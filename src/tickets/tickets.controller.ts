import { Controller, Post, Body, Get } from "@nestjs/common";
import { ticketsInstance } from "./tickets.clase";
import { logger } from "../logger";
import { cestasInstance } from "../cestas/cestas.clase";
import { paytefInstance } from "../paytef/paytef.class";
import { TicketsInterface } from "./tickets.interface";
import { parametrosController } from "src/parametros/parametros.controller";
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
import axios from "axios";
import { clienteInstance } from "src/clientes/clientes.clase";
import { getClienteById } from "src/clientes/clientes.mongodb";
import descuentoEspecial from "src/clientes/clientes.interface";
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
        false,
        false,
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
  redondearPrecio = (precio: number) => Math.round(precio * 100) / 100;

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
      honei,
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
      honei?: boolean;
    }
  ) {
    try {
      if (!(typeof total == "number" && idCesta && idTrabajador && tipo)) {
        throw Error("Error, faltan datos en crearTicket() controller 1");
      }
      const cesta = await cestasInstance.getCestaById(idCesta);
      let descuento: any = Number(
        (await clienteInstance.isClienteDescuento(cesta.idCliente))?.descuento
      );
      //en ocasiones cuando un idcliente es trabajador y quiera consumo peronal,
      // el modo de cesta debe cambiar a consumo_personal.
      const clienteDescEsp = descuentoEspecial.find(
        (cliente) => cliente.idCliente === cesta.idCliente
      );
      if (tipo == "CONSUMO_PERSONAL") cesta.modo = "CONSUMO_PERSONAL";
      if (tipo !== "CONSUMO_PERSONAL" && descuento && descuento > 0 && (!clienteDescEsp || clienteDescEsp.precio==total)) {
        cesta.lista.forEach((producto) => {
          if (producto.arraySuplementos != null) {
            producto.subtotal = this.redondearPrecio(
              producto.subtotal - (producto.subtotal * descuento) / 100
            );
          } else if (producto.promocion == null)
            producto.subtotal = this.redondearPrecio(
              producto.subtotal - (producto.subtotal * descuento) / 100
            ); // Modificamos el total para añadir el descuento especial del cliente
        });
      } else if (tipo == "CONSUMO_PERSONAL" && descuento) {
        await cestasInstance.recalcularIvas(cesta);
      }

      const d3G = tipo === "DATAFONO_3G";
      const paytef = false;
      const ticket = await ticketsInstance.generarNuevoTicket(
        total,
        idTrabajador,
        cesta,
        tipo === "CONSUMO_PERSONAL",
        d3G,
        paytef,
        tipo.includes("HONEI") || honei,
        tkrsData?.cantidadTkrs > 0
      );

      if (!ticket) {
        throw Error(
          "Error, no se ha podido generar el objecto del ticket en crearTicket controller 3"
        );
      }
      if (await ticketsInstance.insertarTicket(ticket)) {
        await cestasInstance.borrarArticulosCesta(idCesta, true, true);
        await cestasInstance.setClients(0, idCesta);
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
          const cliente = await getClienteById(cesta.idCliente);
          //como tipo DEUDA se utilizaba antes de crear deudas en la tabla deudas
          // se diferenciara su uso cuando el concepto sea igual a DEUDA
          if (concepto && concepto == "DEUDA") {
            await movimientosInstance.nuevoMovimiento(
              total,
              "DEUDA",
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
          } else if (cliente.albaran) {
            await movimientosInstance.nuevoMovimiento(
              total,
              "Albaran",
              "DEUDA",
              ticket._id,
              idTrabajador
            );
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
        if (tipo !== "TARJETA" && concepto == "DEUDA") {
          await impresoraInstance.abrirCajon();
        }
        ticketsInstance.actualizarTickets();
        return ticket._id;
      }

      throw Error(
        "Error, no se ha podido crear el ticket en crearTicket() controller 2"
      );
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
          null,
          tipo.includes("HONEI"),
          false
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
