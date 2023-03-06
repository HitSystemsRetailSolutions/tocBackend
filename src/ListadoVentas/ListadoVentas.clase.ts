import * as schVentas from "./listadoVentas.mongodb";
import * as schParams from "../parametros/parametros.mongodb";
//const sinc = require("../sincro");

export class ListadoVentas {
  /* Uri */
  getTickets = async () => {
    return await schVentas.getTickets();
  };

  /* Uri */
  getParms = async () => {
    return await schParams.getParametros();
  };
}
const ListadoVentasInstance = new ListadoVentas();
export { ListadoVentasInstance };
