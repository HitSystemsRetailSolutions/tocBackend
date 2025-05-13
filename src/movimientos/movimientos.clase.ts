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
import { CajaAbiertaInterface } from "src/caja/caja.interface";
import { clienteInstance } from "src/clientes/clientes.clase";
import { deudasInstance } from "src/deudas/deudas.clase";
import { AlbaranesInstance } from "src/albaranes/albaranes.clase";
import { reenviarTicket, reenviarTicketPago } from "src/sincro";
import { getDataVersion } from "src/version/version.clase";

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
  getSalidasIntervalo = (
    horaApertura: CajaAbiertaInterface["inicioTime"],
    final: number
  ) => schMovimientos.getSalidasIntervalo(horaApertura, final);
  getEntradasIntervalo = (
    horaApertura: CajaAbiertaInterface["inicioTime"],
    final: number
  ) => schMovimientos.getEntradasIntervalo(horaApertura, final);
  /* Eze v23 */
  getMovimientosIntervalo = (inicioTime: number, finalTime: number) =>
    schMovimientos.getMovimientosIntervalo(inicioTime, finalTime);

  getMovTkrsSinExcIntervalo = async (inicioTime: number, finalTime: number) =>
    await schMovimientos.getMovTkrsSinExcIntervalo(inicioTime, finalTime);
  getDat3GDeudaPagada = async (inicioTime: number, finalTime: number) =>
    await schMovimientos.getDat3GDeudaPagada(inicioTime, finalTime);

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
    nombreCliente?: MovimientosInterface["nombreCliente"],
    ExtraData: MovimientosInterface["ExtraData"] = []
  ) {
    let codigoBarras = "";
    // if (concepto === "Entrega Diària" || concepto === "Entrada") {
    codigoBarras = await this.generarCodigoBarrasSalida();
    codigoBarras = String(Ean13Utils.generate(codigoBarras));
    // }
    const nuevoMovimiento: MovimientosInterface = {
      _id: Date.now(),
      codigoBarras,
      concepto,
      enviado: false,
      idTicket,
      idTrabajador,
      tipo,
      valor: this.redondeoNoIntegrado(valor),
      nombreCliente,
      ExtraData,
    };
    if (tipo === "TARJETA")
      if (await schMovimientos.existeMovimiento(idTicket, valor)) return false;
    if (await schMovimientos.nuevoMovimiento(nuevoMovimiento)) {
      if (idTicket) {
        // Se pone el ticket en no enviado para reenviar el ticket a santaAna con el nuevo tipoPago
        const ticketMDB = await ticketsInstance.getTicketById(idTicket);
        if (ticketMDB && ticketMDB.enviado) {
          reenviarTicketPago(idTicket);
        } else if (!ticketMDB) {
          logger.Info(
            "No existe el ticket " +
              idTicket +
              " en local, mov creado pero no hará upd en campootros de 'v_venut'"
          );
          // si no existe el ticket en local, posblemente sea una deuda antigua
        }
      }
      if (tipo === "ENTRADA_DINERO" && concepto != "DEUDA") {
        impresoraInstance.imprimirEntrada(nuevoMovimiento);
      } else if (concepto == "DEUDA" && tipo === "ENTRADA_DINERO") {
        impresoraInstance.imprimirDeuda(nuevoMovimiento, nombreCliente);
      } else if (concepto == "DEUDA" && tipo === "SALIDA") {
        await this.imprimirDeudaSalida(nuevoMovimiento, idTicket);
      } else if (tipo === "DATAFONO_3G") {
        await this.imprimirMov3G(nuevoMovimiento, idTicket);
      } else if (
        concepto !== "Targeta" &&
        concepto !== "DEUDA" &&
        concepto !== "dejaACuenta" &&
        concepto !== "Albaran" &&
        concepto !== "Paytef" &&
        tipo !== "DEV_DATAFONO_PAYTEF" &&
        tipo !== "DEV_DATAFONO_3G"
      ) {
        impresoraInstance.imprimirSalida(nuevoMovimiento);
      }
      return true;
    }
    return false;
  }
  // creacion de mov, añadiendo el param _id y sin imprimir
  public async nuevoMovimientoForDeudas(
    _id: MovimientosInterface["_id"],
    valor: MovimientosInterface["valor"],
    concepto: MovimientosInterface["concepto"],
    tipo: MovimientosInterface["tipo"],
    idTicket: MovimientosInterface["idTicket"],
    idTrabajador: MovimientosInterface["idTrabajador"],
    nombreCliente?: MovimientosInterface["nombreCliente"],
    ExtraData: MovimientosInterface["ExtraData"] = []
  ) {
    let codigoBarras = "";
    // if (concepto === "Entrega Diària" || concepto === "Entrada") {
    codigoBarras = await this.generarCodigoBarrasSalida();
    codigoBarras = String(Ean13Utils.generate(codigoBarras));
    // }
    const nuevoMovimiento: MovimientosInterface = {
      _id: _id,
      codigoBarras,
      concepto,
      enviado: false,
      idTicket,
      idTrabajador,
      tipo,
      valor: this.redondeoNoIntegrado(valor),
      nombreCliente,
      ExtraData,
    };

    if (await schMovimientos.nuevoMovimiento(nuevoMovimiento)) {
      if (idTicket) {
        // Se pone el ticket en no enviado para reenviar el ticket a santaAna con el nuevo tipoPago
        const ticketMDB = await ticketsInstance.getTicketById(idTicket);
        if (ticketMDB && ticketMDB.enviado) {
          reenviarTicketPago(idTicket);
        } else if (!ticketMDB) {
          logger.Info(
            "No existe el ticket " +
              idTicket +
              " en local, mov creado pero no hará upd en campootros de 'v_venut'"
          );
          // si no existe el ticket en local, posblemente sea una deuda antigua
        }
      }
      return true;
    }
    return false;
  }
  async imprimirMov3G(nuevoMovimiento: MovimientosInterface, idTicket: number) {
    try {
      const ticket = await ticketsInstance.getTicketById(idTicket);
      const client = await clienteInstance.getClienteById(ticket.idCliente);
      let nombreCliente = client ? client.nombre : null;
      impresoraInstance.imprimirMov3G(nuevoMovimiento, nombreCliente);
    } catch (error) {
      logger.Error(211, error.message);
    }
  }
  async imprimirDeudaSalida(
    nuevoMovimiento: MovimientosInterface,
    idTicket: number
  ) {
    try {
      let ticketInfo = await ticketsInstance.getTicketById(idTicket);
      let client = await clienteInstance.getClienteById(ticketInfo.idCliente);
      impresoraInstance.imprimirDeudaSalida(nuevoMovimiento, client.nombre);
    } catch (error) {
      try {
        const albaranInfo = await AlbaranesInstance.getAlbaranById(idTicket);
        const client = await clienteInstance.getClienteById(
          albaranInfo.idCliente
        );
        impresoraInstance.imprimirDeudaSalida(nuevoMovimiento, client.nombre);
      } catch (innerError) {
        console.error("Error al obtener información del albarán:", innerError);
        // Puedes decidir cómo manejar este error, lanzar una excepción o hacer algo más.
      }
    }
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
      dataVersion: getDataVersion(),
    };

    if (await schMovimientos.nuevoMovimiento(nuevoMovimiento)) {
      return true;
    }
    return false;
  }

  /* Eze 4.0 */
  public async generarCodigoBarrasSalida(): Promise<string> {
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
  getMovimientosDelTicket = (idTicket: number) =>
    schMovimientos.getMovimientosDelTicket(idTicket);
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
        arrayFinalTickets[i].tipoPago = await this.calcularFormaPago(
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
      if (
        arrayMovimientos[0].tipo === "TARJETA" ||
        arrayMovimientos[0].tipo === "DEV_DATAFONO_PAYTEF"
      ) {
        return "TARJETA";
      } else if (
        arrayMovimientos[0].tipo === "DATAFONO_3G" ||
        arrayMovimientos[0].tipo === "DEV_DATAFONO_3G"
      ) {
        return "DATAFONO_3G";
      }
    } else if (ticket.consumoPersonal) {
      return "CONSUMO_PERSONAL";
    }
    return "EFECTIVO";
  }

  /* Uri */
  public async getExtraData(ticket) {
    const arrayMovimientos =
      await schMovimientos.getMovimientosDelTicket(ticket);
    if (arrayMovimientos?.length > 0) {
      return arrayMovimientos[0].ExtraData;
    }
    return null;
  }

  /* Uri */
  public async getMovimentOfTicket(ticket) {
    const arrayMovimientos =
      await schMovimientos.getMovimientosDelTicket(ticket);
    if (arrayMovimientos?.length > 0) {
      return arrayMovimientos[0];
    }
    return null;
  }

  public async payWithCash(idTicket: TicketsInterface["_id"]) {
    let movimiento = await this.getMovimentOfTicket(idTicket);
    movimiento.valor = movimiento.valor * -1;
    movimiento._id = Date.now();

    if (await schMovimientos.nuevoMovimiento(movimiento)) {
      const ticket = await ticketsInstance.getTicketById(idTicket);
      if (ticket && ticket.enviado) {
        reenviarTicketPago(idTicket);
      }
      return true;
    }
    return false;
  }

  public async PayWith3G(idTicket: TicketsInterface["_id"]) {
    let movimiento = await this.getMovimentOfTicket(idTicket);
    if (movimiento) {
      if (movimiento.valor < 0) movimiento.valor = movimiento.valor * -1;
      movimiento._id = Date.now();
      if (await schMovimientos.nuevoMovimiento(movimiento)) {
        const ticket = await ticketsInstance.getTicketById(idTicket);
        if (ticket && ticket.enviado) {
          reenviarTicketPago(idTicket);
        }
        return true;
      }
    } else {
      let ticket = await ticketsInstance.getTicketById(idTicket);
      let nuevoMovimiento: MovimientosInterface = {
        _id: Date.now(),
        codigoBarras: "",
        concepto: "",
        enviado: false,
        idTicket,
        idTrabajador: ticket.idTrabajador,
        tipo: "DATAFONO_3G",
        valor: ticket.total,
        ExtraData: [],
      };
      if (await schMovimientos.nuevoMovimiento(nuevoMovimiento)) {
        ticketsInstance.setTicketEnviado(idTicket, false);
        return true;
      }
    }
    return false;
  }

  public async comprobarDeudaParcial(superTicket: SuperTicketInterface) {
    const total = superTicket.total;
    // devolver el valor de movimientos con concepto dejaACuentaDeuda

    const montosParciales = superTicket.movimientos.filter(
      (mov) => mov.tipo === "ENTRADA_DINERO" && mov.concepto === "DEUDA"
    );
    let totalParcial = montosParciales.reduce((acc, mov) => acc + mov.valor, 0);
    totalParcial = totalParcial;
    if (totalParcial < total) {
      return "DEUDA";
    } else {
      return "EFECTIVO";
    }
  }
  // funcion con muchas comprobaciones para calcular el tipo de pago en el ticket, se puede simplificar
  /* Eze 4.0 */
  public async calcularFormaPago(
    superTicket: SuperTicketInterface
  ): Promise<FormaPago> {
    // let movTicket = (await this.getMovimentOfTicket(superTicket._id)) || null;
    try {
      const coincidenciasDeuda = superTicket.movimientos.filter(
        (movimiento) =>
          movimiento.concepto === "DEUDA" &&
          movimiento.tipo === "ENTRADA_DINERO"
      );
      if (coincidenciasDeuda.length > 1) {
        return this.comprobarDeudaParcial(superTicket);
      }
      if (superTicket.honei) {
        const todoHonei = superTicket.cesta.lista.every((art) => art.pagado);
        switch (true) {
          case superTicket.movimientos?.[0]?.tipo === "TARJETA":
            return "HONEI + TARJETA";
          case superTicket.movimientos?.[0]?.tipo === "DATAFONO_3G":
            return "HONEI + DATAFONO_3G";
          case !todoHonei:
            return "HONEI + EFECTIVO";
          default:
            return "HONEI";
        }
      }
      if (superTicket.consumoPersonal) return "CONSUMO_PERSONAL";
      if (superTicket.paytef)
        if (superTicket.total < 0) {
          return "DEVUELTO";
        } else {
          return "TARJETA";
        }
      if (superTicket.movimientos.length === 1) {
        if (superTicket.movimientos[0].tipo === "TARJETA") {
          if (superTicket.movimientos[0].valor < 0) {
            return "DEVUELTO";
          } else {
            return "TARJETA";
          }
        } else if (superTicket.movimientos[0].tipo === "DEV_DATAFONO_PAYTEF") {
          return "DEV_DATAFONO_PAYTEF";
        } else if (superTicket.movimientos[0].tipo === "DEV_DATAFONO_3G") {
          return "DEV_DATAFONO_3G";
        } else if (superTicket.movimientos[0].tipo === "TKRS_SIN_EXCESO") {
          if (
            superTicket.total > superTicket.movimientos[0].valor &&
            !superTicket.datafono3G
          )
            return "TKRS + EFECTIVO";
          else if (
            superTicket.total > superTicket.movimientos[0].valor &&
            superTicket.datafono3G
          )
            return "TKRS + DATAFONO_3G";
          else return "TKRS";
        } else if (superTicket.movimientos[0].tipo === "DEUDA") {
          return "DEUDA";
        } else if (
          superTicket.movimientos[0].tipo === "SALIDA" &&
          superTicket.cesta.modo !== "RECOGER ENCARGO"
        ) {
          return "DEUDA";
        } else if (superTicket.movimientos[0].tipo === "DATAFONO_3G") {
          return "DATAFONO_3G";
        } else {
          return "EFECTIVO";
          throw Error("Forma de pago desconocida");
        }
      } else if (
        superTicket.movimientos.length === 0 &&
        superTicket.total > 0
      ) {
        return "EFECTIVO";
      } else if (
        superTicket.movimientos.length === 0 &&
        superTicket.total < 0
      ) {
        return "ANULADO";
      } else if (
        // CASO DEUDA PAGADA con 5 movs (1 es de dejaCuenta)
        superTicket.movimientos.length === 5
      ) {
        if (
          superTicket.movimientos.filter((e) => e.tipo === "SALIDA").length >
            0 &&
          superTicket.movimientos.filter((e) => e.tipo === "TKRS_SIN_EXCESO")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "DATAFONO_3G")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "ENTRADA_DINERO")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "ENTRADA_DINERO")
            .length > 0
        )
          return "TKRS + DATAFONO_3G";
        if (
          superTicket.movimientos.filter((e) => e.tipo === "SALIDA").length >
            0 &&
          superTicket.movimientos.filter((e) => e.tipo === "TKRS_SIN_EXCESO")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "TKRS_CON_EXCESO")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "ENTRADA_DINERO")
            .length > 1
        )
          return "TKRS";
      } else if (
        // CASO DEUDA/DEUDA PAGADA con 4 movs
        superTicket.movimientos.length == 4
      ) {
        if (
          superTicket.movimientos.filter((e) => e.tipo === "SALIDA").length >
            0 &&
          superTicket.movimientos.filter((e) => e.tipo === "TKRS_SIN_EXCESO")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "DATAFONO_3G")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "ENTRADA_DINERO")
            .length > 0
        )
          return "TKRS + DATAFONO_3G";
        if (
          superTicket.movimientos.filter((e) => e.tipo === "SALIDA").length >
            0 &&
          superTicket.movimientos.filter((e) => e.tipo === "TKRS_SIN_EXCESO")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "TKRS_CON_EXCESO")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "ENTRADA_DINERO")
            .length > 0
        )
          return "TKRS";
        if (
          superTicket.movimientos.filter((e) => e.tipo === "SALIDA").length >
            0 &&
          superTicket.movimientos.filter((e) => e.tipo === "ENTRADA_DINERO")
            .length > 1 &&
          superTicket.movimientos.filter((e) => e.tipo === "TARJETA").length > 0
        )
          return "TARJETA";
        if (
          superTicket.movimientos.filter((e) => e.tipo === "SALIDA").length >
            0 &&
          superTicket.movimientos.filter((e) => e.tipo === "DATAFONO_3G")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "SALIDA").length >
            0 &&
          superTicket.movimientos.filter((e) => e.tipo === "ENTRADA_DINERO")
            .length > 0
        )
          return "DATAFONO_3G";
        if (
          superTicket.movimientos.filter((e) => e.tipo === "SALIDA").length >
            0 &&
          superTicket.movimientos.filter((e) => e.tipo === "TKRS_SIN_EXCESO")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "ENTRADA_DINERO")
            .length > 1
        ) {
          if (
            superTicket.movimientos.filter(
              (e) => e.tipo === "TKRS_SIN_EXCESO"
            )[0].valor === superTicket.total
          )
            return "TKRS";
          else if (
            superTicket.movimientos.filter(
              (e) => e.tipo === "TKRS_SIN_EXCESO"
            )[0].valor < superTicket.total
          )
            return "TKRS + EFECTIVO";
        }
      } else if (
        // CASO DEUDA PAGADA con 3 movs
        superTicket.movimientos.length == 3
      ) {
        // caso deuda pagada con tarjeta
        if (
          superTicket.movimientos.filter((e) => e.tipo === "SALIDA").length >
            0 &&
          superTicket.movimientos.filter((e) => e.tipo === "ENTRADA_DINERO")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "TARJETA").length > 0
        )
          return "TARJETA";
        if (
          superTicket.movimientos.filter((e) => e.tipo === "SALIDA").length >
            0 &&
          superTicket.movimientos.filter((e) => e.tipo === "DATAFONO_3G")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "SALIDA").length > 0
        )
          return "DATAFONO_3G";
        if (
          superTicket.movimientos.filter((e) => e.tipo === "SALIDA").length >
            0 &&
          superTicket.movimientos.filter((e) => e.tipo === "TKRS_SIN_EXCESO")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "ENTRADA_DINERO")
            .length > 0
        ) {
          if (
            superTicket.movimientos.filter(
              (e) => e.tipo === "TKRS_SIN_EXCESO"
            )[0].valor === superTicket.total
          )
            return "TKRS";
          else if (
            superTicket.movimientos.filter(
              (e) => e.tipo === "TKRS_SIN_EXCESO"
            )[0].valor < superTicket.total
          )
            return "TKRS + EFECTIVO";
        }
        if (
          superTicket.movimientos.filter((e) => e.tipo === "ENTRADA_DINERO")
            .length > 1 &&
          superTicket.movimientos.filter((e) => e.tipo === "SALIDA").length >
            0 &&
          superTicket.movimientos.filter(
            (e) => e.concepto === "dejaACuentaDeuda"
          ).length > 0
        ) {
          return "EFECTIVO";
        }
      } else if (superTicket.movimientos.length > 1) {
        
        // caso encargo con dejaACuentaSobrante (en principio, solo es posible este concepto  en efectivo)
        if (
          superTicket.cesta.modo == "RECOGER ENCARGO" &&
          (superTicket.movimientos[0].concepto === "dejaACuentaSobrante" ||
            superTicket.movimientos[1].concepto === "dejaACuentaSobrante")
        ) {
          return "EFECTIVO";
        }
        // CASO TARJETA ANULADA
        if (
          superTicket.movimientos[0].tipo === "TARJETA" &&
          superTicket.movimientos[1].tipo === "TARJETA"
        ) {
          const debeSerCero =
            superTicket.movimientos[0].valor + superTicket.movimientos[1].valor;
          if (debeSerCero === 0) return "DEVUELTO";
          return "ERROR_DETECTADO";
        } else if (
          superTicket.movimientos[0].tipo === "SALIDA" &&
          superTicket.movimientos[1].tipo === "ENTRADA_DINERO"
        ) {
          if (superTicket.movimientos[1].concepto === "dejaACuentaDeuda")
            return "DEUDA";
          // CASO DEUDA PAGADA
          const debeSerCero =
            superTicket.movimientos[0].valor - superTicket.movimientos[1].valor;
          if (debeSerCero === 0) return "EFECTIVO";
          return "ERROR_DETECTADO";
        }
        if (
          superTicket.movimientos.filter((e) => e.tipo === "DATAFONO_3G")
            .length > 0 &&
          superTicket.movimientos.filter((e) => e.tipo === "TKRS_SIN_EXCESO")
            .length > 0
        )
          return "TKRS + DATAFONO_3G";
        if (
          superTicket.movimientos.filter((e) => e.tipo === "DEV_DATAFONO_3G")
            .length > 0
        )
          return "DEV_DATAFONO_3G";
        if (
          superTicket.movimientos.filter((e) => e.tipo === "DATAFONO_3G")
            .length === superTicket.movimientos.length
        ) {
          if (
            superTicket.movimientos.filter((e) => e.tipo === "DATAFONO_3G")
              .length %
              2 ===
            0
          )
            return "EFECTIVO";
          else return "DATAFONO_3G";
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
              superTicket.movimientos[indexSinExceso].valor ===
              superTicket.total
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
      const allDatafono3G = superTicket.movimientos.every(
        (mov) => mov.tipo === "DATAFONO_3G"
      );
      if (allDatafono3G) {
        const allSum = superTicket.movimientos.reduce(
          (acc, mov) => acc + mov.valor,
          0
        );

        if (allSum === 0) {
          return "EFECTIVO";
        } else {
          return "DATAFONO_3G";
        }
      }
      throw Error("Forma de pago desconocida idTicket: " + superTicket._id);
    } catch (error) {
      console.log("Error en calcularFormaPago", error);
      logger.Error(211, error);
      return "ERROR_DETECTADO";
    }
  }
  private redondeoNoIntegrado(valor: number): number {
    return valor % 1 === 0 ? valor : Number(valor.toFixed(2));
  }
  getMovsDatafono3G = async (inicioTime: number, finalTime: number) =>
    await schMovimientos.getMovsDatafono3G(inicioTime, finalTime);

  async verifyCurrentBoxEntregaDiaria() {
    const infoCaja = await cajaInstance.getInfoCajaAbierta();
    if (infoCaja) {
      const inicioCaja = infoCaja.inicioTime;
      const final = Date.now();
      const movimientos = await this.getMovimientosIntervalo(inicioCaja, final);
      if (movimientos.length > 0) {
        const findEntregaDiaria = movimientos.find(
          (mov) => mov.concepto === "Entrega Diària"
        );
        if (findEntregaDiaria) {
          return true;
        }
      }
    }
    return false;
  }
}

export const movimientosInstance = new MovimientosClase();
