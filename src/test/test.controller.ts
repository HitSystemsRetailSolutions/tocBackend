import { Body, Controller, Post } from "@nestjs/common";
import axios from "axios";
import { movimientosInstance } from "../movimientos/movimientos.clase";

@Controller("test")
export class TestController {
  @Post("test")
  async imprimirAlgo(@Body() _parms) {
    try {
      return await movimientosInstance.construirArrayVentas();
      return 0;
    } catch (err) {
      return null;
    }
  }
}
