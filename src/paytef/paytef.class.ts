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
let intentosBuclePago = 0;
let intentosBucleBucle = 0;

axios.defaults.timeout = 5000; // Evitem que el client esperi...  // ???? se modificar en instalador.controller.ts
class PaytefClass {
  // datos de la última inicio de transacción por si se ha de repetir en paytef.controller cobrarUltimoTicket
  ultimaIniciarTransaccion:{
    idTrabajador: number,
    idTicket: TicketsInterface["_id"],
    total: TicketsInterface["total"],
    type: "refund" | "sale"
  }|null=null;

  /* Eze 4.0 */
  async iniciarTransaccion(
    idTrabajador: number,
    idTicket: TicketsInterface["_id"],
    total: TicketsInterface["total"],
    type: "refund" | "sale" = "sale"
  ): Promise<void> {
    console.log(total)
    this.ultimaIniciarTransaccion={idTrabajador, idTicket,total,type};

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
      transactionReference: idTicket,
      showResultSeconds: 5,
    };
    
    intentosBucleBucle = 0;
    
    if (parametros.ipTefpay) {
      await axios({
        method: "POST",
        url: `http://${parametros.ipTefpay}:8887/transaction/start`,
        data: opciones,
        timeout: 7000,
      })
        .then(async (respuestaPayef: any) => {
          intentosBuclePago = 0;
          if (await respuestaPayef.data.info["started"]) {
            io.emit("procesoPaytef", { proceso: "Inicio proceso" });
            return await this.bucleComprobacion(
              idTicket,
              total,
              idTrabajador,
              type
            );
          } else {
            io.emit("consultaPaytefRefund", { ok: false, id: idTicket });
            io.emit("procesoPaytef", { proceso: "Denegado" });
            return false;
          }
        })
        .catch(async (err) => {
          /* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
           * (ToDo) Si start falla por timeout (error de conexión) puede ser que el comando haya llegado al datáfono pero la respuesta se haya
           *         perdido. Por lo tanto el datáfono habria iniciado la transacción y se iniciaria otra que daria error 500
           * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          */
          if (intentosBuclePago >= 2) {
            intentosBuclePago = 0;
            io.emit("consultaPaytefRefund", { ok: false, id: idTicket });
          } else {
            await new Promise((r) => setTimeout(r, 100));
            intentosBuclePago += 1;
            this.iniciarTransaccion(idTrabajador, idTicket, total, type);
          }
          //io.emit("consultaPaytefRefund", { ok: false, id: idTicket });
        });
    } else {
      io.emit("consultaPaytefRefund", { ok: false, id: idTicket });
    }
  }

  /* Eze 4.0 */
  async bucleComprobacion(
    idTicket: TicketsInterface["_id"],
    total: TicketsInterface["total"],
    idTrabajador: TicketsInterface["idTrabajador"],
    type: "refund" | "sale" = "sale"
  ): Promise<void> {
    try {
      const ipDatafono = (await parametrosInstance.getParametros()).ipTefpay;
      const resEstadoPaytef: any = (
        await axios.post(`http://${ipDatafono}:8887/transaction/poll`, {
          pinpad: "*",
        }, { timeout: 5000 })
      ).data;
      io.emit("procesoPaytef", { proceso: resEstadoPaytef.info.cardStatus });
      if (resEstadoPaytef.result) {
        if (resEstadoPaytef.result.approved) {
          if (type === "sale") {
            /*-------------------------------
             *** la respuesta de /transaction/poll ya incluye el campo result. Asi no hay que hacer la petición a /transaction/result y tener que 
             *** comprobar errores de conexión 

            await axios
              .post(`http://${ipDatafono}:8887/transaction/result`, {
                pinpad: "*",
              }, { timeout:5000 })
              .then(async (respuesta: any) => {
                if (respuesta.data.result.transactionReference == idTicket) {
            --------------------------------- */
                if (resEstadoPaytef.result.transactionReference == idTicket) {

                  parametrosInstance.setContadoDatafono(0, total);
                  if((await parametrosInstance.getParametros())?.params?.TicketDFAuto=="Si") impresoraInstance.imprimirTicket(idTicket);
                  ticketsInstance.setPagadoPaytef(idTicket);
                  io.emit("consultaPaytef", true);
                  io.emit("procesoPaytef", { proceso: "aprobado" });
                  /*---- return true; */
                } else {
                  io.emit("consultaPaytefRefund", {
                    ok: false,
                    errorconex: true,
                    id: idTicket,
                    datos: [
                      total * -1,
                      "Targeta",
                      "TARJETA",
                      idTicket + 1,
                      idTrabajador,
                    ],
                  });
                  /*---- return false; */
                }
              /*-------------------------------
              })
              .catch((e) => {
                console.log(e);
              });
              --------------------------------- */
          } else if (type === "refund") {
            schTickets.anularTicket(idTicket);
            /*-------------------------------
            await axios
              .post(`http://${ipDatafono}:8887/transaction/result`, {
                pinpad: "*",
              },{ timeout: 5000 })
              .then((respuesta: any) => {
                if (respuesta.data.result.transactionReference == idTicket) {
             --------------------------------- */
                if (resEstadoPaytef.result.transactionReference == idTicket) {
                  parametrosInstance.setContadoDatafono(0, total * -1);
                  io.emit("consultaPaytefRefund", { ok: true, id: idTicket });
                  this.imprimirTicket(idTicket);
                  /*---- return true; */
                } else {
                  io.emit("consultaPaytefRefund", {
                    ok: false,
                    errorconex: true,
                    id: idTicket,
                    datos: [
                      total * -1,
                      "Targeta",
                      "TARJETA",
                      idTicket + 1,
                      idTrabajador,
                    ],
                  });
                  /*---- return false; */
                }
              /*-------------------------------
              });
              --------------------------------- */
            intentosBucleBucle = 0;
            intentosBuclePago = 0;
          } else {
          }

          ticketsInstance.actualizarTickets();
          movimientosInstance.construirArrayVentas();
        } else if (type === "sale") {
          io.emit("consultaPaytef", false);
        } else if (type === "refund") {
          io.emit("consultaPaytefRefund", { ok: false, id: idTicket });
        }
      } else { // poll aún no hay result
        await new Promise((r) => setTimeout(r, 1000));
        await this.bucleComprobacion(idTicket, total, idTrabajador, type);
      }
    } catch (e) {
      logger.Error(e);
      console.error(
        "error de conexión (pago ya enviado) / ",
        intentosBucleBucle
      );
      if (intentosBucleBucle >= 2) { /* ??? */
        intentosBucleBucle = 0;
        io.emit("consultaPaytefRefund", {
          ok: false,
          errorconex: true,
          id: idTicket,
          datos: [total * -1, "Targeta", "TARJETA", idTicket + 1, idTrabajador],
        });
      } else {
        await new Promise((r) => setTimeout(r, 100));
        intentosBucleBucle += 1;
        await this.bucleComprobacion(idTicket, total, idTrabajador, type);
      }
    }
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
        await axios.post(`http://${ip}:8887/pinpad/status`, {
          pinpad: "*",
        },{ timeout:5000 })
      ).data["result"]?.tcod;
    } catch (e) {
      console.log(e);
      return "error";
    }
  }

  /* Uri */
  async ComprobarTicketPagado(ticket) {
    const ipDatafono = (await parametrosInstance.getParametros()).ipTefpay;
    const tcod = (await parametrosInstance.getParametros()).payteftcod;
    let startDate = await cajaInstance.getInicioTime();
    const res: any = await axios
      .post("paytef/getTicket", {
        timeout: 10000,
        tcod: tcod,
        startDate: startDate,
        ticket: ticket,
      },{ timeout:10000 })
      .catch((e) => {
        console.log(e);
      });

    if (res?.data?.approved) {
      ticketsInstance.setPagadoPaytef(ticket);
      io.emit("consultaPaytef", true);
      io.emit("procesoPaytef", { proceso: "aprobado" });
      return true;
    }
  }

  /* Uri */
  async getLastFive() {
    const tcod = (await parametrosInstance.getParametros()).payteftcod;
    let startDate = await cajaInstance.getInicioTime();
    const res: any = await axios
      .post("paytef/getLastFive", {
        timeout: 10000, //??
        tcod: tcod,
        startDate: startDate,
      }, {timeout: 10000})
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
        .post(`http://${ipDatafono}:8887/pinpad/getLastResult`, {
          pinpad: "*",
        },{ timeout:5000 })
        .then(async (datafonoLastTicket: any) => {
          if (datafonoLastTicket.data) {
            let result = datafonoLastTicket.data.result.result;
            if (String(result.approved) == "false") rnt = "3";
            else if (result.transactionReference == ticket) {
              if (
                await movimientosInstance.getMovimientoTarjetaMasAntiguo(  // ????????????????
                  result.transactionReference
                ) != null
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
      await axios.post(`http://${ipDatafono}:8887/pinpad/cancel`, {
        pinpad: "*",
      },{ timeout:5000 })
    ).data as CancelInterface;
    return resultado.info.success;
  }

  /* Uri */
  async getRecuentoTotal(startDate) {
    const ipDatafono = (await parametrosInstance.getParametros()).ipTefpay;
    const tcod = (await parametrosInstance.getParametros()).payteftcod;
    const res: any = await axios
      .post("paytef/getCierre", {
        timeout: 10000,
        tcod: tcod,
        startDate: startDate,
      },{ timeout: 10000 })
      .catch((e) => {
        console.log(e);
      });
    return res.data;
  }
}

const paytefInstance = new PaytefClass();
export { paytefInstance };
