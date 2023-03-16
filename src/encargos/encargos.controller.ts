import { Body, Controller, Post } from "@nestjs/common";
import { logger } from "../logger";
import { encargosInstance } from "./encargos.clase";

@Controller("encargos")
export class EncargosController {
  @Post("setEncargo")
  async setEncargo(@Body() data) {
    try {
        if(!data || !data.productos.length || !data.total)
            return {
                error: true,
                msg: 'Faltan datos.'
            }
        return encargosInstance.setEncargo(data);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
}
