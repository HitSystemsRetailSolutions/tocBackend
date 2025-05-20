import axios, { Axios } from "axios";
import * as WebSocket from 'ws';
import * as credentials from "./redsys.credentials"
import * as https from "https";

class RedsysClase {
	webSocket:WebSocket

	constructor() {}

	async start() {
		this.connect("start", true) // connect websocket
	}
	async cambio_ip(new_ip_port:string) {
		if (new_ip_port != this.ip_port) {
			if (!await this.fase_abort()) return
			this.comunicacion_iniciada=false
			this.conexion_event({err_inicializacion:false, finalizado:false, inicializado:false })
			this.connect("cambio_ip",true)
		}
	}
	// ip donde esta el bridge
	ip_port:string
	async activado() {
		let ip_port=(await parametrosInstance.getParametros())?.ipBridgeRedsys
		/* await */this.cambio_ip(ip_port)
		return ip_port ? true : false 
	}
	construct_url(path:string) {
		if (!this.ip_port) return ""
		let [ip,port] = this.ip_port.split(':')
		if (!port) port = DEFAULT_PORT.toString()
		return `https://${ip}:${port}${path}`
	}
	get_options_request() {
		return {
				auth: `${credentials.username}:${credentials.password}`,
				agent: this.httpsAgent
				//            ca: [],
//            checkServerIdentity: () => { return undefined; }
		}
	}

  httpsAgent=new https.Agent({
			//...this.get_options_request(),
			//timeout:5000
		ca: credentials.cert,
		checkServerIdentity: () => { return undefined; },
	})
	auth_axios = { username: credentials.username, password: credentials.password }
	auth_http=`${this.auth_axios.username}:${this.auth_axios.password}`
	axios_instance=axios.create({
		httpsAgent:this.httpsAgent,
		transitional:{
			...axios.defaults.transitional,
			forcedJSONParsing:true
		},
		auth:{ username: credentials.username, password: credentials.password },
		timeout: 5000
	})

