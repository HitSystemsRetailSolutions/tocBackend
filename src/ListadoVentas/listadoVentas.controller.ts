import { Controller, Post, Body } from "@nestjs/common";
import { ListadoVentasInstance } from "./listadoVentas.clase";
@Controller("ListadoVentas")
export class ListadoVentasController {
  /* Eze 4.0 */
  @Post("getVentas")
  async getVentas(@Body() { ano, mes }) {
    try {
      let ultimoDia = new Date(ano, mes + 1, 0);
      let tickets = await ListadoVentasInstance.getTickets();
      let values = [];
      for (let i = 0; i < ultimoDia.getDate(); i++) {
        values.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      }
      for (let i = 0; i < tickets.length; i++) {
        let unixtodate = new Date(tickets.at(i)["timestamp"]);
        if (unixtodate.getFullYear() == ano && unixtodate.getMonth() == mes) {
          let iva = tickets.at(i)["cesta"]["detalleIva"];
          let val = values[unixtodate.getUTCDate() - 1];
          let isdev = 1;
          if (tickets.at(i).total < 0) isdev = -1;
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
      return values;
    } catch (err) {
      throw Error("Error, faltan datos en getArticulo controller");
    }
  }

  @Post("getEmpresa")
  async GetEmpresa() {
    try {
      let nomEmpresa = (await ListadoVentasInstance.getParms()).nombreEmpresa;
      let nomTienda = (await ListadoVentasInstance.getParms()).nombreTienda;
      let DNI = "";
      try {
        DNI = "- "+ (await ListadoVentasInstance.getParms()).header
          .split("NIF")[1]
          .replace(" ", "");
      } catch {}
      return [`${nomEmpresa} (${nomTienda})`, DNI];
    } catch (err) {
      throw Error("Error, faltan datos en getArticulo controller");
    }
  }
}
