import { Controller, Get, Post } from "@nestjs/common";
import { apagarinstance } from "./apagar.class";

@Controller("controlTpv")
export class ApagarController {
  @Post("ApagarOrdenador")
  apagar() {
    return apagarinstance.apagarEquipo();
  }
}
