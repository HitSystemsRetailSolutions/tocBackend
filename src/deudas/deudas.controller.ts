import { Body, Controller, Get, Post } from "@nestjs/common";
import { logger } from "../logger";
import { deudasInstance } from "./deudas.clase";
import { parametrosInstance } from "src/parametros/parametros.clase";
import axios from "axios";

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
  @Post("descargarDeudas")
  async descargarDeudas() {
    try {
      const parametros: any = await parametrosInstance.getParametros();
      const data: any = {
        database: parametros.database,
        botiga: parametros.codigoTienda,
        licencia: parametros.licencia,
      };
      const res: any = await axios.post("deudas/getDeudas", data);
      await deudasInstance.borrarDeudas();
      return await deudasInstance.insertarDeudas(res.data);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
  @Get("getUpdateDeudas")
  async getUpdateDeudas() {
    try {
      return await deudasInstance.getUpdateDeudas();
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
  @Get("getTotalMoneyStandBy")
  async getTotalMoneyStandBy(){
    try {
      return await deudasInstance.getTotalMoneyStandBy();
    } catch (err) {
      logger.Error(500, err);
      return null;
    }
  }
}
