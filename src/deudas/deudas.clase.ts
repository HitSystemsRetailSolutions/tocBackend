import { parametrosInstance } from "src/parametros/parametros.clase";
import { DeudasInterface } from "./deudas.interface";
import { logger } from "src/logger";
import axios from "axios";
import * as schDeudas from "./deudas.mongodb";
import { movimientosInstance } from "src/movimientos/movimientos.clase";
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
      "Deute_Boti_" +
      codigoTienda +
      "_dep_" +
      idTrabajador +
      "_" +
      dataDeuda.replace(/\D/g, "");
    return id;
  }
  // async getDeudas() {
  //   return await schEncargos.getEncargos();
  // }

  // getDeudaById = async (idEncargo:DeudasInterface["_id"]) =>
  //   await schEncargos.getEncargoById(idEncargo);

  setDeuda = async (deuda) => {
    const parametros = await parametrosInstance.getParametros();
    const dataDeuda = this.getDate(deuda.timestamp);
    const deuda_santAna = {
      id: this.getId(parametros.codigoTienda, deuda.idTrabajador, dataDeuda),
      timestamp: deuda.timestamp,
      dependenta: deuda.idTrabajador,
      cliente: deuda.idCliente,
      data: dataDeuda,
      estat: 0,
      tipus: 1,
      import: deuda.total,
      botiga: parametros.licencia,
      idTicket: deuda.idTicket,
      bbdd: parametros.database,
    };
    // Mandamos la deuda al SantaAna
    const { data }: any = await axios.post("deudas/setDeuda", deuda_santAna);
    // Si data no existe (null, undefined, etc...) o error = true devolvemos false
    if (!data || data.error) {
      // He puesto el 153 pero no se cual habría que poner, no se cual es el sistema que seguís
      logger.Error(153, "Error: no se ha podido crear la deuda en el SantaAna");
      return {
        error: true,
        msg: data.msg,
      };
    }
    // Si existe, llamámos a la función de setDeuda
    // que devuelve un boolean.
    deuda.pagado = false;

    return schDeudas
      .setDeuda(deuda)
      .then((ok: boolean) => {
        if (!ok) return { error: true, msg: "Error al crear la deuda" };
        return { error: false, msg: "Deuda creada" };
      })
      .catch((err: string) => ({ error: true, msg: err }));
  };
  async getDeudas() {
    return await schDeudas.getDeudas();
  }

  async ticketPagado(data) {
    const deuda = await schDeudas.getDeudaById(data.idDeuda);

    if (deuda) {
      const movimiento = {
        cantidad: deuda.total,
        concepto: "ENTRADA",
        idTicket: deuda.idTicket,
        idTrabajador: deuda.idTrabajador,
        tipo: "ENTRADA_DINERO",
      };
      const pagado = await movimientosInstance.nuevoMovimiento(
        movimiento.cantidad,
        movimiento.concepto,
        "ENTRADA_DINERO",
        Number(movimiento.idTicket),
        Number(movimiento.idTrabajador)
      );
      // sera false cuando se encuentre un movimiento existente de idTicket
      if (pagado) {
        await schDeudas
          .setPagado(deuda._id)
          .then(async (ok: boolean) => {
            if (!ok)
              return { error: true, msg: "Error al guardar deuda pagada" };
            const parametros = await parametrosInstance.getParametros();
            const dataDeuda = this.getDate(deuda.timestamp);
            const certificadoDeuda = {
              id: this.getId(
                parametros.codigoTienda,
                deuda.idTrabajador,
                dataDeuda
              ),
              timestamp: deuda.timestamp,
              dependenta: deuda.idTrabajador,
              cliente: deuda.idCliente,
              data: dataDeuda,
              estat: 0,
              tipus: 1,
              import: deuda.total,
              botiga: parametros.licencia,
              idTicket: deuda.idTicket,
              bbdd: parametros.database,
            };
             // Mandamos la deuda al SantaAna
            const { data }: any = await axios.post("deudas/setCertificadoDeuda", certificadoDeuda);
            return data;
          })
          .catch((err: string) => ({ error: true, msg: err }));
      }
    } else {
      return {
        error: true,
        msg: "Deuda no encontrada",
      };
    }
  }
  eliminarDeuda = async (idDeuda) => {
    return schDeudas
    .setPagado(idDeuda)
    .then((ok: boolean) => {
      if (!ok) return { error: true, msg: "Error al borrar la deuda" };
      return { error: false, msg: "Deuda borrada" };
    })
    .catch((err: string) => ({ error: true, msg: err }));
  }
}
const deudasInstance = new Deudas();
export { deudasInstance };
