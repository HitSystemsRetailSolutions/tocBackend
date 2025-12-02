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
import { cestasInstance } from "src/cestas/cestas.clase";
import { cajaInstance } from "src/caja/caja.clase";
import { socket } from "src/sanPedro";
import { getDataVersion } from "src/version/version.clase";
import * as bcrypt from "bcrypt";
import { backupRestoreInstance } from "src/backuprestore/backup.class";

export class TrabajadoresClase {
  /* Eze 4.0 */
  getTrabajadorById = async (idTrabajador: number) =>
    await schTrabajadores.getTrabajador(idTrabajador);

  /* Eze 4.0 */
  buscar = async (busqueda: string) => await schTrabajadores.buscar(busqueda);

  buscarSinFichar = async (busqueda: string) =>
    await schTrabajadores.buscarSinFichar(busqueda);

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
  async actualizarTrabajadores(): Promise<any> {
    await backupRestoreInstance.backupCollection("trabajadores");
    try {
      const res: any = await axios.get("trabajadores/getTrabajadores", {});
      if (res.data.error) {
        throw Error(
          "Error, la información que llega desde San Pedro no es correcta en actualizarTrabajadores() class"
        );
      }

      if (res.data.info.length == 0) {
        throw Error("Error, no hay trabajadores");
      }

      const resKeep = await this.mantenerTrabajadoresFichados(res.data.info);

      try {
        return await this.insertarTrabajadores(resKeep);
      } catch (err) {
        // recuperar copia de seguridad de trabajadores
        logger.Error(114, "actualizarTrabajadores", err);
        const restore =
          await backupRestoreInstance.restoreCollection("trabajadores");

        return restore
          ? { error: true, restore: "success", message: err.message }
          : { error: true, restore: "failed", message: err.message };
      }
    } catch (err) {
      logger.Error(114, "actualizarTrabajadores", err);
      return { error: true, restore: "not_used", message: err.message };
    }
  }

  /* Eze 4.0 */
  getTrabajadoresFichados = async (): Promise<TrabajadoresInterface[]> =>
    await schTrabajadores.getTrabajadoresFichados();

  /* Eze 4.0 */
  getTrabajadorFichados = async (trabajador) =>
    await schTrabajadores.getTrabajadorFichados(trabajador);

  /* Eze 4.0 */
  async ficharTrabajador(idTrabajador: number): Promise<boolean> {
    if (await schTrabajadores.ficharTrabajador(idTrabajador)) {
      const arrayFichados = (await cajaInstance.getInfoCajaAbierta())?.fichajes;
      if (!arrayFichados || !arrayFichados.includes(idTrabajador)) {
        let array = arrayFichados ? arrayFichados : [];
        array.push(idTrabajador);
        await cajaInstance.postFichajesCaja(array);
      }
      const fichados = await this.nuevoFichajesSincro("ENTRADA", idTrabajador);
      await trabajadoresInstance.actualizarTrabajadoresFrontend();
      cestasInstance.actualizarCestas();
      return fichados;
    }
    throw Error(
      "Error, no se ha podido fichar al trabajador ficharTrabajador() class"
    );
  }

  /* Eze 4.0 */
  async desficharTrabajador(idTrabajador: number): Promise<boolean> {
    const trabajador = await schTrabajadores.getTrabajador(idTrabajador);
    await cestasInstance.borrarTrabajadores(idTrabajador);
    if (trabajador.idCesta) {
      await cestasInstance.deleteCesta(trabajador._id);
      cestasInstance.actualizarCestas();
    }
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
          month: auxTime.getMonth() + 1, //Enero equivale al mes 0
          day: auxTime.getDate(),
          hours: auxTime.getHours(),
          minutes: auxTime.getMinutes(),
          seconds: auxTime.getSeconds(),
        },
      },
      tipo: tipo,
      enviado: false,
      dataVersion: getDataVersion(),
    };
    return await schTrabajadores.insertNuevoFichaje(objGuardar);
  }

  /* Eze 4.0 */
  insertarTrabajadores = async (arrayTrabajadores: TrabajadoresInterface[]) => {
    const saltRounds = 10;

    for (const trabajador of arrayTrabajadores) {
      if (trabajador.password) {
        trabajador.password = await bcrypt.hash(
          trabajador.password,
          saltRounds
        );
      }
    }

    return await schTrabajadores.insertarTrabajadores(arrayTrabajadores);
  };

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
  /* Eze 4.0 */
  actualizarSoloTrabajadorFrontend(t) {
    this.getTrabajadorFichados(t)
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

  /* Uri */
  usarTrabajador = async (idTrabajador, inUse) => {
    if (!idTrabajador) return null;
    return await schTrabajadores.usarTrabajador(idTrabajador, inUse);
  };

  /* Uri */
  trabajadorActivo = async (idTrabajador) => {
    if (!idTrabajador) return;
    return await schTrabajadores.trabajadorActivo(idTrabajador);
  };
  setTrabajadorActivo = async (idTrabajador) => {
    if (!idTrabajador) return;
    return await schTrabajadores.setTrabajadorActivo(idTrabajador);
  };

  /* Uri */
  removeActiveEmployers = async () => {
    try {
      await schTrabajadores.removeActiveEmployers().then((res) => {});
    } catch (err) {
      logger.Error(36, err);
    }
  };

  getFichajesIntervalo = async (fechaInicio, fechaFin, trabajador) => {
    return await schTrabajadores.getFichajesIntervalo(
      fechaInicio,
      fechaFin,
      trabajador
    );
  };

  getRol = async (idTrabajador) => {
    const res = await schTrabajadores.getRol(idTrabajador);
    if (res) {
      return res;
    } else {
      return null;
    }
  };

  getRepartidores = async () => {
    const res = await schTrabajadores.getRepartidores();
    if (res) {
      return res;
    } else {
      return null;
    }
  };

  checkPassword = async (idTrabajador, password) => {
    const res = await schTrabajadores.getTrabajador(idTrabajador);
    if (res && res.password) {
      const match = await bcrypt.compare(password, res.password);
      if (match) {
        return true;
      } else {
        return false;
      }
    } else {
      console.log("No existe el trabajador o no tiene password");
      return null;
    }
  };
}

export const trabajadoresInstance = new TrabajadoresClase();
