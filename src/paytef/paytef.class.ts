import axios, { Axios } from "axios";
import { movimientosInstance } from "../movimientos/movimientos.clase";
import { parametrosInstance } from "../parametros/parametros.clase";
import { ticketsInstance } from "../tickets/tickets.clase";
import { TicketsInterface } from "../tickets/tickets.interface";
// import { Socket } from "dgram";
import { CancelInterface } from "./paytef.interface";
import { io } from "../sockets.gateway";
import { logger } from "../logger";
import * as schTickets from "../tickets/tickets.mongodb";
import { impresoraInstance } from "src/impresora/impresora.class";
import { cajaInstance } from "src/caja/caja.clase";

//let intentosBuclePollResult = 0;

axios.defaults.timeout = 5000; // Evitem que el client esperi...  // ???? se modifica en instalador.controller.ts
class PaytefClass {
  // errorConexionUltimaTransaccion se puede consultar a la salida de iniciarTransaccion en el caso de que esta devuelva false.
  // En este caso podra ser porque el datáfono a denegado la trasacción o porque haya habido un error (de conexión, no started, o != transReference),
  // si ha habido alguno de estos errores errorConexionUltimaTransaccion=true 
  errorConexionUltimaTransaccion = false;

  // datos de la última inicio de transacción por si se ha de repetir en paytef.controller cobrarUltimoTicket
  ultimaIniciarTransaccion: {
    idTrabajador: number;
    idTicket: TicketsInterface["_id"];
    total: TicketsInterface["total"];
    type: "refund" | "sale";
  } | null = null;

  dentroIniciarTransaccion = false;
  timeUltimaTransaccionNoFinalizada: number = 0;

  /* Eze 4.0 */
  async iniciarTransaccion(
    idTrabajador: number,
    idTicket: TicketsInterface["_id"],
    total: TicketsInterface["total"],
    type: "refund" | "sale" = "sale"
  ): Promise<boolean> {

    if (this.dentroIniciarTransaccion) {
      // no tendria que pasar por aqui. Si pasa hay algún error en la operativa del programa.
      logger.Warn(`dentroIniciarTransaccion==true (${idTicket}) type:${type}`, "paytef.class");
      await new Promise(r=>{ setTimeout(r, 2000); }); // 2 segundos antes de dar error (?), no tendria que pasar por aqui. 
      io.emit("consultaPaytefRefund", { ok: false, id: idTicket });
      io.emit("errorConexionPaytef");
      this.errorConexionUltimaTransaccion = true;
        // devolver denegada y error de conexión es lo menos perjudicial de momento.
      return false; // transacción denegada
    }

    let transaccionAprobada = false; 
    let errorConexion = false; // puede ser error de conexion, o no started, o != transactionReference
    this.ultimaIniciarTransaccion = { idTrabajador, idTicket, total, type };

    const parametros = await parametrosInstance.getParametros();
    const opciones = {
      pinpad: "*",
      opType: type,
      createReceipt: true,
      executeOptions: {
        method: "polling",
      },
      language: "es",
      requestedAmount: Math.round(total * 100),
      requireConfirmation: false,
      transactionReference: idTicket, // transactionReference es string, idTicket es number
      showResultSeconds: 5,
    };

    logger.Info(
      `Transaccion (${idTicket}) inicio type:${type}`,
      "paytef.class"
    );

    if (parametros.ipTefpay) {
      io.emit("procesoPaytef", { proceso: "" });
      try {
        this.dentroIniciarTransaccion = true;
        let salirBucleStart = false;
        let intentosBucleStart = 0;
        while (!salirBucleStart) {
          [ transaccionAprobada, errorConexion ] =
            await axios({
              method: "POST",
              url: `http://${parametros.ipTefpay}:8887/transaction/start`,
              data: opciones,
              timeout: 10000,
            })
            .then(async (respuestaPayef: any) => {
              salirBucleStart = true;
              if (await respuestaPayef.data.info["started"]) {
                io.emit("procesoPaytef", { proceso: "Inicio proceso" });
                // intentosBuclePollResult = 0;
                let xy:[boolean, boolean] = await this.bucleComprobacion(
                  idTicket,
                  total,
                  idTrabajador,
                  type
                );
                return xy;
              } else {
                logger.Error(`Transaccion (${idTicket}) not started`, "paytef.class");
                io.emit("consultaPaytefRefund", { ok: false, id: idTicket });
                io.emit("procesoPaytef", { proceso: "Denegado" });
                return [ false, true ]; // aprobada=false, error de conex=true.
              }
            })
            .catch(async (err) => {
              logger.Error(`Transaccion (${idTicket}) catch1 ${err}`, "paytef.class");
              /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
              * Si start falla por timeout (error de conexión) puede ser que el comando haya llegado al datáfono pero la respuesta se haya
              * perdido. Por lo tanto el datáfono habria iniciado la transacción y se iniciaria otra que daria error 500
              ** (Arreglado) no se envia 2 veces la misma start transaction
              **             si la primera petición no responde dar error de conexión ya que no se puede saber el estado de la transacción
              **             por lo que el bucle 'while (!salirBucleStart)' solo se hace una vez y podria quitarse
              * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
              */
              if (intentosBucleStart >= 0) { 
                logger.Error(`Transaccion (${idTicket}) start error conexion`, "paytef.class");
                intentosBucleStart = 0;
                io.emit("consultaPaytefRefund", { ok: false, id: idTicket });
                salirBucleStart = true;
                return [ false, true ]; // aprobada=false, error de conex=true.
              } else {
                // esta parte ya no se ejecuta porque solo se envia una vez el coando start transaction
                await new Promise((r) => setTimeout(r, 100));
                intentosBucleStart += 1;
                //this.iniciarTransaccion(idTrabajador, idTicket, total, type); // se realiza en el siguiente bucleStart
                return [ false, true ]; // aprobada=false, error de conex=true.
              }
              //io.emit("consultaPaytefRefund", { ok: false, id: idTicket });
            });
        } // while !salirBucleStart
      } finally { // proteger esta variable de posibles excepciones
        this.dentroIniciarTransaccion = false;
      }
      if (errorConexion) {
        this.timeUltimaTransaccionNoFinalizada = Date.now();
      }
    } else {
      // no hay parametros.ipTefpay ( no tendria que pasar por aqui )
      logger.Info(
        `Transaccion (${idTicket}) no hay parametros.ipTefpay`,
        "paytef.class"
      );
      io.emit("consultaPaytefRefund", { ok: false, id: idTicket });
      errorConexion = true;
    }
    logger.Info(`Transaccion (${idTicket}) fin type:${type}`, "paytef.class");

    this.errorConexionUltimaTransaccion = errorConexion;
    if (errorConexion) {
      transaccionAprobada = false;
      io.emit("errorConexionPaytef");
    }  
    return transaccionAprobada;
  }

