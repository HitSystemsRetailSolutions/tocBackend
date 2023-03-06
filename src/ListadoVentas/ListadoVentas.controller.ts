import { Controller, Post, Body } from "@nestjs/common";
import { ListadoVentasInstance } from "./ListadoVentas.clase";
@Controller("ListadoVentas")
export class ListadoVentasController {
  /* Eze 4.0 */
  @Post("getVentas")
  async getVentas(@Body() { ano, mes }) {
    try {
      let UltimoDia = new Date(ano, mes + 1, 0);
      let Tickets = await ListadoVentasInstance.GetTickets();
      let Values = [];
      for (let i = 0; i < UltimoDia.getDate(); i++) {
        Values.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      }
      for (let i = 0; i < Tickets.length; i++) {
        let unixtodate = new Date(Tickets.at(i)["timestamp"]);
        if (unixtodate.getFullYear() == ano && unixtodate.getMonth() == mes) {
          let iva = Tickets.at(i)["cesta"]["detalleIva"];
          let val = Values[unixtodate.getUTCDate() - 1];
          let isdev = 1;
          if (Tickets.at(i).total < 0) isdev = -1;
          val[0] = val[0] + isdev * iva.base4;
          val[1] = val[1] + isdev * iva.valorIva4;
          val[2] = val[2] + isdev * iva.base1;
          val[3] = val[3] + isdev * iva.valorIva1;
          val[4] = val[4] + isdev * iva.base5;
          val[5] = val[5] + isdev * iva.valorIva5;
          val[6] = val[6] + isdev * iva.base2;
          val[7] = val[7] + isdev * iva.valorIva2;
          val[8] = val[8] + isdev * iva.base3;
          val[9] = val[9] + isdev * iva.valorIva3;
        }
      }
      return Values;
    } catch (err) {
      throw Error("Error, faltan datos en getArticulo controller");
    }
  }

  @Post("getEmpresa")
  async GetEmpresa() {
    try {
      let NomEmpresa = (await ListadoVentasInstance.GetParms()).at(
        0
      ).nombreEmpresa;
      let NomTienda = (await ListadoVentasInstance.GetParms()).at(
        0
      ).nombreTienda;
      let DNI = "";
      try {
        DNI = (await ListadoVentasInstance.GetParms())
          .at(0)
          .header.split("NIF")[1]
          .replace(" ", "");
      } catch {}
      return [`${NomEmpresa} (${NomTienda})`, DNI];
    } catch (err) {
      throw Error("Error, faltan datos en getArticulo controller");
    }
  }
}
