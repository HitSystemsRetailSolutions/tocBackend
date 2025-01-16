import {
  CajaSincro,
  CajaAbiertaInterface,
  CajaCerradaInterface,
  MonedasInterface,
  TiposInfoMoneda,
} from "./caja.interface";
import * as schCajas from "./caja.mongodb";
import * as schTickets from "../tickets/tickets.mongodb";
import {
  SuperTicketInterface,
  TicketsInterface,
} from "../tickets/tickets.interface";
import { MovimientosInterface } from "../movimientos/movimientos.interface";
import { movimientosInstance } from "../movimientos/movimientos.clase";
import { ObjectId } from "mongodb";
import { logger } from "../logger";
import { impresoraInstance } from "../impresora/impresora.class";
import { io } from "../sockets.gateway";
import { cestasInstance } from "../cestas/cestas.clase";
import { trabajadoresInstance } from "src/trabajadores/trabajadores.clase";
import { parametrosInstance } from "src/parametros/parametros.clase";
import * as moment from "moment";
import { parametrosController } from "src/parametros/parametros.controller";
import { ticketsInstance } from "src/tickets/tickets.clase";
import { deudasInstance } from "src/deudas/deudas.clase";
import { redondearPrecio } from "src/funciones/funciones";
import { getDataVersion } from "src/version/version.clase";
require("dotenv").config();
const mqtt = require("mqtt");
export class CajaClase {
  private mqttOptions = {
    host: process.env.MQTT_HOST,
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD,
  };
  private client = mqtt.connect(this.mqttOptions);
  async mqttAbrirCaja(inicioTime: number) {
    try {
      const parametros = await parametrosInstance.getParametros();
      const date = this.formatoFechaISO8601(inicioTime);
      let ticketJSON = {
        Llicencia: parametros.codigoTienda,
        Empresa: parametros.database,
        tipus: "ObreCaixa",
        CaixaDataInici: date,
      };
      let url = `/Hit/Serveis/Contable/Licencia/Apertura`;

      // cuando se conecta enviamos los datos
      if (this.client.connected) {
        // Publica los datos
        this.client.publish(url, JSON.stringify(ticketJSON));
        this.client.on("error", (err) => {
          logger.Error("Error en el client MQTT obreCaixa:", err);
        });
      } else {
        // Si no está conectado, espera a que se conecte antes de publicar
        this.client.on("connect", () => {
          this.client.publish(url, JSON.stringify(ticketJSON));
        });
        this.client.on("error", (err) => {
          logger.Error("Error en el client MQTT obreCaixa:", err);
        });
      }
    } catch (error) {
      logger.Error(53.2, "Error en mqttAbrirCaja: " + error);
    }
  }
  formatoFechaISO8601(timestamp: number) {
    const fecha = new Date(timestamp);
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0"); // Sumar 1 al mes porque los meses van de 0 a 11
    const dia = String(fecha.getDate()).padStart(2, "0");
    const horas = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    const segundos = String(fecha.getSeconds()).padStart(2, "0");

    // Crear la cadena de fecha en el formato deseado
    const fechaFormateada = `${año}-${mes}-${dia}T${horas}:${minutos}:${segundos}.000Z`;
    return fechaFormateada;
  }
  postFichajesCaja = async (
    arrayTrabajadores: CajaAbiertaInterface["fichajes"]
  ) => await schCajas.postfichajesCaja(arrayTrabajadores);
  /* Eze 4.0 */
  getInfoCajaAbierta = async () => await schCajas.getInfoCajaAbierta();

  /* Eze 4.0 */
  async cajaAbierta(): Promise<boolean> {
    const infoCaja = await this.getInfoCajaAbierta();
    if (infoCaja) {
      if (infoCaja.inicioTime) return true;
    }
    return false;
  }

  /* Eze 4.0 */
  confirmarCajaEnviada = async (idCaja: CajaSincro["_id"]) =>
    await schCajas.confirmarCajaEnviada(idCaja);