  /* Eze 4.0 */
  async bucleComprobacion(
    idTicket: TicketsInterface["_id"],
    total: TicketsInterface["total"],
    idTrabajador: TicketsInterface["idTrabajador"],
    type: "refund" | "sale" = "sale"
  ): Promise<[boolean, boolean]> { // [ transaccionAprobada, errorConexion ]
    const ipDatafono = (await parametrosInstance.getParametros()).ipTefpay;

    let transaccionAprobada = false;
    let errorConexion = false;
    let salirBucleComprobacion = false;
    let intentosBucleComprobacion = 0;

    while(!salirBucleComprobacion) {
      try {
        const resEstadoPaytef: any = (
          await axios.post(
            `http://${ipDatafono}:8887/transaction/poll`,
            { pinpad: "*" },
            { timeout: 5000 }
          )
        ).data;
        io.emit("procesoPaytef", { proceso: resEstadoPaytef.info.cardStatus });
        if (resEstadoPaytef.result) {
          salirBucleComprobacion = true;
          if (resEstadoPaytef.result.approved) {
            if (type === "sale") {
              /*-------------------------------
              *** la respuesta de /transaction/poll ya incluye el campo result. Asi no hay que hacer la petición a /transaction/result y tener que 
              *** comprobar errores de conexión 

              *** (old) await axios.post(`http://${ipDatafono}:8887/transaction/result`, { pinpad: "*",})
              --------------------------------- */
              if (resEstadoPaytef.result.transactionReference == idTicket) {
                logger.Info(`Transaccion (${idTicket}) venta aprobada`, "paytef.class");
                parametrosInstance.setContadoDatafono(0, total);
                // el ticket ahora se puede generar despues de terminar la transacción en crearTicketPaytef (tickets.controller.ts)
                // se comprueba si el ticket existe y despues se imprime y se marca como paytef
                // sino se tendra que hacer cuando se genere el ticket
                if (await ticketsInstance.getTicketById(idTicket)) {
                  if (
                    (await parametrosInstance.getParametros())?.params?.TicketDFAuto == "Si"
                  ) {
                    impresoraInstance.imprimirTicket(idTicket);
                  }
                  ticketsInstance.setPagadoPaytef(idTicket);
                }
                io.emit("consultaPaytef", { valid: true, ticket: idTicket });
                io.emit("procesoPaytef", { proceso: "aprobado" });

                transaccionAprobada = true;
                /*---- return true; */
              } else {
                // transactionReference != idTicket
                // No tendria que pasar, pero si pasa se da error y que la dependienta compruebe que ha pasado
                logger.Error(`Transaccion (${idTicket}) transactionReference error ${resEstadoPaytef.result.transactionReference}`, "paytef.class");
                io.emit("consultaPaytefRefund", {
                  ok: false,
                  errorconex: true,
                  id: idTicket,
                  datos: [ total * -1, "Targeta", "TARJETA", idTicket + 1, idTrabajador],
                });
                errorConexion = true;
                /*---- return false; */
              }
            } else if (type === "refund") {
              /*-------------------------------
              * (old) await axios.post(`http://${ipDatafono}:8887/transaction/result`, { pinpad: "*", })
              * --------------------------------- */
              if (resEstadoPaytef.result.transactionReference == idTicket) {
                logger.Info(`Transaccion (${idTicket}) refund aprobada`, "paytef.class");
                await schTickets.anularTicket(idTicket);
                parametrosInstance.setContadoDatafono(0, total * -1);
                io.emit("consultaPaytefRefund", { ok: true, id: idTicket });
                this.imprimirTicket(idTicket).catch(()=>{});
                transaccionAprobada = true;
                /*---- return true; */
              } else {
                // transactionReference != idTicket
                logger.Error(`Transaccion (${idTicket}) transactionReference error ${resEstadoPaytef.result.transactionReference}`, "paytef.class");
                io.emit("consultaPaytefRefund", {
                  ok: false,
                  errorconex: true,
                  id: idTicket,
                  datos: [ total * -1, "Targeta", "TARJETA", idTicket + 1, idTrabajador],
                });
                errorConexion = true;
                /*---- return false; */
              }
//              intentosBuclePollResult = 0;
            } else {
              // no pasa por aqui, type == sale,refund
            }

            ticketsInstance.actualizarTickets();
            movimientosInstance.construirArrayVentas();
          } else {
            // result.approved = false
            if (type === "sale") {
              logger.Info(`Transaccion (${idTicket}) venta denegada`, "paytef.class");
              io.emit("consultaPaytef", { valid: false, ticket: idTicket });
            } else if (type === "refund") {
              logger.Info(`Transaccion (${idTicket}) refund denegada`, "paytef.class");
              io.emit("consultaPaytefRefund", { ok: false, id: idTicket });
            }
            transaccionAprobada = false;
          }
        } else { // !resEstadoPaytef.result
          // poll aún no hay result
          await new Promise((r) => setTimeout(r, 1000));
          // await this.bucleComprobacion(idTicket, total, idTrabajador, type);
        }
      } catch (e) {
        logger.Error(`Transaccion (${idTicket}) catch2 ${e}`, "paytef.class");
        console.error(
          "error de conexión (pago ya enviado) / ",
          intentosBucleComprobacion
        );
        if (intentosBucleComprobacion >= 2) {
          /* ??? */
          logger.Error(`Transaccion (${idTicket}) poll no respuesta`, "paytef.class");
          //intentosBuclePollResult = 0;
          io.emit("consultaPaytefRefund", {
            ok: false,
            errorconex: true,
            id: idTicket,
            datos: [total * -1, "Targeta", "TARJETA", idTicket + 1, idTrabajador],
          });
          salirBucleComprobacion = true;
          errorConexion = true;
        } else {
          await new Promise((r) => setTimeout(r, 100));
          intentosBucleComprobacion++
          //intentosBuclePollResult += 1;
          //await this.bucleComprobacion(idTicket, total, idTrabajador, type);
        }
      } // catch
    } // while(!salirBucleComprobacion)
    return [ transaccionAprobada, errorConexion ];

  }
  /*
  En la función comprobarDisponibilidad en paytef.controller se llama al servidor paytef para guardar el contado por Datafono a la base de datos
  Como esta función se llama muchas veces, al entrar a los menus, etc..., se hacen demasiadas llamadas al servidor paytef.
  checkIfSetContadoDatafono devolvera true cuando el valor del contado por Datafono pueda ser diferente del de la base de datos.
  Devuelve false cuando estamos en una transacción ya que al finalizar se actualiza el contado Datafono sumando el importe y si se actualiza
  con datos del servidor en ese momento podria ser que el importe se sumara a un total que ya estaria actualizado.
  Si hace mas de 2 minutos desde que se inicio la última transacción que no sabemos si finalizo por error de conexión, se puede actualizar
  el contado Datafono, ya que es tiempo suficiente para que haya acabado.     
  */
  checkIfSetContadoDatafono(resetIfTrue = false) {
    if (this.dentroIniciarTransaccion) return false;
    if (this.timeUltimaTransaccionNoFinalizada == 0) return false;
    if (Date.now() - this.timeUltimaTransaccionNoFinalizada < 2 * 60 * 1000)
      return false;

    if (resetIfTrue) this.timeUltimaTransaccionNoFinalizada = 0;
    return true;
  }

