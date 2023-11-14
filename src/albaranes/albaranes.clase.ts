import { AlbaranesInterface } from "./albaranes.interface";
import * as schAlbaranes from "./albaranes.mongodb";
export class AlbaranesClase {
  async crearAlbaran(total, cesta, idTrabajador) {
    const nuevoTicket: AlbaranesInterface = {
      _id: 1,
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
}

export const AlbaranesInstance = new AlbaranesClase();
