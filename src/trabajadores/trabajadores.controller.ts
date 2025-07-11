import { Body, Controller, Post, Get, Query } from "@nestjs/common";
import { trabajadoresInstance } from "./trabajadores.clase";
import { cestasInstance } from "../cestas/cestas.clase";
import { logger } from "../logger";
import { io } from "src/sockets.gateway";
import { parametrosInstance } from "src/parametros/parametros.clase";
import axios from "axios";

@Controller("trabajadores")
export class TrabajadoresController {
  /* Eze 4.0 */
  @Get("getTrabajadoresFichados")
  async getTrabajadoresFichados() {
    try {
      return await trabajadoresInstance.getTrabajadoresFichados();
    } catch (err) {
      logger.Error(109, err);
      return null;
    }
  }

  /* Eze 4.0 */
  @Get("hayFichados")
  async hayFichados() {
    try {
      const arrayFichados =
        await trabajadoresInstance.getTrabajadoresFichados();
      return arrayFichados && arrayFichados.length > 0;
    } catch (err) {
      logger.Error(110, err);
      return false;
    }
  }

  @Get("getFichajesIntervalo")
  async getTotalsIntervalo(
    @Query() data: { inicioTime; finalTime; trabajador }
  ) {
    try {
      if (!data.inicioTime || !data.finalTime || !data.trabajador) {
        throw Error("faltan datos en getFichajesIntervalo");
      }
      return await trabajadoresInstance.getFichajesIntervalo(
        data.inicioTime,
        data.finalTime,
        data.trabajador
      );
    } catch (error) {
      logger.Error(137, error);
      return null;
    }
  }

  /* Eze 4.0 */
  @Post("buscar")
  async buscar(@Body() { busqueda }) {
    try {
      return await trabajadoresInstance.buscar(busqueda);
    } catch (err) {
      logger.Error(111, err);
      return null;
    }
  }

  /* Eze 4.0 */
  @Post("buscarSinFichar")
  async buscarSinFichar(@Body() { busqueda }) {
    try {
      let x = await trabajadoresInstance.buscarSinFichar(busqueda);
      return x;
    } catch (err) {
      logger.Error(111, err);
      return null;
    }
  }

  /* Urii */
  @Post("setTrabajadorActivo")
  async setTrabajadorActivo(@Body() { id }) {
    try {
      let x = await trabajadoresInstance.setTrabajadorActivo(id);
      return x;
    } catch (err) {
      logger.Error(111, err);
      return null;
    }
  }

  /* Eze 4.0 */
  @Post("fichar")
  async fichar(@Body() { idTrabajador }) {
    try {
      const arrayFichados =
        await trabajadoresInstance.getTrabajadoresFichados();
      //console.log(arrayFichados);

      // Verificar si el trabajador ya está fichado
      const trabajadorYaFichado = arrayFichados.find(
        (trabajador) => trabajador.idTrabajador === idTrabajador
      );
      if (trabajadorYaFichado) {
        throw new Error("El trabajador ya ha fichado anteriormente.");
      }

      if (idTrabajador) {
        const idCesta = await cestasInstance.crearCesta(null, idTrabajador);
        if (await trabajadoresInstance.setIdCesta(idTrabajador, idCesta)) {
          return trabajadoresInstance.ficharTrabajador(idTrabajador);
        }
        throw new Error(
          "Error, no se ha podido asignar el idCesta nuevo al trabajador. trabajadores controller"
        );
      }
      throw new Error(
        "Error, faltan datos en fichar() trabajadores controller"
      );
    } catch (err) {
      logger.Error(112, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Post("desfichar")
  async desfichar(@Body() { idTrabajador }) {
    try {
      if (idTrabajador) {
        await trabajadoresInstance.usarTrabajador(idTrabajador, false);
        return await trabajadoresInstance.desficharTrabajador(idTrabajador);
      }
      throw Error("Error, faltan datos en desfichar() controller");
    } catch (err) {
      logger.Error(113, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Get("actualizarTrabajadores")
  async actualizarTrabajadores() {
    try {
      return await trabajadoresInstance.actualizarTrabajadores();
    } catch (err) {
      logger.Error(114, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Post("inicioDescanso")
  async inicioDescanso(@Body() { idTrabajador }) {
    try {
      if (idTrabajador)
        return await trabajadoresInstance.inicioDescanso(idTrabajador);
      throw Error("Error, faltan datos en inicioDescanso() controller");
    } catch (err) {
      logger.Error(115, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Post("finDescanso")
  async finDescanso(@Body() { idTrabajador }) {
    try {
      if (idTrabajador)
        return await trabajadoresInstance.finDescanso(idTrabajador);
      else throw Error("Error en trabajadores/finDescanso");
    } catch (err) {
      logger.Error(116, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Get("descansando")
  async getTrabajadoresDescansando() {
    try {
      return await trabajadoresInstance.getTrabajadoresDescansando();
    } catch (err) {
      logger.Error(132, err);
      return false;
    }
  }

  /* uri :) */
  @Post("cambiarTrabajador")
  async cambiarTrabajador(@Body() { idAntiguo, idNuevo, forced = false }) {
    try {
      const inUse = (await trabajadoresInstance.trabajadorActivo(idNuevo))
        .activo;
      if (inUse && !forced) return 0;

      let result = false;
      if (idAntiguo)
        result = await trabajadoresInstance.usarTrabajador(idAntiguo, false);

      if (!result && idAntiguo) return 1;
      let res = (await trabajadoresInstance.usarTrabajador(idNuevo, true))
        ? 2
        : 1;
      if (res == 2)
        io.emit("nuevoTrabajadorActivo", {
          id: idNuevo,
        });
      return res;
    } catch (err) {
      logger.Error(132, err);
      return false;
    }
  }

  @Post("getTrabajadorById")
  async getTrabajadorById(@Body() { idTrabajador }) {
    try {
      if (idTrabajador) {
        return await trabajadoresInstance.getTrabajadorById(idTrabajador);
      }
      throw Error("Faltan datos en trabajadores/getTrabajadorById");
    } catch (err) {
      logger.Error(141, err);
      return false;
    }
  }

  @Post("getRol")
  async getRol(@Body() { idTrabajador }) {
    try {
      if (idTrabajador) {
        return await trabajadoresInstance.getRol(idTrabajador);
      }
      throw Error("Faltan datos en trabajadores/getTrabajadorById");
    } catch (err) {
      logger.Error(141, err);
      return false;
    }
  }
  @Post("checkPassword")
  async checkPassword(@Body() { idTrabajador, password }) {
    try {
      if (idTrabajador && password) {
        return await trabajadoresInstance.checkPassword(
          idTrabajador,
          password
        );
      }
      throw Error("Faltan datos en trabajadores/checkPassword");
    } catch (err) {
      logger.Error(141, err);
      return false;
    }
  }
}
