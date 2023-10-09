import { Body, Controller, Post } from "@nestjs/common";
import { logger } from "../logger";
import { deudasInstance } from "./deudas.clase";

@Controller("deudas")
export class DeudasController {
  @Post("setDeuda")
  async setDeuda(@Body() data) {
    try {
      if (!data || !data.cesta.length || !data.total)
        return {
          error: true,
          msg: "Faltan datos.",
        };
      return deudasInstance.setDeuda(data);
    } catch (err) {
      logger.Error(510, err);
      return null;
    }
  }
  @Post("getDeudas")
  async getDeudas() {
    try {
      return await deudasInstance.getDeudas();
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }

  @Post("ticketPagado")
  async ticketPagado(@Body() data) {
    try {
      if (!data)
        return {
          error: true,
          msg: "Faltan datos.",
        };
      return deudasInstance.ticketPagado(data);
    } catch (err) {
      logger.Error(510, err);
      return null;
    }
  }
  @Post("eliminarDeuda")
  async eliminarDeuda(@Body() data) {
    try {
      if (!data)
        return {
          error: true,
          msg: "Faltan datos.",
        };
      return await deudasInstance.eliminarDeuda(data.idDeuda);
    } catch (err) {
      logger.Error(510, err);
      return null;
    }
  }

  @Post("importarDeudas")
  async importarDeudas(@Body() data) {
    const deudas = [
      {
        Botiga: 842,
        Data: "2023-06-20T16:53:11.000Z",
        Dependenta: 975,
        Num_tick: 545047,
        Estat: "",
        Plu: 8573,
        Quantitat: 1,
        Import: 1.85,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-06-22T15:49:58.000Z",
        Dependenta: 975,
        Num_tick: 545011,
        Estat: "",
        Plu: 8573,
        Quantitat: 2,
        Import: 3.7,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_552_20170302061714]",
      },
      {
        Botiga: 842,
        Data: "2023-06-08T16:07:21.000Z",
        Dependenta: 975,
        Num_tick: 545008,
        Estat: "",
        Plu: 8573,
        Quantitat: 1,
        Import: 1.85,
        Tipus_venta: "V",
        FormaMarcar: "0",
        Otros: "[Id:CliBoti_225_20170301092958]",
      },
      {
        Botiga: 842,
        Data: "2023-07-19T15:19:44.000Z",
        Dependenta: 3944,
        Num_tick: 545158,
        Estat: "842",
        Plu: 1328,
        Quantitat: 1,
        Import: 1.85,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_842_1680532232362]",
      },
      {
        Botiga: 842,
        Data: "2023-07-19T17:16:58.000Z",
        Dependenta: 3944,
        Num_tick: 545165,
        Estat: "842",
        Plu: 4709,
        Quantitat: 4,
        Import: 5.4,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_225_20170301103540]",
      },
      {
        Botiga: 842,
        Data: "2023-07-21T17:31:24.000Z",
        Dependenta: 3944,
        Num_tick: 545174,
        Estat: "842",
        Plu: 4178,
        Quantitat: 1,
        Import: 2.9000000000000004,
        Tipus_venta: "V",
        FormaMarcar: ",4019,4020",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-07-21T17:31:24.000Z",
        Dependenta: 3944,
        Num_tick: 545174,
        Estat: "842",
        Plu: 4431,
        Quantitat: 1,
        Import: 0.35,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-07-21T17:31:24.000Z",
        Dependenta: 3944,
        Num_tick: 545174,
        Estat: "842",
        Plu: 4431,
        Quantitat: 3,
        Import: 0.9,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-07-24T15:16:14.000Z",
        Dependenta: 3944,
        Num_tick: 545175,
        Estat: "842",
        Plu: 4709,
        Quantitat: 1,
        Import: 1.35,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_679_20170302065138]",
      },
      {
        Botiga: 842,
        Data: "2023-07-24T17:46:30.000Z",
        Dependenta: 3944,
        Num_tick: 545177,
        Estat: "842",
        Plu: 4560,
        Quantitat: 1,
        Import: 2,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-07-24T17:53:25.000Z",
        Dependenta: 3944,
        Num_tick: 545178,
        Estat: "842",
        Plu: 1328,
        Quantitat: 1,
        Import: 1.85,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-07-24T17:59:45.000Z",
        Dependenta: 3944,
        Num_tick: 545180,
        Estat: "842",
        Plu: 1328,
        Quantitat: 1,
        Import: 1.85,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-07-25T15:17:02.000Z",
        Dependenta: 3944,
        Num_tick: 545182,
        Estat: "842",
        Plu: 4391,
        Quantitat: 1,
        Import: 0,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-07-25T16:36:11.000Z",
        Dependenta: 3944,
        Num_tick: 545186,
        Estat: "842",
        Plu: 4560,
        Quantitat: 1,
        Import: 1.8,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-07-25T16:36:11.000Z",
        Dependenta: 3944,
        Num_tick: 545186,
        Estat: "842",
        Plu: 8567,
        Quantitat: 1,
        Import: 1.71,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-08-24T11:54:52.000Z",
        Dependenta: 3944,
        Num_tick: 545219,
        Estat: "",
        Plu: 4560,
        Quantitat: 2,
        Import: 4,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-08-24T11:54:52.000Z",
        Dependenta: 3944,
        Num_tick: 545219,
        Estat: "",
        Plu: 8568,
        Quantitat: 1,
        Import: 2,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-10-03T09:39:29.000Z",
        Dependenta: 3944,
        Num_tick: 545636,
        Estat: "842",
        Plu: 8572,
        Quantitat: 1,
        Import: 0.88,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-10-06T10:15:46.000Z",
        Dependenta: 3944,
        Num_tick: 545662,
        Estat: "842",
        Plu: 8571,
        Quantitat: 1,
        Import: 1.6,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-10-06T10:15:46.000Z",
        Dependenta: 3944,
        Num_tick: 545662,
        Estat: "842",
        Plu: 8572,
        Quantitat: 1,
        Import: 0.88,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-06-08T15:59:49.000Z",
        Dependenta: 975,
        Num_tick: 545007,
        Estat: "",
        Plu: 4560,
        Quantitat: 1,
        Import: 1.9,
        Tipus_venta: "V",
        FormaMarcar: "0",
        Otros: "[Id:CliBoti_225_20170302113421]",
      },
      {
        Botiga: 842,
        Data: "2023-06-08T16:10:28.000Z",
        Dependenta: 975,
        Num_tick: 545010,
        Estat: "",
        Plu: 4709,
        Quantitat: 1,
        Import: 1.3,
        Tipus_venta: "V",
        FormaMarcar: "0",
        Otros: "[Id:CliBoti_794_20170303100636]",
      },
      {
        Botiga: 842,
        Data: "2023-06-08T16:10:28.000Z",
        Dependenta: 975,
        Num_tick: 545010,
        Estat: "",
        Plu: 8573,
        Quantitat: 2,
        Import: 3.7,
        Tipus_venta: "V",
        FormaMarcar: "0",
        Otros: "[Id:CliBoti_794_20170303100636]",
      },
      {
        Botiga: 842,
        Data: "2023-06-22T15:55:06.000Z",
        Dependenta: 975,
        Num_tick: 545012,
        Estat: "",
        Plu: 8573,
        Quantitat: 1,
        Import: 1.85,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_679_20170302065138]",
      },
      {
        Botiga: 842,
        Data: "2023-07-19T15:25:42.000Z",
        Dependenta: 3944,
        Num_tick: 545159,
        Estat: "842",
        Plu: 8572,
        Quantitat: 1,
        Import: 1.1,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_225_20170301103540]",
      },
      {
        Botiga: 842,
        Data: "2023-07-19T15:56:23.000Z",
        Dependenta: 3944,
        Num_tick: 545161,
        Estat: "842",
        Plu: 350,
        Quantitat: 1,
        Import: 1.9,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_225_20170301102543]",
      },
      {
        Botiga: 842,
        Data: "2023-07-24T17:57:50.000Z",
        Dependenta: 3944,
        Num_tick: 545179,
        Estat: "842",
        Plu: 8567,
        Quantitat: 1,
        Import: 1.9,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-07-25T17:08:07.000Z",
        Dependenta: 3944,
        Num_tick: 545189,
        Estat: "842",
        Plu: 8572,
        Quantitat: 1,
        Import: 0.99,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
      {
        Botiga: 842,
        Data: "2023-07-25T17:08:07.000Z",
        Dependenta: 3944,
        Num_tick: 545189,
        Estat: "842",
        Plu: 8573,
        Quantitat: 1,
        Import: 1.845,
        Tipus_venta: "V",
        FormaMarcar: ",",
        Otros: "[Id:CliBoti_819_20200107103051]",
      },
    ];
    
    
    try {
      return await deudasInstance.insertarDeudas(deudas);
    } catch (error) {}
  }
}
