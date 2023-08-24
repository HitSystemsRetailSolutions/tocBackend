import { Body, Controller, Get, Post } from "@nestjs/common";
import { paytefInstance } from "./paytef.class";
import { logger } from "../logger";
import { ticketsInstance } from "../tickets/tickets.clase";
import { movimientosInstance } from "src/movimientos/movimientos.clase";
import { cajaInstance } from "src/caja/caja.clase";
import { parametrosController } from "src/parametros/parametros.controller";
import { parametrosInstance } from "src/parametros/parametros.clase";

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
        const ticket = await ticketsInstance.getUltimoTicket();
        paytefInstance.iniciarTransaccion(
          idTrabajador,
          ticket._id,
          ticket.total
        );
        return true;
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
      const validIp = await paytefInstance.detectarPytef(ip);
      let startDate = await cajaInstance.getInicioTime();
      if (validIp.toString().includes("PAYTEF")) {
        paytefInstance
          .getRecuentoTotal(startDate)
          .then((res) => {
            parametrosInstance.setContadoDatafono(1, res);
          })
          .catch((err) => {});
        return "ONLINE";
      }
      return "OFFLINE";
    } catch (err) {
      logger.Error(131, err);
      return false;
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
}
