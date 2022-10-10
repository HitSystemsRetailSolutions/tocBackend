import { Controller, Post, Body } from "@nestjs/common";
import { UtilesModule } from "src/utiles/utiles.module";
import { cestasInstance } from "../cestas/cestas.clase";
import { tecladoInstance } from "./teclado.clase";
import { logger } from "../logger";

@Controller("teclado")
export class TecladoController {
  /* Eze 4.0 */
  @Post("clickTeclaArticulo")
  async clickTeclaArticulo(
    @Body()
    { idArticulo, gramos, idCesta, unidades, arraySuplementos }
  ) {
    try {
      if (UtilesModule.checkVariable(idArticulo, gramos, idCesta, unidades)) {
        return await cestasInstance.clickTeclaArticulo(
          idArticulo,
          gramos,
          idCesta,
          unidades,
          arraySuplementos
        );
      }
      throw Error("Faltan datos en cestas (controller) > clickTeclaArticulo");
    } catch (err) {
      logger.Error(1, err);
      return false;
    }
  }
  /* Eze 4.0 */
  @Post("actualizarTeclado")
  async actualizarArticulos() {
    try {
      return await tecladoInstance.actualizarTeclado();
    } catch (err) {
      logger.Error(2, err);
      return false;
    }
  }

  /* está mal */
  @Post("cambiarPosTecla")
  async cambiarPosTecla(@Body() params) {
    try {
      if (params.idArticle && params.nuevaPos && params.nombreMenu) {
        return await tecladoInstance
          .cambiarPosTecla(params.idArticle, params.nuevaPos, params.nombreMenu)
          .then((res) => {
            if (res) {
              return { error: false, info: res };
            }
            return { error: true, mensaje: "Error en teclado/cambiarPosTecla" };
          });
      } else {
        return {
          error: true,
          mensaje: "Faltan datos en teclado/cambiarPosTecla",
        };
      }
    } catch (err) {
      logger.Error(3, err);
      return false;
    }
  }
}
