import { TarifaInterface } from "./tarifas.interface";
import * as schTarifas from "./tarifas.mongodb";
import axios from "axios";
import { parametrosInstance } from "../parametros/parametros.clase";
import { ClientesInterface } from "../clientes/clientes.interface";

export class TarifasClass {
  /* Eze 4.0 */
  async guardarTarifasEspeciales(
    arrayTarifas: TarifaInterface[]
  ): Promise<boolean> {
    if (arrayTarifas && arrayTarifas.length > 0) {
      return await schTarifas.insertarTarifas(arrayTarifas);
    }
    return null;
  }

  /* Eze 4.0 */
  async descargarTarifasEspeciales(): Promise<TarifaInterface[]> {
    const resTarifas = (await axios.get("tarifas/getTarifasEspeciales"))
      .data as TarifaInterface[];
    if (resTarifas.length > 0) return resTarifas;
    return [];
  }

  /* Eze 4.0 */
  async actualizarTarifas(): Promise<boolean> {
    await schTarifas.borrarTarifas();
    const arrayTarifas = await this.descargarTarifasEspeciales();
    return await this.guardarTarifasEspeciales(arrayTarifas);
  }

  /* Eze 4.0 */
  clienteTieneTarifa = async (idCliente: ClientesInterface["id"]) =>
    await schTarifas.tieneTarifaEspecial(idCliente);

  /* uri */
  async tarifaMesas(idArticulo): Promise<TarifaInterface> {
    return await schTarifas.tarifasMesas(idArticulo);
  }

  /* uri */
  async tarifaMenu(id, menu): Promise<TarifaInterface> {
    return await schTarifas.tarifasMenu(id, menu);
  }
}

export const tarifasInstance = new TarifasClass();
