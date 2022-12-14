import {
  CajaSincro,
  CajaAbiertaInterface,
  CajaCerradaInterface,
  MonedasInterface,
  TiposInfoMoneda,
} from "./caja.interface";
import * as schCajas from "./caja.mongodb";
import * as schTickets from "../tickets/tickets.mongodb";
import * as schMonedas from "../monedas/monedas.mongodb";
import { TicketsInterface } from "../tickets/tickets.interface";
import { MovimientosInterface } from "../movimientos/movimientos.interface";
import { movimientosInstance } from "../movimientos/movimientos.clase";
import { ObjectId } from "mongodb";
import { logger } from "../logger";

export class CajaClase {
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
    tipo: TiposInfoMoneda
  ) => await schCajas.guardarMonedas(arrayMonedas, tipo);

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
    idDependientaCierre: CajaCerradaInterface["idDependientaCierre"]
  ): Promise<boolean> {
    if (!(await this.cajaAbierta()))
      throw Error("Error al cerrar caja: La caja ya está cerrada");

    if (
      totalDatafono3G > 0 &&
      !(await movimientosInstance.nuevoMovimiento(
        totalDatafono3G,
        "",
        "DATAFONO_3G",
        null,
        idDependientaCierre
      ))
    )
      throw Error("No se ha podido crear el movimiento 3G");

    const finalTime = Date.now();
    const cajaAbiertaActual = await this.getInfoCajaAbierta();
    const cajaCerradaActual = await this.getDatosCierre(
      cajaAbiertaActual,
      totalCierre,
      detalleCierre,
      idDependientaCierre,
      totalDatafono3G,
      finalTime
    );

    if (await this.nuevoItemSincroCajas(cajaAbiertaActual, cajaCerradaActual))
      if (await schMonedas.setMonedas(guardarInfoMonedas))
        return await this.resetCajaAbierta();

    return false;
  }

  /* Eze 4.0 */
  resetCajaAbierta = async () => await schCajas.resetCajaAbierta();

  /* Eze 4.0  */
  borrarCaja = async () => await schCajas.borrarCaja();

  /* Eze 4.0 */
  getUltimoCierre = async () => await schCajas.getUltimoCierre();

  /* Eze 4.0 */
  async getDatosCierre(
    cajaAbiertaActual: CajaAbiertaInterface,
    totalCierre: CajaCerradaInterface["totalCierre"],
    detalleCierre: CajaCerradaInterface["detalleCierre"],
    idDependientaCierre: CajaCerradaInterface["idDependientaCierre"],
    totalDatafono3G: CajaCerradaInterface["totalDatafono3G"],
    finalTime: CajaCerradaInterface["finalTime"]
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

    if (arrayTicketsCaja.length <= 0)
      throw Error("No hay tickets en esta caja");

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
        case "TARJETA":
          totalSalidas += arrayMovimientos[i].valor;
          totalTarjeta += arrayMovimientos[i].valor;
          break;
        case "TKRS_CON_EXCESO":
          totalSalidas += arrayMovimientos[i].valor;
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
          totalSalidas += arrayMovimientos[i].valor;
          totalTarjeta += arrayMovimientos[i].valor;
          break;
        default:
          logger.Error(51, "Error, tipo de movimiento desconocido");
      }
    }

    // totalEfectivo -= totalDatafono3G;

    // ESTO SERÁ PARA CALCULAR EL DESCUADRE
    for (let i = 0; i < arrayTicketsCaja.length; i++) {
      nClientes++;
      totalTickets += arrayTicketsCaja[i].total;
    }

    const descuadre =
      Math.round(
        (totalCierre -
          cajaAbiertaActual.totalApertura +
          totalSalidas -
          totalEntradaDinero -
          totalTickets) *
          100
      ) / 100;

    recaudado = totalTickets + descuadre - totalSalidas;

    return {
      calaixFetZ: totalTickets,
      primerTicket: arrayTicketsCaja[0]._id,
      ultimoTicket: arrayTicketsCaja[arrayTicketsCaja.length - 1]._id,
      descuadre,
      detalleCierre: detalleCierre,
      finalTime: finalTime,
      idDependientaCierre: idDependientaCierre,
      nClientes: nClientes,
      recaudado: recaudado,
      totalCierre: totalCierre,
      totalDatafono3G: totalDatafono3G,
      totalDeuda: totalDeuda,
      totalEfectivo: totalEfectivo,
      totalEntradas: totalEntradas,
      totalSalidas: totalSalidas,
      totalTarjeta: totalTarjeta,
      totalTkrsConExceso: totalTkrsConExceso,
      totalTkrsSinExceso: totalTkrsSinExceso,
      mediaTickets: totalTickets / nClientes,
    };
  }
}

export const cajaInstance = new CajaClase();
