import { Body, Controller, Post } from "@nestjs/common";
import { logger } from "../logger";
import { encargosInstance } from "./encargos.clase";

@Controller("encargos")
export class EncargosController {
  @Post("getEncargos")
  async getEncargos() {
    try {
      return await encargosInstance.getEncargos();
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
  @Post("setEncargo")
  async setEncargo(@Body() data) {
    try {
      if (!data || !data.productos.length || !data.total)
        return {
          error: true,
          msg: "Faltan datos.",
        };
      return encargosInstance.setEncargo(data);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
  @Post("setEntregado")
  async setEntregado(@Body() data) {
    try {
      if (!data.id)
        return {
          error: true,
          msg: "Faltan datos.",
        };
      return encargosInstance.setEntregado(data.id);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }

  @Post("imprimirEncargosHoy")
  async imprimirEncargosHoy(@Body() data) {
    try {
      if (!data.orden || !data.array)
        return {
          error: true,
          msg: "Faltan datos.",
        };


      return encargosInstance.ordenarImpresion(data.orden,data.array);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
}
