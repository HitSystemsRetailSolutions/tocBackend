import axios from "axios";
import { MesaInterface } from "./mesas.interface";
import * as schMesas from "./mesas.mongodb";
import { cestasInstance } from "src/cestas/cestas.clase";
export class MesasClass {
  getMesas = async () => await schMesas.getMesas();
  saveMesas = async (arrayMesas: MesaInterface[]) =>
    await schMesas.insertMesas(arrayMesas);

  iniciarMesa = async (
    indexMesa: number,
    comensales: number,
    trabajador: number
  ) => {
    try {
      const idCesta = await cestasInstance.getCestaByMesa(indexMesa);

      if (!idCesta) throw Error("No se ha podido iniciar la mesa");
      const cesta = await cestasInstance.getCestaById(idCesta);
      if (!cesta) throw Error("No se ha podido iniciar la mesa");

      cesta.comensales = comensales;
      cesta.encargadoMesa = trabajador;

      const cestaActualizada = await cestasInstance.updateCesta(cesta);
      if (cestaActualizada) {
        cestasInstance.actualizarCestas();
      }
      return cestaActualizada;
    } catch (err) {
      throw err;
    }
  };
}
export const mesasInstance = new MesasClass();
