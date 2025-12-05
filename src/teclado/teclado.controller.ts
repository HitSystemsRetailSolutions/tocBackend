import { Controller, Headers, Post, Body, Get } from "@nestjs/common";
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
    @Headers() headers: Record<string, string>,
    @Body()
    {
      idArticulo,
      gramos,
      idCesta,
      unidades,
      arraySuplementos,
      nombre = "",
      menu,
      articulosMenu,
      precioTecla = 0,
      precioManual = false,
    }
  ) {
    const sourceProgram = headers["x-source-program"];
    // decodeURIComponent para que no haya problemas con los caracteres especiales pasados por headers
    let article = decodeURIComponent(headers["article"]);
    const worker = decodeURIComponent(headers["worker"]);
    logger.Info(
      `nombre_programa: ${sourceProgram}, articulo: ${article}, unidades: ${unidades}, dependienta: ${worker}`
    );
    try {
      if (UtilesModule.checkVariable(idArticulo, gramos, idCesta, unidades)) {
        console.log("clicktecla articulo:", precioManual, precioTecla);
        const resultado = await cestasInstance.clickTeclaArticulo(
          idArticulo,
          gramos,
          idCesta,
          unidades,
          arraySuplementos,
          articulosMenu,
          nombre,
          menu,
          false,
          precioManual,
          precioTecla
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
  async actualizarArticulos(@Body() params) {
    try {
      const force = params?.force || false;
      const res = await tecladoInstance.actualizarTeclado(force);
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
