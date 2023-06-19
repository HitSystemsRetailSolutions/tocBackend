import { Controller, Post, Body } from "@nestjs/common";
import { ArticulosInterface } from "./articulos.interface";
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

  @Post("editarArticulo")
  editarArticulo(@Body() params) {
    if (
      params.idArticulo &&
      params.nombre &&
      params.precioBase != undefined &&
      params.precioConIva != undefined
    ) {
      return articulosInstance
        .editarArticulo(
          params.idArticulo,
          params.nombre,
          params.precioBase,
          params.precioConIva,
          params.tipoIva,
          params.essumable
        )
        .then((res) => {
          if (res) {
            return { error: false, info: res };
          }
          return { error: true, mensaje: "Backend: Error, faltan datos" };
        });
    } else {
      return {
        error: true,
        mensaje: "Backend: Faltan datos en articulos/editarArticulo",
      };
    }
  }

  @Post("moverArticulo")
  moverArticulo(@Body() params) {
    if ((params.id, params.posicion, params.menu)) {
      return articulosInstance
        .MoverArticulo(params.id, params.posicion, params.menu)
        .then((res) => {
          if (res) {
            return { error: false, info: res };
          }
          return { error: true, mensaje: "Backend: Error, faltan datos" };
        });
    } else {
      return {
        error: true,
        mensaje: "Backend: Faltan datos en articulos/editarArticulo",
      };
    }
  }

  @Post("eliminarArticulo")
  eliminarArticulo(@Body() params) {
    if (params.id) {
      return articulosInstance.EliminarArticulo(params.id).then((res) => {
        if (res) {
          return { error: false, info: res };
        }
        return { error: true, mensaje: "Backend: Error, faltan datos" };
      });
    } else {
      return {
        error: true,
        mensaje: "Backend: Faltan datos en articulos/editarArticulo",
      };
    }
  }

  @Post("anadirProducto")
  anadirProducto(@Body() params) {
    if (
      params.nombreArticulo != undefined &&
      params.precioConIva != undefined &&
      params.precioBase != undefined &&
      params.tipoIva != undefined &&
      params.menus != undefined &&
      params.posicion != undefined &&
      params.articuloExistente != undefined
    ) {
      if (params.articuloExistente && params.idArticulo) 
        return articulosInstance.insertarTeclasNuevos(
          params.menus,
          params.esSumable,
          params.nombreArticulo,
          params.idArticulo,
          params.posicion,
          params.precioConIva
        );
      return articulosInstance
        .insertarArticulosNuevos(
          params.nombreArticulo,
          params.precioConIva,
          params.tipoIva,
          params.esSumable,
          params.menus,
          params.precioBase,
          params.posicion
        )
        .then((res) => {
          if (res) {
            return { error: false, info: res };
          }
          return { error: true, mensaje: "Backend: Error, faltan datos" };
        });
    } else {
      return {
        error: true,
        mensaje: "Backend: Faltan datos en articulos/editarArticulo",
      };
    }
  }
}
