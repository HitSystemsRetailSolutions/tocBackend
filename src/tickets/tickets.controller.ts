import { Controller, Post, Body } from "@nestjs/common";
import { ticketsInstance } from "./tickets.clase";
import { logger } from "../logger";
import { cestasInstance } from "../cestas/cestas.clase";
import { paytefInstance } from "../paytef/paytef.class";
import { TicketsInterface } from "./tickets.interface";
import {
  FormaPago,
  MovimientosInterface,
} from "../movimientos/movimientos.interface";
import { movimientosInstance } from "../movimientos/movimientos.clase";
import { cajaInstance } from "src/caja/caja.clase";
import { impresoraInstance } from "../impresora/impresora.class";
import { encargosInstance } from "src/encargos/encargos.clase";
import { EncargosInterface } from "src/encargos/encargos.interface";
import { deudasInstance } from "src/deudas/deudas.clase";
import { timestamp } from "rxjs";
import { mqttInstance } from "src/mqtt";
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

  @Post("crearTicketEncargo") async crearTicketEncargo(
    @Body()
    {
      idEncargo,
      total,
      dejaCuenta,
      idTrabajador,
      tipo,
    }: {
      idEncargo: EncargosInterface["_id"];
      total: number;
      dejaCuenta: TicketsInterface["dejaCuenta"];
      tipo: FormaPago;
      idTrabajador: TicketsInterface["idTrabajador"];
    }
  ) {
    try {
      const cestaEncargo = await encargosInstance.getEncargoById(idEncargo);
      // modifica
      const graellaModificada = await encargosInstance.updateEncargoGraella(
        idEncargo
      );
      if (!graellaModificada) return false;

      const ticket = await ticketsInstance.generarNuevoTicket(
        total - dejaCuenta,
        idTrabajador,
        cestaEncargo.cesta,
        tipo === "CONSUMO_PERSONAL",
        false,
        dejaCuenta
      );

      if (!ticket) {
        throw Error(
          "Error, no se ha podido generar el objecto del ticket en crearTicket controller 3"
        );
      }

      if (await ticketsInstance.insertarTicket(ticket)) {
          await encargosInstance.setEntregado(idEncargo);

        if (tipo !== "TARJETA") {
          await impresoraInstance.abrirCajon();
        }

        ticketsInstance.actualizarTickets();
        return true;
      }

      throw Error(
        "Error, no se ha podido crear el ticket en crearTicket() controller 2"
      );
    } catch (err) {
      logger.Error(1072, err);
      return false;
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
      concepto,
    }: {
      total: number;
      idCesta: TicketsInterface["cesta"]["_id"];
      idTrabajador: TicketsInterface["idTrabajador"];
      tipo: FormaPago;
      tkrsData: {
        cantidadTkrs: number;
        formaPago: FormaPago;
      };
      concepto?: MovimientosInterface["concepto"];
    }
  ) {
    try {
      if (typeof total == "number" && idCesta && idTrabajador && tipo) {
        const cesta = await cestasInstance.getCestaById(idCesta);
        let d3G = false;
        if (tipo === "DATAFONO_3G") d3G = true;
        const ticket = await ticketsInstance.generarNuevoTicket(
          total,
          idTrabajador,
          cesta,
          tipo === "CONSUMO_PERSONAL",
          d3G,
          null
        );

        if (!ticket) {
          throw Error(
            "Error, no se ha podido generar el objecto del ticket en crearTicket controller 3"
          );
        }
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
            //como tipo DEUDA se utilizaba antes de crear deudas en la tabla deudas
            // se diferenciara su uso cuando el concepto sea igual a DEUDA
            if (concepto && concepto == "DEUDA") {
              await movimientosInstance.nuevoMovimiento(
                total,
                "",
                "SALIDA",
                ticket._id,
                idTrabajador
              );
              var deuda = {
                idTicket: ticket._id,
                cesta: cesta,
                idTrabajador: idTrabajador,
                idCliente: cesta.idCliente,
                nombreCliente: cesta.nombreCliente,
                total: total,
                timestamp: ticket.timestamp,
              };
              await deudasInstance.setDeuda(deuda);
            } else {
              await movimientosInstance.nuevoMovimiento(
                total,
                "",
                "DEUDA",
                ticket._id,
                idTrabajador
              );
            }
          } else if (
            tipo !== "EFECTIVO" &&
            tipo != "CONSUMO_PERSONAL" &&
            tipo !== "DATAFONO_3G"
          ) {
            throw Error(
              "Falta información del tkrs o bien ninguna forma de pago es correcta"
            );
          }
          if (tipo !== "TARJETA" || concepto == "DEUDA") {
            await impresoraInstance.abrirCajon();
          }
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
  @Post("crearTicketSeparado")
  async crearTicketSeparado(
    @Body()
    {
      total,
      cesta,
      idTrabajador,
      tipo,
      tkrsData,
    }: {
      total: number;
      cesta: any;
      idTrabajador: TicketsInterface["idTrabajador"];
      tipo: FormaPago;
      tkrsData: {
        cantidadTkrs: number;
        formaPago: FormaPago;
      };
    }
  ) {
    try {
      if (typeof total == "number" && cesta && idTrabajador && tipo) {
        let d3G = false;
        if (tipo === "DATAFONO_3G") d3G = true;
        const ticket = await ticketsInstance.generarNuevoTicket(
          total,
          idTrabajador,
          cesta,
          tipo === "CONSUMO_PERSONAL",
          d3G,
          null
        );
        if (!ticket) {
          throw Error(
            "Error, no se ha podido generar el objecto del ticket en crearTicket controller 3"
          );
        }
        if (await ticketsInstance.insertarTicket(ticket)) {
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
          if (tipo !== "TARJETA") {
            await impresoraInstance.abrirCajon();
          }

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
    try {
      if (ticketId) {
        const res = await ticketsInstance.anularTicket(ticketId);
        return res;
      }
      throw Error("Error, faltan datos en anularTicket() controller");
    } catch (err) {
      logger.Error(108, err);
      return false;
    }
  }

  @Post("getUltimoTicket")
  async getUltimoTicket() {
    const caja = await cajaInstance.getInfoCajaAbierta();
    return await ticketsInstance.getUltimoTicketIntervalo(
      caja.inicioTime,
      Date.now()
    );
  }
}
