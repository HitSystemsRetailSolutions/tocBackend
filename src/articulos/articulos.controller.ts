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
      console.log(err);
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
      params.precioBase &&
      params.precioConIva
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
    if ((params.id, params.posicion)) {
      return articulosInstance
        .MoverArticulo(params.id, params.posicion)
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

  @Post("anadirProducto")
  anadirProducto(@Body() params) {
    if (
      params.nombreArticulo != undefined &&
      params.precioConIva != undefined &&
      params.precioBase != undefined &&
      params.tipoIva != undefined &&
      params.menus != undefined &&
      params.posicion != undefined
    ) {
      let valors: ArticulosInterface[] = [
        {
          nombre: params.nombreArticulo,
          precioConIva: params.precioConIva,
          tipoIva: params.tipoIva,
          esSumable: params.esSumable,
          familia: params.menus,
          precioBase: params.precioBase,
          _id: undefined,
          suplementos: undefined,
        },
      ];
      return articulosInstance.insertarArticulosNuevos(valors).then((res) => {
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
