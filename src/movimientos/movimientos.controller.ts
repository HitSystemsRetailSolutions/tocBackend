import { Controller, Post, Body, Get } from "@nestjs/common";
import { UtilesModule } from "../utiles/utiles.module";
import { movimientosInstance } from "./movimientos.clase";
import { logger } from "../logger";
import { parametrosController } from "../parametros/parametros.controller";
import axios from "axios";
import { cajaInstance } from "src/caja/caja.clase";

@Controller("movimientos")
export class MovimientosController {
  /* Yasai :D */
  @Post("nuevoMovimiento") // Solo para entradas o salidas manuales (idTicket = null)
  async nuevoMovimiento(@Body() { cantidad, concepto, idTrabajador, tipo, nombreCliente=null,idTicket=null }) {
    try {
      if (
        cantidad &&
        UtilesModule.checkVariable(concepto, idTrabajador, tipo)
      ) {
        return movimientosInstance.nuevoMovimiento(
          cantidad,
          concepto,
          tipo,
          idTicket,
          idTrabajador,
          nombreCliente
        );
      }
      throw Error("Error, faltan datos en nuevoMovimiento() controller");
    } catch (err) {
      logger.Error(99, err);
      return false;
    }
  }
  @Get("getSalidasIntervalo")
  async getSalidasIntervalo() {
    try {
      const horaApertura = (await cajaInstance.getInfoCajaAbierta()).inicioTime;
      const final = Date.now();
      return await movimientosInstance.getSalidasIntervalo(horaApertura, final);
    } catch (err) {
      logger.Error(54, err);
      console.log(err);
      return 0;
    }
  }
  @Get("getEntradasIntervalo")
  async getEntradasIntervalo() {
    try {
      const horaApertura = (await cajaInstance.getInfoCajaAbierta()).inicioTime;
      const final = Date.now();
      return await movimientosInstance.getEntradasIntervalo(
        horaApertura,
        final
      );
    } catch (err) {
      logger.Error(98, err);
      console.log(err);
      return 0;
    }
  }
  @Post("getMovimientosIntervalo")
  async getMovimientosIntervalo(@Body() { inicio, final }) {
    try {
      if (inicio && final)
        return await movimientosInstance.getMovimientosIntervalo(inicio, final);
      else throw Error("Faltan datos en movimientos/getMovimientosIntervalo");
    } catch (err) {
      logger.Error(142, err);
      return false;
    }
  }
  /* Yasai :D */
  @Post("getPred")
  async getPred() {
    const { licencia, database } = await parametrosController.getParametros();
    let prediccion = undefined;
    await axios
      .post("/movimientos/getPrediccion", { tienda: licencia, database })
      .then((res) => {
        prediccion = res.data;
      })
      .catch((err) => {
        prediccion = -1;
      });
    return prediccion;
  }
  @Get("getMovTkrsSinExcIntervalo")
  async getMovTkrsSinExcIntervalo() {
    try {
      const inicioTime = (await cajaInstance.getInfoCajaAbierta()).inicioTime;
      const finalTime = Date.now();
      return await movimientosInstance.getMovTkrsSinExcIntervalo(
        inicioTime,
        finalTime
      );
    } catch (err) {
      logger.Error(99, err);
      console.log(err);
      return 0;
    }
  }
  @Get("getDat3GDeudaPagada")
  async getDat3GDeudaPagada() {
    try {
      const inicioTime = (await cajaInstance.getInfoCajaAbierta()).inicioTime;
      const finalTime = Date.now();
      return await movimientosInstance.getDat3GDeudaPagada(
        inicioTime,
        finalTime
      );
    } catch (err) {
      logger.Error(99, err);
      console.log(err);
      return 0;
    }
  }
  @Post("PayWithCash")
  async PayWithCash(@Body() { idTicket }) {
    try {
      return await movimientosInstance.payWithCash(idTicket);
      return null;
    } catch (err) {
      logger.Error(99, err);
      console.log(err);
      return 0;
    }
  }
  @Post("PayWith3G")
  async PayWith3G(@Body() { idTicket }) {
    try {
      return await movimientosInstance.PayWith3G(idTicket);
      return null;
    } catch (err) {
      logger.Error(99, err);
      console.log(err);
      return 0;
    }
  }
  @Post("getMovsDatafono3G")
  async getMovsDatafono3G() {
    try {
      const inicioTime = (await cajaInstance.getInfoCajaAbierta()).inicioTime;
      const finalTime = Date.now();
      return await movimientosInstance.getMovsDatafono3G(inicioTime, finalTime);
    } catch (err) {
      logger.Error(99, err);
      console.log(err);
      return 0;
    }
  }

  @Get("verifyCurrentBoxEntregaDiaria")
  async verifyCurrentBoxEntregaDiaria() {
    try {
      return await movimientosInstance.verifyCurrentBoxEntregaDiaria();
    } catch (err) {
      logger.Error(102, err);
      return false;
    }
  }
}
