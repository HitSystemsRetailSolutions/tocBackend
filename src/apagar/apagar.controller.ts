import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import { apagarinstance } from "./apagar.class";

@Controller("controlTpv")
export class ApagarController {
  @Post("ApagarOrdenador")
  apagar(@Req() req: Request, @Res() res: Response) {
    //console.log(JSON.parse(req.headers["authorization"]).id);
    return apagarinstance.apagarEquipo();
  }
}
