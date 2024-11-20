import { ClientesInterface } from "../clientes/clientes.interface";
import { ArticulosInterface } from "./articulos.interface";
import * as schArticulos from "./articulos.mongodb";
import { getItemTarifa } from "../tarifas/tarifas.mongodb";
import axios from "axios";

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

  async insertarTeclasNuevos(menu, esSumable, Nombre, idArt, pos, preuIva, preuBase) {
    return await schArticulos.insertarTeclasNuevos(
      menu,
      esSumable,
      Nombre,
      idArt,
      pos,
      preuIva,
      preuBase,
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
  async descargarArticulos(): Promise<boolean> {
    try {
      const arrayArticulos: any = await axios
        .get("articulos/descargarArticulos")
        .catch((e) => {
          console.log(e);
        });
      if (arrayArticulos.data) {
        return await this.insertarArticulos(arrayArticulos.data);
      } else {
        return false;
      }
    } catch (err) {
      console.log(err);
    }
  }
}
const articulosInstance = new Articulos();
export { articulosInstance };