  /* Eze 4.0 */
  getCajaSincroMasAntigua = async () =>
    await schCajas.getCajaSincroMasAntigua();

  /* Yasai :D */
  aumentarPropina = (propina: number) => {
    schCajas.aumentarPropina(propina);
  };

  /* Yasai :D */
  getPropina = async () => {
    return await schCajas.getPropina();
  };

  /* Eze 4.0 */
  async abrirCaja(cajaAbierta: CajaAbiertaInterface): Promise<boolean> {
    if (
      cajaAbierta.detalleApertura &&
      typeof cajaAbierta.totalApertura === "number"
    )
      return await schCajas.setInfoCaja(cajaAbierta);
    throw Error("Error precondiciones abrirCaja > caja.clase.ts");
  }

  /* Eze 4.0 */
  guardarMonedas = async (
    arrayMonedas: MonedasInterface["array"],
    cambioEmergencia: CajaCerradaInterface["cambioEmergenciaCierre"],
    tipo: TiposInfoMoneda
  ) => await schCajas.guardarMonedas(arrayMonedas, cambioEmergencia, tipo);

  /* Eze 4.0 */
  getMonedas = async (tipo: TiposInfoMoneda) => await schCajas.getMonedas(tipo);

  /* Eze 4.0 */
  nuevoItemSincroCajas(
    cajaAbierta: CajaAbiertaInterface,
    cajaCerrada: CajaCerradaInterface
  ) {
    const cajaInsertar: CajaSincro = {
      ...cajaAbierta,
      ...cajaCerrada,
      enviado: false,
      dataVersion: getDataVersion(),
    };
    cajaInsertar._id = new ObjectId();
    return schCajas.nuevoItemSincroCajas(cajaInsertar);
  }

