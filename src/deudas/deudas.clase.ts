import { parametrosInstance } from "src/parametros/parametros.clase";
import { DeudasInterface } from "./deudas.interface";
import { logger } from "src/logger";
import axios from "axios";
import * as schDeudas from "./deudas.mongodb";
export class Deudas {
  getDate(timestamp: any) {
    var date = new Date(timestamp);

    // componentes de fecha
    var ano = date.getFullYear();
    var mes = ("0" + (date.getMonth() + 1)).slice(-2);
    var dia = ("0" + date.getDate()).slice(-2);
    var horas = ("0" + date.getHours()).slice(-2);
    var minutos = ("0" + date.getMinutes()).slice(-2);
    var segundos = ("0" + date.getSeconds()).slice(-2);
    var milisegundos = ("00" + date.getMilliseconds()).slice(-3);

    //fecha como "YYYY-MM-DD HH:MM:SS.000"
    var data =
      ano +
      "-" +
      mes +
      "-" +
      dia +
      " " +
      horas +
      ":" +
      minutos +
      ":" +
      segundos +
      "." +
      milisegundos;

    return data;
  }
  getId(codigoTienda: number, idTrabajador: any, dataDeuda: any) {
    
    let id =
      "Deute_Boti_" + codigoTienda + "_dep_" + idTrabajador + "_" + dataDeuda.replace(/\D/g, "");
    console.log(dataDeuda.replace(/\D/g, ""));
    return id;
  }
  // async getDeudas() {
  //   return await schEncargos.getEncargos();
  // }

  // getDeudaById = async (idEncargo:DeudasInterface["_id"]) =>
  //   await schEncargos.getEncargoById(idEncargo);

  setDeuda = async (deuda) => {
    const parametros = await parametrosInstance.getParametros();
    const dataDeuda=this.getDate(deuda.data)
    const deuda_santAna = {
      id: this.getId(
        parametros.codigoTienda,
        deuda.idTrabajador,
        dataDeuda,
      ),
      dependenta: deuda.idTrabajador,
      cliente: deuda.idCliente,
      data: this.getDate(deuda.data),
      estat: 0,
      tipus: 1,
      import: deuda.total,
      botiga: parametros.licencia,
      detall: "[NumTicket:" + deuda._id + "]",
    };
    // Mandamos la deuda al SantaAna
    const { data }: any = await axios.post(
      "encargos/setEncargo",
      deuda_santAna
    );
    // Si data no existe (null, undefined, etc...) o error = true devolvemos false
    if (!data || data.error) {
      // He puesto el 153 pero no se cual habría que poner, no se cual es el sistema que seguís
      logger.Error(153, "Error: no se ha podido crear la deuda en el SantaAna");
      return {
        error: true,
        msg: data.msg,
      };
    }
    // Si existe, llamámos a la función de setEncargo
    // que devuelve un boolean.
    // True -> Se han insertado correctamente el encargo.
    // False -> Ha habido algún error al insertar el encargo.
    deuda.pagado = false;

    return schDeudas
      .setDeuda(deuda)
      .then((ok: boolean) => {
        if (!ok) return { error: true, msg: "Error al crear el encargo" };
        return { error: false, msg: "Encargo creado" };
      })
      .catch((err: string) => ({ error: true, msg: err }));
  };
}
const deudasInstance = new Deudas();
export { deudasInstance };