  async imprimirTicket(idTicket) {
    const tcod = (await parametrosInstance.getParametros()).payteftcod;
    let startDate = await cajaInstance.getInicioTime();
    let extraDataMovimiento: any = await axios.post("paytef/getTicket", {
      timeout: 10000,
      tcod: tcod,
      startDate: startDate,
      ticket: idTicket,
    });
    if (extraDataMovimiento == null)
      throw Error("Faltan datos en impresora/imprimirTicket");
    for (const x of ["TITULAR", "ESTABLECIMIENTO"]) {
      setTimeout(() => {
        impresoraInstance.imprimirTicketPaytef(extraDataMovimiento.data, x);
      }, 1500);
    }
  }

  /* Uri 4.0 */
  async detectarPytef(ip) {
    try {
      return (
        await axios.post(
          `http://${ip}:8887/pinpad/status`,
          {
            pinpad: "*",
          },
          { timeout: 5000 }
        )
      ).data["result"]?.tcod;
    } catch (e) {
      // console.log(e);
      return "error";
    }
  }

  /* Uri */
  async ComprobarTicketPagado(ticket) {
    const ipDatafono = (await parametrosInstance.getParametros()).ipTefpay;
    const tcod = (await parametrosInstance.getParametros()).payteftcod;
    let startDate = await cajaInstance.getInicioTime();
    const res: any = await axios
      .post(
        "paytef/getTicket",
        {
          timeout: 10000,
          tcod: tcod,
          startDate: startDate,
          ticket: ticket,
        },
        { timeout: 10000 }
      )
      .catch((e) => {
        console.log(e);
      });

    if (res?.data?.approved) {
      ticketsInstance.setPagadoPaytef(ticket);
      io.emit("consultaPaytef", { valid: true, ticket: ticket });
      io.emit("procesoPaytef", { proceso: "aprobado" });
      return true;
    }
  }

