import * as schClientes from "./clientes.mongodb";
import { ClientesInterface } from "./clientes.interface";
import axios from "axios";
import { parametrosInstance } from "../parametros/parametros.clase";
import { tarifasInstance } from "../tarifas/tarifas.class";
import { ArticulosInterface } from "src/articulos/articulos.interface";
const dtoP="DtoProducte";
const dtoF="DtoFamilia";
export class Clientes {
  /* Eze 4.0. Busca tanto nombres como tarjeta cliente */
  buscar = async (cadena: string) => await schClientes.buscar(cadena);

  /* Eze 4.0 */
  getClienteById = async (idCliente: string): Promise<ClientesInterface> =>
    await schClientes.getClienteById(idCliente);

  isClienteDescuento = async (idCliente: string): Promise<ClientesInterface> =>
    await schClientes.isClienteDescuento(idCliente);

  /* Uri */
  getClienteByNumber = async (idTarjeta: string): Promise<ClientesInterface> =>
    await schClientes.getClienteByNumber(idTarjeta);

  /* Eze 4.0 */
  insertarClientes = async (arrayClientes: ClientesInterface[]) =>
    schClientes.insertarClientes(arrayClientes);

  /* Eze 4.0 */
  async getPuntosCliente(
    idClienteFinal: ClientesInterface["id"]
  ): Promise<number> {
    let x: any = await axios
      .post("clientes/getPuntosCliente", {
        idClienteFinal: idClienteFinal,
      })
      .catch((e) => {
        console.log(e);
      });
    return x?.data;
  }
  getDtoAlbaran(cliente: ClientesInterface, articulo: ArticulosInterface) {
    const dtoFamilia= this.getDtoFamilia(cliente, articulo);
    const dtoProduco = this.getDtoProducto(cliente, articulo);
    if(dtoFamilia > dtoProduco){
      return dtoFamilia;
    } else if(dtoFamilia < dtoProduco){
      return dtoProduco;
    } else {
      return 0;
    }
  }
  getDtoProducto(cliente: ClientesInterface, articulo: ArticulosInterface) {
    const artIdString = articulo._id.toString();
    if (cliente.dto && Array.isArray(cliente.dto)) {
      // Filtrar el array 'dto' para encontrar las posiciones que coinciden con 'DtoProducte' y 'articulo.id'
      for (const elemento of cliente.dto) {
        if (elemento.variable === dtoP && elemento.valor === artIdString) {
          // Si se encuentra una coincidencia, devolver el descuento
          return elemento.descuento;
        }
      }
    }
    return 0;
  }
  getDtoFamilia(cliente: ClientesInterface, articulo: ArticulosInterface) {

    if (cliente.dto && Array.isArray(cliente.dto)) {
      // Filtrar el array 'dto' para encontrar las posiciones que coinciden con 'DtoProducte' y 'pare'
      for (const elemento of cliente.dto) {
        if (elemento.variable === dtoF && elemento.valor === articulo.pare) {
          // Si se encuentra una coincidencia, devolver el descuento
          return elemento.descuento;
        }
      }
    }
    return 0;
  }
  /* Eze 4.0 */
  tieneTarifaEspecial = async (idCliente: ClientesInterface["id"]) =>
    await tarifasInstance.clienteTieneTarifa(idCliente);
  eliminarCliente = async (idCliente: ClientesInterface["id"]) =>
    await schClientes.eliminarCliente(idCliente);
}
export const clienteInstance = new Clientes();
