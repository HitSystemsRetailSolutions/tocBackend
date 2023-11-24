import { Body, Controller, Get, Post } from "@nestjs/common";
import { paytefInstance } from "./paytef.class";
import { logger } from "../logger";
import { ticketsInstance } from "../tickets/tickets.clase";
import { movimientosInstance } from "src/movimientos/movimientos.clase";
import { cajaInstance } from "src/caja/caja.clase";
import { parametrosController } from "src/parametros/parametros.controller";
import { parametrosInstance } from "src/parametros/parametros.clase";
import { UtilesModule } from "src/utiles/utiles.module";
const exec = require("child_process").exec;

@Controller("paytef")
export class PaytefController {
  @Get("cancelarOperacionActual")
  async cancelarOperacionActual() {
    try {
      return await paytefInstance.cancelarOperacionActual();
    } catch (err) {
      logger.Error(48, err);
      return false;
    }
  }

  @Get("scanDevices")
  buscarDispositivos() {
    exec("arp -a", (err, stdout, stderr) => {
      if (err) {
        logger.Error(49, err);
      } else {
        let ipTefpay = "";
        const arrayDevices: any = stdout.split(/\r?\n/);
        for (let i = 0; i < arrayDevices.length; i++) {
          if (arrayDevices[i].includes("A30")) {
            ipTefpay = arrayDevices[i].split(" ");
            break;
          }
        }
      }
    });
  }

  @Post("cobrarUltimoTicket")
  async cobrarUltimoTicket(@Body() { idTrabajador }) {
    try {
      if (idTrabajador) {
        /*--------------------------
          A esta función se puede llegar de un error de conexión con el datafono, por lo tanto es posible que la transacción no haya 
          llegado a paytef. Se cojen los datos de la última transacción de los datos guardados en la última llamada a IniciarTransaccion
        // obtenemos el ultimo ticket recogiendolo del datafono en vez del mongo
        // para evitar un reintento donde no coincida con el ticket deseado
        const tickets = await paytefInstance.getLastFive();
        if (tickets.length > 0) { 
          const ultimoTicket = tickets[tickets.length - 1];
          const ticket = await ticketsInstance.getTicketById(
            Number(ultimoTicket.reference)
          );
          paytefInstance.iniciarTransaccion(
            idTrabajador,
            ticket._id,
            ticket.total
          );
          return true;
        }
        -------------------- */
        if (paytefInstance.ultimaIniciarTransaccion) {
          paytefInstance.iniciarTransaccion(
            idTrabajador,
            paytefInstance.ultimaIniciarTransaccion.idTicket,
            paytefInstance.ultimaIniciarTransaccion.total
          );
          return true;
        }
      }
      throw Error("Faltan datos {idTrabajador} controller");
    } catch (err) {
      logger.Error(131, err);
      return false;
    }
  }

  @Post("darPorValidoUltimoTicket")
  async darPorValidoUltimoTicket(@Body() { idTrabajador }) {
    try {
      if (idTrabajador) {
        const ticket = await ticketsInstance.getUltimoTicket();
        movimientosInstance.nuevoMovimiento(
          ticket.total,
          "Targeta",
          "TARJETA",
          ticket._id,
          idTrabajador
        );
        return true;
      }
      throw Error("Faltan datos {idTrabajador} controller");
    } catch (err) {
      console.log(err);
      logger.Error(131, err);
      return false;
    }
  }

  /* Uri */
  @Post("comprobarDisponibilidad")
  async comprobarDisponibilidad(@Body() { ip }) {
    try {
      const ipDatafono = (await parametrosInstance.getParametros()).ipTefpay;
      if (!ip) ip = ipDatafono;
      return await paytefInstance
        .detectarPytef(ip)
        .then(async (res) => {
          if (res == "error") return "OFFLINE";
          await parametrosInstance.setTcod(res);
          await parametrosInstance.setIpPaytef(ip);
          let startDate = await cajaInstance.getInicioTime();

          if (paytefInstance.checkIfSetContadoDatafono()) {
            paytefInstance
              .getRecuentoTotal(startDate)
              .then((res) => {
                if (paytefInstance.checkIfSetContadoDatafono(true))
                  parametrosInstance.setContadoDatafono(1, res);
              })
              .catch((err) => {});
          }
          return "ONLINE";
        })
        .catch((e) => {
          return "OFFLINE";
        });
    } catch (err) {
      logger.Error(131, err);
      return "OFFLINE";
    }
  }

  /* Uri */
  @Post("comprobarUltimoTicket")
  async comprobarUltimoTicket(@Body() { idticket }) {
    try {
      return await paytefInstance.ComprobarReconectado(idticket);
    } catch (err) {
      logger.Error(131, err);
      console.log(err);
      return false;
    }
  }

  /* Uri */
  @Post("getLastFive")
  async getLastFive() {
    try {
      return await paytefInstance.getLastFive();
    } catch (err) {
      logger.Error(131, err);
      console.log(err);
      return false;
    }
  }

  // @Post("cobrarConTarjeta")
  // async cobrarConTarjeta(@Body() { idTrabajador, idTicket }) {
  //   try {
  //     if (idTrabajador && idTicket) {
  //       const ticket = await ticketsInstance.getTicketById(idTicket);
  //       paytefInstance.iniciarTransaccion(idTrabajador, ticket._id, ticket.total);
  //       return true;
  //     }
  //     throw Error("Faltan datos {idTrabajador} controller");
  //   } catch (err) {
  //     logger.Error(131, err);
  //     return false;
  //   }
  // }

  @Post("devolucionTarjeta")
  async devolucionTarjeta(@Body() { idTrabajador, idTicket }) {
    try {
      if (idTrabajador && idTicket) {
        const ticket = await ticketsInstance.getTicketById(idTicket);
        if (ticket) {
          paytefInstance.iniciarTransaccion(
            idTrabajador,
            ticket._id,
            ticket.total,
            "refund"
          );
          return true;
        }
        throw Error("El ticket no existe");
      }
      throw Error("Faltan datos {idTrabajador} controller");
    } catch (err) {
      logger.Error(131, err);
      return false;
    }
  }

  @Post("cobrarTicketById")
  async cobrarTicketById(@Body() { idTrabajador, idTicket }) {
    try {
      // iniciamos transaccion con el ticket y trabajador obtenidos por el parametro
      if (idTicket && idTrabajador) {
        // recogemos ticket del mongo para obtener el precio
        const ticket = await ticketsInstance.getTicketById(Number(idTicket));
        paytefInstance.iniciarTransaccion(
          idTrabajador,
          ticket._id,
          ticket.total
        );
        return true;
      }
      throw Error("Faltan datos {idTrabajador,idTicket} controller");
    } catch (error) {
      logger.Error(131, "cobrarTicketbyid" + error);
      return false;
    }
  }
}
