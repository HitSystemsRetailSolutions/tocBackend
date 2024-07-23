"use strict";

import axios, { Axios } from "axios";
import { createProxyMiddleware } from "http-proxy-middleware"
import { parametrosInstance } from "../parametros/parametros.clase";
import * as WebSocket from 'ws';
import { clearTimeout } from "timers";
import * as http from "http";
import * as https from "https";
import { io } from "src/sockets.gateway"
import * as schCashlogy from "./cashlogy.mongodb";
import * as credentials from "./cashlogy.credentials"
import { logger } from "src/logger";
const loggerCashlogy = {
    Info:(errorMessage?:any, methodName?:any) => logger.Info(errorMessage, "cashlogy", methodName),
    Error:(errorMessage?:any, methodName?:any) => logger.Error(errorMessage, "cashlogy", methodName)
}

const DEFAULT_PORT = 8443 // del webserver cashlogy connector

// errores cmd Cashlogy
const NO_ERR = "0"
const WR_LEVEL = "WR:LEVEL"
const WR_CANCEL = "WR:CANCEL"
const ER_GENERIC = "ER:GENERIC"
const ER_BAD_DATA = "ER:BAD_DATA"
const ER_BUSY = "ER:BUSY"
const ER_ILLEGAL = "ER:ILLEGAL"
const ABORT_CMD = Symbol("ABORT_CMD") // error throw para cancelar el envio y recepcion de los cmd Cashlogy
const RECONNECT_RESEND = Symbol("RECONNECT_RESEND") // throw si se ha perdido el envio y volverlo a enviar
const FORMATO_ERRONEO = "FORMATO_ERRONEO"

function valid_err(err, ...other_valid_err) {
    if (err == NO_ERR || err == WR_LEVEL) return true
    if (other_valid_err.indexOf(err)>=0) return true
    return false
}

type abort_lock_type={resolve?:()=>void}

// botones aceptar, cancelar son los normales de la operativa.
// botones abort, para abortar y cancelar o resolver manualmente ( solo en el proceso de cobrar)
const BOT_CANCELAR = "BOT_CANCELAR"
const BOT_ACEPTAR = "BOT_ACEPTAR"
const BOT_MANUAL = "BOT_MANUAL"
const BOT_ABORTAR_Y_CANCELAR = "BOT_ABORTAR_Y_CANCELAR"
const BOT_ABORTAR_Y_MANUAL = "BOT_ABORTAR_Y_MANUAL" 

type boton_type = "BOT_CANCELAR" | "BOT_ACEPTAR" | "BOT_MANUAL" | "BOT_ABORTAR_Y_CANCELAR" | "BOT_ABORTAR_Y_MANUAL" 

type notificacion_type = "NIVEL"|"AVISO"|"ERROR"|"MANTENIMIENTO"|"PENDIENTE"|"INICIALIZANDO"|"CONECTANDO" 

// suspendido es cuando un comando no responde porque no hay comunicación, o se esta inicializando, o tarda mucho o 
// se esta recuperando de un abort anterior, pero el comando sigue en marcha y si se resuelven los problemas continuará.
// Se informa al usuario del problema y se le dá la opción de abortar el comando y el proceso
type suspendido_state_type = "CONECTANDO" | "INICIALIZANDO" | "NO_RECUPERADO" | "TIMEOUT" | "OK"

type conexion_state_type = { conectado?:boolean, inicializado?:boolean } 

// cmd que pueden tardar un tiempo indefinido dispensar y retirar stacker
type tipo_cmd_suspendible_type = "NORMAL"|"DISPENSAR"|"RETIRAR_STACKER"|"INICIALIZAR"

// grupo_procesos representa un grupo de procesos que se ejecutan secuencialmente
// el proceso actual se guarda en la prop. enCurso, cada uno de estos procesos es solo una llamada al controller del backend,
// el estado se comunica mediante socket.io events y devuelve el resultado final en el retorno de la llamada.
// esta estructura solo sirve para guardar el estado del grupo_procesos en caso de error fatal estos datos serviran para
// recuperar la contabilidad.
// preEstado guarda el estado al empezar el grupo_procesos y postEstado el estado despues de recuperarse.
// los procesos a ejecutar y el estado general del grupo de procesos se encarga el frontend
type grupo_procesos_type = {
    grupo?: string,
    info?: any,
    preEstado?: proceso_estado_type,
    primerProceso?:boolean,
    enCurso?: {
        proceso:string,
        info?:any,
        preEstado:proceso_estado_type
    },
    postEstado?: proceso_estado_type
}
type proceso_estado_type = {
    date?:number,
    cantidad_recicladores_pd?:valor_por_denominaciones, 
    cantidad_stacker_pd?:valor_por_denominaciones, 
    cantidad_caja_fuerte_pd?:valor_por_denominaciones,
    denominaciones?:type_denominaciones
}

//check valor cargado de db
function check_valor_por_denominaciones(vpd:valor_por_denominaciones) {
    if (vpd==null) return false
    if (typeof(vpd)!="object") return false
    for (let mob of iter_billetes_monedas) {
        if (vpd[mob]==null || typeof(vpd[mob])!="object") return false
        Object.keys(vpd[mob]).forEach((den)=>{
            if (Number.isNaN(parseInt(den))) return false
            if (typeof(vpd[mob][den])!="number") return false
        })
    }
    return true
}
function check_proceso_estado(pe:proceso_estado_type) {
    if (pe==null) return true
    if (typeof(pe)!="object") return false
    if (typeof(pe.date)!="number") return false
    if (!check_valor_por_denominaciones(pe.cantidad_recicladores_pd)) return false
    if (!check_valor_por_denominaciones(pe.cantidad_stacker_pd)) return false
    if (!check_valor_por_denominaciones(pe.cantidad_caja_fuerte_pd)) return false
    if (pe.denominaciones==null) return false
    if (typeof(pe.denominaciones)!="object") return false
    for (let mob of iter_billetes_monedas) {
        if (!Array.isArray(pe.denominaciones[mob])) return false
        for (let i=0;i<pe.denominaciones[mob].length;i++) {
            if (typeof(pe.denominaciones[mob][i])!="number") return false
        } 
    }
    return true
}
function check_grupo_procesos(gp:grupo_procesos_type) {
    try {
        if (gp==null) return true
        if (typeof(gp)!="object") return false
        if (gp.grupo!=null && typeof(gp.grupo)!="string") return false
        if (gp.info!=null && typeof(gp.info)!="object") return false
        if (gp.info && gp.info.importe_entrado!=null && typeof(gp.info.importe_entrado)!="number") return false
        if (!check_proceso_estado(gp.preEstado)) return false
        if (gp.enCurso!=null && typeof(gp.enCurso)!="object") return false
        if (!check_proceso_estado(gp.postEstado)) return false
        return true
    } catch (e) {
        return false
    }
}
function check_fondoCaja(fondoCaja:any) {
    try {
        if (fondoCaja==null) return true
        if (typeof(fondoCaja)!="object") return false
        if (!(fondoCaja.importe==null || (typeof(fondoCaja.importe)=="number" && fondoCaja.importe>=0))) return false
        if (!(fondoCaja.solo_billetes==null || (typeof(fondoCaja.solo_billetes)=="boolean"))) return false
        return true
    } catch(e) {
        return false
    } 
}
// todos los procesos abortables extienden esta estructura donde se guarda la información
type return_abort_type = {
    cancelado?:boolean,
    manual?:boolean,
    not_ready_info?:{
        conexion_state?:conexion_state_type,
        recovered?:boolean,
        watchdog_activado?:boolean,
        stopped?:boolean,
    },
    abort_info?:{
        reason:string,
        grupo_procesos?:grupo_procesos_type,
        timeout_activado?:boolean,
        stopped?:boolean,
        last_suspendido_state?:suspendido_state_type,
    }
}

type emit_suspendido_type = (suspendido_state:suspendido_state_type, not_started:boolean) => {
    state:suspendido_state_type,
    botones:{msg:string, bot:boton_type}[],
    tipo_cmd_suspendible:tipo_cmd_suspendible_type,
    not_started:boolean
}

function Promise_withResolvers<T>() {
    let resolve:(value:T|Promise<T>)=>void, reject:(reason?:any)=>void
    let promise = new Promise<T>((_resolve, _reject) => { resolve=_resolve, reject=_reject})
    return { promise, resolve, reject }
}
async function delay_ms(ms) {
    await new Promise((res)=>setTimeout(res, ms))
}
function removeItemArray<T>(item:T, ar:T[]) {
    let idx = ar.indexOf(item)
    if (idx>=0) ar.splice(idx, 1)
}

const to_cents = (euros:number) => Math.round(euros*100);
const to_euros = (cents:number) => cents/100;

// denominacion es el valor en centimos del billete o moneda
// en Cashlogy no se mezclan las denominaciones de billetes y monedas en un unico grupo,
// ya que puede haber paises que tengan un billete y una moneda con la misma denominación.
// Este programa también sigue este metodo
type type_billetes_monedas = "billetes"|"monedas"
type type_denominaciones = { [mob in type_billetes_monedas]:number[] } // dos arrays con las denominaciones disponibles de mon. o bill.

/*const denominaciones = {
    monedas: [1,2,5,10,20,50,100,200],
    billetes: [500,1000,2000,5000,10000,20000,50000,"STACKER","SAFEBOX"]
}*/

const iter_billetes_monedas:type_billetes_monedas[] = ["billetes", "monedas"]
const iter_monedas_billetes:type_billetes_monedas[] = ["monedas", "billetes"]

// valor por cada denominación, valor generalmente es un cantidad, pero también puede ser un porcentaje o un codigo que indica
// si esta vacio o lleno o casi vacio,lleno 
// las propiedades STACKER y SAFEBOX solo se usan en un cmd, normalmente solo son denominaciones
type valor_por_denominaciones = {
    [mob in type_billetes_monedas]?:{
        [den:number]:number
    }
} & {
    STACKER?:number,
    SAFEBOX?:number,
};

// vpd = valores por denominación 
// mob = monedas o billetes
function create_vpd() { return { monedas:{}, billetes:{} } as valor_por_denominaciones }
// vpd to array
function mob_den_value_vpd(vpd:valor_por_denominaciones) {
    let ret:{
        mob:type_billetes_monedas,
        den:number,
        value:number
    }[] = []
    if (!vpd) return ret

    for (let mob of iter_monedas_billetes) {
        if (vpd[mob]) Object.keys(vpd[mob]).map((den)=> parseInt(den)).sort((a,b)=>a-b).forEach((den)=>{
            ret.push({ mob, den, value:vpd[mob][den]})
        }) 
    }
    return ret
}
function is_empty_vpd(vpd:valor_por_denominaciones) {
    return (mob_den_value_vpd(vpd).length==0)
}
function copy_vpd(vpd:valor_por_denominaciones) {
    let vpd_out = create_vpd()
    mob_den_value_vpd(vpd).forEach(({mob,den,value}) => { vpd_out[mob][den] = value })
    return vpd_out
}

// los cmd Cashlogy usan strings para codificar los vpd
function vpd_to_string(vpd:valor_por_denominaciones) {
    let list_mob:{ monedas:string[], billetes:string[] } = { monedas:[], billetes:[] }
    mob_den_value_vpd(vpd).forEach(({mob,den,value}) => {
        list_mob[mob].push(`${den}:${value}`) 
    })
    return list_mob.monedas.join(',')+(list_mob.billetes.length>0 ? ";"+list_mob.billetes.join(',') : "")
}
function string_to_vpd(str:string) {
    let vpd:valor_por_denominaciones = create_vpd()
    if (typeof str == "string" && str) { // si algún comando da error str podria ser undefined
        let [ str_monedas, str_billetes ] = str.split(';')
        str_monedas?.split(',').forEach((den_val) => { 
            let [ den, val ] = den_val.split(':')
            vpd.monedas[den] = parseInt(val)
        })
        // str_billetes podria ser undefined si no hay ;
        str_billetes?.split(',').forEach((den_val) => {
            let [ den, val ] = den_val.split(':')
            let val_num = parseInt(val)
            if (den=="STACKER") vpd.STACKER = val_num
            else if (den=="SAFEBOX") vpd.SAFEBOX = val_num 
            else vpd.billetes[den] = val_num
        })
    }
    return vpd
}
function solo_denominaciones_to_string(denominaciones:type_denominaciones) {
    denominaciones.monedas.sort((a,b)=>a-b)
    denominaciones.billetes.sort((a,b)=>a-b)

    return denominaciones.monedas.join(',')+(denominaciones.billetes.length>0 ? ";"+denominaciones.billetes.join(',') : "")

}
function string_to_solo_denominaciones(str:string) {
    let denominaciones:type_denominaciones = { monedas:[], billetes:[] }

    if (typeof str == "string" && str) { // si algún comando da error str podria ser undefined
        let [ str_monedas, str_billetes ] = str.split(';')
        str_monedas?.split(',').forEach((den_val) => { 
            let [ den, val ] = den_val.split(':')
            denominaciones.monedas.push(parseInt(den))
        })
        denominaciones.monedas.sort((a,b)=>a-b)
        // str_billetes podria ser undefined si no hay ;
        str_billetes?.split(',').forEach((den_val) => {
            let [ den, val ] = den_val.split(':')
            let den_numeric = parseInt(den)
            // den != "STACKER" y "SAFEBOX"
            if (!isNaN(den_numeric)) denominaciones.billetes.push(den_numeric)
        })
        denominaciones.billetes.sort((a,b)=>a-b)
    }
    return denominaciones
}

// los recicladores de Cashlogy son los lugares donde se guardan, por cada denominiación, los billetes y monedas para poder dispensarlos.
// hay 8 recicladores por cada tipo de moneda y 3 para billetes, normalmente 5,10,20€, aunque esto es configurable.
// El resto de billetes una vez entran van directamente al stacker y ya no pueden volver a dispensarse.
// lugares por donde los billetes pueden salir de los recicladores
// No todos los modelos de cashlogy tiene "CAJA_FUERTE" solo tienen "STACKER" que es una caja fuerte más pequeña que puede almacenar 500 billetes
type destino_billetes_type ="BOCA"|"STACKER"|"CAJA_FUERTE"
type destino_billetes2_type ="STACKER"|"CAJA_FUERTE"

// errores o avisos que puede tener la maquina Cashlogy
type detalle_error = {
    codigo:string,
    tipo:string,
    titulo:string,
    mensaje_principal:string,
    mensaje_adicional:string,
    video:string,
    imagen:string,
    date_start:number,
    date_end:number
}

type type_tipo_mantenimiento = "CONSULTA"|"RESET"|"LIMPIEZA"

type cancel_obj_type = {
    activado?:boolean,
    cancel?:()=>void
}

class CashlogyClase {
    webSocket:WebSocket

    constructor() {
    }

    async start() {
        // los procesos de consulta de errores y mantenimiento siempre estan en marcha, realizan comprobaciones cada cierto intervalo de t.
        this.bucle_consulta_error()
        this.bucle_matenimiento()
        //await this.loadProcesoEnCurso()
        // si el toc se cerro con un proceso en marcha, se recupera la info del mongo
        await this.loadGrupoProcesosDB()
        if (this.grupo_procesos && !this.grupo_procesos.enCurso) {
            // simular un proceso en curso para que actualizarProcesoPrevioInterrumpido actualize
            this.grupo_procesos.enCurso = {proceso:null, preEstado:null}
        }
        this.connect("start") // connect websocket
    }

    cambio_ip(new_ip_port:string) {
        if (new_ip_port != this.ip_port) {
            this.connect("cambio_ip")
        }
    }
    // ip donde esta el ordenador que esta dentro de Cashlogy, si es null o "" es que este Toc no tiene Cashlogy
    ip_port:string
    async activado() {
        let ip_port=(await parametrosInstance.getParametros())?.ipCashlogy
        this.cambio_ip(ip_port)
        return ip_port ? true : false 
    }
/*    procesoEnCurso = null
    async loadProcesoEnCurso() {
        try {
            this.procesoEnCurso = await schCashlogy.loadProceso()
        } catch (e) {
            this.procesoEnCurso = null
        }
    }
    async saveProcesoEnCurso(state) {
        this.procesoEnCurso = state
        try {
            await schCashlogy.saveProceso(state)
        } catch (e) {}
    }
*/

