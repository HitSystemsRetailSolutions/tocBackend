import { Body, Controller, Get, Post } from "@nestjs/common";
import { logger } from "../logger";
import { mesasInstance } from "./mesas.class";

@Controller("mesas")
export class MesasController {
  @Get("getMesas")
  async getMesas() {
    try {
      const resultado = await mesasInstance.getMesas();
      if (resultado && resultado.length === 50) return resultado;

      const arrayMesas = [];
      for (let i = 0; i < 50; i++) {
        arrayMesas.push({
          idCesta: null,
          _id: null,
        });
      }
      return arrayMesas;
    } catch (err) {
      logger.Error(122, err);
    }
  }

  @Post("guardarCambios")
  async saveMesas(@Body() { arrayMesas }) {
    try {
      if (arrayMesas && arrayMesas.length === 50) {
        return await mesasInstance.saveMesas(arrayMesas);
      }
      throw Error(
        "Faltan datos o son incorrectos en guardarCambios mesas.controller.ts"
      );
    } catch (err) {
      logger.Error(124, err);
      return false;
    }
  }

  @Post("getMesa")
  async getNombreMesa(@Body() { indexMesa }) {
    try {
      const arrayMesas = await mesasInstance.getMesas();
      if (arrayMesas[indexMesa]) return arrayMesas[indexMesa];
      return null;
    } catch (err) {
      logger.Error(126, err);
      return null;
    }
  }
}
