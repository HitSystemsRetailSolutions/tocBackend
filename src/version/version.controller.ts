import { Controller, Get } from "@nestjs/common";
import { parametrosInstance } from "../parametros/parametros.clase";
import axios from "axios";
@Controller("getInfo")
export class VersionController {
  /* Eze v23 */
  @Get("tocGame")
  async getInfo() {
    const parametros = await parametrosInstance.getParametros();
    axios.post("/parametros/actualizarVersion", {
      version: process.env.npm_package_version,
      licencia: parametros.licencia,
    });
    return {
      version: process.env.npm_package_version,
      nombreTienda: parametros.nombreTienda,
    };
  }
}
