import { Body, Controller, Post, Get } from "@nestjs/common";
import { parametrosInstance } from "./parametros.clase";
import axios from "axios";
import { UtilesModule } from "../utiles/utiles.module";
import { logger } from "../logger";
import { paytefInstance } from "src/paytef/paytef.class";
import { cajaInstance } from "src/caja/caja.clase";
import { setIpCashlogy } from "./parametros.mongodb";

@Controller("parametros")
export class ParametrosController {
  /* Eze 4.0 */
  @Get("todoInstalado")
  async todoInstalado() {
    try {
      return await parametrosInstance.todoInstalado();
    } catch (err) {
      logger.Error(40, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Post("getParametros")
  async getParametros() {
    try {
      return await parametrosInstance.getParametros();
    } catch (err) {
      logger.Error(41, err);
      return null;
    }
  }

  /* Uri */
  @Post("getPropiedad")
  async getPropiedad() {
    try {
      return await this.getConfiguradorDB();
    } catch (err) {
      logger.Error(43, err);
      return null;
    }
  }

  /* Uri */
  @Post("setPropiedad")
  async setPropiedad(@Body() { parametros }) {
    try {
      if (parametros) {
        await this.sendConfiguradorDB(parametros);
        return await parametrosInstance.setPropiedad(parametros);
      }

      throw Error("Faltan datos en parametros/setPropiedad");
    } catch (err) {
      logger.Error("parametros.controller.ts @setPropiedad");
      return false;
    }
  }

  /* Uri */
  async sendConfiguradorDB(params) {
    const parametros = await parametrosInstance.getParametros();
    const res: any = await axios
      .post("configurador/setConfiguration", {
        database: parametros.database,
        licencia: parametros.licencia,
        configuraciones: params,
        nombreEmpresa: parametros.nombreEmpresa,
        timeout: 30000,
      })
      .catch((e) => {
        console.log(e);
      });
    if (!res) {
      logger.Error("Error al sincronizar con SantaAna");
    }
  }

  /* Uri */
  async getConfiguradorDB() {

    const parametros = await parametrosInstance.getParametros();
    const res: any = await axios
      .post("configurador/getConfiguration", {
        database: parametros.database,
        licencia: parametros.licencia,
      })
      .catch((e) => {
        // console.log(e);
      });
    if (res.data) {
      return this.setPropiedad({ parametros: res.data });
    } else {
      throw Error("Error al sincronizar con SantaAna");
    }
  }

  /* Eze 4.0 */
  @Get("actualizarParametros")
  async actualizarParametros() {
    try {
      const res: any = await axios
        .get("parametros/getParametros")
        .catch((e) => {});

      if (res.data) {
        delete res.data.database;
        delete res.data.ultimoTicket;
        delete res.data.tipoImpresora;
        delete res.data.tipoDatafono;
        delete res.data.token;
        delete res.data.licencia;
        return await parametrosInstance.setParametros(res.data);
      }

      return false;
    } catch (err) {
      logger.Error(42, err);
      return false;
    }
  }

  /* Uri */
  @Post("setIpPaytef")
  async setIpPaytef(@Body() { ip }) {
    try {
      if (UtilesModule.checkVariable(ip))
        return await paytefInstance
          .detectarPytef(ip)
          .then(async (res) => {
            if (res == "error") return false;
            await parametrosInstance.setIpPaytef(ip);
            await parametrosInstance.setTcod(res);
            return true;
          })
          .catch((e) => {
            return false;
          });

      throw Error("Error, faltan datos en setIpPaytef() controller");
    } catch (err) {
      logger.Error(45, err);
      return false;
    }
  }

  @Post("setIpCashlogy")
  async setIpCashlogy(@Body("ip") ip: string) {
    //console.log(ip)
    try {
      const result = await setIpCashlogy(ip);

      if (result) {
        return { message: "IP almacenada correctamente", data: result };
      } else {
        throw new Error("Error al almacenar la IP");
      }
    } catch (err) {
      logger.Error(42, err);
      throw new Error("Error al almacenar la IP");
    }
  }

  /* Uri */
  @Post("setContadoDatafono")
  async setContadoDatafono(@Body() { suma }) {
    try {
      if (UtilesModule.checkVariable(suma))
        return await parametrosInstance.setIpPaytef(suma);
      throw Error("Error, faltan datos en setIpPaytef() controller");
    } catch (err) {
      logger.Error(45, err);
      return false;
    }
  }

  /* Uri */
  @Post("totalPaytef")
  async totalPaytef() {
    try {
      let startDate = await cajaInstance.getInicioTime();
      let localData = await parametrosInstance.totalPaytef();
      let paytefData = await paytefInstance.getRecuentoTotal(startDate);
      // devolerá el valor remoto, excepto que dé 0 y el local sea mayor
      if (paytefData == null || (paytefData == 0 && localData > 0))
        return [localData, true];
      return [paytefData, false];
    } catch (err) {
      let localData = await parametrosInstance.totalPaytef();
      logger.Error(55, err);
      return [localData, true];
    }
  }

  /* yasai :D */
  @Post("set3g")
  async set3g() {
    try {
      return await parametrosInstance.set3G();
    } catch (err) {
      logger.Error(45, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Get("getIpPaytef")
  async getIpPaytef() {
    try {
      return (await parametrosInstance.getParametros()).ipTefpay;
    } catch (err) {
      logger.Error(46, err);
      return null;
    }
  }

  @Get("getIpCashlogy")
  async getIpCashlogy() {
    try {
      return (await parametrosInstance.getParametros()).ipCashlogy;
    } catch (err) {
      logger.Error(46, err);
      return null;
    }
  }
}

const parametrosController = new ParametrosController();

export { parametrosController };
