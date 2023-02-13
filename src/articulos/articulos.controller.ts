import { Controller, Post, Body } from "@nestjs/common";
import { articulosInstance } from "./articulos.clase";
import { logger } from "../logger";
@Controller("articulos")
export class ArticulosController {
  /* Eze 4.0 */
  @Post("getArticulo")
  async getArticulo(@Body() { idArticulo, idCliente }) {
    try {
      if (idArticulo)
        return await articulosInstance.getPrecioConTarifa(
          await articulosInstance.getInfoArticulo(idArticulo),
          idCliente
        );
      throw Error("Error, faltan datos en getArticulo controller");
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }

  @Post("getSuplementos")
  async getSuplementos(@Body() { arrayIdSuplementos }) {
    try {
      if (arrayIdSuplementos)
        return await articulosInstance.getSuplementos(arrayIdSuplementos);

      throw Error("Error, faltan datos en getArticulo controller");
    } catch (err) {
      logger.Error("articulos.controller.ts @getSuplementos", err);
      return null;
    }
  }

  @Post("buscar")
  async buscar(@Body() { busqueda }) {
    try {
      if (busqueda) {
        return await articulosInstance.buscarArticulos(busqueda);
      }
      throw Error("Faltan datos en articulos/buscar");
    } catch (err) {
      logger.Error(138, err);
      return false;
    }
  }

  
  // @Post("editarArticulo")
  // editarArticulo(@Body() params) {
  //   if (
  //     params.idArticulo &&
  //     params.nombre &&
  //     params.precioBase &&
  //     params.precioConIva
  //   ) {
  //     // logger.Error('Hola', params.idArticulo, params.nombre, params.precioBase, params.precioConIva)
  //     return articulosInstance
  //       .editarArticulo(
  //         params.idArticulo,
  //         params.nombre,
  //         params.precioBase,
  //         params.precioConIva
  //       )
  //       .then((res) => {
  //         if (res) {
  //           return { error: false, info: res };
  //         }
  //         return { error: true, mensaje: "Backend: Error, faltan datos" };
  //       });
  //   } else {
  //     return {
  //       error: true,
  //       mensaje: "Backend: Faltan datos en articulos/editarArticulo",
  //     };
  //   }
  // }
}
