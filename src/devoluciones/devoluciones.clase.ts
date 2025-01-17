import { ObjectId } from "mongodb";
import { CestasInterface } from "../cestas/cestas.interface";
import { impresoraInstance } from "../impresora/impresora.class";
import { cestasInstance } from "../cestas/cestas.clase";
import { DevolucionesInterface } from "./devoluciones.interface";
import * as schDevoluciones from "./devoluciones.mongodb";
import { cajaInstance } from "src/caja/caja.clase";
import { getDataVersion } from "src/version/version.clase";


export class Devoluciones {
  /* Eze 4.0 */
  async nuevaDevolucion(
    total: number,
    idCesta: CestasInterface["_id"],
    idTrabajador: number
  ): Promise<boolean> {
    const nuevoIdTicket = Date.now();
    const cesta = await cestasInstance.getCestaById(idCesta);

    if (cesta == null || cesta.lista.length == 0)
      throw Error("Error, cesta rota en nuevaDevolucion() class");

    const objDevolucion: DevolucionesInterface = {
      _id: new ObjectId(),
      timestamp: Date.now(),
      total: total,
      cesta,
      idTrabajador,
      enviado: false,
      cliente: null,
      dataVersion: getDataVersion(),
    };
    await this.insertarDevolucion(objDevolucion);
    await impresoraInstance.imprimirDevolucion(objDevolucion._id);
    if (await cestasInstance.deleteCestaMesa(cesta._id)) {
      cestasInstance.actualizarCestas();
      return true;
    } else {
      throw Error("No se ha podido eliminar la cesta después de la devolución");
    }
  }

  /* Eze 4.0 */
  getDevolucionMasAntigua = async () =>
    await schDevoluciones.getDevolucionMasAntigua();

  /* Eze 4.0 */
  actualizarEstadoDevolucion = async (devolucion: DevolucionesInterface) =>
    await schDevoluciones.actualizarEstadoDevolucion(devolucion);

  /* Eze 4.0 */
  private insertarDevolucion = async (
    devolucion: DevolucionesInterface
  ): Promise<boolean> => await schDevoluciones.insertarDevolucion(devolucion);

  /* Eze 4.0 */
  getDevolucionById = async (id: ObjectId) =>
    await schDevoluciones.getDevolucionById(id);

  async verifyCurrentBoxReturns() {
    const currentBox = await cajaInstance.getInfoCajaAbierta();
    if (currentBox == null) return false;
    return await schDevoluciones.verifyCurrentBoxReturns(currentBox.inicioTime);

  }
}
export const devolucionesInstance = new Devoluciones();