	/* arrow function porque se llama en setInmediate y conserva el this */
  connect = async (connect_reason?:string, close_remote_socket:boolean=false):Promise<boolean> => {
		this.disconnect()
		this.connect_id++

		let connect_canceled=false
		this.cancel_previous_connect = ()=>{connect_canceled=true}

		//console.log("this.conexion_state.finalizado:",this.conexion_state.finalizado)
		if (!this.operativa_comandos_inicializacion && this.conexion_state.finalizado) return false

		this.ip_port=(await parametrosInstance.getParametros())?.ipBridgeRedsys
		if (connect_canceled) return false
        //this.ip_port="127.0.0.1"
        //this.ip="10.128.12.1"
			if (this.ip_port==null || this.ip_port=="") {
				if (!await this.fase_abort()) return
				if (connect_canceled) return false
				this.comunicacion_iniciada = false
				this.notificacionesMap.forEach((value, key) => { this.notificacionesMap.set(key, null)})
				this.refresh_notificaciones()
				return false
			}
        //this.activado = true

        if ((Date.now()-this.last_connect) < 5000) {
            // para errores en websocket open rapidos como "connect ECONNREFUSED" esperar 5 segundos
            await delay_ms(5000-(Date.now()-this.last_connect))
            if (connect_canceled) return false
        }
        this.last_connect=Date.now()

        this.createProxyIfChange()

        let options:WebSocket.ClientOptions={
            ...this.get_options_request(),
            handshakeTimeout:5000
        }
        try {
//            let query = [(connect_reason=="start" ? "reset=1" : "") , (close_remote_socket ? "close=1" : "")].join("&")
            let query = [(!this.comunicacion_iniciada ? "reset=1" : "") , (close_remote_socket ? "close=1" : "")].join("&")
            if (query) query = "?"+query
            this.webSocket=new WebSocket(this.construct_url("/ws"+query), options)
        } catch(e) {
            setImmediate(this.connect, e.toString()) // error en la url o en la ip
        }
        this.webSocket.on("open", async () => {
            if (connect_canceled) return // no hace falta ya que al cancelar el connect tambien close el webSocket

            let current_connect_id = this.connect_id
            //this.start_timeout_in_cmd()
            this.send_ping_with_timeout()
            if (!this.comunicacion_iniciada) { // primer connect, no mirar last_cmd
                this.comunicacion_iniciada = true
                this.num_reconnects=0
                if (this.operativa_comandos_inicializacion) this.conexion_event({conectado:true})
                else await this.inicializar(true, true)
                return
            } else {
                let current_cmd_antes_get_remote_last_cmd = this.current_cmd
               
                try {
                    // preguntar al server el último comando enviado
                    // Desde el connect hasta ahora no se ha enviado ningún comando, se supone que cuando llege la petición al server
                    // no habra ningún comando pendiente de llegar ya que el último comando lo envió el websocket que se cerró 
                    // antes del connect actual
                    let remote_last_cmd:{
                            id: string,
                            msg?: string,
                            response?: string,
                            disconnected?: boolean
                        } = await this.get_remote_last_cmd()
                    if (connect_canceled) return
                    if (this.operativa_comandos_inicializacion && remote_last_cmd== null) {
                        // cuando se reinicia el socket cashlogy puede que al conectar dé ECONNREFUSED
                        // la primera vez y después se cierra el websocket sin que se haya enviado ningún comando
                        // simular que aún no se ha enviado
                        remote_last_cmd = { id:null }
                    }
                    if (remote_last_cmd==null) { // aún no se habia enviado ningún comando o el minipc o el bridge se ha reiniciado
                        if (this.conexion_state.inicializado) this.reset_remoto_event()
                        if (!await this.fase_abort()) return
                        if (connect_canceled) return
                        await this.inicializar(false, true/*(current_connect_id==this.connect_id)*/)
                        return
                    } else {
                        this.num_reconnects=0
                        this.conexion_event({ conectado: true })
                        // reconnect ok event
                        // si mientras se obtenia get_remote_last_cmd, la comunicación se recupero, ya no hace falta recuperar
                        if (this.current_cmd && this.current_cmd==current_cmd_antes_get_remote_last_cmd) { 
                            // hay comando esperando de antes del connect
                            if (this.on_message_hook) { // esta en la fase de receive
                                if (this.current_cmd.id_cmd == remote_last_cmd.id) { // en remote esta el actual
                                    if (remote_last_cmd.response) {
                                        // si hay respuesta es que la respuesta original se perdio en el error de comunicación
                                        // recibir esta respuesta
                                        this.on_message_hook(
                                            Buffer.from(remote_last_cmd.response, "latin1").subarray(this.current_cmd.partial_buf_response.length)
                                        )
                                    }
                                    else if (this.current_cmd.canceled) {
                                        // si no se ha recibido respuesta y el comando enviado ha llegado y el comando se habia cancelado, 
                                        // significa que el comando llego, pero no llego el cancel, entonces volver a enviar el cancel
                                        this.cmd_send_cancelar()
                                    } else if (remote_last_cmd.disconnected) {
                                            // si ha habido una desconexión puede que se haya perdido el comando o la respuesta
                                            // aunque es muy dificil ya que el minipc_adapter y CashlogyConnector estan en el mismo pc
                                            // Si pasara ya se reconectaria en no_respuesta    
                                            // si se reenviara el comando podria darse el caso que se estuviera ejecutando el anterior y
                                            // después otro nuevo.
                                    }
                                }  else {
                                    this.current_cmd.reconnect_resend() //en remote esta el anterior, reenviar el actual
                                    // en caso de canceled ya se mira en reconnect_resend
                                }
                            } else { // esta en la fase de send y fallo por websocket not open
                                this.current_cmd.reconnect_resend()
                                // en caso de canceled ya se mira en reconnect_resend
                            }
                        } /* else // no habia comando enviado o el comando se recupero mientras se obtenia get_remote_last_cmd */
                    }
                        
                } catch(e) { // error de conexion en get_remote_last_cmd()
                    console.log(e)
                    if (connect_canceled) return
                    setImmediate(this.connect, e.toString())
                }

            }
        })
        this.set_event_handlers(true)
        this.webSocket.on("error", () => {}) // para evitar unhandled error event
        return true
    }

    async transaccion(idTicket:string, importe:number) {
      
    }
}

const redsysInstance= new RedsysClase();
export { redsysInstance }