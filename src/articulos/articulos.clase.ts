import { ClientesInterface } from "../clientes/clientes.interface";
import { ArticulosInterface } from "./articulos.interface";
import * as schArticulos from "./articulos.mongodb";
import { getItemTarifa } from "../tarifas/tarifas.mongodb";
import axios from "axios";
import { backupRestoreInstance } from "src/backuprestore/backup.class";
import { logger } from "src/logger";

export class Articulos {
  /* Eze 4.0 */
  async getPrecioConTarifa(
    articulo: ArticulosInterface,
    idCliente: ClientesInterface["id"]
  ): Promise<ArticulosInterface> {
    const articuloCopia = { ...articulo };
    if (idCliente && idCliente != "") {
      const infoTarifa = await getItemTarifa(articulo._id, idCliente);
      if (infoTarifa && typeof infoTarifa.precioConIva == "number")
        articuloCopia.precioConIva = infoTarifa.precioConIva;
      if (infoTarifa && typeof infoTarifa.precioBase == "number")
        articuloCopia.precioBase = infoTarifa.precioBase;
    }
    return articuloCopia;
  }

  /* Eze 4.0 */
  getInfoArticulo = async (idArticulo: number): Promise<ArticulosInterface> =>
    await schArticulos.getInfoArticulo(idArticulo);

  /* Eze 4.0 */
  getArticulos = async (): Promise<ArticulosInterface[]> =>
    await schArticulos.getArticulos();

  /* Eze 4.0 */
  buscarArticulos = async (
    busqueda: string,
    familia: string,
    limit: number = 20
  ) => await schArticulos.buscar(busqueda, familia, limit);

  getFamilies = async () => await schArticulos.getFamilies();

  /* Eze 4.0 */
  async insertarArticulos(arrayArticulos: ArticulosInterface[]) {
    return await schArticulos.insertarArticulos(arrayArticulos);
  }

  async insertarArticulosNuevos(
    nombreArticulo,
    precioConIva,
    tipoIva,
    esSumable,
    menus,
    precioBase,
    posicion
  ): Promise<number> {
    return await schArticulos.insertarArticulosNuevos(
      nombreArticulo,
      precioConIva,
      tipoIva,
      esSumable,
      menus,
      precioBase,
      posicion
    );
  }

  async insertarTeclasNuevos(
    menu,
    esSumable,
    Nombre,
    idArt,
    pos,
    preuIva,
    preuBase
  ) {
    return await schArticulos.insertarTeclasNuevos(
      menu,
      esSumable,
      Nombre,
      idArt,
      pos,
      preuIva,
      preuBase
    );
  }

  /* Eze 4.0 */
  async getSuplementos(suplementos) {
    return await schArticulos.getSuplementos(suplementos);
  }

  async editarArticulo(
    id,
    nombre,
    precioBase,
    precioConIva,
    tipoIva,
    essumable
  ) {
    const resultado = await schArticulos.editarArticulo(
      id,
      nombre,
      precioBase,
      precioConIva,
      tipoIva,
      essumable
    );
    return resultado;
  }

  async MoverArticulo(id, pos, menu) {
    const resultado = await schArticulos.MoverArticulo(id, pos, menu);
    return resultado;
  }
  async EliminarArticulo(id) {
    const resultado = await schArticulos.eliminarArticulo(id);
    return resultado;
  }
  async descargarArticulos(): Promise<any> {
    await backupRestoreInstance.backupCollection("articulos");

    try {
      const arrayArticulos: any = await axios
        .get("articulos/descargarArticulos")
        .catch((e) => {
          console.log(e);
        });

      if (!arrayArticulos?.data || arrayArticulos.data.lenght == 0)
        throw Error("No se obtuvieron articulos");

      try {
        return await this.insertarArticulos(arrayArticulos.data);
      } catch (err) {
        logger.Error(103,'insetarArticulos', err);
        // restauramos teclas y articulos para que los datos relacionados coincidan
        await backupRestoreInstance.restoreCollection("teclas");
        const restore =
          await backupRestoreInstance.restoreCollection("articulos");
        return restore
          ? { error: true, restore: 'success', message: err.message }
          : { error: true, restore: 'failed', message: err.message };
      }
    } catch (err) {
      logger.Error(103,'descargarArticulos ', err);
      console.log(err);
      return { error: true, restore: 'not_used', message: err.message };
    }
  }
}
const articulosInstance = new Articulos();
export { articulosInstance };