  /* Eze 4.0 */
  async cerrarCaja(
    totalCierre: CajaCerradaInterface["totalCierre"],
    detalleCierre: CajaCerradaInterface["detalleCierre"],
    guardarInfoMonedas: MonedasInterface["array"],
    totalDatafono3G: CajaCerradaInterface["totalDatafono3G"],
    cantidadLocal3G: CajaCerradaInterface["cantidadLocal3G"],
    cantidadPaytef: CajaCerradaInterface["cantidadPaytef"],
    totalLocalPaytef: CajaCerradaInterface["totalLocalPaytef"],
    idDependientaCierre: CajaCerradaInterface["idDependientaCierre"],
    cierreAutomatico: boolean = true,
    totalHonei: number,
    cambioEmergenciaCierre: number
  ): Promise<boolean> {
    try {
      if (!(await this.cajaAbierta()))
        throw Error("Error al cerrar caja: La caja ya está cerrada");

      detalleCierre = detalleCierre.map((item) => {
        return {
          _id: item._id,
          valor: parseFloat(item.valor.toFixed(3)),
          unidades: item.unidades,
        };
      });
      //console.log(detalleCierre)
      parametrosInstance.setContadoDatafono(1, 0);
      const cajaAbiertaActual = await this.getInfoCajaAbierta();
      if (!cajaAbiertaActual)
        throw new Error("Error al obtener información de caja abierta");

      const totalDeudas = await deudasInstance.getTotalMoneyStandBy();
      if (totalDeudas == null)
        throw new Error("Error al obtener total de deudas");

      const inicioTurnoCaja = cajaAbiertaActual.inicioTime;
      const finalTime = await this.getFechaCierre(
        inicioTurnoCaja,
        cierreAutomatico
      );
      if (!finalTime) throw new Error("Error al obtener la fecha de cierre");
      const cajaCerradaActual = await this.getDatosCierre(
        cajaAbiertaActual,
        totalCierre,
        detalleCierre,
        idDependientaCierre,
        cantidadPaytef,
        totalLocalPaytef,
        cantidadLocal3G,
        totalDatafono3G,
        finalTime.time,
        totalHonei,
        // TODO: Propina
        await this.getPropina(),
        totalDeudas,
        Number(cambioEmergenciaCierre.toFixed(2))
      );
      if (!cajaCerradaActual)
        throw new Error("Error al obtener datos de cierre de caja actual");

      // Entra para calclular el cierre de caja que no se ha añadido al ser un cierre automático
      if (cierreAutomatico) {
        let cierreCaja = 0;
        // Si el descuadre es negativo, le falta el valor del cierre de caja
        // Si no entra, o la apertura era 0 o
        if (cajaCerradaActual.descuadre < 0) {
          cierreCaja = cajaCerradaActual.descuadre * -1;
          // Si el cierre es automático, el descuadre se le añade el total del cierre caja
          cajaCerradaActual.descuadre += cierreCaja;
          cajaCerradaActual.recaudado += cierreCaja;
        }
        // Se añade el cierre de caja al detalle de cierre
        cajaCerradaActual.detalleCierre[0].unidades +=
          Math.round(cierreCaja * 100 * 100) / 100;
        cajaCerradaActual.detalleCierre[0].valor += cierreCaja;
        guardarInfoMonedas[0] += cajaCerradaActual.detalleCierre[0].unidades;
      }
      if (
        await this.nuevoItemSincroCajas(cajaAbiertaActual, cajaCerradaActual)
      ) {
        const ultimaCaja = await this.getUltimoCierre();
        if (!ultimaCaja) throw new Error("Error al obtener último cierre");
        impresoraInstance.imprimirCajaAsync(ultimaCaja);
        if (await this.resetCajaAbierta()) {
          await cestasInstance.borrarCestas();
          if (!finalTime.estadoTurno) {
            io.emit("cargarVentas", []);
          }
          const res2 = await cajaInstance.guardarMonedas(
            guardarInfoMonedas,
            cambioEmergenciaCierre,
            "CLAUSURA"
          );
          if (!res2) {
            logger.Error(53.1, "Error al guardar monedas en mongodb");
          }
          return true;
        }
        throw Error("Error en resetCajaAbierta");
      }
      throw Error("Error en nuevoItemSincroCajas");
    } catch (error) {
      logger.Error(
        "Error en el proceso de cierre de caja:",
        error.message,
        error.stack
      );
      return false;
    }
  }

  /* Eze 4.0 */
  resetCajaAbierta = async () => await schCajas.resetCajaAbierta();

  /* Eze 4.0  */
  borrarCaja = async () => await schCajas.borrarCaja();

  /* Eze 4.0 */
  getUltimoCierre = async () => await schCajas.getUltimoCierre();

  getCambioDeTurno() {
    return schCajas
      .getCambioDeTurno()
      .then((res) => {
        return res;
      })
      .catch((err) => {
        logger.Error(150, err);
        return null;
      });
  }

  getAnularTurno() {
    return schCajas
      .getAnularTurno()
      .then((res) => {
        return res;
      })
      .catch((err) => {
        logger.Error(151, err);
        return null;
      });
  }
  getComprovarTurno() {
    return schCajas
      .getComprovarTurno()
      .then((res) => {
        return res;
      })
      .catch((err) => {
        logger.Error(152, err);
        return null;
      });
  }

  async getComprovarFechaCierreTurno() {
    try {
      const fecha = await schCajas.getComprovarTurno();
      if (fecha.estado) {
        await schCajas.getCambioDeTurno();
        return parseInt(fecha.time) + 1000;
      } else {
        return Date.now();
      }
    } catch (err) {
      logger.Error(157, err);
      return Date.now();
    }
  }

