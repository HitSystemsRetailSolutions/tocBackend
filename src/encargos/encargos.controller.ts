import { Body, Controller, Get, Post } from "@nestjs/common";
import { logger } from "../logger";
import { encargosInstance } from "./encargos.clase";
import axios from "axios";
import { parametrosInstance } from "src/parametros/parametros.clase";
import { impresoraInstance } from "src/impresora/impresora.class";

@Controller("encargos")
export class EncargosController {
  @Post("getEncargos")
  async getEncargos() {
    try {
      return await encargosInstance.getEncargos();
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }

  @Post("getPedidos")
  async getPedidos() {
    try {
      return await encargosInstance.getPedidos();
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }

  @Post("setCestaPedidos")
  async setCestaPedidos(@Body() data) {
    console.log("idencargo:",data.idEncargo);
    try {
      return await encargosInstance.setCestaPedidos(data.idEncargo, data.cesta);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }




  @Post("getEncargosByIdCliente")
  async getEncargosByIdCliente(@Body() data) {
    try {
      if (!data.idCliente) return null;
      return await encargosInstance.getEncargosByIdCliente(data.idCliente);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
  @Post("setEncargo")
  async setEncargo(@Body() data) {
    try {
      if (!data || !data.productos.length)
        return {
          error: true,
          msg: "Faltan datos.",
        };
      return encargosInstance.setEncargo(data);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
  @Post("anularEncargo")
  async anularEncargo(@Body() data) {
    try {
      if (!data.id)
        return {
          error: true,
          msg: "Faltan datos.",
        };

      return encargosInstance.setAnulado(data.id);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }

  @Post("imprimirEncargo")
  async imprimirEncargo(@Body() data) {
    try {
      if (!data.id)
        return {
          error: true,
          msg: "Faltan datos.",
        };
      const encargo = await encargosInstance.getEncargoById(data.id);
      if (!encargo)
        return {
          error: true,
          msg: "Error al obtener el encargo.",
        };

      return await encargosInstance.imprimirEncargoSelected(encargo);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
  @Post("imprimirEncargosHoy")
  async imprimirEncargosHoy(@Body() data) {
    try {
      if (!data.orden || !data.array)
        return {
          error: true,
          msg: "Faltan datos.",
        };

      return encargosInstance.ordenarImpresion(data.orden, data.array);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
  @Post("getEncargoById")
  async getEncargobyId(@Body() { idEncargo }) {
    try {
      if (idEncargo) return await encargosInstance.getEncargoById(idEncargo);
      throw Error("Error, faltan datos en getEncargoByNumber");
    } catch (err) {
      logger.Error(66, err);
      return null;
    }
  }
  @Post("getEncargoByNumber")
  async getEncargoByNumber(@Body() { idEncargo }) {
    try {
      if (idEncargo)
        return await encargosInstance.getEncargoByNumber(idEncargo);
      throw Error("Error, faltan datos en getEncargoByNumber");
    } catch (err) {
      logger.Error(66, err);
      return null;
    }
  }

  @Post("pruebaImportar")
  async pruebaImportar() {
    try {
      const encargos: any = await encargosInstance.pruebaImportar();
      return await encargosInstance.insertarEncargos(encargos);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
  @Post("descargarEncargos")
  async descargarEncargos() {
    try {
      await encargosInstance.borrarEncargos();
      const parametros: any = await parametrosInstance.getParametros();
      const data: any = {
        database: parametros.database,
        codigoTienda: parametros.codigoTienda,
        licencia: parametros.licencia,
      };

      const res: any = await axios.post("encargos/getEncargos", data);
      return await encargosInstance.insertarEncargos(res.data);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
  @Get("getUpdateEncargos")
  async getUpdateEncargos() {
    try {
      return await encargosInstance.getUpdateEncargos();
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
  @Post("setEntregado")
  async setEntregado(@Body() data) {
    try {
      if (!data.id)
        return {
          error: true,
          msg: "Faltan datos.",
        };

      await encargosInstance.setEntregado(data.id);

      return await encargosInstance.updateEncargoGraella(data.id);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
}
