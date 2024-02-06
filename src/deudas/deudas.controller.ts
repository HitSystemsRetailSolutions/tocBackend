import { Body, Controller, Get, Post } from "@nestjs/common";
import { logger } from "../logger";
import { deudasInstance } from "./deudas.clase";
import { parametrosInstance } from "src/parametros/parametros.clase";
import axios from "axios";
import { AlbaranesInstance } from "src/albaranes/albaranes.clase";
import { DeudasInterface } from "./deudas.interface";
import { AlbaranesInterface } from "src/albaranes/albaranes.interface";

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
      const deudas: DeudasInterface[] = await deudasInstance.getDeudas();
      return deudas;
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
      return deudasInstance.ticketPagado(data.idDeuda, data.albaran);
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
      return await deudasInstance.eliminarDeuda(data.idDeuda, data.albaran);
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
      await deudasInstance.insertarDeudas(res.data);
      return true;
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
  async getTotalMoneyStandBy() {
    try {
      return await deudasInstance.getTotalMoneyStandBy();
    } catch (err) {
      logger.Error(500, err);
      return null;
    }
  }
  @Post("getDeudaByIdTicket")
  /**
   * @param {DeudasInterface["idTicket"]} idTicket
   * @param {DeudasInterface["timestamp"]}timestamp
   * @returns {DeudasInterface}
   * @description Devuelve la deuda utilizando el idTicket y el timestamp.
   */
  async getDeudaByIdTicket(
    @Body()
    {
      idTicket,
      timestamp,
    }: {
      idTicket: DeudasInterface["idTicket"];
      timestamp: DeudasInterface["timestamp"];
    }
  ) {
    try {
      if (!idTicket || !timestamp) {
        throw new Error("Faltan datos.");
      }
      return await deudasInstance.getDeudaByIdTicket(idTicket, timestamp);
    } catch (err) {
      logger.Error(501, err);
    }
  }
}
