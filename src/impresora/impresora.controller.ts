import { Controller, Post, Body } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { logger } from "../logger";
import { impresoraInstance } from "./impresora.class";
import { movimientosInstance } from "src/movimientos/movimientos.clase";
import { mqttInstance } from "src/mqtt";
import { io } from "src/sockets.gateway";

@Controller("impresora")
export class ImpresoraController {
  @Post("imprimirTicket")
  async imprimirTicket(@Body() { idTicket }) {
    try {
      if (idTicket) {
        await impresoraInstance.imprimirTicket(idTicket);
        return true;
      }
      throw Error("Faltan datos en impresora/imprimirTicket");
    } catch (err) {
      logger.Error(139, err);
      return false;
    }
  }


  /* Yasai :D */
  @Post("reiniciarPapel")
  reiniciarPapel() {
    try {
      mqttInstance.resetPapel();
      return true;
    } catch (err) {
      logger.Error(139, err);
      return false;
    }
  }

  /* Uri */

  @Post("imprimirTicketPaytef")
  async imprimirTicketPaytef(@Body() { idTicket }) {
    try {
      if (idTicket) {
        let extraDataMovimiento = await movimientosInstance.getExtraData(
          idTicket
        );
        if (extraDataMovimiento == null)
          throw Error("Faltan datos en impresora/imprimirTicket");
        await impresoraInstance.imprimirTicketPaytef(
          extraDataMovimiento,
          "TITULAR"
        );
        await impresoraInstance.imprimirTicketPaytef(
          extraDataMovimiento,
          "ESTABLECIMIENTO"
        );
        return true;
      }
      throw Error("Faltan datos en impresora/imprimirTicket");
    } catch (err) {
      logger.Error(139, err);
      return false;
    }
  }

  @Post("abrirCajon")
  abrirCajon() {
    impresoraInstance.abrirCajon();
  }

  @Post("imprimirEntregas")
  imprimirEntregas() {
    return impresoraInstance.imprimirEntregas();
  }

  @Post("despedida")
  despedirCliente(@Body() params) {
    impresoraInstance.despedirCliente(params.precioTotal);
  }

  @Post("firma")
  async despedidaFirma(@Body() { idTicket }) {
    try {
      if (idTicket) {
        await impresoraInstance.imprimirFirma(idTicket);
        return true;
      }
      throw Error("Faltan datos en impresora/imprimirTicket");
    } catch (err) {
      logger.Error(139, err);
      return false;
    }
  }

  @Post("saludo")
  saludarCliente() {
    impresoraInstance.saludarCliente();
  }

  @Post("bienvenida")
  binvenidaCliente() {
    impresoraInstance.bienvenidaCliente();
  }

  @Post("getLogo")
  getLogo() {
    mqttInstance.mandarLogo();
  }

  @Post("testMqtt")
  async testMqtt() {
    try {
      await impresoraInstance.imprimirDevolucion(
        new ObjectId("639b1ea2d9aff66ec40a6ccf")
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  @Post("imprimirIntervaloDeuda")
  async imprimirIntervaloDeuda(@Body() params) {
    try {
      if (params.fechaFinal && params.fechaInicial)
        return await impresoraInstance.imprimirIntervaloDeuda(
          params.fechaInicial,
          params.fechaFinal
        );

      return false;
    } catch (err) {
      return false;
    }
  }

  @Post("pocoPapel")
  async pocoPapel() {
    try {
      io.emit("pocoPapel");
      return true;
    } catch (err) {}
  }
}
