import { Body, Controller, Post } from "@nestjs/common";
import { logger } from "../logger";
import { encargosInstance } from "./encargos.clase";
import axios from "axios";

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
  @Post("setEncargo")
  async setEncargo(@Body() data) {
    try {
      if (!data || !data.productos.length || !data.total)
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

      const anularEncargoSantaAna = await encargosInstance.anularTicket(
        data.id
      );
      if (anularEncargoSantaAna) return encargosInstance.setEntregado(data.id);

      return false;
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
      console.log("devuelto", encargos);
      return await encargosInstance.insertarEncargos(encargos);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
  @Post("insertarEncargo")
  async insertarEncargo() {
    try {
      let encargo = [
        {
          Id: "A76A0E8B-AD06-4103-A16C-DD5ED6BC642A",
          fechaEntrega: "2023-09-02T12:48:00.000Z",
          timestamp: "2023-08-29 11:48:54.936",
          Detall:
            "[DataCreat:2023-08-29 11:48:54.936][idServit:A76A0E8B-AD06-4103-A16C-DD5ED6BC642A][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:0][OpcionRec:2][Dia:02-09-2023][Hora:12:48]",
          idArticle: 4195,
          dependienta: 3944,
          cliente: "[Id:CliBoti_819_20200107103051]",
          comentario: ";0",
        },
        {
          id: "13B4D77A-7324-47F6-B778-E8E2AE0B1BF3",
          fechaEntrega: "2023-09-02T12:48:00.000Z",
          timestamp: "2023-08-29 11:48:54.936",
          detall:
            "[DataCreat:2023-08-29 11:48:54.936][idServit:13B4D77A-7324-47F6-B778-E8E2AE0B1BF3][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:0][OpcionRec:2][Dia:02-09-2023][Hora:12:48]",
          idArticle: 7585,
          dependienta: 3944,
          cliente: "[Id:CliBoti_819_20200107103051]",
          comentario: ";0",
        },
        {
          id: "C3D1B0C6-1AAD-4C5A-AE26-552FEA464EC0",
          fechaEntrega: "2023-09-02T12:48:00.000Z",
          timestamp: "2023-08-29 11:48:54.936",
          detall:
            "[DataCreat:2023-08-29 11:48:54.936][idServit:C3D1B0C6-1AAD-4C5A-AE26-552FEA464EC0][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:0][OpcionRec:2][Dia:02-09-2023][Hora:12:48]",
          idArticle: 4187,
          dependienta: 3944,
          cliente: "[Id:CliBoti_819_20200107103051]",
          comentario: ";0",
        },
        {
          id: "40B6107D-38E6-406A-B522-2DE1B8BA18F9",
          fechaEntrega: "2023-09-02T12:48:00.000Z",
          timestamp: "2023-08-29 11:48:54.936",
          detall:
            "[DataCreat:2023-08-29 11:48:54.936][idServit:40B6107D-38E6-406A-B522-2DE1B8BA18F9][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:0][OpcionRec:2][Dia:02-09-2023][Hora:12:48]",
          idArticle: 8910,
          dependienta: 3944,
          cliente: "[Id:CliBoti_819_20200107103051]",
          comentario: ";0",
        },
        {
          id: "0AC1DEDF-D316-47CB-B7A1-469CFEBE6259",
          fechaEntrega: "2023-09-02T12:48:00.000Z",
          timestamp: "2023-08-29 11:48:54.936",
          detall:
            "[DataCreat:2023-08-29 11:48:54.936][idServit:0AC1DEDF-D316-47CB-B7A1-469CFEBE6259][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:0][OpcionRec:2][Dia:02-09-2023][Hora:12:48]",
          idArticle: 4203,
          dependienta: 3944,
          cliente: "[Id:CliBoti_819_20200107103051]",
          comentario: "promoComboArtSec;0",
        },
        {
          id: "CA087899-25AF-48C8-BC5B-20F34A656493",
          fechaEntrega: "2023-09-02T12:48:00.000Z",
          timestamp: "2023-08-29 11:48:54.936",
          detall:
            "[DataCreat:2023-08-29 11:48:54.936][idServit:CA087899-25AF-48C8-BC5B-20F34A656493][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:0][OpcionRec:2][Dia:02-09-2023][Hora:12:48]",
          idArticle: 8910,
          dependienta: 3944,
          cliente: "[Id:CliBoti_819_20200107103051]",
          comentario: ";0",
        },
        {
          id: "5445E581-8E6A-4E46-A9A7-2F708A914526",
          fechaEntrega: "2023-09-02T12:48:00.000Z",
          timestamp: "2023-08-29 11:48:54.936",
          detall:
            "[DataCreat:2023-08-29 11:48:54.936][idServit:5445E581-8E6A-4E46-A9A7-2F708A914526][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:0][OpcionRec:2][Dia:02-09-2023][Hora:12:48]",
          idArticle: 4419,
          dependienta: 3944,
          cliente: "[Id:CliBoti_819_20200107103051]",
          comentario: ";0",
        },
      ];
      return await encargosInstance.insertarEncargo(encargo);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
}
