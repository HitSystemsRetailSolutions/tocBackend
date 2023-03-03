import * as schVentas from "./ListadoVentas.mongodb";
//const sinc = require("../sincro");

export class ListadoVentas {
  /* Uri */
  GetTickets = async () => {
    return await schVentas.GetTickets();
  };

  /* Uri */
  GetParms = async () => {
    return await schVentas.GetParams();
  };
}
const ListadoVentasInstance = new ListadoVentas();
export { ListadoVentasInstance };
