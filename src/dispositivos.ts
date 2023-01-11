import { parametrosInstance } from "./parametros/parametros.clase";

const escpos = require("escpos");
// const exec = require("child_process").exec;
const os = require("os");
escpos.Serial = require("escpos-serialport");
escpos.Screen = require("escpos-screen");
import { logger } from "./logger";

export class Dispositivos {
  async getDevice() {
    const parametros = await parametrosInstance.getParametros();
    if (os.platform() === "linux") {
    } else if (os.platform() === "win32") {
      try {
        if (parametros.tipoImpresora == "USB") {
          return new escpos.USB(
            parametros.impresoraUsbInfo.vid.toUpperCase(),
            parametros.impresoraUsbInfo.pid.toUpperCase()
          );
        } else if (parametros.tipoImpresora == "SERIE") {
          const port: any = "COM1";
          return new escpos.Serial(port, {
            baudRate: 115200,
            autoOpen: true,
          });
        } else {
          logger.Info("Parametros de impresora no configurados");
          return null;
        }
      } catch (err) {
        logger.Error(35, err.message);
        return null;
      }
    } else throw Error("Plataforma desconocida");
  }

  async getDeviceVisor() {
    const parametros = await parametrosInstance.getParametros();
    if (parametros.visor != undefined) {
      if(parametros.visor == 'MQTT'){
        return 'MQTT'
      }
      if (parametros.visor.includes("COM") || parametros.visor == "SI") {
        if (os.platform() === "win32") {
          const port: any = parametros.visor;
          const device = new escpos.Serial(port, {
            baudRate: 9600,
            autoOpen: true,
          });
          return device;
        } else if (os.platform() === "linux") {
          const port: any = "/dev/ttyUSB0";
          return new escpos.Serial(port, {
            baudRate: 9600,
            autoOpen: true,
          });
        }
      }
      return null;
    }
  }
}
