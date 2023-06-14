import { Controller, Get } from "@nestjs/common";
import { tarifasInstance } from "./tarifas.class";
import { logger } from "../logger";

@Controller("tarifas")
export class TarifasController {
  /* Eze 4.0 */
  @Get("descargarTarifas")
  async descargarTarifas() {
    try {
      return await tarifasInstance.actualizarTarifas();
    } catch (err) {
      logger.Error(101, err);
      return false;
    }
  }
  @Get("TarifasMesas")
  async TarifasMesas(idArticulo) {
    try {
      return await tarifasInstance.tarifaMesas(idArticulo);
    } catch (err) {
      logger.Error(101, err);
      return false;
    }
  }
}
