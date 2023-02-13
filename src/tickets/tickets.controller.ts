import { Controller, Post, Body } from "@nestjs/common";
import { ticketsInstance } from "./tickets.clase";
import { logger } from "../logger";
import { cestasInstance } from "../cestas/cestas.clase";
import { paytefInstance } from "../paytef/paytef.class";
import { TicketsInterface } from "./tickets.interface";
import { FormaPago } from "../movimientos/movimientos.interface";
import { movimientosInstance } from "../movimientos/movimientos.clase";
import { cajaInstance } from "src/caja/caja.clase";
import { impresoraInstance } from "../impresora/impresora.class";
@Controller("tickets")
export class TicketsController {
  /* Eze 4.0 */
  @Post("getTicketsIntervalo")
  async getTicketsIntervalo(@Body() { inicioTime, finalTime }) {
    try {
      if (inicioTime && finalTime)
        return await ticketsInstance.getTicketsIntervalo(inicioTime, finalTime);
      throw Error("Error, faltan datos en getTiketsIntervalo() controller");
    } catch (err) {
      logger.Error(105, err);
      return null;
    }
  }

  /* Eze 4.0 */
  @Post("getTicket")
  async getTickets(@Body() { ticketId }) {
    try {
      if (ticketId) await ticketsInstance.getTicketById(ticketId);
      throw Error("Error, faltan datos en getTicket() controller");
    } catch (err) {
      logger.Error(106, err);
      return null;
    }
  }

  /* Eze 4.0 */
  @Post("crearTicket")
  async crearTicket(
    @Body()
    {
      total,
      idCesta,
      idTrabajador,
      tipo,
      tkrsData,
    }: {
      total: number;
      idCesta: TicketsInterface["cesta"]["_id"];
      idTrabajador: TicketsInterface["idTrabajador"];
      tipo: FormaPago;
      tkrsData: {
        cantidadTkrs: number;
        formaPago: FormaPago;
      };
    }
  ) {
    try {
      if (typeof total == "number" && idCesta && idTrabajador && tipo) {
        const cesta = await cestasInstance.getCestaById(idCesta);
        const ticket = await ticketsInstance.generarNuevoTicket(
          total,
          idTrabajador,
          cesta,
          tipo === "CONSUMO_PERSONAL"
        );

        if (!ticket)
          throw Error(
            "Error, no se ha podido generar el objecto del ticket en crearTicket controller 3"
          );
        if (await ticketsInstance.insertarTicket(ticket)) {
          await cestasInstance.borrarArticulosCesta(idCesta, true);
          if (tipo === "TARJETA")
            paytefInstance.iniciarTransaccion(idTrabajador, ticket._id, total);
          else if (
            (tipo === "TKRS" && tkrsData) ||
            (tkrsData?.cantidadTkrs > 0 && tipo === "EFECTIVO")
          ) {
            if (tkrsData.cantidadTkrs > total) {
              await movimientosInstance.nuevoMovimiento(
                total,
                "",
                "TKRS_SIN_EXCESO",
                ticket._id,
                idTrabajador
              );
              await movimientosInstance.nuevoMovimiento(
                tkrsData.cantidadTkrs - total,
                "",
                "TKRS_CON_EXCESO",
                ticket._id,
                idTrabajador
              );
            } else if (tkrsData.cantidadTkrs < total) {
              await movimientosInstance.nuevoMovimiento(
                tkrsData.cantidadTkrs,
                "",
                "TKRS_SIN_EXCESO",
                ticket._id,
                idTrabajador
              );
            } else if (tkrsData.cantidadTkrs === total) {
              await movimientosInstance.nuevoMovimiento(
                total,
                "",
                "TKRS_SIN_EXCESO",
                ticket._id,
                idTrabajador
              );
            }
          } else if (tipo === "DEUDA") {
            await movimientosInstance.nuevoMovimiento(
              total,
              "",
              "DEUDA",
              ticket._id,
              idTrabajador
            );
          } else if (tipo !== "EFECTIVO" && tipo != "CONSUMO_PERSONAL") {
            throw Error(
              "Falta información del tkrs o bien ninguna forma de pago es correcta"
            );
          }
          await impresoraInstance.abrirCajon();
          ticketsInstance.actualizarTickets();
          return true;
        }

        throw Error(
          "Error, no se ha podido crear el ticket en crearTicket() controller 2"
        );
      }
      throw Error("Error, faltan datos en crearTicket() controller 1");
    } catch (err) {
      logger.Error(107, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Post("anularTicket")
  async anularTicket(@Body() { ticketId }) {
    console.log(ticketId)
    try {
      if (ticketId) {
        const res =await ticketsInstance.anularTicket(ticketId);
        return res;
      }
      throw Error("Error, faltan datos en anularTicket() controller");
    } catch (err) {
      logger.Error(108, err);
      return false;
    }
  }

  @Post("getUltimoTicket")
  async getUltimoTicket(){
    const caja= await cajaInstance.getInfoCajaAbierta();
    return await ticketsInstance.getUltimoTicketIntervalo(caja.inicioTime, Date.now());

  }
}
