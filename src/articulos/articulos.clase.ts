import { ClientesInterface } from "../clientes/clientes.interface";
import { ArticulosInterface } from "./articulos.interface";
import * as schArticulos from "./articulos.mongodb";
import { getItemTarifa } from "../tarifas/tarifas.mongodb";

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

  /* Eze 4.0 */
  async getSuplementos(suplementos) {
    return await schArticulos.getSuplementos(suplementos);
  }

  // async editarArticulo(id, nombre, precioBase, precioConIva) {
  //   const resultado = await schArticulos.editarArticulo(id, nombre, precioBase, precioConIva);
  //   // logger.Error(resultado)
  //   return resultado;
  // }
}
const articulosInstance = new Articulos();
export { articulosInstance };
