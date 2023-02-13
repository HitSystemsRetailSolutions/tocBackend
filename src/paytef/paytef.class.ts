import axios from "axios";
import { movimientosInstance } from "../movimientos/movimientos.clase";
import { parametrosInstance } from "../parametros/parametros.clase";
import { ticketsInstance } from "../tickets/tickets.clase";
import { TicketsInterface } from "../tickets/tickets.interface";
// import { Socket } from "dgram";
import { CancelInterface } from "./paytef.interface";
import { io } from "../sockets.gateway";
import { logger } from "../logger";
import * as schTickets from "../tickets/tickets.mongodb";


class PaytefClass {
  /* Eze 4.0 */
  async iniciarTransaccion(
    idTrabajador: number,
    idTicket: TicketsInterface["_id"],
    total: TicketsInterface["total"],
    type: "refund" | "sale" = "sale"
  ): Promise<void> {
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
    console.log(parametros.ipTefpay)

    if (parametros.ipTefpay) {
      axios({
        method: "POST",
        url: `http://${parametros.ipTefpay}:8887/transaction/start`,
        data: opciones,
        timeout: 30000,
      })
        .then(async (respuestaPayef: any) => {
          if (await respuestaPayef.data.info['started'])
            await this.bucleComprobacion(idTicket, total, idTrabajador, type);
          else {
            io.emit("consultaPaytefRefund", {ok:false, id:idTicket});
            logger.Error(137, "Error, la transacción no ha podido empezar paytef.class");
          }
        })
        .catch((err) => {
          logger.Error(135, err);
          io.emit("consultaPaytefRefund", {ok:false, id:idTicket});
        });
    } else {
      io.emit("consultaPaytefRefund", {ok:false, id:idTicket});
      logger.Error(
        136,
        "Error, ipTefpay incorrecta en iniciarTransaccion() paytef.class"
      );
    }
  }

  /* Eze 4.0 */
  async bucleComprobacion(
    idTicket: TicketsInterface["_id"],
    total: TicketsInterface["total"],
    idTrabajador: TicketsInterface["idTrabajador"],
    type: "refund" | "sale" = "sale"
  ): Promise<void> {
    const ipDatafono = (await parametrosInstance.getParametros()).ipTefpay;
    const resEstadoPaytef: any = (
      await axios.post(`http://${ipDatafono}:8887/transaction/poll`, {
        pinpad: "*",
      })
    ).data;

    if (resEstadoPaytef.result) {
      if (resEstadoPaytef.result.approved) {
        if (type === "sale") {
          movimientosInstance.nuevoMovimiento(
            total,
            "Targeta",
            "TARJETA",
            idTicket,
            idTrabajador
          );
          io.emit("consultaPaytef", true);
        } else if (type === "refund") {
          schTickets.anularTicket(idTicket);
          movimientosInstance.nuevoMovimiento(
            total * -1,
            "Targeta",
            "TARJETA",
            idTicket+1,
            idTrabajador
          );
          
          io.emit("consultaPaytefRefund", {ok:true, id:idTicket});
        } else {
          logger.Error("Error grave de devoluciones/movimientos !!!");
        }

        ticketsInstance.actualizarTickets();
        movimientosInstance.construirArrayVentas();
      } else if (type === "sale") {
        io.emit("consultaPaytef", false);
      } else if (type === "refund") {
        io.emit("consultaPaytefRefund", {ok:false, id:idTicket});
      }
    } else {
      await new Promise((r) => setTimeout(r, 1000));
      await this.bucleComprobacion(idTicket, total, idTrabajador, type);
    }
  }

  /* Eze 4.0 */
  async cancelarOperacionActual() {
    const ipDatafono = (await parametrosInstance.getParametros()).ipTefpay;
    const resultado: CancelInterface = (
      await axios.post(`http://${ipDatafono}:8887/pinpad/cancel`, {
        pinpad: "*",
      })
    ).data as CancelInterface;
    return resultado.info.success;
  }
}

const paytefInstance = new PaytefClass();
export { paytefInstance };