  getFechaCierre(
    inicioTime: CajaAbiertaInterface["inicioTime"],
    cierreAutomatico: boolean
  ) {
    let d;
    if (inicioTime && cierreAutomatico) {
      d = new Date(inicioTime);
    } else {
      d = new Date();
    }
    return schCajas.getComprovarTurno().then((res) => {
      if (res.estado) {
        return { time: res.time, estadoTurno: true };
      } else if (cierreAutomatico) {
        d.setHours(23, 59, 59);
        return { time: d.getTime(), estadoTurno: false };
      } else {
        return { time: d.getTime(), estadoTurno: false };
      }
    });
  }

  async getInicioTime() {
    return schCajas.getApeturaCaja().then(async (res) => {
      return moment(res.inicioTime).format("DD/M/YYYY HH:mm:ss");
    });
  }

  getFechaApertura() {
    return schCajas.getApeturaCaja().then(async (res) => {
      if (!res) return false;
      if ((await trabajadoresInstance.getTrabajadoresFichados()).length == 0)
        return false;
      const fechaApertura = new Date(res.inicioTime).toDateString();
      const fechaHoy = new Date().toDateString();
      let trabId = (await trabajadoresInstance.getTrabajadoresFichados())[0][
        "_id"
      ];

      if (trabId == undefined) trabId = 0;
      if (fechaHoy != fechaApertura) {
        // parametrosController.totalPaytef llama a paytefInstance.getRecuentoTotal que llama al server de paytef
        // solo hay que realizar la petición cuando se cierra caja por fecha (hoy!=apertura)
        const paytef = await parametrosController.totalPaytef();
        let totalPaytef = paytef[0] ? paytef[0] : 0;

        let totalLocalPaytef = await ticketsInstance.getTotalLocalPaytef();
        let totalDatafono3G = await ticketsInstance.getTotalDatafono3G(
          res.inicioTime,
          new Date()
        );
        let cantidadLocal3G = totalDatafono3G;
        await cajaInstance.cerrarCaja(
          0,
          [
            { _id: "0.01", valor: 0, unidades: 0 },
            { _id: "0.02", valor: 0, unidades: 0 },
            { _id: "0.05", valor: 0, unidades: 0 },
            { _id: "0.10", valor: 0, unidades: 0 },
            { _id: "0.20", valor: 0, unidades: 0 },
            { _id: "0.50", valor: 0, unidades: 0 },
            { _id: "1", valor: 0, unidades: 0 },
            { _id: "2", valor: 0, unidades: 0 },
            { _id: "5", valor: 0, unidades: 0 },
            { _id: "10", valor: 0, unidades: 0 },
            { _id: "20", valor: 0, unidades: 0 },
            { _id: "50", valor: 0, unidades: 0 },
            { _id: "100", valor: 0, unidades: 0 },
            { _id: "200", valor: 0, unidades: 0 },
            { _id: "500", valor: 0, unidades: 0 },
          ],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          totalDatafono3G,
          cantidadLocal3G,
          totalPaytef,
          totalLocalPaytef,
          trabId,
          true,
          await ticketsInstance.getTotalHonei(),
          0
        );
        return true;
      }
      return false;
    });
  }

