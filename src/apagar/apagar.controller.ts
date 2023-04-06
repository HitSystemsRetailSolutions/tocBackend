import { Controller, Get } from "@nestjs/common";
import { apagarinstance } from "./apagar.class";

@Controller("controlTpv")
export class ApagarController {
  @Get("ApagarOrdenador")
  apagar() {
    return apagarinstance.apagarEquipo();
  }
}
