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
      return await encargosInstance.insertarEncargos(encargos);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
  @Post("insertarEncargos")
  async insertarEncargos() {
    try {
      // ejemplo para comprovar la funcion
      let encargo = [
        {
          Id: "Id_Enc_20230913102155_842_842_3944",
          Dependenta: 3944,
          Client: "[Id:CliBoti_819_20200107103051]",
          Data: "2023-09-14T13:21:00.000Z",
          Anticip: 1,
          Detall:
            "[DataCreat:2023-09-13 10:21:55.993][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:1][OpcionRec:2][codigoBarras:9884232561659][Dia:14-09-2023][Hora:13:21]",
          Article: 8910,
          Quantitat: 3,
          Import: 0.42,
          Descompte: "0",
          Comentari: ";0",
        },
        {
          Id: "Id_Enc_20230913102155_842_842_3944",
          Dependenta: 3944,
          Client: "[Id:CliBoti_819_20200107103051]",
          Data: "2023-09-14T13:21:00.000Z",
          Anticip: 1,
          Detall:
            "[DataCreat:2023-09-13 10:21:55.993][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:1][OpcionRec:2][codigoBarras:9884232561659][PromoArtPrinc:8910][Dia:14-09-2023][Hora:13:21]",
          Article: 4203,
          Quantitat: 1,
          Import: 0.41,
          Descompte: "0",
          Comentari: "promoComboArtSec;0",
        },
        {
          Id: "Id_Enc_20230913102155_842_842_3944",
          Dependenta: 3944,
          Client: "[Id:CliBoti_819_20200107103051]",
          Data: "2023-09-14T13:21:00.000Z",
          Anticip: 1,
          Detall:
            "[DataCreat:2023-09-13 10:21:55.993][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:1][OpcionRec:2][codigoBarras:9884232561659][PromoArtSec:4203][Dia:14-09-2023][Hora:13:21]",
          Article: 8910,
          Quantitat: 2,
          Import: 0.63,
          Descompte: "0",
          Comentari: ";0",
        },
        {
          Id: "Id_Enc_20230913102155_842_842_3944",
          Dependenta: 3944,
          Client: "[Id:CliBoti_819_20200107103051]",
          Data: "2023-09-14T13:21:00.000Z",
          Anticip: 1,
          Detall:
            "[DataCreat:2023-09-13 10:21:55.993][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:1][OpcionRec:2][codigoBarras:9884232561659][suplementos:4020,4180][Dia:14-09-2023][Hora:13:21]",
          Article: 4178,
          Quantitat: 1,
          Import: 1.68,
          Descompte: "0",
          Comentari: "4020,4180;0",
        },
        {
          Id: "Id_Enc_20230913102155_842_842_3944",
          Dependenta: 3944,
          Client: "[Id:CliBoti_819_20200107103051]",
          Data: "2023-09-14T13:21:00.000Z",
          Anticip: 1,
          Detall:
            "[DataCreat:2023-09-13 10:21:55.993][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:1][OpcionRec:2][codigoBarras:9884232561659][Dia:14-09-2023][Hora:13:21]",
          Article: 1022,
          Quantitat: 1,
          Import: 1.48,
          Descompte: "0",
          Comentari: ";0",
        },
      ];
      return await encargosInstance.insertarEncargos(encargo);
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
}
