import { Controller, Post, Body } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { logger } from "../logger";
import { impresoraInstance } from "./impresora.class";
import { movimientosInstance } from "src/movimientos/movimientos.clase";
import { mqttInstance } from "src/mqtt";
import { io } from "src/sockets.gateway";
import { parametrosInstance } from "src/parametros/parametros.clase";
import { cajaInstance } from "src/caja/caja.clase";
import axios from "axios";
import { articulosInstance } from "../articulos/articulos.clase";
const printComandero = { enabled: false, setted: false };
@Controller("impresora")
export class ImpresoraController {
  @Post("imprimirTicket")
  async imprimirTicket(@Body() { idTicket, albaran = false }) {

    try {
      if (idTicket) {
        await impresoraInstance.imprimirTicket(idTicket, albaran);
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

  /* Uri*/
  @Post("imprimirTicketComandero")
  async imprimirTicketComandero(@Body() { products, table, worker, clients }) {
    if (!products || !table || !worker || !clients) {
      throw Error("Faltan datos en impresora/imprimirTicketComandero");
    }

    if (!printComandero.setted) {
      const articulos = await articulosInstance.getArticulos();
      printComandero.enabled = articulos.some(articulo => articulo.impresora !== null);
      printComandero.setted = true;
    }
    if (printComandero.enabled) {
      if (products.some(product => product.promocion)) {
        products = products.map(product => {
          if (product.promocion) {
            return product.promocion.grupos.map(promoProduct => {
              return {
                ...promoProduct[0],
              };
            });
          }
          return { ...product, impresora: product.impresora };
        }).flat();
      }

      const impresoras = products.map(product => product.impresora).filter(impresora => impresora);
      const impresorasUnicas = [...new Set(impresoras)];
      if (impresorasUnicas.length === 0) {
        throw Error("No hay impresoras disponibles");
      }
      for (const impresora of impresorasUnicas) {
        const productosFiltrados = products.filter(product => product.impresora === impresora);
        const topic = (impresora as string).toLowerCase().includes('cable') ? `hit.hardware/printer` : `hit.hardware/printerIP/${impresora}`;
        await impresoraInstance.imprimirComandero(productosFiltrados, table, worker, clients, topic);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      return true;
    }
  }

  /* Uri */

  @Post("imprimirTicketPaytef")
  async imprimirTicketPaytef(@Body() { idTicket }) {
    try {
      if (idTicket) {
        const tcod = (await parametrosInstance.getParametros()).payteftcod;
        let startDate = await cajaInstance.getInicioTime();
        let extraDataMovimiento: any = await axios.post("paytef/getTicket", {
          timeout: 10000,
          tcod: tcod,
          startDate: startDate,
          ticket: idTicket,
        });
        if (extraDataMovimiento == null || extraDataMovimiento.data == '')
          throw Error("Faltan datos en impresora/imprimirTicket");
        for (const x of ["TITULAR", "ESTABLECIMIENTO"]) {
          await impresoraInstance.imprimirTicketPaytef(
            extraDataMovimiento.data,
            x
          );
        }
        return true;
      }
      throw Error("Faltan datos en impresora/imprimirTicket");
    } catch (err) {
      console.log(err);
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
  async despedidaFirma(@Body() { idTicket, albaran = false }) {
    try {
      if (idTicket) {
        await impresoraInstance.imprimirFirma(idTicket, albaran);
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
    } catch (err) { }
  }

  @Post("detallesVip")
  async detallesVip(@Body() { lista, idCliente }) {
    try {
      if (lista && idCliente) {
        return await impresoraInstance.detallesTicket(lista, idCliente);
      }
      return false;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
  @Post("detalles")
  async detalles(@Body() { lista, idCliente }) {
    try {
      if (lista && idCliente) {
        return await impresoraInstance.precioUnitario(lista, idCliente);
      }
      return false;
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  @Post("imprimirComprobante3G")
  async imprimirComprobante3G(@Body() { idTicket }) {
    try {
      if (idTicket) {
        const movimientos = await movimientosInstance.getMovimentOfTicket(idTicket);
        let movimiento;
        if (Array.isArray(movimientos)) {
          movimiento = movimientos.find(
            (mov) => mov.tipo === "DATAFONO_3G" && mov.codigoBarras
          );
        } else {
          movimiento = (movimientos.tipo === "DATAFONO_3G" && movimientos.codigoBarras) ? movimientos : undefined;
        }
        await impresoraInstance.imprimirMov3G(movimiento, movimiento?.nombreCliente);
        return true;
      }
      throw Error("Faltan datos en impresora/imprimirComprobante3G");
    } catch (err) {
      logger.Error(139, err);
      return false;
    }
  }

}
