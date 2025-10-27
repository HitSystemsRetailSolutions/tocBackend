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
import { Clientes, clienteInstance } from "src/clientes/clientes.clase";
import { getClienteById } from "src/clientes/clientes.mongodb";
import { descuentoEspecial } from "src/clientes/clientes.interface";
import { parametrosInstance } from "../parametros/parametros.clase";
import {
  CestasCombinadaInterface,
  CestasInterface,
} from "src/cestas/cestas.interface";
import { DeudasInterface } from "src/deudas/deudas.interface";
import { versionDescuentosClient } from "src/version/version.clase";

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
  @Post("crearTicketDeuda")
  async crearTicketDeuda(
    @Body()
    {
      total,
      idCesta,
      idTrabajador,
      tipo,
      tkrsData,
      dejaCuenta,
    }: {
      total: number;
      idCesta: TicketsInterface["cesta"]["_id"];
      idTrabajador: TicketsInterface["idTrabajador"];
      tipo: FormaPago;
      tkrsData: {
        cantidadTkrs: number;
        formaPago: FormaPago;
      };
      dejaCuenta: TicketsInterface["dejaCuenta"];
    }
  ) {
    try {
      var TDeuda1 = performance.now();
      const cesta = await cestasInstance.getCestaById(idCesta);
      const cliente = await clienteInstance.getClienteById(cesta.idCliente);
      const alboVip = cliente && (cliente?.albaran || cliente?.vip);
      // aplica posible descuento a la cesta a los clientes que no son de facturación (albaranes y vips)
      await cestasInstance.aplicarDescuento(cesta, total, cliente);
      if (
        cesta.modo == "CONSUMO_PERSONAL" ||
        (cliente &&
          !alboVip &&
          cesta.dataVersion &&
          cesta.dataVersion >= versionDescuentosClient)
      )
        await cestasInstance.applyDiscountShop(cesta, total);

      const ticket = await ticketsInstance.generarNuevoTicket(
        total,
        idTrabajador,
        cesta,
        ticketsInstance.esConsumoPersonal(tipo, cesta.modo),
        false,
        tkrsData?.cantidadTkrs > 0,
        dejaCuenta
      );

      if (!ticket) {
        throw Error(
          "Error, no se ha podido generar el objecto del ticket en crearTicketDeuda controller"
        );
      }
      if (await ticketsInstance.insertarTicket(ticket)) {
        var deuda = {
          idTicket: ticket._id,
          cesta: cesta,
          idTrabajador: idTrabajador,
          idCliente: cesta.idCliente,
          nombreCliente: cesta.nombreCliente,
          total: total,
          timestamp: ticket.timestamp,
          dejaCuenta: dejaCuenta,
        };
        await deudasInstance.setDeuda(deuda);
        await movimientosInstance.nuevoMovimiento(
          total,
          "DEUDA",
          "SALIDA",
          ticket._id,
          idTrabajador,
          cesta.nombreCliente
        );
        if (dejaCuenta > 0) {
          await movimientosInstance.nuevoMovimiento(
            dejaCuenta,
            "dejaACuentaDeuda",
            "ENTRADA_DINERO",
            ticket._id,
            idTrabajador,
            cesta.nombreCliente
          );
        }
        if (tipo !== "TARJETA") {
          await impresoraInstance.abrirCajon();
        }

        ticketsInstance.actualizarTickets();
        var TDeuda2 = performance.now();
        var TiempoDeuda = TDeuda2 - TDeuda1;
        logger.Info("TiempoDeuda", TiempoDeuda.toFixed(4) + " ms");
        return true;
      }
      throw Error(
        "Error, no se ha podido generar el ticket de deuda y sus movs en crearTicketDeuda controller"
      );
    } catch (error) {
      logger.Error(1071, error);
      return false;
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
      const graellaModificada =
        await encargosInstance.updateEncargoGraella(idEncargo);
      if (!graellaModificada) return false;
      const ticket = await ticketsInstance.generarNuevoTicket(
        total,
        idTrabajador,
        cestaEncargo.cesta,
        ticketsInstance.esConsumoPersonal(tipo, cestaEncargo.cesta.modo),
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
  redondearPrecio = (precio: number) =>
    Number((Math.round(precio * 100) / 100).toFixed(2));

  @Post("crearPagoCombinado")
  async crearPagoCombinado(
    @Body()
    {
      total,
      idCesta,
      idTrabajador,
      tipo,
      tkrsData,
      concepto,
      honei,
      dejaCuenta = 0,
      arrayDeudas,
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
      dejaCuenta?: number;
      arrayDeudas: DeudasInterface[];
    }
  ) {
    try {
      var TTicket1 = performance.now();
      const cestaCombinada: CestasCombinadaInterface =
        await cestasInstance.getCestaById(idCesta);

      if (!cestaCombinada) {
        logger.Error(
          `crearPagoCombinado: No se ha encontrado la cesta con id ${idCesta}`,
          "tickets.controller"
        );
        return false;
      }
      // separamos la cesta en ticket y deuda
      const cestaTicket: CestasInterface = {
        _id: cestaCombinada._id,
        modo: "VENTA",
        trabajador: cestaCombinada.trabajador,
        idCliente: cestaCombinada.idCliente,
        nombreCliente: cestaCombinada.nombreCliente,
        lista: cestaCombinada.lista,
        comensales: cestaCombinada.comensales,
        timestamp: cestaCombinada.timestamp,
        indexMesa: cestaCombinada.indexMesa,
        detalleIva: cestaCombinada.detalleIvaTickets,
        trabajadores: cestaCombinada.trabajadores ?? [],
        ArticulosFaltaUnoParaPromocion:
          cestaCombinada.ArticulosFaltaUnoParaPromocion ?? [],
      }; // cesta ticket
      const cesta = cestaTicket;

      const cestaDeuda: CestasInterface = {
        _id: cestaCombinada._id,
        modo: cestaCombinada.modo,
        trabajador: cestaCombinada.trabajador,
        idCliente: cestaCombinada.idCliente,
        nombreCliente: cestaCombinada.nombreCliente,
        lista: cestaCombinada.listaDeudas ?? [],
        comensales: cestaCombinada.comensales,
        timestamp: cestaCombinada.timestamp,
        indexMesa: cestaCombinada.indexMesa,
        detalleIva: cestaCombinada.detalleIvaDeudas ?? null,
        trabajadores: cestaCombinada.trabajadores ?? [],
        ArticulosFaltaUnoParaPromocion:
          cestaCombinada.ArticulosFaltaUnoParaPromocion ?? [],
      }; // cesta deuda

      // comprobar la cesta de un cliente con descuento especial
      let clienteDescEsp = descuentoEspecial.find(
        (desc) => desc.idCliente == cesta.idCliente
      );
      let totalTicket = Object.keys(cesta.detalleIva)
        .filter((key) => key.startsWith("importe"))
        .reduce((total, key) => total + cesta.detalleIva[key], 0);

      if (clienteDescEsp && total != clienteDescEsp.precio) {
        logger.Info("Descuento especial activado en crearTicket");
        // si el precio de la cesta no coincide con el precio del descuento especial, se recalcula
        await cestasInstance.recalcularIvasDescuentoEspecial(cesta);
        totalTicket = clienteDescEsp.precio;
      }

      // aplica posible descuento a la cesta a los clientes que no son de facturación (albaranes y vips)
      const cliente = await clienteInstance.getClienteById(cesta.idCliente);
      const alboVip = cliente && (cliente?.albaran || cliente?.vip);
      // aplica posible descuento a la cesta a los clientes que no son de facturación (albaranes y vips)
      await cestasInstance.aplicarDescuento(cesta, total, cliente);
      if (
        cesta.modo == "CONSUMO_PERSONAL" ||
        (cliente &&
          !alboVip &&
          cesta.dataVersion &&
          cesta.dataVersion >= versionDescuentosClient)
      )
        await cestasInstance.applyDiscountShop(cesta, totalTicket);

      if (
        !paytefInstance.dentroIniciarTransaccion &&
        paytefInstance.ultimaIniciarTransaccion
      ) {
        paytefInstance.deleteUltimaIniciarTransaccion();
      }
      // generar ticket
      const cantidadTkrs =
        tkrsData?.cantidadTkrs == 0
          ? 0
          : tkrsData?.cantidadTkrs > totalTicket
          ? totalTicket
          : this.redondearPrecio(totalTicket - tkrsData?.cantidadTkrs);

      const ticket = await ticketsInstance.generarNuevoTicket(
        totalTicket,
        idTrabajador,
        cesta,
        false,
        tipo.includes("HONEI") || honei,
        tkrsData?.cantidadTkrs > 0,
        0
      );

      if (!ticket) {
        throw Error(
          "Error, no se ha podido generar el objecto del ticket en crearTicket controller 3"
        );
      }

      var TTicket2 = performance.now();
      var TiempoTicket = TTicket2 - TTicket1;
      logger.Info("TiempoTicket", TiempoTicket.toFixed(4) + " ms");
      if (await ticketsInstance.insertarTicket(ticket)) {
        // generar movimientos del arrayDeuda
        // sumar los importeX que hay en deudas

        let totalDeuda = this.redondearPrecio(
          arrayDeudas.reduce(
            (acc, deuda) => acc + deuda.total - deuda.dejaCuenta,
            0
          )
        );

        const tkrsDataTicket = {
          cantidadTkrs: cantidadTkrs,
          formaPago: tkrsData.formaPago,
        };

        // genera los movimientos del ticket
        ticketsInstance.finalizarTicket(
          ticket,
          idTrabajador,
          tipo,
          concepto,
          cesta,
          tkrsDataTicket
        );

        const tkrsDataDeuda = {
          cantidadTkrs: this.redondearPrecio(
            tkrsData?.cantidadTkrs - cantidadTkrs
          ),
          formaPago: tkrsData.formaPago,
        };
        const infoCobro = {
          idCesta,
          total: totalDeuda,
          idTrabajador,
          tkrsData: tkrsDataDeuda,
          tipo,
        };
        // genera los movimientos de las deudas y las paga
        await deudasInstance.pagarDeuda(arrayDeudas, infoCobro);

        return ticket._id; // devuelve el id del ticket creado
      }
      throw Error(
        "Error, no se ha podido crear el ticket en crearPagoCombinado() controller"
      );
    } catch (err) {
      logger.Error(1070, err);
      return false;
    }
  }

  @Post("crearPagoCombinadoPaytef")
  async crearPagoCombinadoPaytef(
    @Body()
    {
      total,
      idCesta,
      idTrabajador,
      tipo,
      tkrsData,
      concepto,
      honei,
      dejaCuenta = 0,
      arrayDeudas,
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
      dejaCuenta?: number;
      arrayDeudas: DeudasInterface[];
    }
  ) {
    const cestaCombinada: CestasCombinadaInterface =
      await cestasInstance.getCestaById(idCesta);

    if (!cestaCombinada) {
      logger.Error(
        `crearPagoCombinadoPaytef: No se ha encontrado la cesta con id ${idCesta}`,
        "tickets.controller"
      );
      return false;
    }
    // separamos la cesta en ticket y deuda
    const cestaTicket: CestasInterface = {
      _id: cestaCombinada._id,
      modo: "VENTA",
      trabajador: cestaCombinada.trabajador,
      idCliente: cestaCombinada.idCliente,
      nombreCliente: cestaCombinada.nombreCliente,
      lista: cestaCombinada.lista,
      comensales: cestaCombinada.comensales,
      timestamp: cestaCombinada.timestamp,
      indexMesa: cestaCombinada.indexMesa,
      detalleIva: cestaCombinada.detalleIvaTickets,
      trabajadores: cestaCombinada.trabajadores ?? [],
      ArticulosFaltaUnoParaPromocion:
        cestaCombinada.ArticulosFaltaUnoParaPromocion ?? [],
    }; // cesta ticket
    const cesta = cestaTicket;

    const cestaDeuda: CestasInterface = {
      _id: cestaCombinada._id,
      modo: cestaCombinada.modo,
      trabajador: cestaCombinada.trabajador,
      idCliente: cestaCombinada.idCliente,
      nombreCliente: cestaCombinada.nombreCliente,
      lista: cestaCombinada.listaDeudas ?? [],
      comensales: cestaCombinada.comensales,
      timestamp: cestaCombinada.timestamp,
      indexMesa: cestaCombinada.indexMesa,
      detalleIva: cestaCombinada.detalleIvaDeudas ?? null,
      trabajadores: cestaCombinada.trabajadores ?? [],
      ArticulosFaltaUnoParaPromocion:
        cestaCombinada.ArticulosFaltaUnoParaPromocion ?? [],
    }; // cesta deuda

    // aplica posible descuento a la cesta a los clientes que no son de facturación (albaranes y vips)
    let totalTicket = Object.keys(cesta.detalleIva)
      .filter((key) => key.startsWith("importe"))
      .reduce((total, key) => total + cesta.detalleIva[key], 0);
    const cliente = await clienteInstance.getClienteById(cesta.idCliente);
    const alboVip = cliente && (cliente?.albaran || cliente?.vip);
    // aplica posible descuento a la cesta a los clientes que no son de facturación (albaranes y vips)
    await cestasInstance.aplicarDescuento(cesta, total, cliente);
    if (
      cesta.modo == "CONSUMO_PERSONAL" ||
      (cliente &&
        !alboVip &&
        cesta.dataVersion &&
        cesta.dataVersion >= versionDescuentosClient)
    )
      await cestasInstance.applyDiscountShop(cesta, totalTicket);

    // elimina la última transacción de Paytef
    paytefInstance.deleteUltimaIniciarTransaccion();
    // genera un ticket temporal hasta que se confirme o se anule el pago
    const ticketTemp = await ticketsInstance.generarNuevoTicket(
      totalTicket,
      idTrabajador,
      cesta,
      false,
      tipo.includes("HONEI") || honei,
      tkrsData?.cantidadTkrs > 0,
      0
    );
    // id temporal para el ticketPaytef
    let idTransaccion = await ticketsInstance.getProximoId();
    ticketTemp._id = idTransaccion;
    logger.Info(
      `crearTicketCombinadoPaytef entrada (${idTransaccion})`,
      "tickets.controller"
    );
    const transaccion = this.redondearPrecio(total - dejaCuenta);

    const resPaytef = await paytefInstance.iniciarTransaccion(
      idTrabajador,
      idTransaccion,
      transaccion
    );

    if (!resPaytef) {
      logger.Error(
        `crearPagoCombinadoPaytef: Error
          al iniciar la transacción Paytef para el ticket ${idTransaccion}`,
        "tickets.controller"
      );
      return false;
    }
    logger.Info(
      `crearTicketCombinadoPaytef salida (${idTransaccion}, ${resPaytef})`,
      "tickets.controller"
    );

    if (await ticketsInstance.insertarTicket(ticketTemp)) {
      // generar movimiento tarjeta
      ticketsInstance.setPagadoPaytef(ticketTemp._id);

      // sumar los importeX que hay en detalleIvaDeudas
      let totalDeuda = this.redondearPrecio(
        arrayDeudas.reduce(
          (acc, deuda) => acc + deuda.total - deuda.dejaCuenta,
          0
        )
      );
      const infoCobro = {
        idCesta,
        total: totalDeuda,
        idTrabajador,
        tkrsData,
        tipo,
      };
      // generar movimientos del arrayDeuda
      await deudasInstance.pagarDeuda(arrayDeudas, infoCobro, 0, true);
      ticketsInstance.actualizarTickets();
      return idTransaccion;
    }
  }

  @Post("crearTicketPaytef")
  async crearTicketPaytef(
    @Body()
    {
      total,
      idCesta,
      idTrabajador,
      tipo,
      tkrsData,
      concepto,
      honei,
      dejaCuenta = 0,
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
      dejaCuenta?: number;
    }
  ) {
    const cesta = await cestasInstance.getCestaById(idCesta);
    // aplica posible descuento a la cesta a los clientes que no son de facturación (albaranes y vips)
    const cliente = await clienteInstance.getClienteById(cesta.idCliente);
    const alboVip = cliente && (cliente?.albaran || cliente?.vip);
    // aplica posible descuento a la cesta a los clientes que no son de facturación (albaranes y vips)
    await cestasInstance.aplicarDescuento(cesta, total, cliente);
    if (
      cesta.modo == "CONSUMO_PERSONAL" ||
      (cliente &&
        !alboVip &&
        cesta.dataVersion &&
        cesta.dataVersion >= versionDescuentosClient)
    )
      await cestasInstance.applyDiscountShop(cesta, total);
    // elimina la última transacción de Paytef
    paytefInstance.deleteUltimaIniciarTransaccion();
    // genera un ticket temporal hasta que se confirme o se anule el pago
    const ticketTemp = await ticketsInstance.generarNuevoTicket(
      total,
      idTrabajador,
      cesta,
      ticketsInstance.esConsumoPersonal(tipo, cesta.modo),
      tipo.includes("HONEI") || honei,
      tkrsData?.cantidadTkrs > 0,
      dejaCuenta
    );
    // id temporal para el ticketPaytef
    let idTransaccion = await ticketsInstance.getProximoId();

    ticketTemp._id = idTransaccion;
    logger.Info(
      `crearTicketPaytef entrada (${idTransaccion})`,
      "tickets.controller"
    );
    const transaccion = this.redondearPrecio(total - dejaCuenta);
    return await paytefInstance
      .iniciarTransaccion(idTrabajador, idTransaccion, transaccion)
      .then(async (x) => {
        if (x) {
          if (await ticketsInstance.insertarTicket(ticketTemp)) {
            // si el ticket ya se ha creado, se hace una llamada a finalizarTicket
            // donde se generarán los movimientos necesarios y actualizará el total de tickets generados
            await ticketsInstance.finalizarTicket(
              ticketTemp,
              idTrabajador,
              tipo,
              concepto,
              cesta,
              tkrsData
            );
          }
          // si el identificador temporal no coincide con el real, se lanza un logError
          // puede ocurrir si se ha generado un nuevo ticket mientras se realizaba el pago con Paytef
          if (ticketTemp._id != idTransaccion) {
            logger.Error(
              `idTicket!=idTransaccion (${ticketTemp._id}!=${idTransaccion}), se ha generado un nuevo ticket mientras se realizaba el pago con Paytef.`,
              "tickets.controller"
            );
          }
          if (
            (await parametrosInstance.getParametros())?.params?.TicketDFAuto ==
            "Si"
          ) {
            impresoraInstance.imprimirTicket(ticketTemp._id);
          }
          //ticketsInstance.setPagadoPaytef(idTicket);
        }
        logger.Info(
          `crearTicketPaytef salida (${idTransaccion}, ${x})`,
          "tickets.controller"
        );
        return x;
      })
      .catch((err) => {
        logger.Error(1073, err);
        return false;
      });
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
      honei,
      dejaCuenta = 0,
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
      dejaCuenta?: number;
    }
  ) {
    try {
      var TTicket1 = performance.now();
      if (!(typeof total == "number" && idCesta && idTrabajador && tipo)) {
        throw Error("Error, faltan datos en crearTicket() controller 1");
      }
      const cesta = await cestasInstance.getCestaById(idCesta);

      // comprobar la cesta de un cliente con descuento especial
      let clienteDescEsp = descuentoEspecial.find(
        (desc) => desc.idCliente == cesta.idCliente
      );
      if (clienteDescEsp && total != clienteDescEsp.precio) {
        logger.Info("Descuento especial activado en crearTicket");
        // si el precio de la cesta no coincide con el precio del descuento especial, se recalcula
        await cestasInstance.recalcularIvasDescuentoEspecial(cesta);
        total = clienteDescEsp.precio;
      }

      if (tipo == "CONSUMO_PERSONAL") cesta.modo = "CONSUMO_PERSONAL";

      const cliente = await clienteInstance.getClienteById(cesta.idCliente);
      const alboVip = cliente && (cliente?.albaran || cliente?.vip);
      // aplica posible descuento a la cesta a los clientes que no son de facturación (albaranes y vips)
      await cestasInstance.aplicarDescuento(cesta, total, cliente);
      if (
        cesta.modo == "CONSUMO_PERSONAL" ||
        (cliente &&
          !alboVip &&
          cesta.dataVersion &&
          cesta.dataVersion >= versionDescuentosClient)
      )
        await cestasInstance.applyDiscountShop(cesta, total);
      // caso doble tpv; borrar registro de la última transacción de Paytef cuando no se ha iniciado una transacción
      if (
        !paytefInstance.dentroIniciarTransaccion &&
        paytefInstance.ultimaIniciarTransaccion
      ) {
        paytefInstance.deleteUltimaIniciarTransaccion();
      }
      const ticket = await ticketsInstance.generarNuevoTicket(
        total,
        idTrabajador,
        cesta,
        ticketsInstance.esConsumoPersonal(tipo, cesta.modo),
        tipo.includes("HONEI") || honei,
        tkrsData?.cantidadTkrs > 0,
        dejaCuenta
      );

      if (!ticket) {
        throw Error(
          "Error, no se ha podido generar el objecto del ticket en crearTicket controller 3"
        );
      }
      var TTicket2 = performance.now();
      var TiempoTicket = TTicket2 - TTicket1;
      logger.Info("TiempoTicket", TiempoTicket.toFixed(4) + " ms");
      if (await ticketsInstance.insertarTicket(ticket)) {
        // si el ticket ya se ha creado, se hace una llamada a finalizarTicket
        // donde se generarán los movimientos necesarios y actualizará el total de tickets generados
        return await ticketsInstance.finalizarTicket(
          ticket,
          idTrabajador,
          tipo,
          concepto,
          cesta,
          tkrsData
        );
      }
      throw Error(
        "Error, no se ha podido crear el ticket en crearTicket() controller 2"
      );
    } catch (err) {
      console.log(err);
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
        const ticket = await ticketsInstance.generarNuevoTicket(
          total,
          idTrabajador,
          cesta,
          ticketsInstance.esConsumoPersonal(tipo, cesta.modo),
          null,
          tipo.includes("HONEI")
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
                this.redondearPrecio(tkrsData.cantidadTkrs - total),
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
  async anularTicket(@Body() { ticketId, reason = null }) {
    try {
      if (ticketId) {
        const res = await ticketsInstance.anularTicket(ticketId, reason);
        ticketsInstance.actualizarTickets();
        return res;
      }
      throw Error("Error, faltan datos en anularTicket() controller");
    } catch (err) {
      logger.Error(108, err);
      return false;
    }
  }
  @Post("isTicketAnulable")
  async isTicketAnulable(@Body() { ticketId }) {
    return ticketsInstance.isTicketAnulable(ticketId);
  }

  @Post("getUltimoTicket")
  async getUltimoTicket() {
    const caja = await cajaInstance.getInfoCajaAbierta();
    return await ticketsInstance.getUltimoTicketIntervalo(
      caja.inicioTime,
      Date.now()
    );
  }
  @Get("getTotalDatafono3G")
  async getTotalDatafono3G() {
    try {
      const inicioTime = (await cajaInstance.getInfoCajaAbierta()).inicioTime;
      const finalTime = Date.now();
      return await ticketsInstance.getTotalDatafono3G(inicioTime, finalTime);
    } catch (err) {
      logger.Error(99, err);
      console.log(err);
      return 0;
    }
  }
}
