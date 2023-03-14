import { Body, Controller, Post } from "@nestjs/common";
import { UtilesModule } from "../utiles/utiles.module";
import { satelitesInstance } from "./satelites.class";

@Controller("satelites")
export class SatelitesController {
  @Post("verifyToken")
  verificarToken(@Body() params) {
    if (UtilesModule.checkVariable(params.token)) {
      return satelitesInstance.verifyToken(params.token);
    } else {
      return false;
    }
  }
}
