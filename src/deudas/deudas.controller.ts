import { Body, Controller, Post } from "@nestjs/common";
import { logger } from "../logger";
import { deudasInstance } from "./deudas.clase";

@Controller("deudas")
export class DeudasController {
  @Post("setDeuda")
  async setDeuda(@Body() data) {
    try {
      if (!data || !data.cesta.length || !data.total)
        return {
          error: true,
          msg: "Faltan datos.",
        };
      return deudasInstance.setDeuda(data);
    } catch (err) {
      logger.Error(510, err);
      return null;
    }
  }
  @Post("getDeudas")
  async getDeudas() {
    try {
      return await deudasInstance.getDeudas();
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }

  @Post("ticketPagado")
  async ticketPagado(@Body() data) {
    try {
      if (!data)
        return {
          error: true,
          msg: "Faltan datos.",
        };
      return deudasInstance.ticketPagado(data);
    } catch (err) {
      logger.Error(510, err);
      return null;
    }
  }
  @Post("eliminarDeuda")
  async eliminarDeuda(@Body() data) {
    try {
      if (!data)
        return {
          error: true,
          msg: "Faltan datos.",
        };
      return await deudasInstance.eliminarDeuda(data.idDeuda);
    } catch (err) {
      logger.Error(510, err);
      return null;
    }
  }
}