    // El grupo_procesos se guarda en el mongo solo por si el toc se cierra con un proceso en marcha.
    // en la operativa normal no se usa el mongo, los datos se guardan en memoria
    grupo_procesos:grupo_procesos_type = null
    async loadGrupoProcesosDB() {
        try {
            this.grupo_procesos = await schCashlogy.loadGrupoProcesosDB() as typeof this.grupo_procesos
            if (!check_grupo_procesos(this.grupo_procesos)) this.grupo_procesos = null
        } catch (e) {
            this.grupo_procesos = null
        }
    }
    async saveGrupoProcesosDB(state:grupo_procesos_type) {
        this.grupo_procesos = state
        try {
            await schCashlogy.saveGrupoProcesosDB(state)
        } catch (e) {}
    }

    // Importe del fondo de Caja para cerrar caja. Solo es el valor inicial que se presenta al usuario.
    // Pero puede cambiarse en cada cierre e incluso escojer la cantidad de monedas de cada tipo que se dejan en el fondo de caja.
    // El valor final del cierre de caja puede ser diferente a este valor.
    fondoCaja = null
    async loadFondoCajaDB() {
        try {
            this.fondoCaja = await schCashlogy.loadFondoCajaDB()
            if (!check_fondoCaja(this.fondoCaja)) this.fondoCaja = null
        } catch (e) {
            this.fondoCaja = null
        }
        return this.fondoCaja
    }
    
    async saveFondoCajaDB(fondoCaja) {
        this.fondoCaja = fondoCaja
        try {
            await schCashlogy.saveFondoCajaDB(fondoCaja)
        } catch (e) {}
    }
    
    // denominaciones que se pueden dispensar, el valor real lo dá un cmd de Cashlogy,
    // este es un valor inicial solo usado por el simulador, ya que en este no funciona el cmd
    denominaciones_dispensables:type_denominaciones = { monedas:[1,2,5,10,20,50,100,200], billetes:[500,1000,2000] };
    //todas_denominaciones:type_denominaciones = { monedas:[1,2,5,10,20,50,100,200], billetes:[500,1000,2000,5000,10000,20000,50000] };

    // El Toc se comunica con el Cashlogy a traves de un websocket server que esta en un minipc dentro de la máquina Cashlogy.
    // Este websocket server se comunica a través de un socket tcp con el servicio CashlogyConnector y este por usb con la máquina.
    // El websocket server es un programa de HitSystems que corre en un minipc con Windows ya que CashlogyConnector no funciona en linux
    // y no puede estar en el mismo pc que el Toc.
    // La comunicación con el server es por https y autenticación usuario:password.
    // Se usa cifrado y autenticación y no comunicación directa con el socket de CashlogyConnector, ya que, aunque la red de la tienda
    // es segura, alguíen podria tener acceso al wifi de la tienda y enviar comandos directamente a Cashlogy.
    // Además como hay comandos de Cashlogy que pueden tardar un tiempo indefinido, se puede preguntar al websocket server si hay
    // conexión, de la otra manera no se sabria si el comando esta en marcha o la conexión a fallado.
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
    num_reconnects=0
    on_message_hook:(data:Buffer)=>void
    reconnect_on_message_hook:(data:Buffer)=>void
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

    // el server también tiene un proxy https para descargar las imagenes y videos que tiene CashlogyConnector
    proxy:ReturnType<typeof this.createProxy>
    createProxy() {
        return createProxyMiddleware({
            ...this.get_options_request(),
    //        agent: this.httpsAgent,
    //        auth: this.auth_http,
            target: this.construct_url(""),
            pathFilter: (pathname, req) => {
                let parts=pathname.split('/')
                let tipo=parts[parts.length-2], code=parts[parts.length-1]
                let remotePath = this.media_Map.get(code)?.[tipo]
                return remotePath ? true: false
            },
            pathRewrite: (path, req) => {
                let pathname=new URL(`http://localhost${req.url}`).pathname;
                let parts=pathname.split('/')
                let tipo=parts[parts.length-2], code=parts[parts.length-1]
                let remotePath = this.media_Map.get(code)?.[tipo]
                return "/media/"+encodeURIComponent(remotePath)
            },
        })
    }
    // el server tambien tiene esta pagina web donde consultar el último comando enviado,
    // en caso de corte de conexión entre Toc y minipc, se puede saber si el comando a llegado al Cashlogy Connector o no,
    // o sí el minipc se ha reiniciado (realmente si el websocket server se ha reiniciado)
    async get_remote_last_cmd() {
        return (await this.axios_instance.get(this.construct_url("/last_cmd"))).data 
    }

    last_connect=0
    comunicacion_iniciada=false
    inicializando = false
    connect_id=0