  /* Uri */
  async getLastFive() {
    const tcod = (await parametrosInstance.getParametros()).payteftcod;
    let startDate = await cajaInstance.getInicioTime();
    const res: any = await axios
      .post(
        "paytef/getLastFive",
        {
          timeout: 10000, //??
          tcod: tcod,
          startDate: startDate,
        },
        { timeout: 10000 }
      )
      .catch((e) => {
        console.log(e);
      });

    if (res.data) return res.data;
  }

  /* Uri */
  /* valores retorno (string):
       1: datáfono aprovado, pero no ha llegado al servidor de paytef
       2: error de conexión con datáfono
       3: datáfono denegado
       4: transacción ha llegado al servidor de paytef
  */
  async ComprobarReconectado(ticket): Promise<string> {
    let rnt = "2";
    try {
      if (await this.ComprobarTicketPagado(ticket)) return "4";
      const ipDatafono = (await parametrosInstance.getParametros()).ipTefpay;
      await axios
        .post(
          `http://${ipDatafono}:8887/pinpad/getLastResult`,
          {
            pinpad: "*",
          },
          { timeout: 5000 }
        )
        .then(async (datafonoLastTicket: any) => {
          if (datafonoLastTicket.data) {
            let result = datafonoLastTicket.data.result.result;
            if (String(result.approved) == "false") rnt = "3";
            else if (result.transactionReference == ticket) {
              if (
                (await movimientosInstance.getMovimientoTarjetaMasAntiguo(
                  // ????????????????
                  result.transactionReference
                )) != null
              ) {
                rnt = "4";
              }
              rnt = "1"; // ????????????????
            }
          } else {
            rnt = "2";
          }
        })
        .catch((e) => {
          rnt = "2";
        });
    } catch (e) {
      rnt = "2";
    }
    return rnt;
  }

  /* Eze 4.0 */
  async cancelarOperacionActual() {
    const ipDatafono = (await parametrosInstance.getParametros()).ipTefpay;
    const resultado: CancelInterface = (
      await axios.post(
        `http://${ipDatafono}:8887/pinpad/cancel`,
        {
          pinpad: "*",
        },
        { timeout: 5000 }
      )
    ).data as CancelInterface;
    return resultado.info.success;
  }

  /* Uri */
  async getRecuentoTotal(startDate) {
    const ipDatafono = (await parametrosInstance.getParametros()).ipTefpay;
    const tcod = (await parametrosInstance.getParametros()).payteftcod;
    const res: any = await axios
      .post(
        "paytef/getCierre",
        {
          timeout: 10000,
          tcod: tcod,
          startDate: startDate,
        },
        { timeout: 10000 }
      )
      .catch((e) => {
        console.log(e);
      });
    return res.data;
  }
}

const paytefInstance = new PaytefClass();
export { paytefInstance };
