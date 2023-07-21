import { parametrosInstance } from "../parametros/parametros.clase";
import { FormaPago, MovimientosInterface } from "./movimientos.interface";
import * as schMovimientos from "./movimientos.mongodb";
// import { impresoraInstance } from "../impresora/impresora.class";
// import { trabajadoresInstance } from "../trabajadores/trabajadores.clase";
import { logger } from "../logger";
import {
  SuperTicketInterface,
  TicketsInterface,
} from "../tickets/tickets.interface";
import { ticketsInstance } from "../tickets/tickets.clase";
import { cajaInstance } from "../caja/caja.clase";
import { impresoraInstance } from "../impresora/impresora.class";

const moment = require("moment");
const Ean13Utils = require("ean13-lib").Ean13Utils;
// const TIPO_ENTRADA = "ENTRADA";
// const TIPO_SALIDA = "SALIDA";

function getNumeroTresDigitos(x: number) {
  let devolver = "";
  if (x < 100 && x >= 10) {
    devolver = "0" + x;
  } else {
    if (x < 10 && x >= 0) {
      devolver = "00" + x;
    } else {
      devolver = x.toString();
    }
  }
  return devolver;
}

export class MovimientosClase {
  /* Eze v23 */
  getMovimientosIntervalo = (inicioTime: number, finalTime: number) =>
    schMovimientos.getMovimientosIntervalo(inicioTime, finalTime);

  /* Uri */
  /* Yasai :D */
  public async existeMovimiento(
    idTicket: MovimientosInterface["idTicket"],
    valor: MovimientosInterface["valor"]
  ): Promise<boolean> {
    return await schMovimientos.existeMovimiento(idTicket, valor);
  }

  public async nuevoMovimiento(
    valor: MovimientosInterface["valor"],
    concepto: MovimientosInterface["concepto"],
    tipo: MovimientosInterface["tipo"],
    idTicket: MovimientosInterface["idTicket"],
    idTrabajador: MovimientosInterface["idTrabajador"],
    ExtraData: MovimientosInterface["ExtraData"] = []
  ) {
    let codigoBarras = "";
    if (concepto === "Entrega Diària" || concepto === "Entrada") {
      codigoBarras = await this.generarCodigoBarrasSalida();
      codigoBarras = String(Ean13Utils.generate(codigoBarras));
    }
    const nuevoMovimiento: MovimientosInterface = {
      _id: Date.now(),
      codigoBarras,
      concepto,
      enviado: false,
      idTicket,
      idTrabajador,
      tipo,
      valor,
      ExtraData,
    };
    if (tipo === "TARJETA")
      if (await schMovimientos.existeMovimiento(idTicket, valor)) return false;

    if (await schMovimientos.nuevoMovimiento(nuevoMovimiento)) {
      if (concepto === "Entrega Diària") {
        impresoraInstance.imprimirSalida(nuevoMovimiento);
      }
      if (concepto === "Entrada") {
        impresoraInstance.imprimirEntrada(nuevoMovimiento);
      }
      return true;
    }
    return false;
  }
  /* uri */
  public async insertMovimientos(
    valor: MovimientosInterface["valor"],
    concepto: MovimientosInterface["concepto"],
    tipo: MovimientosInterface["tipo"],
    idTicket: MovimientosInterface["idTicket"],
    idTrabajador: MovimientosInterface["idTrabajador"],
    ExtraData: MovimientosInterface["ExtraData"] = []
  ) {
    let codigoBarras = "";

    const nuevoMovimiento: MovimientosInterface = {
      _id: Date.now(),
      codigoBarras,
      concepto,
      enviado: false,
      idTicket,
      idTrabajador,
      tipo,
      valor,
      ExtraData,
    };

    if (await schMovimientos.nuevoMovimiento(nuevoMovimiento)) {
      return true;
    }
    return false;
  }

  /* Eze 4.0 */
  private async generarCodigoBarrasSalida(): Promise<string> {
    const parametros = await parametrosInstance.getParametros();
    const ultimoCodigoDeBarras = await schMovimientos.getUltimoCodigoBarras();

    if (!ultimoCodigoDeBarras)
      if (!(await schMovimientos.resetContadorCodigoBarras()))
        throw "Error en inicializar contador de codigo de barras";

    let ultimoNumero = await schMovimientos.getUltimoCodigoBarras();

    if (ultimoNumero == 999) {
      if (!(await schMovimientos.resetContadorCodigoBarras()))
        throw "Error en resetContadorCodigoBarras";
    } else if (!(await schMovimientos.actualizarCodigoBarras())) {
      throw "Error en actualizarCodigoBarras";
    }

    ultimoNumero = await schMovimientos.getUltimoCodigoBarras();

    const codigoLicenciaStr = getNumeroTresDigitos(parametros.licencia);
    const strNumeroCodigosDeBarras: string = getNumeroTresDigitos(ultimoNumero);
    let codigoFinal = "";
    const digitYear = new Date().getFullYear().toString()[3];

    codigoFinal = `98${codigoLicenciaStr}${digitYear}${getNumeroTresDigitos(
      moment().dayOfYear()
    )}${strNumeroCodigosDeBarras}`;
    return codigoFinal;
  }

