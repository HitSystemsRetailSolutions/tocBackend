import { Controller, Post, Body,Get } from "@nestjs/common";
import { devolucionesInstance } from "./devoluciones.clase";
import { logger } from "../logger";

@Controller("devoluciones")
export class DevolucionesController {
  /* Eze 4.0 */
  @Post("nuevaDevolucion")
  async nuevaDevolucion(@Body() { total, idCesta, idTrabajador }) {
    try {
      if (typeof total == "number" && idCesta && idTrabajador)
        return await devolucionesInstance.nuevaDevolucion(
          total,
          idCesta,
          idTrabajador
        );
      throw Error("Error, faltan datos en nuevaDevolucion() controller");
    } catch (err) {
      logger.Error(69, err);
      return false;
    }
  }

  @Get("verifyCurrentBoxReturns")
  async verifyCurrentBoxReturns() {
    try {
      return await devolucionesInstance.verifyCurrentBoxReturns();
    } catch (err) {
      logger.Error(70, err);
      return false;
    }
  }
}
