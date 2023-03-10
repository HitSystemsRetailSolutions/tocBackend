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
    if (idCliente && idCliente != "") {
      const infoTarifa = await getItemTarifa(articulo._id, idCliente);
      if (infoTarifa && typeof infoTarifa.precioConIva == "number")
        articulo.precioConIva = infoTarifa.precioConIva;
    }
    return articulo;
  }

  /* Eze 4.0 */
  getInfoArticulo = async (idArticulo: number): Promise<ArticulosInterface> =>
    await schArticulos.getInfoArticulo(idArticulo);

  /* Eze 4.0 */
  buscarArticulos = async (busqueda: string) =>
    await schArticulos.buscar(busqueda);

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
  ) {
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
    const arrayArticulos: any = await axios.get("articulos/descargarArticulos");
    if (arrayArticulos.data) {
      return await this.insertarArticulos(arrayArticulos.data);
      
    }else{
      return false;
    }

  }
}
const articulosInstance = new Articulos();
export { articulosInstance };