  /* Eze v23 */
  getMovimientoMasAntiguo = () => schMovimientos.getMovimientoMasAntiguo();
  getMovimientoTarjetaMasAntiguo = async (idTiket) =>
    await schMovimientos.getMovimientoTarjetaMasAntiguo(idTiket);

  /* Eze v4 */
  setMovimientoEnviado = (movimiento: MovimientosInterface) =>
    schMovimientos.setMovimientoEnviado(movimiento);

  /* Eze 4.0 */
  construirArrayVentas = async () => {
    const infoCaja = await cajaInstance.getInfoCajaAbierta();
    if (infoCaja) {
      const inicioCaja = infoCaja.inicioTime;
      const final = Date.now();
      const arrayTickets = await ticketsInstance.getTicketsIntervalo(
        inicioCaja,
        final
      );
      const arrayMovimientos = await this.getMovimientosIntervalo(
        inicioCaja,
        final
      );
      const arrayFinalTickets: SuperTicketInterface[] = [];

      for (let i = 0; i < arrayTickets.length; i++) {
        arrayFinalTickets.push({
          ...arrayTickets[i],
          tipoPago: null,
          movimientos: null,
        });
        arrayFinalTickets[i].movimientos = [];

        for (let j = 0; j < arrayMovimientos.length; j++) {
          if (arrayTickets[i]._id === arrayMovimientos[j].idTicket) {
            arrayFinalTickets[i].movimientos.push(arrayMovimientos[j]);
          }
        }
      }

      for (let i = 0; i < arrayFinalTickets.length; i++) {
        arrayFinalTickets[i].tipoPago = this.calcularFormaPago(
          arrayFinalTickets[i]
        );
      }

      return arrayFinalTickets;
    }
    return null;
  };

  /* Eze 4.0 */
  public async getFormaPago(ticket: TicketsInterface) {
    const arrayMovimientos = await schMovimientos.getMovimientosDelTicket(
      ticket._id
    );
    if (arrayMovimientos?.length > 0) {
      return this.calcularFormaPago({
        ...ticket,
        movimientos: arrayMovimientos,
        tipoPago: null,
      });
    }
    return null;
  }

  /* Uri */
  public async getExtraData(ticket) {
    const arrayMovimientos = await schMovimientos.getMovimientosDelTicket(
      ticket
    );
    if (arrayMovimientos?.length > 0) {
      return arrayMovimientos[0].ExtraData;
    }
    return null;
  }

  /* Eze 4.0 */
  public calcularFormaPago(superTicket: SuperTicketInterface): FormaPago {
    if (superTicket.consumoPersonal) return "CONSUMO_PERSONAL";
    if (superTicket.datafono3G) return "DATAFONO_3G";
    if (superTicket.movimientos.length === 1) {
      if (superTicket.movimientos[0].tipo === "TARJETA") {
        if (superTicket.movimientos[0].valor < 0) {
          return "DEVUELTO";
        } else {
          return "TARJETA";
        }
      } else if (superTicket.movimientos[0].tipo === "TKRS_SIN_EXCESO") {
        if (superTicket.total > superTicket.movimientos[0].valor)
          return "TKRS + EFECTIVO";
        else return "TKRS";
      } else if (superTicket.movimientos[0].tipo === "DEUDA") {
        return "DEUDA";
      } else if (superTicket.movimientos[0].tipo === "SALIDA") {
        return "DEUDA";
      } else {
        throw Error("Forma de pago desconocida");
      }
    } else if (superTicket.movimientos.length === 0 && superTicket.total > 0) {
      return "EFECTIVO";
    } else if (superTicket.movimientos.length === 0 && superTicket.total < 0) {
      return "ANULADO";
    } else if (superTicket.movimientos.length === 2) {
      // CASO TARJETA ANULADA
      if (
        superTicket.movimientos[0].tipo === "TARJETA" &&
        superTicket.movimientos[1].tipo === "TARJETA"
      ) {
        const debeSerCero =
          superTicket.movimientos[0].valor + superTicket.movimientos[1].valor;
        if (debeSerCero === 0) return "DEVUELTO";
        return "ERROR_DETECTADO";
      } else {
        let tkrsSinExceso = false;
        let tkrsConExceso = false;
        let indexSinExceso = null;

        for (let i = 0; i < 2; i++) {
          if (superTicket.movimientos[i].tipo === "TKRS_SIN_EXCESO") {
            tkrsSinExceso = true;
            indexSinExceso = i;
          }

          if (superTicket.movimientos[i].tipo === "TKRS_CON_EXCESO")
            tkrsConExceso = true;
        }
        if (tkrsSinExceso && tkrsConExceso) {
          if (
            superTicket.movimientos[indexSinExceso].valor === superTicket.total
          )
            return "TKRS";
          else if (
            superTicket.movimientos[0].valor +
              superTicket.movimientos[1].valor <
            superTicket.total
          )
            return "TKRS + EFECTIVO";
        }
        throw Error(
          "2 movimientos que no son tarjeta y no se cumple con los requisitos del tkrs"
        );
      }
    }
  }
}

export const movimientosInstance = new MovimientosClase();
