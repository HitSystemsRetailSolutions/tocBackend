import {
  SincroFichajesInterface,
  TrabajadoresInterface,
  TiposSincroFichaje,
} from "./trabajadores.interface";
import * as schTrabajadores from "./trabajadores.mongodb";
import { parametrosInstance } from "../parametros/parametros.clase";
import axios from "axios";
import { CestasInterface } from "../cestas/cestas.interface";
import { io } from "../sockets.gateway";
import { logger } from "../logger";

export class TrabajadoresClase {
  /* Eze 4.0 */
  getTrabajadorById = async (idTrabajador: number) =>
    await schTrabajadores.getTrabajador(idTrabajador);

  /* Eze 4.0 */
  buscar = async (busqueda: string) => await schTrabajadores.buscar(busqueda);

  /* Eze 4.0 */
  async mantenerTrabajadoresFichados(
    nuevoArray: TrabajadoresInterface[]
  ): Promise<TrabajadoresInterface[]> {
    const arrayFichados = await this.getTrabajadoresFichados();

    for (let i = 0; i < arrayFichados.length; i++) {
      for (let j = 0; j < nuevoArray.length; j++) {
        if (arrayFichados[i]._id == nuevoArray[j]._id) {
          nuevoArray[j]["fichado"] = true;
          break;
        }
      }
    }
    return nuevoArray;
  }

  /* Eze OK. NO 4.0 */
  async actualizarTrabajadores(): Promise<boolean> {
    const params = await parametrosInstance.getParametros();
    const res: any = await axios.post("dependientas/descargar", {
      database: params.database,
    });
    if (!res.data.error && res.data.info.length > 0) {
      const resKeep = await this.mantenerTrabajadoresFichados(res.data.info);
      if (resKeep.length > 0) {
        return await this.insertarTrabajadores(resKeep);
      } else {
        return true;
      }
    }
    throw Error(
      "Error, la información que llega desde San Pedro no es correcta en actualizarTrabajadores() class"
    );
  }

  /* Eze 4.0 */
  getTrabajadoresFichados = async (): Promise<TrabajadoresInterface[]> =>
    await schTrabajadores.getTrabajadoresFichados();

  /* Eze 4.0 */
  async ficharTrabajador(idTrabajador: number): Promise<boolean> {
    if (await schTrabajadores.ficharTrabajador(idTrabajador)) {
      return await this.nuevoFichajesSincro("ENTRADA", idTrabajador);
    }
    throw Error(
      "Error, no se ha podido fichar al trabajador ficharTrabajador() class"
    );
  }

  /* Eze 4.0 */
  async desficharTrabajador(idTrabajador: number): Promise<boolean> {
    if (await schTrabajadores.desficharTrabajador(idTrabajador)) {
      return await this.nuevoFichajesSincro("SALIDA", idTrabajador);
    }
    throw Error("No se ha podido desfichar al trabajador");
  }

  /* Eze 4.0 */
  async inicioDescanso(idTrabajador: number): Promise<boolean> {
    if (await schTrabajadores.inicioDescanso(idTrabajador)) {
      return await this.nuevoFichajesSincro("DESCANSO", idTrabajador);
    }

    throw Error("No se ha podido iniciar el descanso");
  }

  /* Eze 4.0 */
  async finDescanso(idTrabajador: number): Promise<boolean> {
    if (await schTrabajadores.ficharTrabajador(idTrabajador)) {
      return await this.nuevoFichajesSincro("FINDESCANSO", idTrabajador);
    }
    throw Error("No se ha podido fichar al trabajador");
  }

  /* Eze 4.0 */
  async nuevoFichajesSincro(
    tipo: TiposSincroFichaje,
    idTrabajador: number
  ): Promise<boolean> {
    const auxTime = new Date();
    const objGuardar: SincroFichajesInterface = {
      _id: Date.now(),
      infoFichaje: {
        idTrabajador: idTrabajador,
        fecha: {
          year: auxTime.getFullYear(),
          month: auxTime.getMonth(),
          day: auxTime.getDate(),
          hours: auxTime.getHours(),
          minutes: auxTime.getMinutes(),
          seconds: auxTime.getSeconds(),
        },
      },
      tipo: tipo,
      enviado: false,
    };
    return await schTrabajadores.insertNuevoFichaje(objGuardar);
  }

  /* Eze 4.0 */
  insertarTrabajadores = async (arrayTrabajadores: TrabajadoresInterface[]) =>
    await schTrabajadores.insertarTrabajadores(arrayTrabajadores);

  /* Eze 4.0 */
  getFichajeMasAntiguo = async () =>
    await schTrabajadores.getFichajeMasAntiguo();

  /* Eze 4.0 */
  getTrabajadoresDescansando = async () =>
    await schTrabajadores.getTrabajadoresDescansando();

  /* Eze 4.0 */
  actualizarEstadoFichaje = async (fichaje: SincroFichajesInterface) =>
    await schTrabajadores.actualizarEstadoFichaje(fichaje);

  /* Eze 4.0 */
  setIdCesta = async (
    idTrabajador: TrabajadoresInterface["_id"],
    idCesta: CestasInterface["_id"]
  ) => await schTrabajadores.setIdCestaTrabajador(idTrabajador, idCesta);

  /* Eze 4.0 */
  actualizarTrabajadoresFrontend() {
    this.getTrabajadoresFichados()
      .then((resTrabajadores) => {
        if (resTrabajadores && resTrabajadores.length > 0) {
          io.emit("cargarTrabajadores", resTrabajadores);
        }
        return null;
      })
      .catch((err) => {
        logger.Error(120, err);
      });
  }
}

export const trabajadoresInstance = new TrabajadoresClase();
