import { Controller, Post, Body, Get } from "@nestjs/common";
import { UtilesModule } from "../utiles/utiles.module";
import { cestasInstance } from "../cestas/cestas.clase";
import { tecladoInstance } from "./teclado.clase";
import { logger } from "../logger";
import { io } from "src/sockets.gateway";

@Controller("teclado")
export class TecladoController {
  /* Yasai :D */
  @Post("clickTeclaArticulo")
  async clickTeclaArticulo(
    @Body()
    {
      idArticulo,
      gramos,
      idCesta,
      unidades,
      arraySuplementos,
      nombre = "",
      menu,
    }
  ) {
    try {
      if (UtilesModule.checkVariable(idArticulo, gramos, idCesta, unidades)) {
        const resultado = await cestasInstance.clickTeclaArticulo(
          idArticulo,
          gramos,
          idCesta,
          unidades,
          arraySuplementos,
          nombre,
          menu
        );
        await cestasInstance.actualizarCestas();
        return resultado;
      }
      throw Error("Faltan datos en cestas (controller) > clickTeclaArticulo");
    } catch (err) {
      console.log(err);
      logger.Error(1, err);
      return false;
    }
  }
  /* Eze 4.0 */
  @Post("actualizarTeclado")
  async actualizarArticulos() {
    try {
      const res = await tecladoInstance.actualizarTeclado();
      if (res) {
        io.emit("cargarTeclado", res);
        return res;
      }
    } catch (err) {
      logger.Error(2, err);
      return false;
    }
  }

  @Post("cambiarPosTecla")
  async cambiarPosTecla(@Body() params) {
    try {
      if (
        params.idArticle &&
        params.nuevaPos != undefined &&
        params.nombreMenu
      ) {
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

  @Get("getTecladoCompleto")
  async getTecladoCompleto() {
    try {
      return await tecladoInstance.generarTecladoCompleto();
    } catch (err) {
      logger.Error(117, err);
      return null;
    }
  }
}