  /* Eze 4.0 */
  async getDatosCierre(
    cajaAbiertaActual: CajaAbiertaInterface,
    totalCierre: CajaCerradaInterface["totalCierre"],
    detalleCierre: CajaCerradaInterface["detalleCierre"],
    idDependientaCierre: CajaCerradaInterface["idDependientaCierre"],
    cantidadPaytef: CajaCerradaInterface["cantidadPaytef"],
    totalLocalPaytef: CajaCerradaInterface["totalLocalPaytef"],
    cantidadLocal3G: CajaCerradaInterface["cantidadLocal3G"],
    totalDatafono3G: CajaCerradaInterface["totalDatafono3G"],
    finalTime: CajaCerradaInterface["finalTime"],
    totalHonei: number,
    propina: number,
    totalDeudas: CajaCerradaInterface["totalDeuda"],
    cambioEmergenciaCierre: CajaCerradaInterface["cambioEmergenciaCierre"]
  ): Promise<CajaCerradaInterface> {
    const arrayTicketsCaja: TicketsInterface[] =
      await schTickets.getTicketsIntervalo(
        cajaAbiertaActual.inicioTime,
        finalTime
      );
    const arrayMovimientos: MovimientosInterface[] =
      await movimientosInstance.getMovimientosIntervalo(
        cajaAbiertaActual.inicioTime,
        finalTime
      );

    let totalTickets = 0;
    let nClientes = 0;
    let nTickets = 0;
    let nClientesMesas = 0;

    // if (arrayTicketsCaja.length <= 0)
    // throw Error("No hay tickets en esta caja");

    let totalTarjeta = 0;
    let totalEfectivo = 0;
    let totalSalidas = 0;
    let totalEntradas = 0;
    let recaudado = 0;
    let totalDeuda = 0;
    let totalTkrsConExceso = 0;
    let totalTkrsSinExceso = 0;
    let totalEntregaDiaria = 0;
    let totalEntradaDinero = 0;
    let totalConsumoPersonal = 0;
    let entradasAlbaran = 0;
    let salidasAlbaran = 0;
    /* RECUERDA QUE SE DEBE HACER UN MOVIMIENTO DE SALIDA PARA LA CANTIDAD 3G ANTES DE CERRAR LA CAJA, EN ESTE MOMENTO NO SE HACE */
    for (let i = 0; i < arrayMovimientos.length; i++) {
      switch (arrayMovimientos[i].tipo) {
        // case "EFECTIVO":
        //   totalEntradas += arrayMovimientos[i].valor;
        //   totalEfectivo += arrayMovimientos[i].valor;
        //   break;
        case "TKRS_CON_EXCESO":
          totalTkrsConExceso += arrayMovimientos[i].valor;
          break;
        case "TKRS_SIN_EXCESO":
          totalSalidas += arrayMovimientos[i].valor;
          totalTkrsSinExceso += arrayMovimientos[i].valor;
          break;
        case "DEUDA":
          totalSalidas += arrayMovimientos[i].valor;
          totalDeuda += arrayMovimientos[i].valor;
          break;
        case "ENTREGA_DIARIA":
          totalSalidas += arrayMovimientos[i].valor;
          totalEntregaDiaria += arrayMovimientos[i].valor;
          break;
        case "ENTRADA_DINERO":
          if (
            arrayMovimientos[i].concepto == "DEUDA ALBARAN" ||
            arrayMovimientos[i].concepto == "Albara"
          ) {
            entradasAlbaran += arrayMovimientos[i].valor;
          }
          totalEntradas += arrayMovimientos[i].valor;
          totalEntradaDinero += arrayMovimientos[i].valor;
          break;
        case "DATAFONO_3G":
          totalTarjeta += arrayMovimientos[i].valor;
          break;
        case "DEV_DATAFONO_3G":
          totalTarjeta -= arrayMovimientos[i].valor;
        case "SALIDA":
          if (
            arrayMovimientos[i].concepto === "DEUDA ALBARAN" ||
            arrayMovimientos[i].concepto === "DEUDA ALBARAN ANULADO"
          ) {
            salidasAlbaran += arrayMovimientos[i].valor;
          }
          totalSalidas += arrayMovimientos[i].valor;
          break;
        case "TARJETA":
        case "DEV_DATAFONO_PAYTEF":
          break;
        default:
          logger.Error(51, "Error, tipo de movimiento desconocido");
      }
    }

    // totalAlbaranes
    const totalAlbaranes = Number(
      (entradasAlbaran - salidasAlbaran).toFixed(2)
    );

    // totalEfectivo -= totalDatafono3G;

    // ESTO SERÁ PARA CALCULAR EL DESCUADRE
    for (let i = 0; i < arrayTicketsCaja.length; i++) {
      nTickets++;
      if (arrayTicketsCaja[i].cesta?.indexMesa != null) {
        let n = arrayTicketsCaja[i].cesta?.comensales;
        if (n <= 0) n = 1;
        nClientesMesas += n;
      } else {
        nClientes++;
      }
      totalTickets += arrayTicketsCaja[i].total;
    }

    /*const descuadre =
      Math.round(
        (totalCierre -
          cajaAbiertaActual.totalApertura +
          totalSalidas -
          totalEntradaDinero -
          totalTickets +
          totalDatafono3G) *
          100
      ) / 100;-*/

    // comprueba valor totalDatafono3G calculado en el frontend y el totalTarjeta (datafono3G)
    // calculado en el backend si des del frontend da 0 pero en el backend no, ha habido un mal cálculo en el frontend
    // y se le añade el valor de totaltarjeta
    totalDatafono3G =
      totalDatafono3G == 0 && totalTarjeta != 0
        ? totalTarjeta
        : totalDatafono3G;
    // se calcula el descuadre
    const descuadre = Number(
      (cajaAbiertaActual.totalApertura +
        totalTickets +
        totalEntradaDinero -
        (totalDatafono3G +
          totalSalidas +
          totalCierre +
          cantidadPaytef +
          totalHonei)) *
        -1
    );
    recaudado = totalTickets + descuadre;
    let mediaTickets = 0;
    if (nTickets !== 0) {
      mediaTickets = totalTickets / nTickets;
    }
    return {
      calaixFetZ: Number(totalTickets.toFixed(2)),
      primerTicket:
        arrayTicketsCaja[0]?._id == undefined ? -1 : arrayTicketsCaja[0]._id,
      ultimoTicket:
        arrayTicketsCaja[arrayTicketsCaja.length - 1]?._id == undefined
          ? -1
          : arrayTicketsCaja[arrayTicketsCaja.length - 1]._id,
      descuadre: this.redondeoNoIntegrado(descuadre),
      detalleCierre,
      finalTime,
      idDependientaCierre,
      nClientes,
      nClientesMesas,
      recaudado: this.redondeoNoIntegrado(recaudado),
      totalCierre: this.redondeoNoIntegrado(totalCierre),
      totalDatafono3G: this.redondeoNoIntegrado(totalDatafono3G),
      totalDeudas: this.redondeoNoIntegrado(totalDeudas),
      totalAlbaranes,
      cantidadPaytef: this.redondeoNoIntegrado(cantidadPaytef),
      totalLocalPaytef: this.redondeoNoIntegrado(totalLocalPaytef),
      cantidadLocal3G: this.redondeoNoIntegrado(cantidadLocal3G),
      totalDeuda: this.redondeoNoIntegrado(totalDeuda),
      totalEfectivo: this.redondeoNoIntegrado(totalEfectivo),
      totalEntradas: this.redondeoNoIntegrado(totalEntradas),
      totalSalidas: this.redondeoNoIntegrado(totalSalidas),
      totalTarjeta: this.redondeoNoIntegrado(totalTarjeta),
      totalTkrsConExceso: this.redondeoNoIntegrado(totalTkrsConExceso),
      totalTkrsSinExceso: this.redondeoNoIntegrado(totalTkrsSinExceso),
      mediaTickets: this.redondeoNoIntegrado(mediaTickets),
      totalHonei: this.redondeoNoIntegrado(totalHonei),
      propina: this.redondeoNoIntegrado(propina),
      cambioEmergenciaCierre,
    };
  }