    connect = async (connect_reason?:string, close_remote_socket:boolean=false):Promise<boolean> => {
        //console.log(connect_reason)
        this.connect_id++
        if (this.webSocket) {
            // clean ??
            this.set_event_handlers(false)
            clearTimeout(this.timeout_pong_id)
            this.webSocket.close()
            this.webSocket=null
            this.num_reconnects++
            this.stop_timeout_in_cmd()
        }
        this.conexion_event({ conectado: false })

        this.ip_port=(await parametrosInstance.getParametros())?.ipCashlogy
        //this.ip_port="127.0.0.1"
        //this.ip="10.128.12.1"
        if (this.ip_port==null || this.ip_port=="") {
            if (!await this.fase_abort()) return
            this.comunicacion_iniciada = false
            this.notificacionesMap.forEach((value, key) => { this.notificacionesMap.set(key, null)})
            this.refresh_notificaciones()
            return false
        }
        //this.activado = true

        if ((Date.now()-this.last_connect) < 5000) {
            // para errores en websocket open rapidos como "connect ECONNREFUSED" esperar 5 segundos
            await delay_ms(5000-(Date.now()-this.last_connect))
        }
        this.last_connect=Date.now()

        this.proxy = this.createProxy()

        let options:WebSocket.ClientOptions={
            ...this.get_options_request(),
            handshakeTimeout:5000
        }
        try {
            let query = [(connect_reason=="start" ? "reset=1" : "") , (close_remote_socket ? "close=1" : "")].join("&")
            if (query) query = "?"+query
            this.webSocket=new WebSocket(this.construct_url("/ws"+query), options)
        } catch(e) {
            setImmediate(this.connect, e.toString()) // error en la url o en la ip
        }
        this.webSocket.on("open", async () => {
            let current_connect_id = this.connect_id
            this.start_timeout_in_cmd()
            this.send_ping_with_timeout()
            if (!this.comunicacion_iniciada) { // primer connect
                this.comunicacion_iniciada = true
                this.num_reconnects=0
                await this.inicializar(true, true)
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
                            msg: string,
                            response : string,
                            disconnected: boolean
                        } = await this.get_remote_last_cmd()
                    if (remote_last_cmd==null) { // aún no se habia enviado ningún comando o el server se ha reiniciado
                        if (!await this.fase_abort()) return
                        // si this.connect_id ha cambiado es que hay otro connect en marcha, por lo tanto no generar un evento conectado 
                        await this.inicializar(false, (current_connect_id==this.connect_id))
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
                    setImmediate(this.connect, e.toString())
                }

            }
        })
        this.set_event_handlers(true)
        this.webSocket.on("error", () => {}) // para eviar unhandled error event
        return true
    }

    set_event_handlers(on=true) {
        let on_off = on ? "on" : "off"
        this.webSocket[on_off]("error", this.onError)
        this.webSocket[on_off]("pong", this.onPong)
        this.webSocket[on_off]("message", this.onMessage)
        this.webSocket[on_off]("close", this.onClose)

    }
    // los websockets envian pings y reciben pongs para saber si estan conectados cada 5 seg.
    timeout_pong_id:ReturnType<typeof setTimeout>
    send_ping_with_timeout = () => {
        clearTimeout(this.timeout_pong_id)
        try { this.webSocket.ping() } catch(e) { console.log("ping",e) /* si websocket esta connecting throw */ }
        this.timeout_pong_id = setTimeout(() => {
            this.connect("pong timeout")
        }, 5000) 
    }
    onError = (error) => {
        console.log(error)
        this.connect(error.toString())
    }
    onPong = (data:Buffer) => {
        clearTimeout(this.timeout_pong_id)
        this.timeout_pong_id = setTimeout(this.send_ping_with_timeout, 5000)
    }

    // on message del websocket
    onMessage = (data:Buffer, isBinary:boolean) => {  // arrow bind this
        if (this.on_message_hook) { 
            // this.on_message_hook es un callback que pone la función receive
            // poner a null cuando se recibe, para indicar que se ha recibido en caso de reconnect
            let f=this.on_message_hook
            this.on_message_hook=null
            f(data)
        }  
    }
    autoReconnect=true
    onClose = (code:number, reason:Buffer) => {
        console.log(code, reason.toString())
        if (this.autoReconnect) {
            this.connect(`close ${code} ${reason}`)
        }
    }
    // info del comando actual enviado aCashlogy
    current_cmd:{
        msg?: string,
        a_args?: string[],
        num_args_receive?: number,
        time?: number,
        id_cmd?:string,
        partial_buf_response?: Buffer,
        reconnect_resend?: ()=>void,
        abort?: ()=>void,
        canceled_msg?: string,
        canceled?: boolean,
        really_canceled?:boolean,
        tipo_cmd_suspendible?:tipo_cmd_suspendible_type
    }
    previous_cmd:typeof this.current_cmd

    // enviar mensaje a Cashlogy, a_args es array de los parametros que forman el mensaje
    // formato del mensaje envia a Cashlogy #C#A1#A2#...# C es el comando y A1..An argumentos, a_args = [C,A1,...,An]
    send(a_args:string[], cancel=false) {
        let msg="#"+a_args.join("#")+"#"
        let now = Date.now()
        let id_cmd = now.toString()
        if (this.current_cmd) { 
            // current_cmd se inicializa en send_receive
            if (cancel) {
                if (!this.current_cmd.canceled) { // en reconnect se puede volver a enviar un cancel
                    // pasa por aqui cuando se cancela con el comando cmd_send_cancel
                    this.current_cmd.canceled_msg=this.current_cmd.msg
                    this.current_cmd.canceled=true
                }
            } else {
                 // solo cambiar id cuando se envia un nuevo comando que no cancele el anterior
                 // para poder controlar la respuesta en caso de desconexion
                this.current_cmd.id_cmd = id_cmd 
            }
            this.current_cmd.msg = msg
            this.current_cmd.time = now
        } else {
            // no puede pasar por aqui
            return
        }
        // el mensaje enviado al server es {id_cmd},{msg_Cashlogy}
        // id_cmd es Date.now() como string, para en caso de reconexión saber si el comando actual se ha enviado
        // ya que se podrian haber enviado seguidos dos comando iguales.
        this.webSocket.send(`${id_cmd},${msg}`/*Buffer.from(msg, "latin1")*/)
    }
    receive(num_args:number, valid_errs:"*"|string[], check_level=true):Promise<string[]> {
        return new Promise((resolve, reject) => {
            let buf=Buffer.alloc(0)
            
            let create_reject = (reason) => {
                return () => {
                    clearTimeout(timeout_receive_rest_id)
                    this.on_message_hook=null
                    reject(reason)
                }
            }
            this.current_cmd.reconnect_resend = create_reject(RECONNECT_RESEND)
            this.current_cmd.abort = create_reject(ABORT_CMD)

            let process_response = async (resp:string) => {
                if (resp.length<2 || resp[0]!="#" || resp[resp.length-1]!="#") {
                    reject(FORMATO_ERRONEO)
                } else {
                    let msg_values = resp.slice(1,-1).split("#")
                    if (msg_values[0] == NO_ERR || msg_values[0] == WR_LEVEL) { // no es un error
                        /* ------ debug ------ */
                        if (globalThis?.debug_Cashlogy?.nivel!=null) {
                            msg_values[0]=globalThis?.debug_Cashlogy?.nivel?WR_LEVEL:NO_ERR
                        }
                        if (globalThis?.debug_Cashlogy?.delay_response!=null) {
                            let delay_response = globalThis?.debug_Cashlogy?.delay_response?.[this.current_cmd?.tipo_cmd_suspendible]
                            if (typeof delay_response == "number") await delay_ms(delay_response)
                        }
                        /* ------ debug ------ */
                        
                        if (check_level) {
                            // WR:LEVEL indica aviso nivel bajo de alguna denominación
                            // excepto en el comando dispensar por denominación que tine check_level=false
                            this.notificacion("NIVEL", (msg_values[0] == WR_LEVEL))
                            msg_values[0] = NO_ERR
                        }
                        resolve(msg_values)
                    } else {
                        if (msg_values[0] == WR_CANCEL) this.current_cmd.really_canceled = true 
                        // si el error no es uno que el programa pueda procesar -> reject que al final acabar en un throw catch
                        // donde el programa intentara recuperarse
                        if (valid_errs == null) valid_errs = []
                        if (valid_errs=="*" || valid_errs.indexOf(msg_values[0])>=0) {
                            resolve(msg_values) // resolve toda la respuesta
                        } else {
                            reject(msg_values[0]) // reject solo el error
                        }
                    }
                }
            }
            let timeout_receive_rest_id:ReturnType<typeof setTimeout>

            // esta funcion sera llamada a traves de on_message_hook en el evento onmessage del websocket
            const on_message = (data:Buffer) => {
                if (timeout_receive_rest_id) clearTimeout(timeout_receive_rest_id)
                buf = Buffer.concat([buf, data])
                let resp = buf.toString("latin1")
                this.current_cmd.partial_buf_response=buf
                let n=[...resp].filter((x) => x=='#').length
                if (num_args+1===n) { // n = num of #
                    // si el número de argumentos es el esperado procesar la respuesta
                    process_response(resp)
                } else {
                    // si el mensaje es muy largo el socket lo divide en varios trozos
                    // p.ej. un mensaje con muchos detalles de errores
                    this.on_message_hook = on_message
                    timeout_receive_rest_id = setTimeout(() => {
                        // si el resto no llega en 0.5 seg, procesar el mensaje que ha llegado, 
                        // podria ser si hay un error como ER:BAD_DATA, ER:BUSY o ER:ILLEGAL, ya que el número de argumentos devuelto
                        // no seria el esperado si el comando hubiera ido bien
                        this.on_message_hook = null
                        process_response(resp)
                    }, 500);
                }
            }
            this.on_message_hook = on_message // this.on_message_hook se pondra a null cuando reciba el mensaje
        })
    }
    // este array guarda los comandos pendientes de enviar, en caso de que haya un comando pendiente de respuesta.
    // a parte de la operativa principal hay otros procesos como consultar errores que tenga la maquina o consultar cuando falta 
    // para el mantenimiento que se ejecutan cada cierto tiempo.
    send_receive_pendings:((aborting?:boolean)=>Promise<void>)[] = []
    
    // esta función puede ser loop o noop, cuando esta dentro de loop se pone a noop, que no hace nada, y cuando acaba
    // vuele a loop para ser ejecutada de nuevo la proxima vez
    awake_loop_send_recieve = () => {

        function noop() {}
        let loop = async () => { // arrow -> this
            this.awake_loop_send_recieve = noop

            const abort_all_pendings = () => {
                let pendings = this.send_receive_pendings
                this.send_receive_pendings = []
                pendings.map((pending) => { return pending(true) }) // true -> abort
            }
            let abort_lock = this.create_abort_lock()
            if (!abort_lock) {
                abort_all_pendings()
            } else {
                while (this.send_receive_pendings.length) {
                    await (this.send_receive_pendings.shift())() // cojer el primer pending de send_receive y ejecutarlo
                    if (this.is_abort_lock_aborted(abort_lock)) {
                        abort_all_pendings()
                        break
                    }
                    // permitir que la promise que resuelve el callback pueda abortar la operativa antes de enviar otro cmd
                    // ya que la promise se resuelve asyncronamente en las microtasks y setImmediate en las macrotasks
                    await new Promise((res)=>{ setImmediate(res) }) 
                }

                this.remove_abort_lock(abort_lock)
            }
            this.awake_loop_send_recieve = loop
        }
        loop() // primera ejecución de awake_loop
    }
    // este objeto se encarga de hacer un reset si un camando se bloquea durante 5 minutos.
    // solo lo hara si hay conexión y no hay un proceso activo, ya que en este caso se informaria al usuario, si quiere hacer un reset
    no_respuesta = (() => {
        let timeout_no_respuesta_id:ReturnType<typeof setTimeout>
        const no_respuesta_action = async() => {
            if (!this.stop_proceso_activo && this.conexion_state.conectado) {
                if (!await this.fase_abort()) return
                let abort_lock = this.create_abort_lock()
                if (!abort_lock) return

                let recuperado = false
                try {
                    let err:string
                    await this.cmd_reset()
                    if (!this.conexion_state.inicializado) {
                        // se habria bloqueado la inicialización durante 5 minutos y el reset lo habria arreglado
                        // y faltaria actualizar el proceso interrumpido, seguramente no puede pasar.
                        await this.actualizarProcesoPrevioInterrumpido()
                    }
                    recuperado = true
                } catch (e) {
                }
                if (this.remove_abort_lock(abort_lock)) {
                    if (recuperado) {
                        this.conexion_event({ inicializado: true })
                        this.recovered_event()
                    } else await this.inicializar(false)
                }
            } else {
                setTimeout_no_respuesta(60*1000)
            }
        }
        const setTimeout_no_respuesta = (ms=5*60*1000) => { timeout_no_respuesta_id = setTimeout(no_respuesta_action, ms)}
        const clearTimeout_no_respuesta = () => { clearTimeout(timeout_no_respuesta_id)}
        return {
            setTimeout: setTimeout_no_respuesta,
            clearTimeout: clearTimeout_no_respuesta
        }
    })()

    //current_tipo_suspendible:tipo_cmd_suspendible_type
    promise_wait_real_cancel:Promise<void>
    // función usada por todos los comandos para enviar mensaje y recibir respuesta, excepto cmd cancel.
    // a_args: array con los parametros del mensaje incluyendo el comando, se enviaran a Cashlogy separados por # -> #C#A1#...#An#
    // valid_errs: array de errores que no throws
    // tipo_suspendible: hay comandos que puede tardar indefinidamente, para cada tipo hay un timeout para informar al usuario que un comando
    //                   esta tardando demasiado.
    // check_level: mirar si err==WR:LEVEL y notificar al usuario del nivel de algún reciclador en la máquina
    // cancel_obj: objeto para poder cancelar el comando actual, cuando esta en ejecución
    send_receive(
        a_args:string[], num_args_receive:number, valid_errs:"*"|string[], 
        tipo_cmd_suspendible:tipo_cmd_suspendible_type="NORMAL", check_level=true, cancel_obj:cancel_obj_type=null
    ): Promise<string[] > {
        let { promise, resolve, reject } = Promise_withResolvers<string[]>()
        let callback = async (aborting=false) => {
            if (aborting) {
                reject(ABORT_CMD)
            } else {
                let reconnect_resend:boolean
                do {
                    reconnect_resend=false
                    this.comunicacion_iniciada = true
                    this.current_cmd = { a_args, num_args_receive, partial_buf_response:Buffer.alloc(0) }
                    try {
                        if (this.promise_wait_real_cancel) {
                            let prom2 = Promise_withResolvers<string>()
                            this.current_cmd.reconnect_resend = () => { prom2.reject(RECONNECT_RESEND) }
                            this.current_cmd.abort = () => { prom2.reject(ABORT_CMD) }
                            // esta promise se rejectara con throw al siguiente catch si hubiera abort o reconnect
                            // y si se hubiera esperado para el real cancel seguiria
                            await Promise.race([this.promise_wait_real_cancel, prom2.promise]) 
                        }
                        if (cancel_obj?.activado) {
                            resolve([WR_CANCEL]) // se cancelo antes de enviar
                        } else {
                            try {
                                this.send(a_args) // ?? WebSocket is not open: readyState 0 (CONNECTING)
                            } catch (e) {
                                let prom_send = Promise_withResolvers<string>()
                                this.current_cmd.reconnect_resend = () => { prom_send.reject(RECONNECT_RESEND) }
                                this.current_cmd.abort = () => { prom_send.reject(ABORT_CMD) }
                                await prom_send.promise // esta promise se rejectara con throw al siguiente catch
                            }
                            this.current_cmd.tipo_cmd_suspendible = tipo_cmd_suspendible
                            this.start_timeout_in_cmd(tipo_cmd_suspendible)
                            this.no_respuesta.setTimeout()
                            if (cancel_obj) {
                                cancel_obj.cancel = () => {
                                    this.cmd_send_cancelar()
                                }
                            }
                            resolve(await this.receive(num_args_receive, valid_errs, check_level))
                        }
                    } catch (e) {
                        if (e==RECONNECT_RESEND) { // se envia desde reconnect_resend en el open del websocket
                            if (this.current_cmd?.canceled) {
                                resolve([WR_CANCEL])
                            } else reconnect_resend=true
                        } else {
                            reject(e)
                            // if (e==abort) abort=true
                        }
                    }
                    if (cancel_obj) cancel_obj.cancel = null
                    this.stop_timeout_in_cmd()
                    this.no_respuesta.clearTimeout()
                } while (reconnect_resend)
                if (this.current_cmd.canceled && !this.current_cmd.really_canceled) {
                    // en el improbable caso que se enviara un cancel y llegara a Cashlogy después de que el comando real terminara
                    // se espera 0.5 seg a que llegue la respuesta del cancel y no se coja erroneamente como la respuesta del comando siguiente
                    this.promise_wait_real_cancel = new Promise(async(resolve) => {
                        await delay_ms(500)
                        this.promise_wait_real_cancel = null
                        resolve()
                    })
                }
                this.previous_cmd = this.current_cmd
                this.current_cmd = null
            }
        }
        this.send_receive_pendings.push(callback) // poner el callback como pendiente

        this.awake_loop_send_recieve() // activar el loop de send receive
        return promise
    }

    // Comandos de Cashlogy

    async cmd_inicializar(valid_errs?:"*"|string[]) {
        let [ err, version ] = await this.send_receive(["I"], 2, valid_errs, "INICIALIZAR")
        return { err, version }
    }

    async cmd_finalizar(valid_errs?:"*"|string[]) {
        let [ err ] = await this.send_receive(["E"], 1, valid_errs)
        return { err }
    }

    async cmd_iniciar_admision(valid_errs?:"*"|string[]) {
        let [ err ] = await this.send_receive(["B","0","0","0"], 1, valid_errs)
        return { err }
    }

    async cmd_ver_importe_admitido(valid_errs?:"*"|string[]) {
        let [ err, cents ] = await this.send_receive(["Q"], 2, valid_errs)
        return { err, cents_in:parseInt(cents) }
    }

    async cmd_finalizar_admision(valid_errs?:"*"|string[]) {
        let [ err, cents ] = await this.send_receive(["J"], 2, valid_errs)
        return { err, cents_in:parseInt(cents) }
    }

    async cmd_dispensar(cents:number, solo_monedas=false, valid_errs:"*"|string[]=[ER_GENERIC]) {
        let [ err, cents_out , cambio ] = await this.send_receive(["P", cents.toString(), "0", "0", solo_monedas?"1":"0"], 3, valid_errs, "DISPENSAR")
        return { err, cents_out:parseInt(cents_out), cambio_anadido:parseInt(cambio) }
    }

    async cmd_anadir_cambios(valid_errs?:"*"|string[]) {
        let [err] = await this.send_receive(["A","2"], 1, valid_errs)
        return { err }
    }

    async cmd_dispensar_por_denominacion(
        cantidad_pd:valor_por_denominaciones, destino_billetes:destino_billetes_type, 
        valid_errs:"*"|string[]=[ER_GENERIC, ER_BAD_DATA]
    ) {
        let arg_destino:string=({"BOCA":"0","STACKER":"1","CAJA_FUERTE":"2"})[destino_billetes]
        let [ err, cpd_devueltas ] = 
            await this.send_receive(["U2", vpd_to_string(cantidad_pd), arg_destino, "0", "0"], 2, valid_errs, "DISPENSAR", false)
        return { err, cantidad_devuelta_pd:string_to_vpd(cpd_devueltas), denominaciones:string_to_solo_denominaciones(cpd_devueltas) }
    }

    async cmd_recaudacion(cancel_obj:cancel_obj_type, valid_errs?:"*"|string[]) {
        let [ err, cents_out ] = await this.send_receive(["S","2"], 2, valid_errs, "RETIRAR_STACKER", true, cancel_obj)
        return { err, cents_out:parseInt(cents_out) }
    }

    async cmd_efectivo_total(valid_errs?:"*"|string[]) {
        let [ err, cents_recicladores, cents_no_devolvibles, cents_stacker, cents_caja_fuerte ] = await this.send_receive(["T2"], 5, valid_errs)
        return { 
            err, 
            cents_recicladores:parseInt(cents_recicladores), 
            cents_no_devolvibles:parseInt(cents_no_devolvibles), 
            cents_stacker:parseInt(cents_stacker), 
            cents_caja_fuerte:parseInt(cents_caja_fuerte||"0") 
        }
    }

    async cmd_cantidad_de_una_denominacion(den:number, valid_errs?:"*"|string[]) {
        let [ err, num_recicladores, num_no_devolvibles, num_stacker, num_caja_fuerte ] = await this.send_receive(["X2", den.toString()], 5, valid_errs)
        return {
             err, 
             cantidad_en_recicladores:parseInt(num_recicladores), 
             cantidad_en_no_devolvibles:parseInt(num_no_devolvibles), 
             cantidad_en_stacker:parseInt(num_stacker), 
             cantidad_en_caja_fuerte:parseInt(num_caja_fuerte) 
        }
    }

    async cmd_cantidad_de_todas_denominaciones(valid_errs?:"*"|string[]) {
        let [ err, cpd_recicladores, cpd_no_devolvibles, cpd_stacker, cpd_caja_fuerte ] = await this.send_receive(["Y2"], 5, valid_errs)
        return { 
            err, 
            cantidad_recicladores_pd:string_to_vpd(cpd_recicladores), 
            cantidad_no_devolvibles_pd:string_to_vpd(cpd_no_devolvibles), 
            cantidad_stacker_pd:string_to_vpd(cpd_stacker), 
            cantidad_caja_fuerte_pd:string_to_vpd(cpd_caja_fuerte) ,
            denominaciones:string_to_solo_denominaciones(cpd_recicladores)
        }
    }

    async cmd_nivel_denominaciones(valid_errs?:"*"|string[]) {
        let [ err, estado_pd, porcentaje_pd ] = await this.send_receive(["GC2"], 3, valid_errs)
        let denominaciones = string_to_solo_denominaciones(porcentaje_pd ? porcentaje_pd : estado_pd)
        return { err, estado_pd:string_to_vpd(estado_pd), porcentaje_pd:string_to_vpd(porcentaje_pd), denominaciones }
    }

    async cmd_informacion_auxiliar(valid_errs?:"*"|string[]) {
        let [ err, matricula, funcionalidad_pd ] = await this.send_receive(["GI"], 3, valid_errs)
        return { err, matricula, funcionalidad_pd:string_to_vpd(funcionalidad_pd), denominaciones:string_to_solo_denominaciones(funcionalidad_pd) }
    }

    async cmd_vaciado_completo(
        solo_monedas:boolean|null, denominaciones: type_denominaciones, billetes:destino_billetes2_type, 
        valid_errs:"*"|string[]=[ER_GENERIC,ER_BAD_DATA]
    ) {
        let str_solo_monedas="", str_denonminaciones=""
        if (solo_monedas != null) str_solo_monedas=solo_monedas?"1":"0"
        else str_denonminaciones = solo_denominaciones_to_string(denominaciones)
 
        let [ err, cents_out ] = 
            await this.send_receive(["V2","2",str_solo_monedas,str_denonminaciones,billetes=="STACKER"?"1":"2"], 3, valid_errs, "DISPENSAR")
        return { err, cents_out:parseInt(cents_out) }
    }

    async cmd_mantenimiento(tipo:type_tipo_mantenimiento, valid_errs?:"*"|string[]) {
        //return {err:"0",num_billetes_faltan:0}
        let [ err, num_faltan ] = await this.send_receive(["W",({"CONSULTA":"0","RESET":"1","LIMPIEZA":"2"})[tipo]], 2, valid_errs)
        return { err, num_billetes_faltan:num_faltan?parseInt(num_faltan):null }
    }

    cmd_send_cancelar() {
        try {
            this.send(["!"], true)
            return true
        } catch(e) {
            return false
        }
    }
    
    async cmd_cancelar(valid_errs:"*"|string[]=[WR_CANCEL]) {
        let [ err , resp_cmd_en_curso ] = await this.send_receive(["!"], 1, valid_errs)
        return { err, resp_cmd_en_curso }
    }

    async cmd_reset(valid_errs?:"*"|string[]) {
        let [ err ] = await this.send_receive(["Z"], 1, valid_errs)
        return { err }
    }
    
    async cmd_consulta_versiones(arg:"GENERAL"|"SOFTWARE"|"HARDWARE"|"ALL", valid_errs?:"*"|string[]) {
        let [ err, str_json ] = await this.send_receive(["GV",arg], 2, valid_errs)
        let json:any
        try {
            json = JSON.parse(str_json)
        } catch(e) {
            json=str_json
        }
        return { err, json }
    }

    async cmd_poner_a_cero(valid_errs?:"*"|string[]) {
        let [ err, cents_antes, cents_despues ] = await this.send_receive(["K","2"], 3, valid_errs)
        return { err, cents_antes:parseInt(cents_antes), cents_despues:parseInt(cents_despues) }
    }

    async cmd_resolucion_incidencias(valid_errs?:"*"|string[]) {
        let [ err, cents_antes, cents_despues, cents_in, cents_out, cents_pendiente, cents_descuadre ] 
            = await this.send_receive(["RI","0","0","2"], 7, valid_errs)
        return { 
            err, 
            cents_antes:parseInt(cents_antes), 
            cents_despues:parseInt(cents_despues), 
            cents_in:parseInt(cents_in), 
            cents_out:parseInt(cents_out), 
            cents_pendiente:parseInt(cents_pendiente), 
            cents_descuadre:parseInt(cents_descuadre) 
        }
    }

    async cmd_consulta_error(valid_errs?:"*"|string[]) {
        let [ err, str_codes ] = await this.send_receive(["?"], 2, valid_errs)
        return { err, str_codes }
    }

    async cmd_detalle_error(str_errors: string, ruta_relativa = true, valid_errs?:"*"|string[]) {
        let [ err, ...list_str_info ]
            = await this.send_receive(["?",str_errors,ruta_relativa?"1":"0"], 1+str_errors.split(",").length, valid_errs, "NORMAL")
        let list_detalles = list_str_info.map((str_info:string) => { 
            let parts=str_info.split('|')
            return {
                codigo:parts[0],
                tipo:parts[1],
                titulo:parts[2],
                mensaje_principal:parts[3],
                mensaje_adicional:parts[4],
                video:parts[5],
                imagen:parts[6]
            } as detalle_error
        })
        return { err, list_detalles }
    }

    // notificaciones enviadas al frontend mediante socket.io
    // "NIVEL": Monedas o billetes fuera de límite, se produce cuando el comando devuelve WR:LEVEL
    // "AVISO" o "ERROR": problemas con la máquina, se producen al ejecutar el proceso consulta_error
    // "MANTENIMIENTO": informa que falta poco para el mantenimiento, se produce en el subproceso_mantenimiento
    // "PENDIENTE": el último grupo de procesos no acabo bien, se informa que ya esta el resultado de la recuperación
    // "INICIALIZANDO" y "CONECTANDO"
    notificacionesMap=new Map<notificacion_type,any>()
    notificacion(tipo:notificacion_type, info=null) {
        if (!this.notificacionesMap.has(tipo) || this.notificacionesMap.get(tipo) != info) {
            this.notificacionesMap.set(tipo, info)
            io.emit("Cashlogy.notificacion", { [tipo] : info} )
        }
    }
    refresh_notificaciones() {
        let data = {}
        this.notificacionesMap.forEach((info, tipo) => {
            data[tipo] = info
        })
        io.emit("Cashlogy.notificacion", data)        
    }

    async inicializar(first_time:boolean=false, event_conectado=false) {
        this.inicializando = true
        this.conexion_event({ inicializado:false })
        if (event_conectado) this.conexion_event({ conectado:true })
        let abort_lock = this.create_abort_lock()
        if (!abort_lock) return

        while (true) {
            try {
                let err:string
                if (!first_time) { 
                    // si no es la primera vez que se inicializa, se hace un reset primero,
                    // cuando se llega aqui es porque el estado de Cashlogy o del websocket server es desconocido
                    // y se intenta volver a un estado estable inicializando de nuevo. 
                    ;( { err } = await this.cmd_reset("*") )
                    // check_throw_err(err, ER_ILLEGAL) da igual el error
                    first_time = false
                }
                ;( { err } = await this.cmd_inicializar([ER_BUSY]) )
                if (err==ER_BUSY) {
                    ;( { err } = await this.cmd_reset() )
                }
                await this.actualizarProcesoPrevioInterrumpido()
                break;
            } catch (e) {
                // fail -> reconnect
            }
            if (this.is_abort_lock_aborted(abort_lock)) break
            this.connect("reconnect", true) // true = close y open socket
        }
        if (this.remove_abort_lock(abort_lock)) {
            this.inicializando = false 
            this.conexion_event({ inicializado: true })
            this.recovered_event()
            this.buscar_denominaciones_dispensables()
        }
    }

    buscar_denominaciones_dispensables_id=0
    // las denominaciones dispensables son configurables, aunque normalmente són todas las monedas y los 3 tipos de billetes más pequeños
    async buscar_denominaciones_dispensables() {
        let id = ++this.buscar_denominaciones_dispensables_id
        while(true) {
            await this.wait_recovered()
            if (id != this.buscar_denominaciones_dispensables_id) break
            try {
                let { funcionalidad_pd, denominaciones } = await this.cmd_informacion_auxiliar()
                if (id != this.buscar_denominaciones_dispensables_id) break
                if (denominaciones.monedas.length==0 && denominaciones.billetes.length==0) break
                let denominaciones_dispensables:type_denominaciones = { monedas:[], billetes:[] }
                for (let mob of iter_billetes_monedas) {
                    for (let den of denominaciones[mob]) {
                        let funcionalidad = funcionalidad_pd[mob][den]
                        if (funcionalidad == 2 || funcionalidad == 3) denominaciones_dispensables[mob].push(den)
                    }
                }
                this.denominaciones_dispensables = denominaciones_dispensables
                break // salir while true
            } catch(e) {

            }
            await delay_ms(1000) // esperar y volver a intentar si hay habido un error
        }
    }

    // consultar errores casa segundo
    async bucle_consulta_error() {
        while(true) {
            await delay_ms(1000)
            await this.wait_recovered()
            try {
                await this.consulta_error()
            } catch (e) {
                if (e == ER_ILLEGAL) {
                    // si Cashlogy se ha reseteado y ahora no esta inicializado dá este error.
                    if (!await this.fase_abort()) return
                    await this.inicializar(false)
                }
            }
        }
    }
    
    err_temp=""
    lista_errores_pasados:detalle_error[] = [] // lista de errores solucionados
    detalle_errores_actual_Map = new Map<string,detalle_error>() // errores actuales Map<codigo, detalle>
    str_codes_actuales="" // str_codes para comparar y saber si se han cambiado
    media_Map = new Map<string,{imagen:string, video:string}>() // path a los archivos media en el pc donde est CashlogyConnector
    async consulta_error() {
        let str_codes:string, nuevos_errores:detalle_error[]=[]
        ;( { str_codes } = await this.cmd_consulta_error() ) // devuelve codigos de error separados por comas

        /* ------ debug ------- */
        if (globalThis?.debug_Cashlogy?.str_codes!=null) {
            str_codes = globalThis?.debug_Cashlogy?.str_codes 
        }
        /* ------ debug ------- */

        let actualizar = false
        if (str_codes=="") {
            if (this.str_codes_actuales!="") {
                this.str_codes_actuales=""
                this.detalle_errores_actual_Map.forEach((info, code) => {
                    info.date_end=Date.now()
                    this.lista_errores_pasados.push(info)
                })
                this.detalle_errores_actual_Map.clear()
                actualizar = true
            }
        } else {
            if (str_codes != this.str_codes_actuales) {
                ;( { list_detalles:nuevos_errores } = await this.cmd_detalle_error(str_codes, false) )
                this.str_codes_actuales = str_codes

                let codes_no_nuevos_Set=new Set(this.detalle_errores_actual_Map.keys()) // al final quedaran los codes que ya no estan en los nuevos
                nuevos_errores.forEach((info) => {
                    codes_no_nuevos_Set.delete(info.codigo)
                    if (!this.detalle_errores_actual_Map.has(info.codigo)) {
                        // find detalle_errores_pasados
                        let find_pasado=false
                        for (let i=0;i<this.lista_errores_pasados.length;i++) {
                            let info_pasado = this.lista_errores_pasados[i]
                            if (info_pasado.date_end+10*1000<Date.now()) break
                            if (info_pasado.codigo==info.codigo) {
                                // los errores pasados que reaparecen antes de 10 segundos 
                                // se vuelven a poner como si no hubiera habido interrupción
                                // por si hay errores intermitentes y no se llene la lista de errores pasados
                                this.lista_errores_pasados.splice(i)
                                delete info_pasado.date_end
                                this.detalle_errores_actual_Map.set(info_pasado.codigo, info_pasado)
                                find_pasado = true
                                break
                            }   
                        }
                        if (!find_pasado) {
                            info.date_start = Date.now()
                            this.detalle_errores_actual_Map.set(info.codigo, info)
                        }
                    }
                    this.media_Map.set(info.codigo,{imagen:info.imagen, video:info.video})
                })
                codes_no_nuevos_Set.forEach((code) => {
                    let info = this.detalle_errores_actual_Map.get(code)
                    this.detalle_errores_actual_Map.delete(code)
                    info.date_end = Date.now()
                    this.lista_errores_pasados.unshift(info)
                })
                actualizar = true
            } 
        }
        if (actualizar) {
            let aviso_codes_actual:string[] = []
            let error_codes_actual:string[] = []
            this.detalle_errores_actual_Map.forEach((info, code) => {
                if (info.tipo == "0") aviso_codes_actual.push(info.codigo)
                else error_codes_actual.push(info.codigo)
            })

            aviso_codes_actual.sort()
            error_codes_actual.sort()
            this.notificacion("AVISO", aviso_codes_actual.join(','))
            this.notificacion("ERROR", error_codes_actual.join(','))
        }
    }

    get_media(tipo:"imagen"|"video", code:string) {
        return this.media_Map.get(code)?.[tipo]
    }
    
    async get_errores(tipo:"AVISO"|"ERROR"=null):Promise<{
        detalle_errores_actuales:detalle_error[],
        lista_errores_pasados:detalle_error[]
    }> {
        const toUrl = (detalle:detalle_error, tipo:keyof detalle_error) => {
            return detalle[tipo] ? `/cashlogy/${tipo}/${detalle.codigo}` : ""; // url para el proxy que servira el archivo media
        }
        const filter_map = (ar:detalle_error[]) => ar.filter((detalle) => {
            if (!tipo) return true
            if (tipo=="AVISO" && detalle.tipo=="0") return true
            if (tipo=="ERROR" && detalle.tipo!="0") return true
            return false
        }).map((detalle) => {
            return {
                ...detalle,
                imagen:toUrl(detalle, "imagen"),
                video:toUrl(detalle, "video")
            }
        })
        return {
            detalle_errores_actuales : filter_map(Array.from(this.detalle_errores_actual_Map.values())),
            lista_errores_pasados : filter_map(this.lista_errores_pasados)
        }
    }

    // mirar si hay que hacer mantenimiento cada 2 horas
    async bucle_matenimiento() {
        while(true) {
            await this.wait_recovered()
            try {
                await this.subproceso_mantenimiento("CONSULTA")
                await delay_ms(60*60*1000)
            } catch (e) {
                await delay_ms(10*60*1000)
            }
        }
    }


    //-----------------------------------------
    // botones pulsados en el frontend que llaman a la función boton_pulsar

    boton_state_Map = new Map<boton_type, boolean>()
    boton_handlers_Map = new Map<boton_type, (b:boton_type)=>any>()
    boton_pulsar(bot:boton_type) {
        this.boton_state_Map.set(bot, true)
        let handler = this.boton_handlers_Map.get(bot)
        if (handler) { 
            this.boton_removeHandler(handler) // se elimina el handler de los botones que lo tenian asignado
            return handler(bot)
        }
    }
    boton_setHandler(bots:boton_type|boton_type[], handler:(b:boton_type)=>any) {
        if (!Array.isArray(bots)) bots = [ bots ]
        bots.forEach((bot) => { // se puede asignar un handler a varios botones
            this.boton_state_Map.set(bot, false)
            if (handler) this.boton_handlers_Map.set(bot, handler) 
        })
    }
    // poner los botones a false sin handler
    boton_reset(bots:boton_type|boton_type[]) {
        this.boton_setHandler(bots, null)
    }
    boton_removeHandler(handler:(b:boton_type)=>any) {
        if (handler) {
            for (let [bot_loop, handler_loop] of this.boton_handlers_Map.entries()) {
                if (handler == handler_loop) this.boton_handlers_Map.delete(bot_loop)
            }
        }
    }
    boton_get(bot:boton_type) { return this.boton_state_Map.get(bot); }

    //-----------------------------------------
    
    //guardar el preEstado de Cashlogy antes de un proceso para poder recuperar la contabilidad si hay un error fatal
    async saveProceso(proceso:string, info?:any) {
        if (proceso) {
            let cantidad_recicladores_pd:valor_por_denominaciones, cantidad_stacker_pd:valor_por_denominaciones, 
                cantidad_caja_fuerte_pd:valor_por_denominaciones,
                denominaciones: type_denominaciones

            ;( { cantidad_recicladores_pd, cantidad_stacker_pd, cantidad_caja_fuerte_pd, denominaciones } 
                = await this.cmd_cantidad_de_todas_denominaciones())
            let preEstado = {
                date:Date.now(),
                cantidad_recicladores_pd, 
                cantidad_stacker_pd, 
                cantidad_caja_fuerte_pd,
                denominaciones

            }
            // grupo_procesos es un objeto que agrupa los procesos de una misma operativa
            if (!this.grupo_procesos) this.grupo_procesos = {} // hay procesos que no crean un grupo_procesos, se crea ahora
            if (!this.grupo_procesos.preEstado) { 
                // el primer proceso genera el preEstado del grupo de procesos, que al final sera la información
                // que se presentara al usuario
                this.grupo_procesos.preEstado = preEstado
                this.grupo_procesos.primerProceso = true
            } else {
                this.grupo_procesos.primerProceso = false
            }
            // la propiedad enCurso guarda la información del proceso actual
            if (!this.grupo_procesos.enCurso) this.grupo_procesos.enCurso={ proceso, info, preEstado } 
            else {
                // actualizar la información
                this.grupo_procesos.enCurso.proceso = proceso
                if (info) {
                    if (this.grupo_procesos.enCurso.info) {
                        this.grupo_procesos.enCurso.info={ 
                            ...this.grupo_procesos.enCurso.info,
                            info
                        }
                    } else this.grupo_procesos.enCurso.info = info
                }
                this.grupo_procesos.enCurso.preEstado = preEstado
            }
        } else {
            // proceso == null -> borrar info
            if (this.grupo_procesos) {
                delete this.grupo_procesos.enCurso
                if (!this.grupo_procesos.grupo) this.grupo_procesos = null // proceso sin grupo_procesos
            }
        }
        await this.saveGrupoProcesosDB(this.grupo_procesos)
    }

    // generar postProceso cuando un proceso que fallado se recupera
    async actualizarProcesoPrevioInterrumpido() {
        if (this.grupo_procesos && this.grupo_procesos.enCurso) {
            let cantidad_recicladores_pd:valor_por_denominaciones, cantidad_stacker_pd:valor_por_denominaciones, 
                cantidad_caja_fuerte_pd:valor_por_denominaciones,
                denominaciones:type_denominaciones
            ;( { cantidad_recicladores_pd, cantidad_stacker_pd, cantidad_caja_fuerte_pd, denominaciones } 
                 = await this.cmd_cantidad_de_todas_denominaciones())
            let postEstado = {
                date:Date.now(),
                cantidad_recicladores_pd, 
                cantidad_stacker_pd, 
                cantidad_caja_fuerte_pd,
                denominaciones
            }
            this.grupo_procesos.postEstado = postEstado
            //this.grupo_procesos_con_postEstado = this.grupo_procesos
            await this.saveGrupoProcesosDB(this.grupo_procesos)
            this.notificacion("PENDIENTE", true)
        }
    }
    // crear o actualizar grupo_procesos
    proximo_grupo_procesos:grupo_procesos_type
    async saveGrupoProcesos(grupo:string, info:any) {
        if (this.grupo_procesos?.postEstado || (grupo && this.grupo_procesos?.preEstado)) {
            // si postEstado es que el último proceso se aborto y aún no se ha informado al usuario
            // hay un grupo con preEstado y se inicia otro, solo puede darse si se reinicia el frontend
            if (this.stop_proceso_activo) { 
                // si hay un proceso en marcha es de otro grupo_procesos, hay que pararlo, se produce al reiniciar el frontend
                let f=this.stop_proceso_activo
                this.stop_proceso_activo=null
                f()
                await new Promise((resolve)=>{setImmediate(resolve)}) // esperar a que acaben las promises de stop
            } else {
                if (!this.grupo_procesos?.postEstado && this.recovered) {
                    // hay un grupo iniciado pero sin proceso activo, hay que pararlo, se produce al reiniciar el frontend
                    try {
                        if (this.grupo_procesos && !this.grupo_procesos.enCurso) {
                            // simular un proceso en curso para que actualizarProcesoPrevioInterrumpido actualize
                            this.grupo_procesos.enCurso = {proceso:null, preEstado:null}
                        }
                        await this.actualizarProcesoPrevioInterrumpido()
                    } catch (e) {
                    }
                }
            }
            // el grupo_procesos anterior se interrumpio pero no se ha informado aún al usuario
            // se guarda la información hasta que se informe
            this.proximo_grupo_procesos = grupo ? { grupo, info, primerProceso:true } : null
        } else {
            this.proximo_grupo_procesos = null
            if (!grupo && !info) this.grupo_procesos = null
            else if (!this.grupo_procesos) {
                this.grupo_procesos = { grupo, info, primerProceso:true }
            } else {
                this.grupo_procesos.info = {
                    ...this.grupo_procesos.info,
                    ...info
                } 
            }
            await this.saveGrupoProcesosDB(this.grupo_procesos)
        }
    }

    get_procesoPrevioInterrumpido() {
        return this.grupo_procesos
    }
    // el usuario ya ha visto y aceptado el proceso interrumpido
    async aceptar_procesoPrevioInterrumpido(data?:grupo_procesos_type) {
        this.grupo_procesos=null
        await this.saveGrupoProcesosDB(null)
        this.notificacion("PENDIENTE", false)
    }
    //-----------------------------------------
    /* ---------- ABORT ---------------
        cuando se ejecuta fase_abort se aborta el comando actual, dejando de esperar su respuesta y se abortan y eliminan 
        todos los comandos pendientes de enviar. Después de esto se entra en un estado de recuperación (this.recovered=false) en el que 
        no se pueden enviar comandos, aparte de los comandos usados en la recuperación. Después se genera en recovered_event 
        y se podran enviar comandos.

        El fase_abort se ejecuta cuando:
          el usuario pulsa el boton abort después de informarsele de que un comando tarda demasiado en responder o no hay conexión.
          el websocket server o Cashlogy se reinician
          cuando un comando tarda demasido en responder y no hay un proceso que pueda interrumpir su operativa e informar al usuario,
            normalmente sera consulta de errores, consulta de mantenimiento, inicialización o procesos sin guarda
          cuando un comando recibe un error no controlado por la operativa (un error inesperado).

        Los comandos generan promesas que se resuelven cuando terminan. Durante el abort fallan todas las promesas pendientes.
        Puede haber procesos que en el momento de abortar no tuvieran un proceso en espera, porque estaban en delay o en un 
        una operación asincrona como espera base de datos, estos procesos no se darian cuenta del abort. Para solucionarlo
        estos procesos crean un abort_lock. Hasta que estos procesos no lo eliminen no se pasa de estado aborting a recuperación.
    */
    abort_lock_Map = new Map<abort_lock_type,()=>void>()
    // abort_lock es un objeto con la propiedad resolve, esta se asigna al resolve de una promise cuando se aborta.
    // cuando se remove el abort_lock se reuelve la promise y el abort puede continuar
    create_abort_lock(handler?:()=>void) { // handler ejecutado cuando se aborte
        if (this.aborting) { if (handler) handler(); return null }
        let lock:abort_lock_type={} 
        this.abort_lock_Map.set(lock, handler)
        return lock
    }
    remove_abort_lock(lock:abort_lock_type) {
        if (!lock) return false
        if (lock.resolve) lock.resolve()
        this.abort_lock_Map.delete(lock)
        return !this.is_abort_lock_aborted(lock) 
    }
    is_abort_lock_aborted(lock:abort_lock_type) { return (!lock || lock.resolve) ? true : false }

    aborting = false
    current_cmd_in_abort

    abort_id=0
    list_fase_abort_resolvers:(()=>void)[] = []
    async fase_abort() {
        if (this.aborting) {
            // se ha abortado cuando ya se estaba en la fase de aborting->esperar a que se acabe el aborting actual,
            // es improbale que pase pero podria pasar p.ej. si un comando tarda mucho, se aborta, mientras hay un error de conexión
            // y al volver a conectar se ha reiniciado Cashlogy. En cualquier caso primero debe acabar el aborting el primer proceso
            // y abortarlo antes de llegar a la fase de recuperación.
            let { promise, resolve } = Promise_withResolvers<void>()
            this.list_fase_abort_resolvers.push(resolve)
            await promise
        }

        this.abort_id++
        this.aborting = true
        this.recovered = false
        this.current_cmd_in_abort = this.current_cmd
        // abortar el comando en curso, despues en send_receive se abortaran los pendientes porque tiene un abort_lock
        if (this.current_cmd?.abort) this.current_cmd.abort() 
        // abortar los abort_lock
        let list = Array.from(this.abort_lock_Map.entries())
        this.abort_lock_Map.clear()
        let list_promises = list.map(([lock, handler]) => {
            let { resolve, promise } = Promise_withResolvers<void>()
            lock.resolve = resolve
            if (handler) handler()
            return promise
        })
        await Promise.all(list_promises)
        // esperar a que las promesas de list_promises resuelvan las nuevas promesas que pongan
        await new Promise((resolve) => { setImmediate(resolve) })  // setImmediate se ejecutara en las macroTasks después de las promises

        if (this.list_fase_abort_resolvers.length) {
            // esperar a que el proceso actual que ha ejecutado fase_abort acabe antes que continue el nuevo
            setImmediate(() => (this.list_fase_abort_resolvers.shift())())
            return false // fase_abort debe mirar el retorno para saber si continuar con la fase de recuperación
        } else {
            this.aborting = false
            return true
        }
    }

    // Cuando acabe la fase de recuperación se ejecuta un recovered_event y se continuan los procesos esperando 
    recovered=false
    list_wait_recovered:((ok:boolean)=>void)[] = []
    recovered_event() {
        this.recovered = true
        this.current_cmd_in_abort = null
        let list = this.list_wait_recovered
        this.list_wait_recovered = []
        list.forEach((callback) => { callback(true) })
    }
    async wait_recovered(abort_wait:Promise<void>=null) { // abort_wait una promesa para dejar de esperar la recuperación
        if (this.recovered) {
            return true
        } else {
            let { promise, resolve } = Promise_withResolvers<boolean>()
            this.list_wait_recovered.push(resolve)
            if (abort_wait) abort_wait.then(() => {
                removeItemArray(resolve, this.list_wait_recovered)
                resolve(false) // la promesa wait_recovered se resulve con false si hay abort_wait, si hay recovered se resuelve con true
            })
            return await promise    
        }
    }

    //-----------------------------------------

    // cualquier comando podria quedarse bloqueado o sin conexion, con timeout_in_cmd se podra avisar al usuario y abortar la operación y 
    // poder seguir, depende del tipo de comando tendra un timeout o otro
    // timeout_in_cmd es usado por el proceso que ejecuta la operativa actual y tiene capacidad de informar al usuario,
    // en otros casos se usa el objeto no_respuesta
    timeout_in_cmd_action:()=>void // función que se ejecuta si el comando tarda mucho
    timeout_in_cmd_delays:{[tipo in tipo_cmd_suspendible_type]?:number} // cada tipo de comando tiene un delay 
    timeout_in_cmd_timer:ReturnType<typeof setTimeout>
    // set timeout se ejecuta al iniciar el proceso
    set_timeout_in_cmd(action:()=>void, delays_ms:{[tipo in tipo_cmd_suspendible_type]?:number}) {
        this.timeout_in_cmd_action = action
        this.timeout_in_cmd_delays = delays_ms
        this.start_timeout_in_cmd("NORMAL") // por si hay un comando ejecutandose ahora que este bloqueado
    }
    // cuando salta el timeout se crea una función que se ejecuta si hay un refresh (un start o stop)
    timeout_in_cmd_before_refresh:()=>void
    //timeout_in_cmd_last_tipo_suspendible:tipo_cmd_suspendible_type

    // start después de enviar el comando
    start_timeout_in_cmd(tipo_cmd_suspendible?:tipo_cmd_suspendible_type) {
        this.refresh_timeout_in_cmd()
        clearTimeout(this.timeout_in_cmd_timer)
        //if (!tipo_suspendible) tipo_suspendible=this.timeout_in_cmd_last_tipo_suspendible??"NORMAL"
        let ms = this.timeout_in_cmd_delays?.[tipo_cmd_suspendible]??5*1000
        if (this.timeout_in_cmd_action) { // solo si se ha echo un set_timeout
            this.timeout_in_cmd_timer = setTimeout(this.timeout_in_cmd_action, ms)
        }
    }
    //  stop después de recibir la respuesta
    stop_timeout_in_cmd() {
        this.refresh_timeout_in_cmd()
        clearTimeout(this.timeout_in_cmd_timer)
    }
    refresh_timeout_in_cmd() {
        if (this.timeout_in_cmd_before_refresh) {
            let f=this.timeout_in_cmd_before_refresh
            this.timeout_in_cmd_before_refresh=null
            f()
        }
    }
    // remove al acabar el proceso
    remove_timeout_in_cmd() {
        clearTimeout(this.timeout_in_cmd_timer)
        this.timeout_in_cmd_action=null
        this.timeout_in_cmd_before_refresh=null
    }

    //-----------------------------------------
    // conexion_state tien tres estados ok, conectado, inicializando

    conexion_state:conexion_state_type={ conectado:false, inicializado:false }
    list_conexion_handlers:((state:conexion_state_type)=>void)[]=[]
    list_wait_conexion:((ok:boolean)=>void)[] = []

    conexion_ok() { return this.conexion_state.conectado && this.conexion_state.inicializado; }
    conexion_event(new_state:conexion_state_type) {
        this.conexion_state = {
            ...this.conexion_state,
            ...new_state
        }
        this.list_conexion_handlers.forEach((handler) => { handler(this.conexion_state); })
        if (this.conexion_ok()) {
            let list = this.list_wait_conexion
            this.list_wait_conexion = []
            list.forEach((callback) => { callback(true) })
        }
        this.notificacion("CONECTANDO", !this.conexion_state.conectado)
        this.notificacion("INICIALIZANDO", this.conexion_state.conectado && !this.conexion_state.inicializado)
    }
    set_conexion_handler(handler:(state:conexion_state_type)=>void) {
        this.list_conexion_handlers.push(handler)
    }
    remove_conexion_handler(handler:(state:conexion_state_type)=>void) {
        removeItemArray(handler, this.list_conexion_handlers)
    }

    async wait_conexion(abort_wait:Promise<void>=null) {
        if (this.conexion_ok()) {
            return true
        } else {
            let { promise, resolve } = Promise_withResolvers<boolean>()
            this.list_wait_conexion.push(resolve)
            if (abort_wait) abort_wait.then(() => {
                removeItemArray(resolve, this.list_wait_conexion)
                resolve(false)
            })
            return await promise    
        }
    }

    //-----------------------------------------

    stop_proceso_activo:()=>void

    /* etapas del controlador de estado
            - parar cualquier proceso con controlador que este en marcha. Esta situación puede darse si el frontend se reinicia
              mientras hay un proceso y despues se empieza otro. Normalmente se da en las fases de debug, sino seria un error grave.
              Del mismo modo el controlador esta preparado para que lo paren.
            - Esperar a que conexión este ok, o sea, conectado e inicializado
            - Esperar a que este recovered, o sea, en caso de abort esperar a que este recuperado.
            - En estas dos opciones anteriores, se le da la opción al usuario de cancelar el proceso, en este caso no se aborta
              ya que el proceso aún no se a iniciado.
            - Si hay un proceso previo interrumpido y no se ha informado al usuario, informar y esperar la aceptación
            - Despues de esta fase empieza el proceso que ha generado este controlador
            - Mientras el controlador se encarga de:
                - informar al usuario si no hay conexión o si un proceso tarda mucho, dandole la opción de abortar
            - Cuando el proceso acaba el controlador elimina todos los handlers que ha puesto
            - Si el proceso acaba en error, el controlado se encarga de generar un objeto que se devolvera al frontend con la 
              información del error, además el proceso podra añadir la información parcial que se haya generado.
            - Si el usuario ha abortado la operación se encarga de iniciar la recuperación.
    */
    async generar_controlador_de_estado_para_proceso(
            emit_suspendido:emit_suspendido_type
    ){
        let control_obj:{
            reject_if_abort?:()=>void,
            //boton_not_ready?:boton_type,
            return_abort?:return_abort_type, // objeto que se retorna en caso de abort o cancel
            delay_with_abort?:(ms:number)=>Promise<void>,
            finalizar?:()=>void,
            finalizar_catch?:(e_catch:string|Symbol)=>Promise<return_abort_type>
        } = {}

        let promise_abort_by_user:Promise<boton_type>
        let abort_lock:abort_lock_type

        //control_obj.boton_not_ready = BOT_CANCELAR
        control_obj.return_abort = { cancelado:true }

        // -------------------------
        let stopped = false
        let { promise:stoppedPromise, resolve:stoppedResolve} = Promise_withResolvers<void>()

        // si hay un proceso activo pararlo y poner un handler para que paren este proceso si es necesario
        // la función de parada es sincrona, o sea, después de llamarla el nuevo controlador continuara
        let prev_stop = this.stop_proceso_activo
        this.stop_proceso_activo = () => { stopped=true; stoppedResolve() } 
        if (prev_stop) { 
            prev_stop(); 
            await new Promise((resolve)=>{setImmediate(resolve)}) // esperar a que acaben las promises de stop
        }

        let fase_not_started = true

        // por si falla el evento en socket.io, en teoria solo pasa en debug
        let timeout_emit_suspendido = setInterval(()=>{do_emit_suspendido()}, 10*1000)
        // generar retorno si stop
        const return_stopped = () => { 
            control_obj.return_abort={ cancelado:true, not_ready_info:{stopped:true} }; 
            return return_with_return_abort()
        }
        const return_with_return_abort = () => {
            clearInterval(timeout_emit_suspendido)
            return control_obj
        }
        let timeout_activado = false

        let last_suspendido_state:suspendido_state_type = "OK"
        // generar el estado de suspendido dependiendo de otros estados y cojer el más prioritario y enviar
        // a la función emit_suspendido que emitira un evento al frontend.
        // emit_suspendido es proporcionado por el proceso, ya que cada proceso puede generar información diferente
        // que presentar al usuario. 
        const do_emit_suspendido = () => {
            let state:suspendido_state_type
                 if (!this.conexion_state.conectado) state="CONECTANDO"
            else if (!this.conexion_state.inicializado) state="INICIALIZANDO"
            else if (!this.recovered) state="NO_RECUPERADO"
            else if (timeout_activado) state="TIMEOUT"
            else                        state="OK"
            last_suspendido_state = state
            return emit_suspendido(state, fase_not_started)
        }

        // se ejecuta después de la fase de abort en caso de que este controlador haya generado el abort.
        const recovery_from_abort = async(reset:boolean) => {
            let failed =false
            let abort_lock = this.create_abort_lock()
            if (!abort_lock) return
            try {
                if (reset) await this.cmd_reset()
                await this.actualizarProcesoPrevioInterrumpido()
            } catch (e) {
                failed=true
                // fail -> inicializar
            }
            if (this.remove_abort_lock(abort_lock)) {
                if (!failed) this.recovered_event()
                else this.inicializar()
            }
        }

        let boton_handler_fase_started:(boton:boton_type)=>void

        do {
            // -------------------------

            // esperar a que conexión este ok y después esperar a que este recovered
            for (let {check, wait} of [
                    {check:() => this.conexion_ok(), wait:(abort_wait_promise:Promise<void>) => this.wait_conexion(abort_wait_promise)},
                    {check:() => this.recovered, wait:(abort_wait_promise:Promise<void>) => this.wait_recovered(abort_wait_promise)}
                ]) {
                if (!check()) {
                    let data_emit_suspendido = do_emit_suspendido()
                    let botones=data_emit_suspendido.botones.map((m_b)=>m_b.bot)
                    // emit Cashlogy notReadyState 
                    let { promise:abort_wait_promise, resolve:abort_wait_resolve } = Promise_withResolvers<void>()
                    let boton_not_ready:boton_type
                    let handler_boton = (bot:boton_type) => { 
                        boton_not_ready=bot;
                        abort_wait_resolve()
                    }
                    this.boton_setHandler(botones, handler_boton) // handlers de botones pulsados desde el frontend
                        // wait : esperar a que se resuelva lo que se esta checkeando o salir si se pulsa tecla o stop
                    let wait_ok = await wait(Promise.race([abort_wait_promise, stoppedPromise])) 
                    this.boton_removeHandler(handler_boton)
                    if (stopped) return return_stopped()
                    //this.boton_reset(botones)
                    if (!wait_ok) { // se ha salido de la espera por tecla pulsada
                        // generar el return_abort, con cancel o manual dependiendo del boton pulsado
                        // maual solo se da en el proceso de cobrar
                        control_obj.return_abort = {
                            cancelado:(boton_not_ready==BOT_ABORTAR_Y_CANCELAR || boton_not_ready==BOT_CANCELAR),
                            not_ready_info:{
                                conexion_state:{ ...this.conexion_state },
                                recovered:this.recovered,
                            },
                            manual:(boton_not_ready==BOT_ABORTAR_Y_MANUAL || boton_not_ready==BOT_MANUAL)
                        }
                        // si se cancela aqui antes de haber iniciado ningún proceso del grupo grupo_procesos,
                        // significa que cashlogy esta en el mismo estado que cuando se inicio la operativa,
                        // por lo tanto no se tendra que arreglar la contabilidad
                        if (/*!this.proximo_grupo_procesos && */this.grupo_procesos && this.grupo_procesos.primerProceso==false) {
                            // como no es el primer proceso del grupo de procesos, es como si se abortara,
                            // y se tendra que arreglar la contabilidad
                            control_obj.return_abort.abort_info = {
                                reason:"USER2",
                                grupo_procesos:this.grupo_procesos,
                                stopped,
                                last_suspendido_state
                            }
                            if (await this.fase_abort()) {
                                // no await, se deja recuperando y se vuelve al proceso que retornara el resultado al frontend
                                /* await */ recovery_from_abort(false) // false -> no hace falta enviar un reset a la máquina
                            }
                        }
                        this.stop_proceso_activo = null
                        return return_with_return_abort() // devolver el control al proceso, que comprobara return_abort y saldra
                    }
                }
            }
            do_emit_suspendido() // actualizar el estado de suspendido

            // -------------------------------


            if (stopped) return return_stopped()

            // this.grupo_procesos = null // ???? debug

            // después de esperar recovered puede haber un proceso previo interrumpido que se ha de informar al usuario
            // no puede ser antes de mirar recovered
            if (this.grupo_procesos?.postEstado) {
                // informar al usuario si el proceso previo se ha interrumpido
                let { promise, resolve } = Promise_withResolvers<string>()
                this.boton_setHandler([BOT_ACEPTAR, BOT_CANCELAR], resolve)
                io.emit("Cashlogy.procesoPrevioInterrumpido", this.grupo_procesos)
                let bot_proceso_en_curso = await Promise.race([promise, stoppedPromise])
                this.boton_removeHandler(resolve)
                if (stopped) return return_stopped()
                if (bot_proceso_en_curso == BOT_CANCELAR) {
                    control_obj.return_abort={cancelado:true}
                    this.stop_proceso_activo = null
                    return return_with_return_abort()
                }else {
                    await this.aceptar_procesoPrevioInterrumpido()
                    continue // recheck conexion y recovered
                }
            }

            if (this.proximo_grupo_procesos) {
                this.grupo_procesos = this.proximo_grupo_procesos
                this.proximo_grupo_procesos = null
            }

            const abort_handler = () => {
                if (control_obj.reject_if_abort) control_obj.reject_if_abort()
                //this.boton_reset([BOT_ABORTAR_Y_CANCELAR, BOT_ABORTAR_Y_MANUAL])
                this.boton_removeHandler(boton_handler_fase_started)
            }

            abort_lock = this.create_abort_lock(abort_handler)
            if (!abort_lock) continue // recheck conexion y recovered

            break
        } while (true)

        // ------------------------------

        delete control_obj.return_abort
        fase_not_started = false

        // A partir de aqui solo se ponen los handlers para los diferentes eventos y se generan las funciones finalizar, que el proceso
        // llamara cuando termine y después se vuelve al proceso para iniciarse. Cuando el proceso acabe llamara a la función finalizar
        // correspondiente

        // podria haber watchdog activado y no connection

        // timeout_in_cmd para avisar al usuario que un comado tarda mucho
        const timeout_action = () => {
            timeout_activado = true
            this.timeout_in_cmd_before_refresh = () => {
                timeout_activado=false // si se refresca el timeout emitir no timeout
                do_emit_suspendido()
            }
            do_emit_suspendido() // emitir timeout
        }
        const conexion_handler = (state:conexion_state_type) => {
            do_emit_suspendido()
        }

        // timeouts para diferentes tipos de comandos que se pueden ejecutar durante el proceso, como los propios del proceso,
        // la consulta de errores o mantenimiento. En caso de que se ejecutar el comando inicializar, antes se habria abortado,
        // y el timeout_in_cmd se habria quitado.
        this.set_timeout_in_cmd(timeout_action, {
            NORMAL: 10*1000,
            DISPENSAR: 30*1000,
            RETIRAR_STACKER: 60*1000
        })

        this.set_conexion_handler(conexion_handler)

        boton_handler_fase_started = (boton:boton_type) => {
            if (this.is_abort_lock_aborted(abort_lock)) return // se ha abortado un momento antes de pulsar el boton
            if (timeout_activado || !this.conexion_ok() || stopped) {
                promise_abort_by_user = new Promise<boton_type>(async (resolve) => { 
                    control_obj.return_abort = {
                        manual:(boton==BOT_ABORTAR_Y_MANUAL),
                        not_ready_info:{
                            conexion_state:{...this.conexion_state},
                            recovered:this.recovered
                        },
                        abort_info:{
                            reason:"USER",
                            grupo_procesos:this.grupo_procesos,
                            timeout_activado,
                            stopped,
                            last_suspendido_state,
                        }
                    }
                    if (await this.fase_abort()) {
                        // no await, se deja recuperando y se vuelve al proceso que retornara el resultado al frontend
                        /* await */ recovery_from_abort(true) // true = enviar un reset a la máquina
                    }
                    resolve(boton)
                    //return control_obj.promise_abort_by_user
                })
            } else {
                // como la pulsacion llega asincrona por http podria haberse solucionado el problema antes de llegar, seria muy raro
                // como pulsar el boton quita el handler, se vuelve a poner
                set_boton_handler_bot_abortar() 
            }
        }

        const set_boton_handler_bot_abortar = () => {
            this.boton_setHandler([BOT_ABORTAR_Y_CANCELAR, BOT_ABORTAR_Y_MANUAL], boton_handler_fase_started)
        }
        set_boton_handler_bot_abortar()

        // se cambia el handler stop para ejecutar el handler del boton que empezara el abort, así el nuevo proceso
        // se esperara a que este recovered
        this.stop_proceso_activo = () => {
            stopped = true
            stoppedResolve()
            this.boton_pulsar(BOT_ABORTAR_Y_CANCELAR)
        }
            
        // ------------------------

        control_obj.delay_with_abort = (ms:number) => {
            return new Promise((resolve, reject) => {
                setTimeout(resolve, ms)
                control_obj.reject_if_abort = () => reject(ABORT_CMD)
            })
        }

        const clear = () => {
            if (!stopped) this.stop_proceso_activo = null
            clearInterval(timeout_emit_suspendido)
            this.remove_abort_lock(abort_lock)
            //this.boton_reset([BOT_ABORTAR_Y_CANCELAR, BOT_ABORTAR_Y_MANUAL])
            this.boton_removeHandler(boton_handler_fase_started)
            this.remove_timeout_in_cmd()
            this.remove_conexion_handler(conexion_handler)
        }
        // finalizar, si el proceso acaba correctamente
        control_obj.finalizar = () => {
            clear()
            if (promise_abort_by_user) {
                // podria haber promise_abort_by_user y acabar el proceso correctamente, 
                // si se aborta en una espera asincrona al acabar, como guardar en la base de datos
            }
        }
        // finalizar_catch, si el proceso tiene una excepción, por abort o por un error de Cashlogy no controlado
        control_obj.finalizar_catch = async(e_catch:string|Symbol):Promise<return_abort_type> => {
            clear()
             // grupo_procesos tendra postEstado, si empieza un nuevo grupo_procesos no lo sobreescribira 
             // en saveGrupoProcesos_estado
            if (this.grupo_procesos) this.grupo_procesos.postEstado={}
            let ret:return_abort_type = {
                abort_info:{
                    reason:"",
                    //date:this.procesoEnCurso ? this.procesoEnCurso.data : null,
                    grupo_procesos:this.grupo_procesos
                }
            }
            if (promise_abort_by_user) {
                let boton = await promise_abort_by_user
                ret = control_obj.return_abort
            } else if (e_catch==ABORT_CMD) {
                // aqui se entra si después de una reconexión , el websocket server informa que se ha reiniciado
                ret.abort_info.reason="RESET"
                ret = { 
                    ...ret,
                    not_ready_info:{
                        conexion_state:{...this.conexion_state},
                        recovered:this.recovered
                    }
                } 
            } else {
                // otros errores
                if (await this.fase_abort()) {
                    // no await, se deja recuperando y se vuelve al proceso que retornara el resultado al frontend
                    /* await */ recovery_from_abort(true)
                } 
                ret.abort_info.reason=e_catch.toString()
            }
            return ret
        }
    
        return control_obj
    }

    // bucle con denominaciones dispensables
    bucle_dispensables = (f_inside:(mob:type_billetes_monedas, den:number)=>boolean|void) => {
        return this.bucle_denominaciones(this.denominaciones_dispensables, f_inside)
    }

    // bucle que llama a la función f_inside con cada denominación de mayor a menor, primero billetes y después monedas.
    // si f_inside devuleve == false se sale
    bucle_denominaciones = (denominaciones:type_denominaciones,f_inside:(mob:type_billetes_monedas, den:number)=>boolean|void) => {
        let continue_loop=true
        for (let mob of iter_billetes_monedas) {
            for (let i=denominaciones[mob].length-1; i>=0 && continue_loop; i--) {
                let den = denominaciones[mob][i] as number;
                if (f_inside(mob, den) == false) continue_loop=false // si la funcion no devuelve valor se continua
            }
        }
        return continue_loop
    }

    // emit_suspendido para la mayoria de procesos, generara un boton "CANCELAR" o "ABORTAR" dependiendo de si el proceso 
    // no ha empezado o sí ha empezado
    emit_suspendido_comun:emit_suspendido_type = (suspendido_state:suspendido_state_type, not_started:boolean) => {
        let data:{
            state:suspendido_state_type,
            botones:{msg:string, bot:boton_type}[],
            tipo_cmd_suspendible:tipo_cmd_suspendible_type,
            not_started:boolean
        } ={
            state:suspendido_state,
            botones:(not_started) ? 
                        [{ msg: "CANCELAR", bot:BOT_ABORTAR_Y_CANCELAR }] :
                        [{ msg: "INTERRUMPIR", bot:BOT_ABORTAR_Y_CANCELAR }],
            tipo_cmd_suspendible:this.current_cmd?.tipo_cmd_suspendible,
            not_started
        }
        io.emit("Cashlogy.suspendido", data)
        return data 
    }

    importe_entrado_manualmente_en_cobrar:number = 0

    //---------------------------------------
    // Procesos con controlador de estado

    async cobrar(importe_a_cobrar:number, auto_aceptar):Promise<{ // objecto devuelto al frontend
        cancelado?:boolean,
        importe_falta_devolver?:number,
        error_en_la_devolucion?:boolean,
        importe_entrado?:number,
        importe_entrado_manualmente?:number
    } & return_abort_type> { // return_abort_type todos los procesos extienden esta interfaz, el controlador se encarga de rellenar

        loggerCashlogy.Info(`in:${importe_a_cobrar}`, "cobrar")

        let err:string
        let cents_a_cobrar = to_cents(importe_a_cobrar)
        let cents_falta_cancelar:number 
        let cents_vuelta:number
        let cents_falta_vuelta:number 
        let cents_in:number, cents_out:number
        let finalizando_admision=false
        let cancelando=false
        let error_en_la_devolucion=false
        let importe_entrado_manualmente=0

        const proceso = "COBRAR"

        type state_type = "ENTRADA" | "VUELTA" | "CANCELAR"
        let update_state:state_type

        // se envian eventos socket.io al frontend sobre el estado del proceso
        const update = (state:state_type) => {
            let data:{
                proceso:typeof proceso
                state:state_type,
                importe_a_cobrar?:number,
                importe_entrado?:number,
                importe_entrado_manualmente?:number,
                importe_pendiente?:number,
                finalizando_admision?:boolean,
                importe_a_devolver?:number,
                cancelando?:boolean
            } = {
                proceso,
                state,
                importe_a_cobrar
            }
            update_state = state

            //data.state
            switch(state) {
                case "ENTRADA":
                    data.importe_entrado=to_euros(cents_in);
                    data.importe_entrado_manualmente=importe_entrado_manualmente
                    data.importe_pendiente=to_euros(cents_a_cobrar-cents_in)
                    data.finalizando_admision = finalizando_admision
                    data.cancelando = cancelando
                    break;
                case "VUELTA":
                    data.importe_a_devolver=to_euros(cents_vuelta)
                    break;
                case "CANCELAR":
                    data.importe_a_devolver=to_euros(cents_in)
                    break;
            }
            io.emit("Cashlogy.update", data)
        }

        // en el proceso cobrar, si el proceso esta suspendido, se puede cancelar o resolver manualmente 
        const emit_suspendido:emit_suspendido_type = (suspendido_state:suspendido_state_type, not_started:boolean) => {
            let data:{
                state:suspendido_state_type,
                botones:{msg:string, bot:boton_type}[],
                tipo_cmd_suspendible:tipo_cmd_suspendible_type,
                not_started:boolean
            } = {
                state:suspendido_state,
                botones:[],
                tipo_cmd_suspendible:this.current_cmd?.tipo_cmd_suspendible,
                not_started
            };
            if (update_state==null) {
                data.botones = [ 
                    { msg: "CANCELAR", bot:BOT_ABORTAR_Y_CANCELAR },
                    { msg: "COBRAR MANUALMENTE", bot:BOT_ABORTAR_Y_MANUAL }
                ]
            } else {
                data.botones = [ { msg: "INTERRUMPIR Y CANCELAR", bot:BOT_ABORTAR_Y_CANCELAR } ]
                if (update_state=="ENTRADA" || update_state=="CANCELAR") {
                    data.botones.push({ msg: "INTERRUMPIR Y COBRAR MANUALMENTE", bot:BOT_ABORTAR_Y_MANUAL })
                }
            }
            io.emit("Cashlogy.suspendido", data)
            return data
        }
        let control_obj = await this.generar_controlador_de_estado_para_proceso(emit_suspendido)
        if (control_obj.return_abort) {
            loggerCashlogy.Error("out-1", "cobrar")
            return {
                ...control_obj.return_abort,
                importe_falta_devolver:(control_obj.return_abort.cancelado)?0:null
            }
        }
        try {
            // guardar estado de Cashlogy por si se aborta, poder recuperar la contabilidad
            await this.saveProceso("COBRO", {cents_a_cobrar} )  
            
            //await this.consulta_error();

            await this.cmd_iniciar_admision()

            cents_in=0
            this.boton_reset([BOT_CANCELAR, BOT_ACEPTAR])
            if (auto_aceptar) this.boton_pulsar(BOT_ACEPTAR)
            update("ENTRADA")

            while(true) {
                await control_obj.delay_with_abort(200)

                if (this.boton_get(BOT_CANCELAR)) break;

                let prev_cents_in=cents_in
                ;( { cents_in } = await this.cmd_ver_importe_admitido() )

                if (importe_entrado_manualmente!=this.importe_entrado_manualmente_en_cobrar) {
                    importe_entrado_manualmente=this.importe_entrado_manualmente_en_cobrar
                    update("ENTRADA")
                }

                if (cents_in!=prev_cents_in) update("ENTRADA")

                if (cents_in+to_cents(importe_entrado_manualmente) >=cents_a_cobrar && this.boton_get(BOT_ACEPTAR)) break;

                if (this.boton_get(BOT_CANCELAR)) break;
            }
            const fase_cancelar = async () => {
                importe_entrado_manualmente=0
                cancelando = true
                update("CANCELAR")

                if (cents_in==0) {
                    cents_falta_cancelar=0
                } else {
                    await this.saveProceso("COBRO", { update_state, cents_in, cents_a_cobrar})

                    ;( { err, cents_out } = await this.cmd_dispensar(cents_in) )
                    error_en_la_devolucion = (err==ER_GENERIC) && (cents_out!=0)
                    cents_falta_cancelar = cents_in-cents_out

                    //await this.consulta_error()
                }

            }
            if (this.boton_get(BOT_CANCELAR)) {
                cancelando = true
                finalizando_admision=true
                update("ENTRADA")

                ;( { cents_in } = await this.cmd_finalizar_admision() )

                await fase_cancelar()

            } else {
                //await this.consulta_error();

                finalizando_admision=true
                update("ENTRADA")
                
                ;( { cents_in } = await this.cmd_finalizar_admision() )

                cents_vuelta = (cents_in+to_cents(importe_entrado_manualmente))-cents_a_cobrar

                if (cents_vuelta>=0) {
                    update("VUELTA")
                    if (cents_vuelta==0) {
                        cents_falta_vuelta=0
                    } else {
                        await this.saveProceso("COBRO", {update_state, cents_vuelta, cents_a_cobrar})

                        ;( { err, cents_out } = await this.cmd_dispensar(cents_vuelta) )
                        error_en_la_devolucion = (err==ER_GENERIC) && (cents_out!=0)
                        cents_falta_vuelta = cents_vuelta-cents_out

                        //await this.consulta_error()
                    }

                } else {
                    // no tendria que pasar por aqui (cents_in < cents_a_cobrar), si pasa cancelar operación
                    this.boton_pulsar(BOT_CANCELAR)

                    await fase_cancelar()
                } 
            }
            control_obj.finalizar() // finalizar el controlador de estado

            await this.saveProceso(null)

            loggerCashlogy.Info("out", "cobrar")

            if (cancelando) return { 
                cancelado:true, 
                importe_falta_devolver:to_euros(cents_falta_cancelar), 
                error_en_la_devolucion,
                importe_entrado:to_euros(cents_in), 
                importe_entrado_manualmente:0
            }
            else return { 
                importe_falta_devolver:to_euros(cents_falta_vuelta), 
                error_en_la_devolucion,
                importe_entrado:to_euros(cents_in),
                importe_entrado_manualmente
            }
        } catch(e) {
            loggerCashlogy.Error("out-2", "cobrar")
            // finalizar el controlador con error, ret tendra la información del error que se envia al frontend
            // ret puede extenderse con información del estado parcial del proceso, si es necesario
            let ret = await control_obj.finalizar_catch(e)
            if (update_state=="CANCELAR") return {
                ...ret,
                importe_falta_devolver:to_euros(cents_falta_cancelar),
                error_en_la_devolucion,
                importe_entrado:to_euros(cents_in),
                importe_entrado_manualmente:0
            }
            if (update_state=="VUELTA") return {
                ...ret,
                cancelado:false,
                importe_falta_devolver:to_euros(cents_falta_vuelta),
                error_en_la_devolucion,
                importe_entrado:to_euros(cents_in),
                importe_entrado_manualmente
            }
            return ret // update_state=="ENTRADA"
        } finally {
        }
    }


    async subproceso_anadir_cambios(control_obj:Awaited<ReturnType<CashlogyClase["generar_controlador_de_estado_para_proceso"]>>) {
        let cantidad_inicio_pd:valor_por_denominaciones, 
            cantidad_recicladores_pd:valor_por_denominaciones,
            cantidad_diff_pd:valor_por_denominaciones,
            cantidad_inicio_no_devolvibles_pd:valor_por_denominaciones,
            cantidad_no_devolvibles_pd:valor_por_denominaciones,
            denominaciones:type_denominaciones
        let cents_in:number,
            cents_recicladores:number
        let finalizando_admision=false

        const proceso = "AÑADIR_CAMBIOS"

        type state_type = "AÑADIENDO"
        let update_state:state_type

        const update = (state:state_type) => {
            let data:{
                proceso:typeof proceso,
                //state:state_type,
                cantidad_entrado_pd?:valor_por_denominaciones
                cantidad_recicladores_pd?:valor_por_denominaciones,
                denominaciones_dispensables?:type_denominaciones,
                importe_entrado?:number,
                importe_recicladores?:number,
                finalizando_admision?:boolean
            } = {
                proceso,
                //state,
            }
            update_state = state
            switch(state) {
                case "AÑADIENDO":
                    data.cantidad_entrado_pd = cantidad_diff_pd
                    data.cantidad_recicladores_pd = cantidad_recicladores_pd
                    data.denominaciones_dispensables = this.denominaciones_dispensables
                    data.importe_entrado = to_euros(cents_in)
                    data.importe_recicladores = to_euros(cents_recicladores)
                    data.finalizando_admision = finalizando_admision
                    break;
            }
            io.emit("Cashlogy.update", data)
        }

        this.boton_reset(BOT_ACEPTAR)

        await this.saveProceso("AÑADIR_CAMBIOS")

        await this.consulta_error();

        ;( { cantidad_recicladores_pd, cantidad_no_devolvibles_pd, denominaciones } = await this.cmd_cantidad_de_todas_denominaciones() )
        cantidad_inicio_pd = cantidad_recicladores_pd
        cantidad_inicio_no_devolvibles_pd = cantidad_no_devolvibles_pd

        await this.cmd_anadir_cambios()

        let cpd_prev:valor_por_denominaciones,
            cpd_no_devolvibles_prev:valor_por_denominaciones
        while(true) {
            ;( { cantidad_recicladores_pd, cantidad_no_devolvibles_pd } = await this.cmd_cantidad_de_todas_denominaciones() )

            let igual_prev=false
            if (cpd_prev) {
                igual_prev = this.bucle_denominaciones(denominaciones, (monedas_billetes, den) => {
                    return (cpd_prev[monedas_billetes][den] == cantidad_recicladores_pd[monedas_billetes][den]);
                })
            }
            if (cpd_no_devolvibles_prev) {
                if (igual_prev) {
                    igual_prev = this.bucle_denominaciones(denominaciones, (monedas_billetes, den) => {
                        return (cpd_no_devolvibles_prev[monedas_billetes][den] == cantidad_no_devolvibles_pd[monedas_billetes][den]);
                    })
                }
            }

            if (!igual_prev) { // update
                cantidad_diff_pd = create_vpd();
                cents_in=0
                cents_recicladores=0
                this.bucle_denominaciones(denominaciones, (mob, den) => {
                    let diff = cantidad_recicladores_pd[mob][den] - cantidad_inicio_pd[mob][den];
                    cantidad_diff_pd[mob][den] = diff;
                    cents_in += diff*den + (cantidad_no_devolvibles_pd[mob][den]-cantidad_inicio_no_devolvibles_pd[mob][den])*den;
                    cents_recicladores += cantidad_recicladores_pd[mob][den]*den
                    
                })

                update("AÑADIENDO")
            }

            cpd_prev = cantidad_recicladores_pd; 
            cpd_no_devolvibles_prev = cantidad_no_devolvibles_pd;

            if (this.boton_get(BOT_ACEPTAR)) break;

            await control_obj.delay_with_abort(200)
            if (this.boton_get(BOT_ACEPTAR)) break;
        }
        await this.consulta_error();
            
        finalizando_admision=true
        update("AÑADIENDO")

        ;( { cents_in } = await this.cmd_finalizar_admision() )
        return cents_in
    }

    async subproceso_solo_dispensar(cents_a_devolver:number) {
        let err:string
        let cents_falta_devolver:number
        let cents_out:number
        let error_en_la_devolucion=false

        let importe_a_devolver = to_euros(cents_a_devolver)

        const proceso = "SOLO_DISPENSAR"

        type state_type = "DISPENSANDO"
        let update_state:state_type

        const update = (state:state_type) => {
            let data:{
                proceso:typeof proceso,
                //state:state_type,
                importe_a_devolver?:number,
            } = {
                proceso,
                //state,
                importe_a_devolver:importe_a_devolver
            }
            update_state = state
            switch(state) {
                case "DISPENSANDO":
                    break;
            }
            io.emit("Cashlogy.update", data)
        }

        await this.saveProceso(proceso, {update_state, cents_a_devolver})

        update("DISPENSANDO");

        ;( { err, cents_out } = await this.cmd_dispensar(cents_a_devolver) )
        error_en_la_devolucion = (err==ER_GENERIC) && (cents_out!=0)
        cents_falta_devolver = cents_a_devolver-cents_out

        await this.consulta_error()

        return { cents_falta_devolver, error_en_la_devolucion }
    }

    async anadir_cambios_y_devolver(importe_a_devolver:number):Promise<{
        importe_falta_devolver?:number,
        importe_anadido_en_cambios?:number,
        error_en_la_devolucion?:boolean
    } & return_abort_type> {

        loggerCashlogy.Info(`in:${importe_a_devolver}`, "anadir_cambios_y_devolver")

        let cents_in:number
        let cents_falta_devolver:number
        let error_en_la_devolucion=false
        let cents_a_devolver=to_cents(importe_a_devolver)

        let control_obj = await this.generar_controlador_de_estado_para_proceso(this.emit_suspendido_comun)
        if (control_obj.return_abort) {
            loggerCashlogy.Error("out-1", "anadir_cambios_y_devolver")
            return {
                ...control_obj.return_abort,
                importe_falta_devolver:0,
                importe_anadido_en_cambios:0
            }
        }

        try {
            cents_in = await this.subproceso_anadir_cambios(control_obj)

            ;( { cents_falta_devolver, error_en_la_devolucion } = await this.subproceso_solo_dispensar(cents_a_devolver))

            control_obj.finalizar()
    
            await this.saveProceso(null)

            loggerCashlogy.Info("out", "anadir_cambios_y_devolver")

            return { 
                importe_falta_devolver:to_euros(cents_falta_devolver),
                importe_anadido_en_cambios:to_euros(cents_in),
                error_en_la_devolucion
            }
        } catch(e) {
            loggerCashlogy.Error("out-2", "anadir_cambios_y_devolver")
            let ret = await control_obj.finalizar_catch(e)
            return {
                ...ret,
                importe_anadido_en_cambios:(cents_in!=null)?to_euros(cents_in):null,
                error_en_la_devolucion
            }            
        }
    }

    async anadir_cambios():Promise<{
        importe_entrado?:number,
    } & return_abort_type> {
        let cents_in:number

        let control_obj = await this.generar_controlador_de_estado_para_proceso(this.emit_suspendido_comun)
        if (control_obj.return_abort) return {
            ...control_obj.return_abort,
            importe_entrado:0
        }

        try {
            cents_in = await this.subproceso_anadir_cambios(control_obj)

            control_obj.finalizar()
    
            await this.saveProceso(null)

            return { importe_entrado:to_euros(cents_in) }
        } catch(e) {
            let ret = await control_obj.finalizar_catch(e)
            return ret            
        }

    }

    async solo_dispensar(importe_a_devolver):Promise<{
        importe_falta_devolver?:number,
        error_en_la_devolucion?:boolean
    } & return_abort_type> {
        let cents_falta_devolver:number 
        let error_en_la_devolucion=false
        let cents_a_devolver=to_cents(importe_a_devolver)

        let control_obj = await this.generar_controlador_de_estado_para_proceso(this.emit_suspendido_comun)
        if (control_obj.return_abort) return {
            ...control_obj.return_abort,
            importe_falta_devolver:0
        }

        try {
            ;( { cents_falta_devolver, error_en_la_devolucion } = await this.subproceso_solo_dispensar(cents_a_devolver))

            control_obj.finalizar()

            await this.saveProceso(null)

            return { importe_falta_devolver:to_euros(cents_falta_devolver), error_en_la_devolucion }
        } catch(e) {
            let ret = await control_obj.finalizar_catch(e)
            return ret            
        }

    }

    async dar_cambio_entrada():Promise<{
        cancelado?:boolean,
        importe_falta_devolver?:number,      // solo en cancelar
        importe_entrado?:number,
        denominaciones_dispensables?:type_denominaciones
        cantidad_recicladores_pd?:valor_por_denominaciones,
        error_en_la_devolucion?:boolean
    } & return_abort_type> {

        let err:string
        let cents_in:number, cents_out:number
        let cents_falta_cancelar:number 
        let finalizando_admision=false
        let cancelando=false
        let cantidad_recicladores_pd:valor_por_denominaciones
        let error_en_la_devolucion=false

        const proceso = "DAR_CAMBIO_ENTRADA"

        type state_type = "ENTRADA" | "CANCELAR"
        let update_state:state_type

        const update = (state:state_type) => {
            let data:{
                proceso:typeof proceso,
                state:state_type,
                importe_entrado?:number,
                finalizando_admision?:boolean,
                importe_a_devolver?:number,
            } = {
                proceso,
                state,
            }
            update_state = state
            switch(state) {
                case "ENTRADA":
                    data.importe_entrado=to_euros(cents_in);
                    data.finalizando_admision = finalizando_admision
                    break;
                case "CANCELAR":
                    data.importe_a_devolver=to_euros(cents_in)
                    break;
            }
            io.emit("Cashlogy.update", data)
        }

        let control_obj = await this.generar_controlador_de_estado_para_proceso(this.emit_suspendido_comun)
        if (control_obj.return_abort) {
            return {
                ...control_obj.return_abort,
                importe_entrado:0,
                importe_falta_devolver:0
            }
        }
        try {
            await this.saveProceso(proceso, { update_state })

            await this.cmd_anadir_cambios()

            cents_in=0
            this.boton_reset([BOT_CANCELAR, BOT_ACEPTAR])
            update("ENTRADA")

            while(true) {
                let prev_cents_in=cents_in
                ;( { cents_in } = await this.cmd_ver_importe_admitido() )

                if (cents_in!=prev_cents_in) update("ENTRADA")

                if (this.boton_get(BOT_CANCELAR) || this.boton_get(BOT_ACEPTAR)) break;

                await control_obj.delay_with_abort(200)
                if (this.boton_get(BOT_CANCELAR) || this.boton_get(BOT_ACEPTAR)) break;
            }
            if (this.boton_get(BOT_CANCELAR)) cancelando=true
            update("ENTRADA")
            ;( { cents_in } = await this.cmd_finalizar_admision() )

            if (this.boton_get(BOT_CANCELAR)) {
                cancelando = true
                update("CANCELAR")

                if (cents_in==0) {
                    cents_falta_cancelar=0
                } else {
                    await this.saveProceso(proceso, { update_state, cents_in })

                    ;( { err, cents_out } = await this.cmd_dispensar(cents_in) )
                    error_en_la_devolucion = (err==ER_GENERIC) && (cents_out!=0)
                    cents_falta_cancelar = cents_in-cents_out
                }
            } else {
                ;( { cantidad_recicladores_pd } = await this.cmd_cantidad_de_todas_denominaciones())
            }

            control_obj.finalizar()

            await this.saveProceso(null)

            if (cancelando) return { 
                    cancelado:true,
                    importe_entrado:to_euros(cents_in),
                    importe_falta_devolver:to_euros(cents_falta_cancelar),
                    error_en_la_devolucion
                }
            else return { 
                importe_entrado:to_euros(cents_in), 
                denominaciones_dispensables:this.denominaciones_dispensables,
                cantidad_recicladores_pd,
                error_en_la_devolucion
            }
        } catch(e) {
            let ret = await control_obj.finalizar_catch(e)
            return {
                ...ret,
                importe_entrado:update_state=="CANCELAR"?to_euros(cents_in):null,
                error_en_la_devolucion
            }
        }
    }

    async dispensar_por_denominacion(cantidad_retirar_pd:valor_por_denominaciones, destino_billetes:destino_billetes_type):Promise<{
        denominaciones_dispensables?:type_denominaciones,
        denominaciones?:type_denominaciones,
        cantidad_recicladores_pd?:valor_por_denominaciones,
        cantidad_stacker_pd?:valor_por_denominaciones,
        cantidad_caja_fuerte_pd?:valor_por_denominaciones,
        cantidad_devuelta_pd?:valor_por_denominaciones,
        importe_a_retirar?:number,
        importe_devuelto?:number,
        importe_falta_devolver?:number,
        no_hay_caja_fuerte?:boolean,
        falta_alguna_denominacion?:boolean,
        error_en_la_devolucion?:boolean
    } & return_abort_type> {

        let err:string
        let cantidad_devuelta_pd:valor_por_denominaciones
        let cantidad_recicladores_pd:valor_por_denominaciones,
            cantidad_stacker_pd:valor_por_denominaciones,
            cantidad_caja_fuerte_pd:valor_por_denominaciones
        let denominaciones:type_denominaciones
        let cents_a_retirar:number,
            cents_devuelto:number
        let no_hay_caja_fuerte=false
        let falta_alguna_denominacion=false
        let error_en_la_devolucion=false

        const proceso = "DISPENSAR_DENOMINACION"

        type state_type = "DISPENSANDO"
        let update_state:state_type

        const update = (state:state_type) => {
            let data:{
                proceso:typeof proceso,
                state:state_type,
            } = {
                proceso,
                state,
            }
            update_state = state
            switch(state) {
                case "DISPENSANDO":
                    break;
            }
            io.emit("Cashlogy.update", data)
        }

        cents_a_retirar=0

        mob_den_value_vpd(cantidad_retirar_pd).forEach(({den,value})=>{
            cents_a_retirar+=(value||0)*den
        })

        let control_obj = await this.generar_controlador_de_estado_para_proceso(this.emit_suspendido_comun)
        if (control_obj.return_abort) return {
            ...control_obj.return_abort,
            importe_a_retirar:to_euros(cents_a_retirar),
            importe_devuelto:0,
            importe_falta_devolver:to_euros(cents_a_retirar-0)
        }

        try {
            await this.saveProceso(proceso)

            update("DISPENSANDO")
            ;( { err, cantidad_devuelta_pd } = await this.cmd_dispensar_por_denominacion(cantidad_retirar_pd, destino_billetes))
            if (err == ER_BAD_DATA && destino_billetes == "CAJA_FUERTE") no_hay_caja_fuerte=true
            if (err == WR_LEVEL) falta_alguna_denominacion=true 
            if (err == ER_GENERIC) {
                error_en_la_devolucion=false
                for (let { value } of mob_den_value_vpd(cantidad_devuelta_pd)) {
                    if (value) {
                        error_en_la_devolucion=true
                        break
                    }
                } 
            }
            ;( { cantidad_recicladores_pd, cantidad_stacker_pd, cantidad_caja_fuerte_pd, denominaciones } = await this.cmd_cantidad_de_todas_denominaciones() )

            control_obj.finalizar()

            await this.saveProceso(null)

            cents_devuelto=0

            mob_den_value_vpd(cantidad_devuelta_pd).forEach(({den,value})=>{
                cents_devuelto+=(value||0)*den
            })

            return { 
                denominaciones_dispensables:this.denominaciones_dispensables,
                denominaciones,
                cantidad_recicladores_pd,
                cantidad_stacker_pd,
                cantidad_caja_fuerte_pd,
                cantidad_devuelta_pd,
                importe_a_retirar:to_euros(cents_a_retirar),
                importe_devuelto:to_euros(cents_devuelto),
                importe_falta_devolver:to_euros(cents_a_retirar-cents_devuelto),
                no_hay_caja_fuerte,
                falta_alguna_denominacion,
                error_en_la_devolucion
            }
        } catch(e) {
            let ret = await control_obj.finalizar_catch(e)
            return ret            
        }
    }

    async vaciado_completo(solo_monedas:boolean|null, denominaciones_vaciar:type_denominaciones, destino_billetes:destino_billetes2_type):Promise<{
        denominaciones_dispensables?:type_denominaciones,
        denominaciones?:type_denominaciones,
        importe_vaciado_solo_monedas?:number,
        cantidad_recicladores_pd?:valor_por_denominaciones,
        cantidad_stacker_pd?:valor_por_denominaciones,
        cantidad_caja_fuerte_pd?:valor_por_denominaciones,
        no_hay_caja_fuerte?:boolean,
        error_en_la_devolucion?:boolean
    } & return_abort_type> {

        let err:string
        let cents_out:number
        let cantidad_recicladores_pd:valor_por_denominaciones,
            cantidad_stacker_pd:valor_por_denominaciones,
            cantidad_caja_fuerte_pd:valor_por_denominaciones
        let denominaciones:type_denominaciones
        let no_hay_caja_fuerte=false
        let error_en_la_devolucion=false

        const proceso = "VACIADO_COMPLETO"

        type state_type = "VACIANDO"
        let update_state:state_type

        const update = (state:state_type) => {
            let data:{
                proceso:typeof proceso,
                state:state_type,
            } = {
                proceso,
                state,
            }
            update_state = state
            switch(state) {
                case "VACIANDO":
                    break;
            }
            io.emit("Cashlogy.update", data)
        }

        let control_obj = await this.generar_controlador_de_estado_para_proceso(this.emit_suspendido_comun)
        if (control_obj.return_abort) return {
            ...control_obj.return_abort,
            importe_vaciado_solo_monedas:0
        }

        try {
            await this.saveProceso(proceso)

            update("VACIANDO")
            ;( { err, cents_out } = await this.cmd_vaciado_completo(solo_monedas, denominaciones_vaciar, destino_billetes))
            if (err == ER_BAD_DATA && destino_billetes == "CAJA_FUERTE") no_hay_caja_fuerte=true
            if (err == ER_GENERIC) error_en_la_devolucion=true

            ;( { cantidad_recicladores_pd, cantidad_stacker_pd, cantidad_caja_fuerte_pd, denominaciones } = await this.cmd_cantidad_de_todas_denominaciones() )

            control_obj.finalizar()

            await this.saveProceso(null)

            return { 
                denominaciones_dispensables:this.denominaciones_dispensables,
                denominaciones,
                importe_vaciado_solo_monedas:to_euros(cents_out),
                cantidad_recicladores_pd,
                cantidad_stacker_pd,
                cantidad_caja_fuerte_pd,
                no_hay_caja_fuerte,
                error_en_la_devolucion
            }
        } catch(e) {
            let ret = await control_obj.finalizar_catch(e)
            return ret            
        }
    }

    async consulta_todas_denominaciones(incluir_efectivo_total=false):Promise<{
        denominaciones_dispensables?:type_denominaciones,
        denominaciones?:type_denominaciones,
        cantidad_recicladores_pd?:valor_por_denominaciones,
        cantidad_stacker_pd?:valor_por_denominaciones,
        cantidad_caja_fuerte_pd?:valor_por_denominaciones,
        valoracion_recicladores?:number,
        valoracion_stacker?:number,
        valoracion_caja_fuerte?:number,
        valoracion_total?:number,
    } & return_abort_type> {

        let cantidad_recicladores_pd:valor_por_denominaciones,
            cantidad_stacker_pd:valor_por_denominaciones,
            cantidad_caja_fuerte_pd:valor_por_denominaciones
        let denominaciones:type_denominaciones
        let cents_recicladores:number,
            cents_stacker:number,
            cents_caja_fuerte:number

        //const proceso = "CONSULTA_DENOMINACIONES_RECICLADOR"

        let control_obj = await this.generar_controlador_de_estado_para_proceso(this.emit_suspendido_comun)
        if (control_obj.return_abort) return control_obj.return_abort

        try {
            ;( { cantidad_recicladores_pd, cantidad_stacker_pd, cantidad_caja_fuerte_pd, denominaciones } = await this.cmd_cantidad_de_todas_denominaciones() )

            let ret_incluir_efectivo_total:{
                valoracion_recicladores?:number,
                valoracion_stacker?:number,
                valoracion_caja_fuerte?:number,
                valoracion_total?:number
            } = {}
            if (incluir_efectivo_total) {
                ;( { cents_recicladores, cents_stacker, cents_caja_fuerte } = await this.cmd_efectivo_total())
                ret_incluir_efectivo_total = {
                    valoracion_recicladores:to_euros(cents_recicladores),
                    valoracion_stacker:to_euros(cents_stacker),
                    valoracion_caja_fuerte:to_euros(cents_caja_fuerte),
                    valoracion_total:to_euros(cents_recicladores+cents_stacker+cents_caja_fuerte)
                }
            }
            control_obj.finalizar()

            return { 
                denominaciones_dispensables:this.denominaciones_dispensables,
                denominaciones,
                cantidad_recicladores_pd,
                cantidad_stacker_pd,
                cantidad_caja_fuerte_pd,
                ...ret_incluir_efectivo_total
            }
        } catch(e) {
            let ret = await control_obj.finalizar_catch(e)
            return ret            
        }
    }

    async recaudar():Promise<{
        importe_recaudado?:number,
        cancelado_despues_de_retirar?:boolean,
//        valoracion_recicladores?:number,
//        valoracion_stacker?:number,
//        valoracion_caja_fuerte?:number,
//        valoracion_total?:number,
    } & return_abort_type> {

        let err:string
        let cents_out:number
        //let cents_recicladores:number,
        //    cents_stacker:number,
        //    cents_caja_fuerte:number

        const proceso = "RECAUDAR"

        type state_type = "RETIRAR" | "CANCELAR"
        let update_state:state_type

        const update = (state:state_type) => {
            let data:{
                proceso:typeof proceso,
                state:state_type,
            } = {
                proceso,
                state,
            }
            update_state = state
            switch(state) {
                case "RETIRAR":
                    break;
                case "CANCELAR":
                    break;
            }
            io.emit("Cashlogy.update", data)
        }

        let control_obj = await this.generar_controlador_de_estado_para_proceso(this.emit_suspendido_comun)
        if (control_obj.return_abort) return {
            ...control_obj.return_abort,
            importe_recaudado:0
        }
        
        try {
            await this.saveProceso(proceso)

            let cancel_obj:cancel_obj_type = {}
            this.boton_setHandler(BOT_CANCELAR, () => { 
                update("CANCELAR"); 
                if (cancel_obj) {
                    cancel_obj.activado=true
                    cancel_obj.cancel?.()
                }
            })
            
            update("RETIRAR")
            ;( { err, cents_out } = await this.cmd_recaudacion(cancel_obj, [WR_CANCEL]) )

            this.boton_reset(BOT_CANCELAR)

            //;( { cents_recicladores, cents_stacker, cents_caja_fuerte } = await this.cmd_efectivo_total())

            control_obj.finalizar()

            await this.saveProceso(null)

            return {
                importe_recaudado:to_euros(cents_out),
                cancelado_despues_de_retirar:(err==WR_CANCEL),
                //valoracion_recicladores:to_euros(cents_recicladores),
                //valoracion_stacker:to_euros(cents_stacker),
                //valoracion_caja_fuerte:to_euros(cents_caja_fuerte),
                //valoracion_total:to_euros(cents_recicladores+cents_stacker+cents_caja_fuerte)
            }
        } catch(e) {
            let ret = await control_obj.finalizar_catch(e)
            return ret            
        }
    }

    async subproceso_mantenimiento(tipo:type_tipo_mantenimiento):Promise<{
        num_billetes_faltan:number
    }> {
        let num_billetes_faltan:number

        /* ------ debug ------- */
        if (globalThis?.debug_Cashlogy?.num_billetes_faltan!=null) {
            num_billetes_faltan = globalThis?.debug_Cashlogy?.num_billetes_faltan
            if (tipo=="CONSULTA" || tipo=="RESET") 
                this.notificacion("MANTENIMIENTO", num_billetes_faltan<10)
            return {
                num_billetes_faltan
            }
        } 
        /* ------ debug ------- */
        
        ;( { num_billetes_faltan } = await this.cmd_mantenimiento(tipo) )
        
        if (tipo=="CONSULTA" || tipo=="RESET") 
            this.notificacion("MANTENIMIENTO", num_billetes_faltan<10)
        return {
            num_billetes_faltan
        }
    }


    async mantenimiento(tipo:type_tipo_mantenimiento):Promise<{
        num_billetes_faltan?:number
    } & return_abort_type> {

        const proceso = "MANTENIMIENTO"

        let control_obj = await this.generar_controlador_de_estado_para_proceso(this.emit_suspendido_comun)
        if (control_obj.return_abort) return control_obj.return_abort

        try {
            await this.saveProceso(proceso)

            let ret_subproceso = await this.subproceso_mantenimiento(tipo)
            
            control_obj.finalizar()

            await this.saveProceso(null)

            return ret_subproceso

        } catch(e) {
            let ret = await control_obj.finalizar_catch(e)
            return ret            
        }
    }

    async poner_a_cero():Promise<{
        importe_antes?:number,
        importe_despues?:number,
    } & return_abort_type> {
        let cents_antes:number,
            cents_despues:number

        const proceso = "PONER_A_CERO"
            
        let control_obj = await this.generar_controlador_de_estado_para_proceso(this.emit_suspendido_comun)
        if (control_obj.return_abort) return control_obj.return_abort

        try {
            await this.saveProceso(proceso)

            ;( { cents_antes, cents_despues } = await this.cmd_poner_a_cero() )

            control_obj.finalizar()

            await this.saveProceso(null)

            return {
                importe_antes:to_euros(cents_antes),
                importe_despues:to_euros(cents_despues)
            }
        } catch(e) {
            let ret = await control_obj.finalizar_catch(e)
            return ret            
        }
    }

    async resolver_incidencias():Promise<{
    } & return_abort_type> {

        const proceso = "RESOLUCION_INCIDENCIAS"
            
        let control_obj = await this.generar_controlador_de_estado_para_proceso(this.emit_suspendido_comun)
        if (control_obj.return_abort) return control_obj.return_abort

        try {
            await this.saveProceso(proceso)

            ;( { } = await this.cmd_resolucion_incidencias() )

            control_obj.finalizar()

            await this.saveProceso(null)

            return { }

        } catch(e) {
            let ret = await control_obj.finalizar_catch(e)
            return ret            
        }
    }

    // los procesos sin controlador son procesos en que solo hay camandos de consulta
    // si un proceso sin controlador se queda retenido, ya sea por error de conexión o que tarda mucho en responder, 
    // al cabo de un tiempo se devuelve error al frontend, pero no se aborta ya que entonces se tendria que recuperar.
    // si hay un proceso sin controlado retenido, los siguientes procesos sin controlador devuelven error inmediatamente.
    // los procesos sin controlador se pueden iniciar cuando ha yn proceso con controlador en marcha. 
    proceso_sin_controlador_retenido=false
    async crear_proceso_sin_controlador<T>(proceso:()=>Promise<T>, timeout_ms:number):Promise<T|{err:string}> {
        let promise_delay_init = (async() => { await delay_ms(timeout_ms) })()
        
        while (!this.conexion_ok() || !this.recovered || this.proceso_sin_controlador_retenido) {
            if (!this.conexion_ok()) {
                if (!await this.wait_conexion(promise_delay_init)) return { err: !this.conexion_state.conectado ? "CONECTANDO" : "INICIALIZANDO" }
            }
            if (!this.recovered) {
                if (!await this.wait_recovered(promise_delay_init)) return { err: "NOT_READY" }
            }
            while (this.proceso_sin_controlador_retenido) {
                if (await Promise.race([(async() => { await delay_ms(200); return true})(), promise_delay_init]) == true) continue
                if (this.proceso_sin_controlador_retenido) return { err: "NOT_READY" }
            }
        } 

        return Promise.race([
            (async () => {
                this.proceso_sin_controlador_retenido=true
                let ret = await proceso()
                this.proceso_sin_controlador_retenido=false
                return ret
            })(),
            (async () => {
                await delay_ms(timeout_ms)
                return { err:"NOT_READY" }
            })()
        ])
    }

    async get_niveles():Promise<{
        denominaciones_dispensables:type_denominaciones
        estado_pd:valor_por_denominaciones,
        porcentaje_pd:valor_por_denominaciones,
    }|{err:string}> {
        return this.crear_proceso_sin_controlador(async() => {
            let estado_pd:valor_por_denominaciones,
            porcentaje_pd:valor_por_denominaciones

            try {
                ;( { estado_pd, porcentaje_pd } = await this.cmd_nivel_denominaciones() )
                /* ------ debug ------- */
                if (globalThis?.debug_Cashlogy?.estado_pd) estado_pd = globalThis?.debug_Cashlogy?.estado_pd
                if (globalThis?.debug_Cashlogy?.porcentaje_pd) porcentaje_pd = globalThis?.debug_Cashlogy?.porcentaje_pd
                /* ------ debug ------- */

                return {
                    denominaciones_dispensables:this.denominaciones_dispensables,
                    estado_pd,
                    porcentaje_pd
                }
            } catch(e) {
                return { err:e }
            }
        }, 3000)
    }
    async get_estado():Promise<{
        cantidad_recicladores_pd:valor_por_denominaciones, 
        cantidad_stacker_pd:valor_por_denominaciones, 
        cantidad_caja_fuerte_pd:valor_por_denominaciones,
        denominaciones:type_denominaciones,
        valoracion_recicladores:number,
        valoracion_stacker:number,
        valoracion_caja_fuerte:number,
        valoracion_total:number
    }|{err:string}> {
        return this.crear_proceso_sin_controlador(async() => {
            let cantidad_recicladores_pd:valor_por_denominaciones, 
                cantidad_stacker_pd:valor_por_denominaciones, 
                cantidad_caja_fuerte_pd:valor_por_denominaciones
            let denominaciones:type_denominaciones
            let cents_recicladores:number, cents_stacker:number, cents_caja_fuerte:number

            try {
                ;( { 
                    cantidad_recicladores_pd, 
                    cantidad_stacker_pd, 
                    cantidad_caja_fuerte_pd,
                    denominaciones 
                   } = await this.cmd_cantidad_de_todas_denominaciones() )
                ;( { cents_recicladores, cents_stacker, cents_caja_fuerte } = await this.cmd_efectivo_total() )
                
                return {
                    cantidad_recicladores_pd, cantidad_stacker_pd, cantidad_caja_fuerte_pd,
                    denominaciones: denominaciones,
                    valoracion_recicladores: to_euros(cents_recicladores),
                    valoracion_stacker: to_euros(cents_stacker),
                    valoracion_caja_fuerte: to_euros(cents_caja_fuerte),
                    valoracion_total:to_euros(cents_recicladores+cents_stacker+cents_caja_fuerte)
                }
            } catch(e) {
                return { err:e }
            }
        },3000)
    }

/*    async mantenimiento_en_notificaciones(tipo:type_tipo_mantenimiento):Promise<{
        num_billetes_faltan:number
    }|{err:string}> {
        return this.crear_proceso_sin_controlador(async() => {
            try {
                let ret_subproceso = await this.subproceso_mantenimiento(tipo)
                return ret_subproceso
            } catch(e) {
                return { err:e }
            }
        },3000)
    }
*/

    /*
    cobrar

    añadir cambios
   */

    /*
        errores:
            timeout
            formato
            errores cashlogy
    */    

    /*
        
    */
}

const cashlogyInstance = new CashlogyClase();
// setImmediate para esperar a que se carge el modulo sockets.gateway ya que dependen el uno del otro
setImmediate(() => { cashlogyInstance.start(); })
export { cashlogyInstance };
