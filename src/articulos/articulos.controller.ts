import { Controller, Post, Body } from "@nestjs/common";
import { ArticulosInterface } from "./articulos.interface";
import { articulosInstance } from "./articulos.clase";
import axios from "axios";
import { logger } from "../logger";
import { tecladoInstance } from "src/teclado/teclado.clase";
import { type } from "os";
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
  @Post("getArticuloById")
  async getArticuloById(@Body() { idArticulo }) {
    try {
      if (idArticulo)
        return await articulosInstance.getInfoArticulo(idArticulo);

      throw Error("Error, faltan datos en getArticuloById controller");
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
  async buscar(@Body() { busqueda, familia, limit }) {
    try {
      return await articulosInstance.buscarArticulos(busqueda, familia, limit);
      throw Error("Faltan datos en articulos/buscar");
    } catch (err) {
      logger.Error(138, err);
      return false;
    }
  }

  @Post("familias")
  async familias() {
    try {
      return await articulosInstance.getFamilies();
    } catch (err) {
      logger.Error(138, err);
      return false;
    }
  }

  @Post("editarArticulo")
  editarArticulo(@Body() params) {
    try {
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
              const editarArticulo: any = axios
                .post("articulos/editarArticulos", {
                  id: params.idArticulo,
                  nom: params.nombre,
                  preu: params.precioConIva,
                  desc: 1,
                  esSum: params.essumable,
                  tipoIva: params.tipoIva,
                })
                .catch((e) => {
                  console.log(e);
                });
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
    } catch (err) {
      return {
        error: true,
        mensaje: "Backend: Faltan datos en articulos/editarArticulo",
      };
    }
  }

  @Post("moverArticulo")
  moverArticulo(@Body() params) {
    try {
      if ((params.id, params.posicion, params.menu)) {
        return articulosInstance
          .MoverArticulo(params.id, params.posicion, params.menu)
          .then(async (res) => {
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
    } catch (err) {
      return {
        error: true,
        mensaje: "Backend: Faltan datos en articulos/editarArticulo",
      };
    }
  }

  @Post("eliminarMenu")
  eliminarMenu(@Body() params) {
    try {
      if (params.id) {
        return articulosInstance
          .EliminarArticulo(params.id)
          .then(async (res) => {
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
    } catch (err) {
      return {
        error: true,
        mensaje: "Backend: Faltan datos en articulos/editarArticulo",
      };
    }
  }

  @Post("eliminarArticulo")
  eliminarArticulo(@Body() params) {
    try {
      if (params.id) {
        return articulosInstance
          .EliminarArticulo(params.id)
          .then(async (res) => {
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
    } catch (err) {
      return {
        error: true,
        mensaje: "Backend: Faltan datos en articulos/editarArticulo",
      };
    }
  }

  @Post("saveTeclas")
  async saveTeclas(@Body() params) {
    axios
      .post("teclas/subirTeclas", {
        teclas: await tecladoInstance.getTeclas(),
      })
      .catch((e) => {
        console.log(e);
      });
  }

  @Post("anadirProducto")
  async anadirProducto(@Body() params) {
    try {
      if (
        params.nombreArticulo != undefined &&
        params.precioConIva != undefined &&
        params.precioBase != undefined &&
        params.tipoIva != undefined &&
        params.menus != undefined &&
        params.posicion != undefined &&
        params.articuloExistente != undefined
      ) {
        let id = -1;
        if (params.articuloExistente && params.idArticulo) {
          id = params.idArticulo;
          articulosInstance.insertarTeclasNuevos(
            params.menus,
            params.esSumable,
            params.nombreArticulo,
            params.idArticulo,
            params.posicion,
            params.precioConIva
          );
        } else {
          id = await articulosInstance.insertarArticulosNuevos(
            params.nombreArticulo,
            params.precioConIva,
            params.tipoIva,
            params.esSumable,
            params.menus,
            params.precioBase,
            params.posicion
          );
        }

        const subirArt: any = axios
          .post("articulos/subirArticulos", {
            nom: params.nombreArticulo,
            preu: params.precioConIva,
            pos: params.posicion,
            desc: 1,
            esSum: params.esSumable,
            familia: params.menus,
            idArticle: id,
            tipoIva: params.tipoIva,
          })
          .catch((e) => {
            console.log(e);
          });
      } else {
        return {
          error: true,
          mensaje: "Backend: Faltan datos en articulos/editarArticulo",
        };
      }
    } catch (err) {
      return {
        error: true,
        mensaje: "Backend: Faltan datos en articulos/editarArticulo",
      };
    }
  }
}
