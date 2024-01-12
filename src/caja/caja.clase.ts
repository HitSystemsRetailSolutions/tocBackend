import {
  CajaSincro,
  CajaAbiertaInterface,
  CajaCerradaInterface,
  MonedasInterface,
  TiposInfoMoneda,
} from "./caja.interface";
import * as schCajas from "./caja.mongodb";
import * as schTickets from "../tickets/tickets.mongodb";
import { TicketsInterface } from "../tickets/tickets.interface";
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

export class CajaClase {
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
    if (!(await this.cajaAbierta()))
      throw Error("Error al cerrar caja: La caja ya está cerrada");

    cestasInstance.actualizarCestas();
    parametrosInstance.setContadoDatafono(1, 0);
    const cajaAbiertaActual = await this.getInfoCajaAbierta();
    const totalDeudas = await deudasInstance.getTotalMoneyStandBy();
    const inicioTurnoCaja = cajaAbiertaActual.inicioTime;
    const finalTime = await this.getFechaCierre(
      inicioTurnoCaja,
      cierreAutomatico
    );
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
    if (await this.nuevoItemSincroCajas(cajaAbiertaActual, cajaCerradaActual)) {
      const ultimaCaja = await this.getUltimoCierre();
      impresoraInstance.imprimirCajaAsync(ultimaCaja);
      if (await this.resetCajaAbierta()) {
        if (!finalTime.estadoTurno) {
          io.emit("cargarVentas", []);
        }
        cajaInstance
          .guardarMonedas(
            guardarInfoMonedas,
            cambioEmergenciaCierre,
            "CLAUSURA"
          )
          .then((res2) => {
            if (res2) {
              return true;
            }
            return false;
          });
        return true;
      }
    }
    return false;
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

  getComprovarFechaCierreTurno() {
    return schCajas.getComprovarTurno().then((res) => {
      if (res.estado == true) {
        schCajas.getCambioDeTurno().then((res2) => {});
        return parseInt(res.time) + 1000;
      } else {
        return Date.now();
      }
    });
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
        let cantidadLocal3G = await ticketsInstance.cantidadLocal3G();

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
          0,
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
          totalEntradas += arrayMovimientos[i].valor;
          totalEntradaDinero += arrayMovimientos[i].valor;
          break;
        case "DATAFONO_3G":
          totalTarjeta += arrayMovimientos[i].valor;
          break;
        case "SALIDA":
          totalSalidas += arrayMovimientos[i].valor;
          break;
        default:
          logger.Error(51, "Error, tipo de movimiento desconocido");
      }
    }

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
    const mediaTickets = totalTickets / nTickets;
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
}

export const cajaInstance = new CajaClase();
