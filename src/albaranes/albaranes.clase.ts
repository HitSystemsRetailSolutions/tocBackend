import { ticketsInstance } from "src/tickets/tickets.clase";
import { AlbaranesInterface } from "./albaranes.interface";
import * as schAlbaranes from "./albaranes.mongodb";
import { parametrosInstance } from "src/parametros/parametros.clase";
export class AlbaranesClase {
  async setAlbaran(total, cesta, idTrabajador) {
    const nuevoTicket: AlbaranesInterface = {
      _id: await ticketsInstance.getProximoId(),
      datafono3G: false,
      timestamp: Date.now(),
      total: total,
      paytef: false,
      idCliente: cesta.idCliente,
      idTrabajador,
      cesta,
      consumoPersonal: false,
      enviado: false,
    };
    return await schAlbaranes.setAlbaran(nuevoTicket);
  }

  async getUltimoIdAlbaran() {
    const ultimoIdMongo = (await schAlbaranes.getUltimoAlbaran())?._id;
    if (ultimoIdMongo) {
      return ultimoIdMongo;
    } else {
      return (await parametrosInstance.getParametros()).ultimoTicket;
    }
  }
  getAlbaranCreadoMasAntiguo = async () =>
    await schAlbaranes.getAlbaranCreadoMasAntiguo();

  setEnviado = (idAlbaran: AlbaranesInterface["_id"]) =>
    schAlbaranes.setAlbaranEnviado(idAlbaran);
}

export const AlbaranesInstance = new AlbaranesClase();
