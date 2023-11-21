import { ticketsInstance } from "src/tickets/tickets.clase";
import { AlbaranesInterface } from "./albaranes.interface";
import * as schAlbaranes from "./albaranes.mongodb";
import { parametrosInstance } from "src/parametros/parametros.clase";
import axios from "axios";
import { cestasInstance } from "src/cestas/cestas.clase";
export class AlbaranesClase {
  async setAlbaran(
    total,
    cesta,
    idTrabajador,
    estado: AlbaranesInterface["estado"]
  ) {
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
      estado: estado,
    };

    try {
      // devolver id cuando se haya guradado el albaran en mongodb
      if (await schAlbaranes.setAlbaran(nuevoAlbaran)) {
        return nuevoAlbaran._id;
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
    let id = 0;
    const parametros = await parametrosInstance.getParametros();
    const codigoTienda = parametros.codigoTienda;
    let contador = 0;
    try {
      const ultimoIdMongo = await this.getUltimoIdAlbaran();
      if (!ultimoIdMongo) {
        const params = {
          botiga: parametros.codigoTienda,
          database: parametros.codigoTienda,
        };

        const idAlbaranSantaAna: { data: number } = await axios.get(
          "albaranes/getLastId",
          { params }
        );
        if (idAlbaranSantaAna.data) {
          contador = Number(idAlbaranSantaAna.data.toString().slice(3));
          contador += 1;
          return Number(codigoTienda + contador.toString().padStart(4, "0"));
        }
      }
      contador = Number(ultimoIdMongo.toString().slice(3));
      contador += 1;
      return Number(codigoTienda + contador.toString().padStart(4, "0"));
    } catch (error) {
      return Number(codigoTienda + "0001");
    }
  }

  async getUltimoIdAlbaran() {
    const ultimoIdMongo = (await schAlbaranes.getUltimoAlbaran())?._id;
    if (ultimoIdMongo) {
      return ultimoIdMongo;
    }
  }
  getAlbaranById = async (idAlbaran: AlbaranesInterface["_id"]) =>
    await schAlbaranes.getAlbaranById(idAlbaran);
  getAlbaranCreadoMasAntiguo = async () =>
    await schAlbaranes.getAlbaranCreadoMasAntiguo();

  setEnviado = (idAlbaran: AlbaranesInterface["_id"]) =>
    schAlbaranes.setAlbaranEnviado(idAlbaran);

  pagarAlbaran = (idAlbaran: AlbaranesInterface["_id"]) =>
    schAlbaranes.pagarAlbaran(idAlbaran);
}

export const AlbaranesInstance = new AlbaranesClase();
