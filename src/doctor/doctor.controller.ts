import { Controller, Get } from "@nestjs/common";
import { doctorInstance } from "./doctor.class";
import { logger } from "../logger";

@Controller("doctor")
export class DoctorController {
  /* Eze 4.0 */
  @Get("checkTrabajadores")
  async checkTrabajadoresDoctor() {
    try {
      return await doctorInstance.checkTrabajadores();
    } catch (err) {
      logger.Error(72, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Get("checkCestas")
  async checkCestasDoctor() {
    try {
      return await doctorInstance.checkCestas();
    } catch (err) {
      logger.Error(73, err);
      return false;
    }
  }
}
