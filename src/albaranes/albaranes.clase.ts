import { ticketsInstance } from "src/tickets/tickets.clase";
import { AlbaranesInterface } from "./albaranes.interface";
import * as schAlbaranes from "./albaranes.mongodb";
import { parametrosInstance } from "src/parametros/parametros.clase";
import axios from "axios";
import { cestasInstance } from "src/cestas/cestas.clase";
import { movimientosInstance } from "src/movimientos/movimientos.clase";
import { deudasInstance } from "src/deudas/deudas.clase";
export class AlbaranesClase {
  async setAlbaran(
    total,
    cesta,
    idTrabajador
  ):Promise<boolean> {
    // creando json albaran
    const id = await this.getProximoId();
    const nuevoAlbaran: AlbaranesInterface = {
      _id: id,
      datafono3G: false,
      timestamp: Date.now(),
      total: Number(total.toFixed(2)),
      paytef: false,
      idCliente: cesta.idCliente,
      idTrabajador,
      cesta,
      consumoPersonal: false,
      enviado: false,
    };

    try {
      // devolver id cuando se haya guradado el albaran en mongodb
      if (await schAlbaranes.setAlbaran(nuevoAlbaran)) {

        return true;
      }

      throw Error(
        "Error, no se ha podido crear el ticket en crearTicket() controller 2"
      );
    } catch (error) {
      console.log("error setAlbaran:", error);
    }
  }
  async getAlbaranes() {
    return await schAlbaranes.getAlbaranes();
  }
  async getProximoId(): Promise<number | PromiseLike<number>> {
    const parametros = await parametrosInstance.getParametros();
    const codigoTienda = parametros.codigoTienda;

    try {
      const params = {
        codigoTienda: parametros.codigoTienda,
        database: parametros.database,
      };
      const idAlbaranSantaAna = await axios.post("albaranes/getLastId", {
        params,
      });

      if (idAlbaranSantaAna?.data) {
        const contador = Number(idAlbaranSantaAna.data.toString().slice(3)) + 1;
        return Number(codigoTienda + contador.toString().padStart(4, "0"));
      }
    } catch (error) {
      // Si hay algún error, manejarlo, pero no interrumpe la ejecución para intentar otra estrategia
      console.error(
        "Error al obtener el próximo IDAlbaran en santaana:",
        error
      );
    }

    // Si no se obtuvo el ID de la primera manera, intentar con la segunda
    const ultimoIdMongo = await this.getUltimoIdAlbaran();
    const contador = ultimoIdMongo
      ? Number(ultimoIdMongo.toString().slice(3)) + 1
      : 1;

    return Number(codigoTienda + contador.toString().padStart(4, "0"));
  }

  async getUltimoIdAlbaran() {
    const ultimoIdMongo = (await schAlbaranes.getUltimoAlbaran())?._id;
    if (ultimoIdMongo) {
      return ultimoIdMongo;
    }
  }
  setPagado = async (idAlbaran: AlbaranesInterface["_id"]) =>
    await schAlbaranes.setPagado(idAlbaran);
  getDeudas = async () => await schAlbaranes.getDeudas();
  getAlbaranById = async (idAlbaran: AlbaranesInterface["_id"]) =>
    await schAlbaranes.getAlbaranById(idAlbaran);
  getAlbaranCreadoMasAntiguo = async () =>
    await schAlbaranes.getAlbaranCreadoMasAntiguo();
  getAlbaranFinalizadoMasAntiguo = async () =>
    await schAlbaranes.getAlbaranFinalizadoMasAntiguo();
  setEnviado = (idAlbaran: AlbaranesInterface["_id"]) =>
    schAlbaranes.setAlbaranEnviado(idAlbaran);
  setFinalizado = (idAlbaran: AlbaranesInterface["_id"]) =>
    schAlbaranes.setFinalizado(idAlbaran);

  pagarAlbaran = (idAlbaran: AlbaranesInterface["_id"]) =>
    schAlbaranes.pagarAlbaran(idAlbaran);
}

export const AlbaranesInstance = new AlbaranesClase();