  private redondeoNoIntegrado(valor: number): number {
    return valor % 1 === 0 ? valor : Number(valor.toFixed(2));
  }
  setCambioEmActual = async (valor) => await schCajas.setCambioEmActual(valor);
  getCambioEmActual = async () => await schCajas.getCambioEmActual();
  setDetalleActual = async (detalleActual) =>
    await schCajas.setDetalleActual(detalleActual);

  getDetalleActual = async () => await schCajas.getDetalleActual();

  /**
   *  obtiene los datos de las cajas de un intervalo de tiempo y devuelve los datos agrupados por días
   * @param fechaInicio
   * @param fechaFin
   * @returns  array {Fecha: string, "Total tarjeta": number, "Total efectivo": number, Total: number}
   */
  async getTotalsIntervalo(fechaInicio: number, fechaFin: number) {
    const arrayCajas: CajaSincro[] = await schCajas.getTotalsIntervalo(
      fechaInicio,
      fechaFin
    );

    const groupByDays = this.groupByDays(arrayCajas);
    const latestDate = this.findLatestDateInGroupedData(groupByDays);
    const arrayTicketsCaja: SuperTicketInterface[] =
      await movimientosInstance.construirArrayVentas();

    const totalTickets = arrayTicketsCaja.reduce(
      (total, ticket) => total + ticket.total,
      0
    );
    const totalPaytef = await parametrosController.totalPaytef();
    const inicioTime = (await cajaInstance.getInfoCajaAbierta()).inicioTime;
    const finalTime = Date.now();
    const total3G = await ticketsInstance.getTotalDatafono3G(
      inicioTime,
      finalTime
    );

    const formattedTotalTarjeta = redondearPrecio(totalPaytef[0] + total3G);
    const formattedTotalEfectivo = redondearPrecio(
      totalTickets - totalPaytef[0]
    );

    const objTotal = {
      id: inicioTime,
      total: totalTickets,
      totalTarjeta: formattedTotalTarjeta,
      totalEfectivo: formattedTotalEfectivo,
    };

    const formattedDate = new Date(inicioTime).toISOString().split("T")[0];

    if (latestDate === formattedDate) {
      groupByDays[latestDate].push(objTotal);
    } else {
      groupByDays[formattedDate] = [objTotal];
    }

    return this.convertGroupedData(groupByDays);
  }

