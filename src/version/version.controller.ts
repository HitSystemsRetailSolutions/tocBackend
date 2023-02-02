import { Controller, Get } from "@nestjs/common";
import { parametrosInstance } from "../parametros/parametros.clase";
@Controller("getInfo")
export class VersionController {
  /* Eze v23 */
  @Get("tocGame")
  async getInfo() {
    const parametros = await parametrosInstance.getParametros();
    return {
      version: process.env.npm_package_version,
      nombreTienda: parametros.nombreTienda,
    };
  }
}
