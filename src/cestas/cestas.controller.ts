import { Controller, Post, Body, Get } from "@nestjs/common";
import { trabajadoresInstance } from "../trabajadores/trabajadores.clase";
import { cestasInstance } from "./cestas.clase";
import { logger } from "../logger";
import { UtilesModule } from "../utiles/utiles.module";
import axios from "axios";
import { articulosInstance } from "../articulos/articulos.clase";

@Controller("cestas")
export class CestasController {
  /* Eze 4.0 */
  @Post("borrarCesta")
  async borrarCesta(@Body() { idCesta }) {
    try {
      if (idCesta) return await cestasInstance.borrarArticulosCesta(idCesta);

      throw Error("Error, faltan datos en borrarCesta controller");
    } catch (err) {
      logger.Error(58, err);
      return false;
    }
  }
  /* Eze 4.0 */
  @Post("fulminarCesta")
  async fulminarCesta(@Body() { idCesta }) {
    try {
      if (idCesta) {
        if (await cestasInstance.deleteCestaMesa(idCesta)) {
          cestasInstance.actualizarCestas();
          return true;
        }
      }

      throw Error("Error, faltan datos en fulminarCesta controller");
    } catch (err) {
      logger.Error(121, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Post("borrarItemCesta")
  async borrarItemCesta(@Body() { idCesta, index }) {
    try {
      if (UtilesModule.checkVariable(index, idCesta))
        return await cestasInstance.borrarItemCesta(idCesta, index);
      throw Error("Error, faltan datos en borrarItemCesta controller");
    } catch (err) {
      logger.Error(59, err);
      return false;
    }
  }

  /* Uri */
  @Post("borrarUnicoItemCesta")
  async borrarUnicoItemCesta(@Body() { idCesta, articulos }) {
    try {
      return await cestasInstance.borrarUnicoItemCesta(idCesta, articulos);
    } catch (err) {
      console.log("s");
      logger.Error(59, err);
      return false;
    }
  }
  /* Uri */
  @Post("PagarPorSeparado")
  async PagarPorSeparado(@Body() { articulos }) {
    try {
        return await cestasInstance.CestaPagoSeparado(articulos);
      throw Error("Error, faltan datos en getCestaById() controller");
    } catch (err) {
      logger.Error(60, err);
      return null;
    }
  }

   /* Uri */
   @Post("DevolverProductosACestaSep")
   async DevolverProductosACestaSep(@Body() { cesta,articulos }) {
     try {
         return await cestasInstance.DevolverCestaPagoSeparado(cesta,articulos);
       throw Error("Error, faltan datos en getCestaById() controller");
     } catch (err) {
       logger.Error(60, err);
       return null;
     }
   }

  /* Eze 4.0  (probablemente no se usará porque irá por socket)*/
  @Post("getCestaById")
  async getCestaByID(@Body() { idCesta }) {
    try {
      if (idCesta) return await cestasInstance.getCestaById(idCesta);

      throw Error("Error, faltan datos en getCestaById() controller");
    } catch (err) {
      logger.Error(60, err);
      return null;
    }
  }

  /* Eze 4.0 */
  @Post("crearCesta")
  async crearCesta(@Body() { idTrabajador }) {
    try {
      if (idTrabajador) {
        const idCesta = await cestasInstance.crearCesta();
        if (await trabajadoresInstance.setIdCesta(idTrabajador, idCesta)) {
          cestasInstance.actualizarCestas();
          trabajadoresInstance.actualizarTrabajadoresFrontend();
          return true;
        }
      }
      throw Error("Error, faltan datos en crearCesta controller");
    } catch (err) {
      logger.Error(61, err);
      return false;
    }
  }
  /* Eze 4.0 */
  @Post("onlyCrearCestaParaMesa")
  async onlyCrearCesta(@Body() { indexMesa }) {
    try {
      if (typeof indexMesa === "number") {
        const idCesta = await cestasInstance.crearCesta(indexMesa);
        cestasInstance.actualizarCestas();
        return idCesta;
      }
      throw Error("Error, faltan datos en crearCesta controller");
    } catch (err) {
      logger.Error(61, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Post("cambiarCestaTrabajador")
  async cambiarCestaTrabajador(@Body() { idTrabajador, idCesta }) {
    try {
      if (idCesta && idTrabajador)
        if (await trabajadoresInstance.setIdCesta(idTrabajador, idCesta)) {
          await cestasInstance.actualizarCestas();
          await trabajadoresInstance.actualizarTrabajadoresFrontend();
          return true;
        }
      throw Error("Error, faltan datos en cambiarCestaTrabajador controller");
    } catch (err) {
      logger.Error(62, err);
      return false;
    }
  }

  /* Eze 4.0 => Tampoco creo que se utilice con el método de los sockets */
  @Get("getCestas")
  async getCestas() {
    try {
      return await cestasInstance.getAllCestas();
    } catch (err) {
      logger.Error(63, err);
      return null;
    }
  }

  /* Eze 4.0 */
  @Post("regalarProducto")
  async regalarProducto(@Body() { idCesta, indexLista }) {
    try {
      if (idCesta && typeof indexLista === "number")
        return await cestasInstance.regalarItem(idCesta, indexLista);
      throw Error("Error, faltan datos en regalarProducto controller");
    } catch (err) {
      logger.Error(64, err);
      return false;
    }
  }

  @Post("updateCestaInverso")
  async updateCestaInverso(@Body() { cesta }) {
    try {
      if (cesta) {
        return await cestasInstance.updateCesta(cesta);
      }
      throw Error("Error, faltan datos en cestas/updateCestaInverso");
    } catch (err) {
      logger.Error(133, err);
    }
  }

  // @Post("addSuplementos")
  // async addSuplementos(
  //   @Body() { idCesta, suplementos, idArticuloGeneral, unidades }
  // ) {
  //   try {
  //     if (idCesta && suplementos?.length > 0 && idArticuloGeneral && unidades)
  //       return await cestasInstance.addItemConSuplementos(
  //         idCesta,
  //         suplementos,
  //         idArticuloGeneral,
  //         unidades
  //       );
  //     throw Error("Es necesario un array con suplementos");
  //   } catch (err) {
  //     logger.Error("cestas.controller @addSuplementos", err);
  //   }
  // }
}
