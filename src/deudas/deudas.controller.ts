import { Body, Controller, Post } from "@nestjs/common";
import { logger } from "../logger";
import { deudasInstance } from "./deudas.clase";

@Controller("deudas")
export class EncargosController {
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

}