  /**
   * encuentra la fecha más reciente en un objeto de datos agrupados
   * @param groupedData
   * @returns string, fecha más reciente
   */
  private findLatestDateInGroupedData(groupedData) {
    if (!groupedData) {
      return null;
    }
    const dates = Object.keys(groupedData);
    const latestDate = dates.reduce((latest, current) => {
      return new Date(current) > new Date(latest) ? current : latest;
    });
    return latestDate;
  }
  /**
   *  agrupa los datos por días
   * @param array
   * @returns
   */
  private groupByDays(array: CajaSincro[]) {
    if (!array) {
      return {};
    }
    return array.reduce((acc, obj) => {
      const date = new Date(obj.inicioTime).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      const totalTarjeta = redondearPrecio(
        obj.cantidadPaytef + obj.totalDatafono3G
      );
      const totalEfectivo = redondearPrecio(obj.calaixFetZ - totalTarjeta);
      acc[date].push({
        id: obj._id,
        total: obj.calaixFetZ,
        totalTarjeta: totalTarjeta,
        totalEfectivo: totalEfectivo,
      });
      return acc;
    }, {});
  }

  /**
   *  cambia el formato de los datos agrupados para que se puedan mostrar en la tabl del frontend
   * @param groupedData
   * @returns array {Fecha: string, "Total tarjeta": number, "Total efectivo": number, Total: number}
   */
  private convertGroupedData(groupedData) {
    if (!groupedData) {
      return [];
    }
    return Object.keys(groupedData).map((date) => {
      const dayItems = groupedData[date];
      const totalTarjeta = dayItems.reduce(
        (sum, item) => sum + item.totalTarjeta,
        0
      );
      const totalEfectivo = dayItems.reduce(
        (sum, item) => sum + item.totalEfectivo,
        0
      );
      const total = dayItems.reduce((sum, item) => sum + item.total, 0);
      return {
        Fecha: date,
        "Total tarjeta": redondearPrecio(totalTarjeta),
        "Total efectivo": redondearPrecio(totalEfectivo),
        Total: redondearPrecio(total),
      };
    });
  }
}

export const cajaInstance = new CajaClase();
