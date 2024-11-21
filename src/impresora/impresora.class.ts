import { articulosInstance } from "../articulos/articulos.clase";
import { ticketsInstance } from "../tickets/tickets.clase";
import { trabajadoresInstance } from "../trabajadores/trabajadores.clase";
import { TrabajadoresInterface } from "../trabajadores/trabajadores.interface";
import { clienteInstance } from "../clientes/clientes.clase";
import { parametrosInstance } from "../parametros/parametros.clase";
import axios from "axios";
import { mqttInstance } from "../mqtt";
import {
  descuentoEspecial,
  ClientesInterface,
} from "../clientes/clientes.interface";
import { CestasInterface, ItemLista } from "../cestas/cestas.interface";
import { devolucionesInstance } from "../devoluciones/devoluciones.clase";
import { ObjectId } from "mongodb";
import { movimientosInstance } from "../movimientos/movimientos.clase";
import { MovimientosInterface } from "../movimientos/movimientos.interface";
import * as moment from "moment";
import { CajaSincro } from "../caja/caja.interface";
import { logger } from "../logger";
import { nuevaInstancePromociones } from "../promociones/promociones.clase";
import { buffer } from "stream/consumers";
import * as schDeudas from "../deudas/deudas.mongodb";
import { conexion } from "../conexion/mongodb";
import { sprintf } from "sprintf-js";
import { paytefInstance } from "src/paytef/paytef.class";
import { deudasInstance } from "src/deudas/deudas.clase";
import * as CryptoJS from "crypto";
import { EncargosInterface } from "src/encargos/encargos.interface";
import { TicketsInterface } from "src/tickets/tickets.interface";
import { AlbaranesInstance } from "src/albaranes/albaranes.clase";
import { CestasController } from "src/cestas/cestas.controller";
import { Console, info } from "console";
import { tiposIvaInstance } from "../tiposIva/tiposIva.clase";
import { redondearPrecio } from "src/funciones/funciones";

moment.locale("es");
const escpos = require("escpos");
const exec = require("child_process").exec;
const os = require("os");
const mqtt = require("mqtt");
escpos.Network = require("escpos-network");
const TIPO_ENTRADA_DINERO = "ENTRADA";
const TIPO_SALIDA_DINERO = "SALIDA";
let imprimirTimeout = null;
// array que enviara los mensajes generados en un corto periodo de tiempo a impresora
// Y evitar el fallo de que algunos mensajes no se imprimían
let mensajesPendientes = [];
function random() {
  const numero = Math.floor(10000000 + Math.random() * 999999999);
  return numero.toString(16).slice(0, 8);
}

// function encryptWhatsapp(text: string) {
//   let encoding: BufferEncoding = "hex";

//   let key: string = "buscoUnTrosDAhirPerEncriptarHITs";

//   function encrypt(plaintext: string) {
//     try {
//       const iv = CryptoJS.randomBytes(16);
//       const cipher = CryptoJS.createCipheriv("aes-256-cbc", key, iv);

//       const encrypted = Buffer.concat([
//         cipher.update(plaintext, "utf-8"),
//         cipher.final(),
//       ]);

//       return iv.toString(encoding) + encrypted.toString(encoding);
//     } catch (e) {
//       console.error(e);
//     }
//   }
//   return encrypt(text);
// }

function encryptWhatsapp(text) {
  return Buffer.from(text, "utf8").toString("base64");
}

// consts para detalles al imprimir
const cMargen = 1; // margen entre columna 1x4=4 caracteres
const cLongQuant = 6;
const cLongArticulo = 19;
const cLongPreuU = 6;
const cLongDto = 5;
const cLongImporte = 8;
// long maxima de la linea
const cLongMax = 48;
// distintos formatos de detalle dependiendo si se muestra preuU, dto,etc:
// 0: incluye dto y preuU; 1: incluye dto; 2: incluye preuU; 3: no incluye dto ni preuU; 4: formato albNPT
const formatoDetalle = [
  "Quant    Article          Preu U.  Dto  Import €",
  "Quant    Article                   Dto  Import €",
  "Quant    Article               Preu U.  Import €",
  "Quant    Article                     Import €   ",
  "Quant    Article                                ",
];

/* Función auxiliar borrar cuando sea posible */
function dateToString2(fecha) {
  let fechaFinal;
  if (typeof fecha === "string" || typeof fecha === "number") {
    fechaFinal = new Date(fecha);
  }

  const finalYear = `${fechaFinal.getFullYear()}`;
  let finalMonth = `${fechaFinal.getMonth() + 1}`;
  let finalDay = `${fechaFinal.getDate()}`;
  let finalHours = `${fechaFinal.getHours()}`;
  let finalMinutes = `${fechaFinal.getMinutes()}`;
  let finalSeconds = `${fechaFinal.getSeconds()}`;

  if (finalMonth.length === 1) {
    finalMonth = "0" + finalMonth;
  }
  if (finalDay.length === 1) {
    finalDay = "0" + finalDay;
  }
  if (finalHours.length === 1) {
    finalHours = "0" + finalHours;
  }
  if (finalMinutes.length === 1) {
    finalMinutes = "0" + finalMinutes;
  }
  if (finalSeconds.length === 1) {
    finalSeconds = "0" + finalSeconds;
  }
  return `${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}`;
}

export class Impresora {
  /* Eze 4.0 */
  async bienvenidaCliente() {
    mqttInstance.enviarVisor("Bon Dia!!");
  }

  /* Eze 4.0 */
  async despedirCliente(data: number) {
    let dataString: string = data.toString();
    let linea1Visor =
      "Moltes gracies!!    " + "Total: " + dataString.replace(",", ".") + "E";
    let restar = linea1Visor;
    linea1Visor += "                                        ";

    let lineasVisor: string = linea1Visor.substring(
      0,
      linea1Visor.length - restar.length
    );
    mqttInstance.enviarVisor(lineasVisor);
  }

  async saludarCliente() {
    let txt = "Bon Dia!            Caixa oberta        ";
    mqttInstance.enviarVisor(txt);
  }

  /* Eze 4.0 */
  async imprimirTicket(idTicket: number, albaran = false) {
    // recoge el ticket por la id

    const ticket = albaran
      ? await AlbaranesInstance.getAlbaranById(idTicket)
      : await ticketsInstance.getTicketById(idTicket);

    const parametros = await parametrosInstance.getParametros();
    // insertamos parametro imprimir y enviado en false al ticket para enviarlo al santaAna
    if (!ticket?.imprimir && !albaran) {
      // solo entramos si nunca antes se habia imprimido antes el ticket
      await ticketsInstance.insertImprimir(idTicket);
    }
    const trabajador: TrabajadoresInterface =
      await trabajadoresInstance.getTrabajadorById(ticket.idTrabajador);
    // Preparamos el objeto que vamos a mandar a la impresora
    let sendObject;
    // Si el ticket existe y el trabajador tambien
    if (ticket && trabajador) {
      let infoCliente = await clienteInstance.getClienteById(ticket.idCliente);
      // Si el ticket tiene cliente imprimimos los datos del cliente tambien
      if (ticket.idCliente && ticket.idCliente != "") {
        // recogemos los datos del cliente

        const puntos = await clienteInstance.getPuntosCliente(ticket.idCliente);
        const descuento =
          infoCliente && !infoCliente?.albaran && !infoCliente?.vip
            ? Number(infoCliente.descuento)
            : 0;

        let informacionVip = infoCliente
          ? {
              nombre: infoCliente.nombre,
              nif: infoCliente["nif"] === "0" ? "" : infoCliente["nif"],
              direccion:
                infoCliente["direccion"] === "0"
                  ? ""
                  : infoCliente["direccion"],
              telefono:
                infoCliente["telefono"] === "0" ? "" : infoCliente["telefono"],
            }
          : null;

        let totalSinDescuento = 0;
        for (let i = 0; i < ticket.cesta.lista.length; i++) {
          totalSinDescuento += ticket.cesta.lista[i].subtotal;
        }
        // preparamos los parametros que vamos a enviar a la impresora
        sendObject = {
          numFactura: ticket._id,
          timestamp: ticket.timestamp,
          arrayCompra: ticket.cesta.lista,
          total: ticket.total,
          visa: await ticketsInstance.getFormaPago(ticket),
          tiposIva: ticket.cesta.detalleIva,
          cabecera: parametros?.header == undefined ? "" : parametros.header,
          pie: parametros?.footer == undefined ? "" : parametros.footer,
          nombreTrabajador: trabajador.nombreCorto,
          infoClienteVip: informacionVip, // Mirar bien para terminar todo
          infoCliente: {
            idCliente: infoCliente.id,
            nombre: infoCliente.nombre,
            telefono: infoCliente.telefono,
            puntos: puntos,
            descuento: descuento,
            albaranNPT: infoCliente?.albaran && infoCliente?.noPagaEnTienda,
          },
          dejaCuenta: ticket.dejaCuenta,
          idCliente: ticket.idCliente,
          totalSinDescuento: totalSinDescuento,
          tmstpCesta: ticket.cesta.timestamp,
        };
      } else {
        // si no tenemos cliente preparamos el objeto sin los datos del cliente
        sendObject = {
          numFactura: ticket._id,
          timestamp: ticket.timestamp,
          arrayCompra: ticket.cesta.lista,
          total: ticket.total,
          visa: await ticketsInstance.getFormaPago(ticket),
          tiposIva: ticket.cesta.detalleIva,
          cabecera: parametros?.header == undefined ? "" : parametros.header,
          pie: parametros?.footer == undefined ? "" : parametros.footer,
          nombreTrabajador: trabajador.nombreCorto,
          infoClienteVip: null, // Mirar bien para terminar todo
          infoCliente: null,
          dejaCuenta: ticket.dejaCuenta,
          idCliente: ticket.idCliente,
          totalSinDescuento: ticket.total,
          mesa:
            ticket?.cesta?.indexMesa == undefined
              ? null
              : ticket.cesta.indexMesa,
          comensales: ticket?.cesta?.comensales || null,
          tmstpCesta: ticket.cesta.timestamp,
        };
      }
      if (ticket.restante > 0) {
        sendObject.restante = ticket.restante;
      }
      // enviamos el objeto
      if (infoCliente?.albaran && infoCliente?.noPagaEnTienda) {
        await this.imprimirAlbaran(sendObject);
      } else {
        await this._venta(sendObject);
      }
    }
  }

  async imprimirFirma(idTicket: number, albaran = false) {
    const ticket = albaran
      ? await AlbaranesInstance.getAlbaranById(idTicket)
      : await ticketsInstance.getTicketById(idTicket);
    const parametros = await parametrosInstance.getParametros();
    const trabajador: TrabajadoresInterface =
      await trabajadoresInstance.getTrabajadorById(ticket.idTrabajador);

    let sendObject;

    let infoCliente = await clienteInstance.getClienteById(ticket.idCliente);

    let informacionVip = infoCliente
      ? {
          nombre: infoCliente.nombre,
          nif: infoCliente["nif"] === "0" ? "" : infoCliente["nif"],
          direccion:
            infoCliente["direccion"] === "0" ? "" : infoCliente["direccion"],
          telefono:
            infoCliente["telefono"] === "0" ? "" : infoCliente["telefono"],
        }
      : null;

    const descuento =
      infoCliente && !infoCliente?.albaran && !infoCliente?.vip
        ? Number(infoCliente.descuento)
        : 0;
    if (ticket && trabajador) {
      if (ticket.idCliente && ticket.idCliente != "") {
        let infoCliente: ClientesInterface;
        infoCliente = await clienteInstance.getClienteById(ticket.idCliente);
        const puntos = await clienteInstance.getPuntosCliente(ticket.idCliente);

        sendObject = {
          numFactura: ticket._id,
          timestamp: ticket.timestamp,
          arrayCompra: ticket.cesta.lista,
          total: ticket.total,
          visa: await ticketsInstance.getFormaPago(ticket),
          tiposIva: ticket.cesta.detalleIva,
          cabecera: parametros?.header == undefined ? "" : parametros.header,
          pie: parametros?.footer == undefined ? "" : parametros.footer,
          nombreTrabajador: trabajador.nombreCorto,
          infoClienteVip: informacionVip, // Mirar bien para terminar todo
          infoCliente: {
            idCliente: infoCliente.id,
            nombre: infoCliente.nombre,
            puntos: puntos,
            descuento: descuento,
            albaranNPT: infoCliente?.albaran && infoCliente?.noPagaEnTienda,
          },
          dejaCuenta: ticket.dejaCuenta,
          firma: true,
          tmstpCesta: ticket.cesta.timestamp,
        };
      } else {
        sendObject = {
          numFactura: ticket._id,
          timestamp: ticket.timestamp,
          arrayCompra: ticket.cesta.lista,
          total: ticket.total,
          visa: await ticketsInstance.getFormaPago(ticket),
          tiposIva: ticket.cesta.detalleIva,
          cabecera: parametros?.header == undefined ? "" : parametros.header,
          pie: parametros?.footer == undefined ? "" : parametros.footer,
          nombreTrabajador: trabajador.nombreCorto,
          infoClienteVip: null, // Mirar bien para terminar todo_venta
          infoCliente: null,
          dejaCuenta: ticket.dejaCuenta,
          firma: true,
          tmstpCesta: ticket.cesta.timestamp,
        };
      }
      if (ticket.restante > 0) {
        sendObject.restante = ticket.restante;
      }
      // funcion parecida a _venta pero imprime dos veces el ticket una de las dos con firma
      // por que existe esta guarrada? para evitar que se imprima solo una de dos.
      await this.imprimirAlbaran(sendObject);
    }
  }

  /* Eze 4.0 */
  async imprimirDevolucion(idDevolucion: ObjectId) {
    try {
      const devolucion =
        await devolucionesInstance.getDevolucionById(idDevolucion);
      const parametros = await parametrosInstance.getParametros();
      const trabajador: TrabajadoresInterface =
        await trabajadoresInstance.getTrabajadorById(devolucion.idTrabajador);

      let sendObject;

      if (devolucion && trabajador) {
        sendObject = {
          numFactura: devolucion._id,
          timestamp: devolucion.timestamp,
          arrayCompra: devolucion.cesta.lista,
          total: devolucion.total,
          visa: "DEVOLUCION",
          tiposIva: devolucion.cesta.detalleIva,
          cabecera: parametros?.header == undefined ? "" : parametros.header,
          pie: parametros?.footer == undefined ? "" : parametros.footer,
          nombreTrabajador: trabajador.nombreCorto,
          infoClienteVip: null, // Mirar bien para terminar todo
          infoCliente: null,
          tmstpCesta: devolucion.cesta.timestamp,
        };

        await this._venta(sendObject);
      }
    } catch (err) {
      logger.Error("imprimirDevolucion()", err);
    }
  }
  public async imprimirListaEncargos(lista: string) {
    const device = new escpos.Network("localhost");
    const printer = new escpos.Printer(device);
    const fechaImpresion = new Date();
    const fechaFormateada = `${fechaImpresion.toLocaleDateString()} ${fechaImpresion.toLocaleTimeString()}`;

    const options = {
      imprimirLogo: false,
      tipo: "encargo",
    };
    this.enviarMQTT(
      [
        { tipo: "setCharacterCodeTable", payload: 19 },
        { tipo: "encode", payload: "CP858" },
        { tipo: "font", payload: "a" },
        { tipo: "style", payload: "b" },
        { tipo: "size", payload: [0, 0] },
        { tipo: "align", payload: "LT" },
        { tipo: "text", payload: "Data d'impressió: " + fechaFormateada },
        { tipo: "text", payload: lista },
        { tipo: "cut", payload: "PAPER_FULL_CUT" },
      ],
      options
    );
  }
  // private async imprimirRecibo(recibo: string) {
  //   mqttInstance.loggerMQTT("imprimir recibo");
  //   try {
  //     const device = new escpos.Network("localhost");
  //     const printer = new escpos.Printer(device);
  //     const options = {
  //       imprimirLogo: false,
  //     };
  //     this.enviarMQTT(
  //       [
  //         { tipo: "setCharacterCodeTable", payload: 19 },
  //         { tipo: "encode", payload: "CP858" },
  //         { tipo: "font", payload: "a" },
  //         { tipo: "style", payload: "b" },
  //         { tipo: "size", payload: [0, 0] },
  //         { tipo: "text", payload: recibo },
  //         { tipo: "cut", payload: "PAPER_FULL_CUT" },
  //       ],
  //       options
  //     );
  //   } catch (err) {
  //     mqttInstance.loggerMQTT("Error impresora: " + err);
  //   }
  // }
  public async testMqtt(txt: string) {
    try {
      const device = new escpos.Network("localhost");
      const printer = new escpos.Printer(device);
      const options = {
        imprimirLogo: false,
      };
      this.enviarMQTT(
        [
          { tipo: "setCharacterCodeTable", payload: 19 },
          { tipo: "encode", payload: "CP858" },
          { tipo: "font", payload: "a" },
          { tipo: "style", payload: "b" },
          { tipo: "size", payload: [0, 0] },
          { tipo: "text", payload: txt },
          { tipo: "cut", payload: "PAPER_FULL_CUT" },
        ],
        options
      );
    } catch (err) {
      mqttInstance.loggerMQTT("Error impresora: " + err);
    }
  }
  private clientMqtt =
    mqtt.connect(process.env.MQTT_URL) ||
    mqtt.connect("mqtt://127.0.0.1:1883", {
      username: "ImpresoraMQTT",
    });
  // recovimos los datos de la impresion
  private enviarMQTT(encodedData, options) {
    // si el array de encodedData es mayor que 0 los añadimos al array de mensajes pendientes
    if (encodedData.length > 0) {
      mensajesPendientes.push(...encodedData);
    }
    // iniciamos un timeout, si se vuelve a llamar
    // a la funcion antes de que se cumpla el timeout
    // se cancela el timeout y se vuelve a iniciar
    if (imprimirTimeout) {
      clearTimeout(imprimirTimeout);
    }
    // al terminar el timeout se envian los datos con el array de mensajes pendientes
    imprimirTimeout = setTimeout(() => {
      const { clientMqtt } = this;
      const enviar = {
        arrayImprimir: mensajesPendientes,
        options: options,
      };

      if (options.tipo === "cierreCaja") {
        logger.Info("Enviando cierre de caja a impresora por MQTT");
      }

      const publishToPrinter = () => {
        clientMqtt.publish(
          "hit.hardware/printer",
          JSON.stringify(enviar),
          (err) => {
            if (err) {
              logger.Error("Error al enviar a impresora por MQTT", err);
            } else {
              logger.Info("Mensaje enviado a impresora por MQTT");
            }
          }
        );
      };

      if (clientMqtt.connected) {
        // Si ya está conectado, enviamos los datos directamente
        publishToPrinter();
      } else {
        // Suscribimos al evento 'connect' solo una vez para manejar la conexión
        clientMqtt.once("connect", publishToPrinter);
      }
      mensajesPendientes = [];
      clearTimeout(imprimirTimeout);
    }, 500);
  }

  private async _venta(info, recibo = null) {
    // recojemos datos de los parametros
    const numFactura = info.numFactura;
    const arrayCompra: ItemLista[] = info.arrayCompra;
    const dejaCuenta = info?.dejaCuenta > 0 ? info?.dejaCuenta : 0;
    const total = Number(info.total.toFixed(2));
    const tipoPago = info.visa;
    //   mqttInstance.loggerMQTT(tipoPago)
    const tiposIva = info.tiposIva;
    const cabecera = info.cabecera;
    const firmaText = !info.firma ? "" : "\n\n\n\n\n";
    const copiaText = !info.firma ? "-- ES COPIA --" : "-- FIRMA CLIENTE --";
    const pie = info.pie;
    const nombreDependienta = info.nombreTrabajador;
    const tipoImpresora = info.impresora;
    const infoClienteVip = info.infoClienteVip;
    const infoCliente = info.infoCliente;
    let strRecibo = "";
    if (recibo) {
      strRecibo = recibo;
    }

    let detalles = await this.detallesTicket(
      arrayCompra,
      info.idCliente,
      tipoPago
    );
    let tipoFormatoDetalle = await this.comprobarFormatoDetalle(
      arrayCompra,
      info.idCliente
    );
    let pagoTarjeta = "";
    let pagoTkrs = "";
    let detalleClienteVip = "";
    let detalleNombreCliente = "";
    let detallePuntosCliente = "";
    let detalleEncargo = "";
    let detalleDejaCuenta = "";
    let detalleDescuento = "";
    let clienteDescuento = "";
    let clientTitle = "";
    let clienteTelefono = "";
    if (infoClienteVip) {
      clientTitle = "\nCLIENT:";
      detalleClienteVip = `\n${infoClienteVip.nombre}`;
      if (infoClienteVip.nif)
        detalleClienteVip += `\x1B\x45\x00 \nDNI/NIF: ${infoClienteVip.nif}`;
      if (infoClienteVip.direccion)
        detalleClienteVip += `\n${infoClienteVip.direccion}`;
    }
    // recojemos datos del cliente si nos los han mandado
    const clienteDescEsp = descuentoEspecial.find(
      (cliente) => cliente.idCliente === infoCliente?.idCliente
    );

    if (infoCliente != null) {
      clientTitle = "\nCLIENT:";
      detalleNombreCliente = infoCliente.nombre;
      if (infoClienteVip) detalleNombreCliente = "";
      if (tipoPago !== "CONSUMO_PERSONAL") {
        if (infoCliente.puntos == null) {
          detallePuntosCliente = "Punts pendents d'actualitzar";
        } else {
          detallePuntosCliente =
            "Punts restants: " +
              (infoCliente.puntos === "" ? "0" : infoCliente.puntos) || "0";
        }
        if (!clienteDescEsp || clienteDescEsp.precio != total) {
          clienteDescuento =
            "Descompte de client: " +
            (infoCliente.descuento ?? "0") +
            " %" +
            "\nVenta registrada.";
          if (infoCliente.descuento == 0)
            clienteDescuento = "Venta registrada.";
        } else if (clienteDescEsp.precio == total) {
          const activacionDescEsp =
            clienteDescEsp?.activacion && clienteDescEsp?.activacion
              ? "Total >= " + clienteDescEsp.activacion
              : infoCliente.nombre;
          clienteDescuento = "Descompte Especial " + activacionDescEsp;
        }
      }
    }
    if (
      tipoPago !== "CONSUMO_PERSONAL" &&
      infoCliente?.descuento &&
      infoCliente.descuento != 0 &&
      (!clienteDescEsp || clienteDescEsp.precio != total)
    ) {
      let baseTotal = 0; // Inicializamos la variable para totalizar las bases
      let ivaTotal = 0; // Inicializamos la variable para totalizar los IVA

      // Iterar sobre cada objeto en tiposIva
      for (const key in tiposIva) {
        if (key.includes("base")) {
          baseTotal += tiposIva[key]; // Sumamos el valor a baseTotal
        }
        if (key.includes("valorIva")) {
          ivaTotal += tiposIva[key]; // Sumamos el valor a ivaTotal
        }
      }
      // Sumamos el total de las bases y el total de los IVA
      detalleDescuento +=
        detalleDescuento += `Total sense descompte: ${redondearPrecio(
          (baseTotal + ivaTotal) / (1 - infoCliente.descuento / 100)
        )}€\nDescompte total: ${redondearPrecio(
          (((baseTotal + ivaTotal) / (1 - infoCliente.descuento / 100)) *
            infoCliente.descuento) /
            100
        )}€\n`;
    }

    const moment = require("moment-timezone");
    const fecha = new Date(info.timestamp);
    //const offset = fecha.getTimezoneOffset() * 60000; // Obtener el desplazamiento de la zona horaria en minutos y convertirlo a milisegundos
    // recojemos el tipo de pago
    const fechaEspaña = moment(info.timestamp).tz("Europe/Madrid");
    if (tipoPago == "TARJETA") {
      pagoTarjeta = "----------- PAGADO CON TARJETA ---------\n";
    }
    if (tipoPago == "TICKET_RESTAURANT") {
      pagoTkrs = "----- PAGADO CON TICKET RESTAURANT -----\n";
    }
    let pagoDevolucion: string = "";

    if (tipoPago == "DEVOLUCION") {
      //   mqttInstance.loggerMQTT('Entramos en tipo pago devolucion')
      pagoDevolucion = "-- ES DEVOLUCION --\n";
    }

    if (info.dejaCuenta > 0) {
      detalleDejaCuenta = "Pagament rebut: " + info.dejaCuenta;
    }

    const detallesIva = await this.getDetallesIva(tiposIva);

    let detalleIva = "";
    detalleIva =
      detallesIva.detalleIvaTipo4 +
      detallesIva.detalleIvaTipo1 +
      detallesIva.detalleIvaTipo5 +
      detallesIva.detalleIvaTipo2 +
      detallesIva.detalleIvaTipo3;

    let infoConsumoPersonal = "";
    if (tipoPago == "CONSUMO_PERSONAL") {
      infoConsumoPersonal = "---------------- CONSUM PERSONAL --------------";
      detalleIva = "";
    }

    const diasSemana = [
      "Diumenge",
      "Dilluns",
      "Dimarts",
      "Dimecres",
      "Dijous",
      "Divendres",
      "Dissabte",
    ];
    /*`Data: ${diasSemana[fecha.getDay()]} ${fecha.getDate()}-${
      fecha.getMonth() + 1
    }-${fecha.getFullYear()}  ${
      (fecha.getHours() < 10 ? "0" : "") + fecha.getHours()
    }:${(fecha.getMinutes() < 10 ? "0" : "") + fecha.getMinutes()}`*/
    // declaramos el dispositivo y la impresora escpos

    //qr info
    const qrData = moment(info.timestamp).format("YYYY-MM-DD");
    const qrLic = (await parametrosInstance.getParametros()).licencia;
    const qrURL = await encryptWhatsapp(
      `Lic:${qrLic} Tick:${numFactura} Data:${qrData}`
    );
    const qrEnabled =
      (await parametrosInstance.getParametros())["params"]["QRWhatsApp"] ==
      "Si";
    const device = new escpos.Network("localhost");
    const printer = new escpos.Printer(device);
    const database = (await conexion).db("tocgame");
    const coleccion = database.collection("parametros");
    const preuU =
      (await parametrosInstance.getParametros())["params"]["PreuUnitari"] ==
      "Si";
    const arrayImprimir = [
      { tipo: "setCharacterCodeTable", payload: 19 },
      { tipo: "setCharacterCodeTable", payload: 19 },
      { tipo: "encode", payload: "cp858" },
      { tipo: "font", payload: "A" },
      { tipo: "text", payload: cabecera },
      {
        tipo: "text",
        payload: `Data: ${
          diasSemana[fechaEspaña.format("d")]
        } ${fechaEspaña.format("DD-MM-YYYY HH:mm")}`,
      },
      {
        tipo: "text",
        payload: `\x1B\x45\x01 Factura simplificada N: ${numFactura}\x1B\x45\x00`,
      },
      { tipo: "text", payload: "Ates per: " + nombreDependienta },
    ];
    if (info.mesa)
      arrayImprimir.push(
        {
          tipo: "text",
          payload:
            info.mesa == null
              ? ""
              : `Taula: ${info.mesa + 1} | PAX (Clients): ${info.comensales}`,
        },
        { tipo: "size", payload: [1, 0] },
        { tipo: "text", payload: clientTitle },
        { tipo: "size", payload: [0, 0] }
      );
    if (infoCliente)
      arrayImprimir.push(
        {
          tipo: "size",
          payload: [0, 1],
        },
        {
          tipo: "text",
          payload: `${
            infoClienteVip.nombre
              ? `\x1B\x45\x01 ${infoClienteVip.nombre} \x1B\x45\x00 \n`
              : ""
          }`,
        },
        { tipo: "size", payload: [0, 0] },
        {
          tipo: "text",
          payload: `${
            infoClienteVip.telefono
              ? `\x1B\x45\x01 tel.: ${infoClienteVip.telefono} \x1B\x45\x00 \n`
              : ""
          }${
            infoClienteVip.nif
              ? `\x1B\x45\x01 DNI/NIF: ${infoClienteVip.nif} \x1B\x45\x00 \n`
              : ""
          }${
            infoClienteVip.direccion
              ? `\x1B\x45\x01 direccion: ${infoClienteVip.direccion} \x1B\x45\x00 \n`
              : ""
          }${detallePuntosCliente ? `${detallePuntosCliente}\n` : ""}${
            clienteDescuento ? `${clienteDescuento}\n` : ""
          }`,
        }
      );

    arrayImprimir.push(
      { tipo: "control", payload: "LF" },
      {
        tipo: "text",
        payload: formatoDetalle[tipoFormatoDetalle],
      },
      {
        tipo: "text",
        payload: "-----------------------------------------------",
      },
      { tipo: "align", payload: "LT" },
      { tipo: "text", payload: detalles },
      { tipo: "align", payload: "CT" },
      {
        tipo: "text",
        payload: "------------------------------------------------",
      },
      {
        tipo: "text",
        payload: `${pagoTarjeta != "" ? `${pagoTarjeta}` : ""}${
          pagoTkrs != "" ? `${pagoTkrs}` : ""
        }${infoConsumoPersonal != "" ? `${infoConsumoPersonal}` : ""}`,
      },
      { tipo: "align", payload: "RT" }
    );
    if (detalleDejaCuenta)
      arrayImprimir.push({ tipo: "text", payload: detalleDejaCuenta });
    if (detalleDescuento)
      arrayImprimir.push({ tipo: "text", payload: detalleDescuento });
    arrayImprimir.push({ tipo: "size", payload: [1, 1] });
    if (pagoDevolucion)
      arrayImprimir.push({ tipo: "text", payload: pagoDevolucion });
    let totalImporte = total;
    // si hay deja cuenta restamos el total, menos si esta anulado el ticket
    if (info?.restante) totalImporte = info.restante;
    arrayImprimir.push(
      { tipo: "align", payload: "RT" },
      { tipo: "text", payload: "TOTAL: " + totalImporte.toFixed(2) + " €" },
      { tipo: "control", payload: "LF" },
      { tipo: "size", payload: [0, 0] },
      { tipo: "align", payload: "CT" },
      { tipo: "text", payload: "Base IVA         IVA         IMPORT" }
    );
    if (detalleIva) arrayImprimir.push({ tipo: "text", payload: detalleIva });
    if (copiaText) arrayImprimir.push({ tipo: "text", payload: copiaText });
    if (firmaText) arrayImprimir.push({ tipo: "text", payload: firmaText });
    if (pie) arrayImprimir.push({ tipo: "text", payload: pie });

    if (qrEnabled) {
      arrayImprimir.push(
        { tipo: "text", payload: "Consulta el ticket al WhatsApp:" },
        {
          tipo: "qrimage",
          payload: `https://api.whatsapp.com/send?phone=34617469230&text=${qrURL}`,
        }
      );
    }
    arrayImprimir.push({ tipo: "cut", payload: "PAPER_FULL_CUT" });

    const options = {
      imprimirLogo: true,
      tipo: "venta",
      lExtra: arrayCompra.length,
    };
    // lo mandamos a la funcion enviarMQTT que se supone que imprime

    this.enviarMQTT(arrayImprimir, options);
  }

  private async imprimirAlbaran(info, recibo = null) {
    // recojemos datos de los parametros
    const numFactura = info.numFactura;
    const arrayCompra: ItemLista[] = info.arrayCompra;
    const dejaCuenta = info?.dejaCuenta > 0 ? info?.dejaCuenta : 0;
    const total = Number(info.total.toFixed(2));
    const tipoPago = info.visa;
    //   mqttInstance.loggerMQTT(tipoPago)
    const tiposIva = info.tiposIva;
    const cabecera = info.cabecera;
    const firmaText = !info.firma ? "" : "\n\n\n\n\n";
    const copiaText = !info.firma ? "-- ES COPIA --" : "-- FIRMA CLIENTE --";
    const pie = info.pie;
    const nombreDependienta = info.nombreTrabajador;
    const tipoImpresora = info.impresora;
    const infoClienteVip = info.infoClienteVip;
    const infoCliente = info.infoCliente;
    let strRecibo = "";
    if (recibo) {
      strRecibo = recibo;
    }

    let detalles = await this.detallesTicket(
      arrayCompra,
      infoCliente?.idCliente,
      tipoPago
    );
    let tipoFormatoDetalle = await this.comprobarFormatoDetalle(
      arrayCompra,
      infoCliente?.idCliente
    );
    const factura = infoCliente?.albaranNPT
      ? "Albarà N: "
      : "Factura simplificada N: ";
    let pagoTarjeta = "";
    let pagoTkrs = "";
    let detalleClienteVip = "";
    let detalleNombreCliente = "";
    let detallePuntosCliente = "";
    let detalleEncargo = "";
    let detalleDejaCuenta = "";
    let detalleDescuento = "";
    let clienteDescuento = "";
    let clientTitle = "";
    if (infoClienteVip) {
      clientTitle = "\nCLIENT:";
      detalleClienteVip = `\n${infoClienteVip.nombre}`;
      if (infoClienteVip.nif)
        detalleClienteVip += `\nDNI/NIF: ${infoClienteVip.nif}`;
      if (infoClienteVip.direccion)
        detalleClienteVip += `\nDir.: ${infoClienteVip.direccion}`;
    }
    // recojemos datos del cliente si nos los han mandado
    const clienteDescEsp = descuentoEspecial.find(
      (cliente) => cliente.idCliente === infoCliente?.idCliente
    );
    if (infoCliente != null) {
      clientTitle = "\nCLIENT:";
      detalleNombreCliente = infoCliente.nombre;
      if (infoClienteVip) detalleNombreCliente = "";
      if (infoCliente.puntos == null) {
        detallePuntosCliente = "Punts pendents d'actualitzar";
      } else {
        detallePuntosCliente =
          "Punts restants: " +
            (infoCliente.puntos === "" ? "0" : infoCliente.puntos) || "0";
      }
      if (!clienteDescEsp || clienteDescEsp.precio != total) {
        clienteDescuento =
          "Descompte de client: " +
          (infoCliente.descuento ?? "0") +
          " %" +
          "\nVenta registrada.";
        if (infoCliente.descuento == 0) clienteDescuento = "Venta registrada.";
      } else if (clienteDescEsp.precio == total) {
        const activacionDescEsp =
          clienteDescEsp?.activacion && clienteDescEsp?.activacion
            ? "Total >= " + clienteDescEsp.activacion
            : infoCliente.nombre;
        clienteDescuento = "Descompte Especial " + activacionDescEsp;
      }
    }
    if (
      infoCliente?.descuento &&
      infoCliente.descuento != 0 &&
      (!clienteDescEsp || clienteDescEsp.precio != total)
    ) {
      detalleDescuento += detalleDescuento += `Total sense descompte: ${(
        (total + dejaCuenta) /
        (1 - infoCliente.descuento / 100)
      ).toFixed(2)}€\nDescompte total: ${(
        (((total + dejaCuenta) / (1 - infoCliente.descuento / 100)) *
          infoCliente.descuento) /
        100
      ).toFixed(2)}€\n`;
    } else if (clienteDescEsp && clienteDescEsp.precio == total) {
      detalleDescuento += "Nou preu total: " + clienteDescEsp.precio;
    }

    const moment = require("moment-timezone");
    const fecha = new Date(info.timestamp);
    //const offset = fecha.getTimezoneOffset() * 60000; // Obtener el desplazamiento de la zona horaria en minutos y convertirlo a milisegundos
    // recojemos el tipo de pago
    const fechaEspaña = moment(info.timestamp).tz("Europe/Madrid");
    if (tipoPago == "TARJETA") {
      pagoTarjeta = "----------- PAGADO CON TARJETA ---------\n";
    }
    if (tipoPago == "TICKET_RESTAURANT") {
      pagoTkrs = "----- PAGADO CON TICKET RESTAURANT -----\n";
    }
    let pagoDevolucion: string = "";

    if (tipoPago == "DEVOLUCION") {
      //   mqttInstance.loggerMQTT('Entramos en tipo pago devolucion')
      pagoDevolucion = "-- ES DEVOLUCION --\n";
    }

    if (info.dejaCuenta > 0) {
      detalleDejaCuenta = "Pagament rebut: " + info.dejaCuenta;
    }
    const detallesIva = await this.getDetallesIva(tiposIva);

    let detalleIva = "";
    detalleIva =
      detallesIva.detalleIvaTipo4 +
      detallesIva.detalleIvaTipo1 +
      detallesIva.detalleIvaTipo5 +
      detallesIva.detalleIvaTipo2 +
      detallesIva.detalleIvaTipo3;

    let infoConsumoPersonal = "";

    const diasSemana = [
      "Diumenge",
      "Dilluns",
      "Dimarts",
      "Dimecres",
      "Dijous",
      "Divendres",
      "Dissabte",
    ];
    /*`Data: ${diasSemana[fecha.getDay()]} ${fecha.getDate()}-${
      fecha.getMonth() + 1
    }-${fecha.getFullYear()}  ${
      (fecha.getHours() < 10 ? "0" : "") + fecha.getHours()
    }:${(fecha.getMinutes() < 10 ? "0" : "") + fecha.getMinutes()}`*/
    // declaramos el dispositivo y la impresora escpos
    const device = new escpos.Network("localhost");
    const printer = new escpos.Printer(device);
    const database = (await conexion).db("tocgame");
    const coleccion = database.collection("parametros");
    const preuU =
      (await parametrosInstance.getParametros())["params"]["PreuUnitari"] ==
      "Si";
    const arrayImprimir = [
      { tipo: "setCharacterCodeTable", payload: 19 },
      { tipo: "setCharacterCodeTable", payload: 19 },
      { tipo: "encode", payload: "cp858" },
      { tipo: "font", payload: "A" },
      { tipo: "text", payload: cabecera },
      {
        tipo: "text",
        payload: `Data: ${
          diasSemana[fechaEspaña.format("d")]
        } ${fechaEspaña.format("DD-MM-YYYY HH:mm")}`,
      },
      { tipo: "text", payload: factura + numFactura },
      { tipo: "text", payload: "Ates per: " + nombreDependienta },
      {
        tipo: "text",
        payload:
          info.mesa == null
            ? ""
            : `Taula: ${info.mesa + 1} | PAX (Clients): ${info.comensales}`,
      },
      { tipo: "size", payload: [1, 0] },
      { tipo: "text", payload: clientTitle },
      { tipo: "size", payload: [0, 0] },
      {
        tipo: "text",
        payload: `${detalleClienteVip ? `${detalleClienteVip} \n` : ""}${
          detalleNombreCliente ? `${detalleNombreCliente} \n` : ""
        }${detallePuntosCliente ? `${detallePuntosCliente} \n` : ""}${
          clienteDescuento ? `${clienteDescuento} \n` : ""
        }`,
      },
      { tipo: "control", payload: "LF" },
      {
        tipo: "text",
        payload: formatoDetalle[tipoFormatoDetalle],
      },
      { tipo: "text", payload: "-----------------------------------------" },
      { tipo: "align", payload: "LT" },
      { tipo: "text", payload: detalles },
      { tipo: "align", payload: "CT" },
      {
        tipo: "text",
        payload: "------------------------------------------",
      },
      {
        tipo: "text",
        payload: `${pagoTarjeta != "" ? `${pagoTarjeta}` : ""}${
          pagoTkrs != "" ? `${pagoTkrs}` : ""
        }${infoConsumoPersonal != "" ? `${infoConsumoPersonal}` : ""}`,
      },
      { tipo: "align", payload: "LT" },
      { tipo: "text", payload: detalleDejaCuenta },
      { tipo: "text", payload: detalleDescuento },
      { tipo: "size", payload: [1, 1] },
      { tipo: "text", payload: pagoDevolucion },
      { tipo: "align", payload: "RT" },
      { tipo: "text", payload: "TOTAL PARCIAL: " + total.toFixed(2) + " €" },
      { tipo: "control", payload: "LF" },
      { tipo: "size", payload: [0, 0] },
      { tipo: "align", payload: "CT" },
      { tipo: "text", payload: "Base IVA         IVA         IMPORT" },
      { tipo: "text", payload: detalleIva },
      { tipo: "text", payload: "-- FIRMA CLIENT --\n\n\n\n\n" },
      { tipo: "control", payload: "LF" },
      { tipo: "text", payload: "ID: " + random() + " - " + random() },
      { tipo: "text", payload: pie },
      { tipo: "control", payload: "LF" },
      { tipo: "control", payload: "LF" },
      { tipo: "control", payload: "LF" },
      { tipo: "cut", payload: "PAPER_FULL_CUT" },
      { tipo: "setCharacterCodeTable", payload: 19 },
      { tipo: "setCharacterCodeTable", payload: 19 },
      { tipo: "encode", payload: "cp858" },
      { tipo: "font", payload: "A" },
      { tipo: "text", payload: cabecera },
      {
        tipo: "text",
        payload: `Data: ${
          diasSemana[fechaEspaña.format("d")]
        } ${fechaEspaña.format("DD-MM-YYYY HH:mm")}`,
      },
      { tipo: "text", payload: factura + numFactura },
      { tipo: "text", payload: "Ates per: " + nombreDependienta },
      {
        tipo: "text",
        payload:
          info.mesa == null
            ? ""
            : `Taula: ${info.mesa + 1} | PAX (Clients): ${info.comensales}`,
      },
      { tipo: "size", payload: [1, 0] },
      { tipo: "text", payload: clientTitle },
      { tipo: "size", payload: [0, 0] },
      {
        tipo: "text",
        payload: `${detalleClienteVip ? `${detalleClienteVip} \n` : ""}${
          detalleNombreCliente ? `${detalleNombreCliente} \n` : ""
        }${detallePuntosCliente ? `${detallePuntosCliente} \n` : ""}${
          clienteDescuento ? `${clienteDescuento} \n` : ""
        }`,
      },
      { tipo: "control", payload: "LF" },
      {
        tipo: "text",
        payload: formatoDetalle[tipoFormatoDetalle],
      },
      { tipo: "text", payload: "-----------------------------------------" },
      { tipo: "align", payload: "LT" },
      { tipo: "text", payload: detalles },
      { tipo: "align", payload: "CT" },
      {
        tipo: "text",
        payload: "------------------------------------------",
      },
      {
        tipo: "text",
        payload: `${pagoTarjeta != "" ? `${pagoTarjeta}` : ""}${
          pagoTkrs != "" ? `${pagoTkrs}` : ""
        }${infoConsumoPersonal != "" ? `${infoConsumoPersonal}` : ""}`,
      },
      { tipo: "align", payload: "LT" },
      { tipo: "text", payload: detalleDejaCuenta },
      { tipo: "text", payload: detalleDescuento },
      { tipo: "size", payload: [1, 1] },
      { tipo: "text", payload: pagoDevolucion },
      { tipo: "align", payload: "RT" },
      { tipo: "text", payload: "TOTAL PARCIAL: " + total.toFixed(2) + " €" },
      { tipo: "control", payload: "LF" },
      { tipo: "size", payload: [0, 0] },
      { tipo: "align", payload: "CT" },
      { tipo: "text", payload: "Base IVA         IVA         IMPORT" },
      { tipo: "text", payload: detalleIva },
      { tipo: "text", payload: copiaText },
      { tipo: "text", payload: firmaText },
      { tipo: "control", payload: "LF" },
      { tipo: "text", payload: "ID: " + random() + " - " + random() },
      { tipo: "text", payload: pie },
      { tipo: "control", payload: "LF" },
      { tipo: "control", payload: "LF" },
      { tipo: "control", payload: "LF" },
      { tipo: "cut", payload: "PAPER_FULL_CUT" },
    ];
    const options = {
      imprimirLogo: true,
      tipo: "venta",
      lExtra: arrayCompra.length,
    };
    // lo mandamos a la funcion enviarMQTT que se supone que imprime
    this.enviarMQTT(arrayImprimir, options);
  }
  async getDetallesIva(tiposIva, timestamp = null) {
    const arrayIvas = timestamp
      ? tiposIvaInstance.getIvasDefault(timestamp)
      : tiposIvaInstance.arrayIvas;
    let str1 = "          ";
    let str2 = "                 ";
    let str3 = "              ";
    let base = "";
    let valorIva = "";
    let importe = "";
    const detalle = {
      detalleIvaTipo1: "",
      detalleIvaTipo2: "",
      detalleIvaTipo3: "",
      detalleIvaTipo4: "",
      detalleIvaTipo5: "",
    };
    if (tiposIva.importe1 > 0) {
      base = tiposIva.base1.toFixed(2) + " €";
      const iva1 = arrayIvas.find((item) => item.tipus === "1");
      valorIva = iva1.iva + "%: " + tiposIva.valorIva1.toFixed(2) + " €";
      importe = tiposIva.importe1.toFixed(2) + " €\n";
      detalle.detalleIvaTipo1 =
        str1.substring(0, str1.length - base.length) +
        base +
        str2.substring(0, str2.length - valorIva.length) +
        valorIva +
        str3.substring(0, str3.length - importe.length) +
        importe;
    }
    if (tiposIva.importe2 > 0) {
      const iva2 = arrayIvas.find((item) => item.tipus === "2");
      base = tiposIva.base2.toFixed(2) + " €";
      valorIva = iva2.iva + "%: " + tiposIva.valorIva2.toFixed(2) + " €";
      importe = tiposIva.importe2.toFixed(2) + " €\n";
      detalle.detalleIvaTipo2 =
        str1.substring(0, str1.length - base.length) +
        base +
        str2.substring(0, str2.length - valorIva.length) +
        valorIva +
        str3.substring(0, str3.length - importe.length) +
        importe;
    }
    if (tiposIva.importe3 > 0) {
      const iva3 = arrayIvas.find((item) => item.tipus === "3");
      base = tiposIva.base3.toFixed(2) + " €";
      valorIva = iva3.iva + "%: " + tiposIva.valorIva3.toFixed(2) + " €";
      importe = tiposIva.importe3.toFixed(2) + " €\n";
      detalle.detalleIvaTipo3 =
        str1.substring(0, str1.length - base.length) +
        base +
        str2.substring(0, str2.length - valorIva.length) +
        valorIva +
        str3.substring(0, str3.length - importe.length) +
        importe;
    }
    if (tiposIva.importe4 > 0) {
      const iva4 = arrayIvas.find((item) => item.tipus === "4");
      base = tiposIva.base4.toFixed(2) + " €";
      valorIva = iva4.iva + "%: " + tiposIva.valorIva4.toFixed(2) + " €";
      importe = tiposIva.importe4.toFixed(2) + " €\n";
      detalle.detalleIvaTipo4 =
        str1.substring(0, str1.length - base.length) +
        base +
        str2.substring(0, str2.length - valorIva.length) +
        valorIva +
        str3.substring(0, str3.length - importe.length) +
        importe;
    }
    if (tiposIva.importe5 > 0) {
      const iva5 = arrayIvas.find((item) => item.tipus === "5");
      base = tiposIva.base5.toFixed(2) + " €";
      valorIva = iva5.iva + "%: " + tiposIva.valorIva5.toFixed(2) + " €";
      importe = tiposIva.importe5.toFixed(2) + " €\n";
      detalle.detalleIvaTipo5 =
        str1.substring(0, str1.length - base.length) +
        base +
        str2.substring(0, str2.length - valorIva.length) +
        valorIva +
        str3.substring(0, str3.length - importe.length) +
        importe;
    }

    return detalle;
  }



  calcularPrecioUnitario(item, albaranNPT, tipoPago) {
    const precioUnitario =
      albaranNPT || tipoPago == "CONSUMO_PERSONAL"
        ? item.precioOrig / item.unidades
        : item.subtotal / item.unidades;
    return Number(precioUnitario.toFixed(2));
  }
  // funcion para imprimir detalles ticket vip
  async detallesTicket(
    arrayCompra: CestasInterface["lista"],
    idCliente: ClientesInterface["id"] = null,
    tipoPago: string = ""
  ) {
    // recoje los parametros y saber si mostrar el precio unitario
    const preuUnitari =
      (await parametrosInstance.getParametros())["params"]["PreuUnitari"] ==
      "Si";
    // comprueba si hay param dto y param iva
    const thereIsDto = arrayCompra.find((item) => "dto" in item) !== undefined;
    const thereIsDtoTienda =
      arrayCompra.find((item) => "descuentoTienda" in item) !== undefined;
    const thereIsIva = arrayCompra.find((item) => "iva" in item) !== undefined;
    // recoje el cliente si lo hay
    let cliente = idCliente
      ? await clienteInstance.getClienteById(idCliente)
      : null;

    const albaranNPT_o_vipPT =
      (cliente?.albaran && cliente?.noPagaEnTienda) ||
      ((cliente?.vip || cliente?.albaran) && !cliente?.noPagaEnTienda)
        ? true
        : false;

    // Longitudes relacionadas con el formato
    let longDto = albaranNPT_o_vipPT
      ? 0
      : thereIsDto || thereIsDtoTienda
      ? cLongDto
      : 0;
    let longQuant = cLongQuant;
    let longPreuU = albaranNPT_o_vipPT ? 0 : preuUnitari ? cLongPreuU : 0;
    let longImporte = albaranNPT_o_vipPT ? 0 : cLongImporte;
    let longArticulo = inicializarLongArticulo();
    let margen = cMargen;

    // variables en cada linea detalle
    let cantidadStr = "";
    let articuloStr = "";
    let precioUnitarioStr = "";
    let descuentoStr = "";
    let importeStr = "";
    let lineaTicket = "";
    let margenStr = "";
    margenStr = sprintf(`%-${margen}s`, margenStr);
    let detalles = "";

    for (let i = 0; i < arrayCompra.length; i++) {
      // obtener precio unitario
      // si contiene gramos, obtenemos el precio unitario de la base de datos para evitar errores de redondeo en el calculo.
      try {
        if (arrayCompra[i].gramos > 0) {
          let infoArt = await articulosInstance.getInfoArticulo(
            arrayCompra[i].idArticulo
          );
          const precioTarifa = await articulosInstance.getPrecioConTarifa(
            infoArt,
            idCliente
          );
          if (precioTarifa.precioConIva != infoArt.precioConIva && !albaranNPT_o_vipPT) {
            arrayCompra[i]["preuU"] = precioTarifa.precioConIva;
          }else if(precioTarifa.precioBase != infoArt.precioBase && albaranNPT_o_vipPT){
            arrayCompra[i]["preuU"] = precioTarifa.precioBase;
          }else{
            arrayCompra[i]["preuU"] = albaranNPT_o_vipPT ? infoArt.precioBase : infoArt.precioConIva;
          }
        } else {
          arrayCompra[i]["preuU"] = await this.calcularPrecioUnitario(
            arrayCompra[i],
            albaranNPT_o_vipPT,
            tipoPago
          );
        }
      } catch (error) {
        console.error(
          `Error al procesar el artículo en el índice ${i}:`,
          error
        );
        // Asignar un valor por defecto en caso de error en la función obtenerPrecioUnitario
        arrayCompra[i]["preuU"] = this.calcularPrecioUnitario(
          arrayCompra[i],
          albaranNPT_o_vipPT,
          tipoPago
        );
      }

      if (thereIsDto && !albaranNPT_o_vipPT) {
        let dto = arrayCompra[i].dto ? arrayCompra[i].dto + "%" : "";
        descuentoStr = sprintf(`%${longDto}s`, dto);
      } else {
        descuentoStr = "";
      }
      if (thereIsDtoTienda) {
        let dto = arrayCompra[i].descuentoTienda
          ? arrayCompra[i].descuentoTienda + "%"
          : "";
        descuentoStr = sprintf(`%${longDto}s`, dto);
      } else {
        descuentoStr = "";
      }
      // entra si es una promo
      if (arrayCompra[i].promocion) {
        // buscamos el nombre del articulo principal
        let nombrePrincipal = (
          await articulosInstance.getInfoArticulo(
            arrayCompra[i].promocion.idArticuloPrincipal
          )
        ).nombre;

        cantidadStr = sprintf(`%-${longQuant}s`, arrayCompra[i].unidades);
        precioUnitarioStr =
          longPreuU == 0
            ? ""
            : sprintf(`%${longPreuU}.2f`, arrayCompra[i]["preuU"]);
        importeStr = setImporteStr();
        // pasamos de param el nombre porque puede variar si es una promo
        comprobarLongitud("Of. " + nombrePrincipal);
        // linea del articulo
        lineaTicket =
          cantidadStr +
          margenStr +
          articuloStr +
          margenStr +
          precioUnitarioStr +
          margenStr +
          (thereIsDto || thereIsDtoTienda ? descuentoStr : "") +
          margenStr +
          importeStr;
        detalles += lineaTicket + "\n";

        // imprime promoPrincipal ej:'>       oferta nombreP (10x)  1.20'
        cantidadStr = sprintf(`%-${longQuant}s`, "");
        precioUnitarioStr =
          longPreuU == 0
            ? ""
            : sprintf(
                `%${longPreuU}s`,
                `(${arrayCompra[i].promocion.cantidadArticuloPrincipal}x)` +
                  arrayCompra[i].promocion.precioRealArticuloPrincipal
              );
        descuentoStr = sprintf(`%${longDto}s`, "");
        importeStr = "";
        comprobarLongitud("> Of. " + nombrePrincipal);
        // linea del art promo principal
        lineaTicket =
          cantidadStr +
          margenStr +
          articuloStr +
          margenStr +
          precioUnitarioStr +
          margenStr +
          descuentoStr +
          margenStr +
          importeStr;
        detalles += `${lineaTicket}\n`;

        if (arrayCompra[i].promocion.cantidadArticuloSecundario > 0) {
          // imprime promoSecundario ej:'<       oferta nombreS (10x)  0.20'
          let nombreSecundario = (
            await articulosInstance.getInfoArticulo(
              arrayCompra[i].promocion.idArticuloSecundario
            )
          ).nombre;

          cantidadStr = sprintf(`%-${longQuant}s`, "");
          precioUnitarioStr =
            longPreuU == 0
              ? ""
              : sprintf(
                  `%${longPreuU}s`,
                  `(${arrayCompra[i].promocion.cantidadArticuloSecundario}x)` +
                    arrayCompra[i].promocion.precioRealArticuloSecundario
                );
          descuentoStr = sprintf(`%${longDto}s`, "");
          importeStr = "";
          comprobarLongitud("> Of. " + nombreSecundario);
          // linea del art promo principal
          lineaTicket =
            cantidadStr +
            margenStr +
            articuloStr +
            margenStr +
            precioUnitarioStr +
            margenStr +
            descuentoStr +
            margenStr +
            importeStr;
          detalles += `${lineaTicket}\n`;
        }
      } else if (
        arrayCompra[i].arraySuplementos &&
        arrayCompra[i].arraySuplementos.length > 0
      ) {
        // Entra si tiene suplementos
        // imprimir articulo
        cantidadStr = sprintf(`%-${longQuant}s`, arrayCompra[i].unidades);
        precioUnitarioStr =
          longPreuU == 0
            ? ""
            : sprintf(`%${longPreuU}.2f`, arrayCompra[i]["preuU"]);
        importeStr = setImporteStr();
        comprobarLongitud();
        // linea del articulo
        lineaTicket =
          cantidadStr +
          margenStr +
          articuloStr +
          margenStr +
          precioUnitarioStr +
          margenStr +
          (thereIsDto || thereIsDtoTienda ? descuentoStr : "") +
          margenStr +
          importeStr;
        detalles += lineaTicket + "\n";
        for (let j = 0; j < arrayCompra[i].arraySuplementos.length; j++) {
          cantidadStr = sprintf(`%-${longQuant}s`, "");
          precioUnitarioStr =
            longPreuU == 0
              ? ""
              : sprintf(
                  `%${longPreuU}.2f`,
                  arrayCompra[i].arraySuplementos[j].precioConIva
                );
          importeStr = sprintf(`%${longImporte}s`, "");
          comprobarLongitud(arrayCompra[i].arraySuplementos[j].nombre);
          // linea del suplemento pos j
          lineaTicket = `${
            cantidadStr +
            margenStr +
            articuloStr +
            margenStr +
            precioUnitarioStr +
            margenStr +
            (thereIsDto || thereIsDtoTienda ? descuentoStr : "") +
            margenStr +
            importeStr
          }`;
          detalles += lineaTicket + "\n";
        }
        // version antigua Suplementos
      } else {
        // articulo sin promos ni suplementos
        cantidadStr = sprintf(`%-${longQuant}s`, arrayCompra[i].unidades);
        precioUnitarioStr =
          longPreuU == 0
            ? ""
            : sprintf(`%${longPreuU}.2f`, arrayCompra[i]["preuU"]);
        importeStr = setImporteStr();
        comprobarLongitud();
        lineaTicket =
          cantidadStr +
          margenStr +
          articuloStr +
          margenStr +
          precioUnitarioStr +
          margenStr +
          (thereIsDto || thereIsDtoTienda ? descuentoStr : "") +
          margenStr +
          importeStr;
        detalles += lineaTicket + "\n";
      }
      // funcion interna donde modifica las longitudes si el valor introducido en
      // cada iteración es mayor que el predeterminado
      function comprobarLongitud(nombreArticulo = null) {
        if (importeStr.length > longImporte) {
          longArticulo = longArticulo + longImporte - importeStr.length;
        }
        if (precioUnitarioStr.length > longPreuU) {
          longArticulo = longArticulo + longPreuU - precioUnitarioStr.length;
        }
        if (thereIsDto && descuentoStr.length > longDto) {
          longArticulo = longArticulo + longDto - descuentoStr.length;
        }
        articuloStr = sprintf(
          `%-${longArticulo}s`,
          nombreArticulo ? nombreArticulo : arrayCompra[i].nombre
        );
        if (articuloStr.length > longArticulo) {
          articuloStr = articuloStr.slice(0, longArticulo);
        }
        // reinicia la longitud predeterminada del nombreArt para utilizarla al volver a entrar
        longArticulo = inicializarLongArticulo();
      }
      function setImporteStr() {
        let str = "";
        if (albaranNPT_o_vipPT) {
          str = `${arrayCompra[i]["preuU"]} p/u`;
          str +=
            arrayCompra[i]?.dto != undefined
              ? ` -${arrayCompra[i]?.dto}% D`
              : "";
          str +=
            arrayCompra[i]?.iva != undefined
              ? ` +${arrayCompra[i].iva}% Iva`
              : "";
          str = sprintf(`%${longImporte}s`, str);
        } else {
          str = sprintf(`%${longImporte}.2f`, arrayCompra[i].subtotal);
        }
        return str;
      }
    }
    detalles = detalles.substring(0, detalles.length - 1);
    return detalles;

    // funciones internas detallesTicket
    function inicializarLongArticulo() {
      // aumenta la long del nombreArt si las demas long de otras col son 0
      let longArticulo = cLongArticulo;
      if (longImporte === 0) {
        longArticulo += cLongImporte;
      }
      if (longPreuU === 0) {
        longArticulo += cLongPreuU;
      }

      if (longDto === 0) {
        longArticulo += cLongDto;
      }
      return longArticulo;
    }
  }

  async precioUnitario(arrayCompra, idCliente = null) {
    let detalles = "";
    //const preuUnitari =
    // recojemos los productos del ticket
    let descuento = 0;
    if (idCliente) {
      const cliente = await clienteInstance.getClienteById(idCliente);
      descuento =
        cliente && !cliente?.albaran && !cliente?.vip
          ? Number(cliente.descuento)
          : 0;
    }

    const preuUnitari =
      (await parametrosInstance.getParametros())["params"]["PreuUnitari"] ==
      "Si";
    for (let i = 0; i < arrayCompra.length; i++) {
      arrayCompra[i].subtotal =
        arrayCompra[i].subtotal - arrayCompra[i].subtotal * (descuento / 100);
      if (preuUnitari) {
        arrayCompra[i]["preuU"] = Number(
          (arrayCompra[i].subtotal / arrayCompra[i].unidades).toFixed(2)
        );
      }
      if (arrayCompra[i].promocion) {
        let nombrePrincipal = (
          await articulosInstance.getInfoArticulo(
            arrayCompra[i].promocion.idArticuloPrincipal
          )
        ).nombre;
        nombrePrincipal = "Oferta " + nombrePrincipal;
        while (nombrePrincipal.length < 20) {
          nombrePrincipal += " ";
        }
        detalles += `${
          arrayCompra[i].unidades *
          arrayCompra[i].promocion.cantidadArticuloPrincipal
        }     ${nombrePrincipal.slice(0, 20)}${
          preuUnitari ? "     " + arrayCompra[i]["preuU"] : ""
        }       ${arrayCompra[i].subtotal.toFixed(2)}\n`;
        detalles += `     >     ${
          nombrePrincipal.slice(0, 20) +
          "(x" +
          arrayCompra[i].promocion.cantidadArticuloPrincipal +
          ")"
        } ${arrayCompra[i].promocion.precioRealArticuloPrincipal.toFixed(2)}\n`;
        if (arrayCompra[i].promocion.cantidadArticuloSecundario > 0) {
          let nombreSecundario = (
            await articulosInstance.getInfoArticulo(
              arrayCompra[i].promocion.idArticuloSecundario
            )
          ).nombre;
          nombreSecundario = "Oferta " + nombreSecundario;
          while (nombreSecundario.length < 20) {
            nombreSecundario += " ";
          }
          /*detalles += `${
            arrayCompra[i].unidades *
            arrayCompra[i].promocion.cantidadArticuloSecundario
          }     ${nombreSecundario.slice(0, 20)}       ${arrayCompra[
            i
          ].promocion.precioRealArticuloSecundario.toFixed(2)}\n`;*/
          detalles += `     >     ${
            nombreSecundario.slice(0, 20) +
            "(x" +
            arrayCompra[i].promocion.cantidadArticuloSecundario +
            ")"
          } ${arrayCompra[i].promocion.precioRealArticuloSecundario.toFixed(
            2
          )}\n`;
        }
      } else if (
        arrayCompra[i].arraySuplementos &&
        arrayCompra[i].arraySuplementos.length > 0
      ) {
        var cantidadStr = sprintf("%-7d", arrayCompra[i].unidades);
        var articuloStr = sprintf("%-18s", arrayCompra[i].nombre);
        var precioUnitario = preuUnitari
          ? "    " + arrayCompra[i]["preuU"].toFixed(2)
          : "";

        var precioStr = sprintf("%-11.2f", precioUnitario);

        var totalStr = sprintf("%-6.2f", arrayCompra[i].subtotal.toFixed(2));

        var lineaTicket = cantidadStr + articuloStr;

        for (let j = 0; j < arrayCompra[i].arraySuplementos.length; j++) {
          if (j == arrayCompra[i].arraySuplementos.length - 1) {
            lineaTicket += `\n${sprintf("%-7s", "")}${sprintf(
              "%-24s",
              arrayCompra[i].arraySuplementos[j].nombre.slice(0, 20)
            )}${precioStr}${totalStr}\n`;
          } else {
            lineaTicket += `\n${sprintf("%-7s", "")}${sprintf(
              "%-24s",
              arrayCompra[i].arraySuplementos[j].nombre.slice(0, 20)
            )}`;
          }
        }
        detalles += lineaTicket;
      } else {
        if (arrayCompra[i].nombre.length < 20) {
          while (arrayCompra[i].nombre.length < 20) {
            arrayCompra[i].nombre += " ";
          }
        }
        function formatSpaces(qtSpaces) {
          let spaces = "";
          for (let i = 0; i < qtSpaces; i++) {
            spaces += " ";
          }
          return spaces;
        }
        let qtSpaces = 6 - arrayCompra[i].unidades.toString().length;
        let spaces = formatSpaces(qtSpaces);
        detalles += ` ${spaces + arrayCompra[i].unidades}  ${arrayCompra[
          i
        ].nombre.slice(0, 20)} ${
          preuUnitari
            ? formatSpaces(
                6 - arrayCompra[i]["preuU"].toFixed(2).toString().length
              ) + arrayCompra[i]["preuU"].toFixed(2)
            : "      "
        }  ${
          formatSpaces(
            8 - arrayCompra[i].subtotal.toFixed(2).toString().length
          ) + arrayCompra[i].subtotal.toFixed(2)
        }€\n`;
      }
    }
    let finaltxt = "";
    for (const x of detalles.split("\n")) {
      if (x.length > 0) {
        if (finaltxt.length > 0) finaltxt += "\n";
        finaltxt += x;
      }
    }

    return finaltxt;
  }
  /* Eze 4.0 */
  async imprimirSalida(movimiento: MovimientosInterface) {
    try {
      const parametros = await parametrosInstance.getParametros();
      const moment = require("moment-timezone");
      const fechaStr = moment(movimiento._id).tz("Europe/Madrid");
      const trabajador = await trabajadoresInstance.getTrabajadorById(
        movimiento.idTrabajador
      );
      const device = new escpos.Network("localhost");
      const printer = new escpos.Printer(device);
      let buffer = [
        { tipo: "setCharacterCodeTable", payload: 19 },
        { tipo: "encode", payload: "CP858" },
        { tipo: "font", payload: "a" },
        { tipo: "style", payload: "b" },
        { tipo: "align", payload: "CT" },
        { tipo: "size", payload: [0, 0] },
        { tipo: "text", payload: parametros.nombreTienda },
        { tipo: "text", payload: fechaStr.format("DD-MM-YYYY HH:mm") },
        { tipo: "text", payload: "Dependienta: " + trabajador.nombre },
        {
          tipo: "text",
          payload: "Retirada efectivo: " + movimiento.valor + "€",
        },
        { tipo: "size", payload: [1, 1] },
        { tipo: "text", payload: movimiento.valor + "€" },
        { tipo: "size", payload: [0, 0] },
        { tipo: "text", payload: "Concepto" },
        { tipo: "size", payload: [1, 1] },
        { tipo: "text", payload: movimiento.concepto },
      ];

      if (movimiento.codigoBarras && movimiento.codigoBarras !== "") {
        buffer.push({
          tipo: "barcode",
          payload: [movimiento.codigoBarras.slice(0, 12), "EAN13", 4],
        });
      }
      buffer.push({
        tipo: "text",
        payload: "\n\n\n",
      });
      buffer.push({
        tipo: "cut",
        payload: "PAPER_FULL_CUT",
      });

      const options = {
        imprimirLogo: false,
        tipo: "salida",
      };

      this.enviarMQTT(buffer, options);
    } catch (err) {
      logger.Error(146, err);
    }
  }

  /* Falta */
  async imprimirEntrada(movimiento: MovimientosInterface) {
    try {
      const parametros = await parametrosInstance.getParametros();
      const moment = require("moment-timezone");
      const fechaStr = moment(movimiento._id).tz("Europe/Madrid");
      const trabajador = await trabajadoresInstance.getTrabajadorById(
        movimiento.idTrabajador
      );
      let buffer = [
        { tipo: "setCharacterCodeTable", payload: 19 },
        { tipo: "encode", payload: "CP858" },
        { tipo: "font", payload: "a" },
        { tipo: "style", payload: "b" },
        { tipo: "align", payload: "CT" },
        { tipo: "size", payload: [0, 0] },
        { tipo: "text", payload: parametros.nombreTienda },
        { tipo: "text", payload: fechaStr.format("DD-MM-YYYY HH:mm") },
        { tipo: "text", payload: "Dependienta: " + trabajador.nombre },
        {
          tipo: "text",
          payload: "Ingreso efectivo: " + movimiento.valor + "€",
        },
        { tipo: "size", payload: [1, 1] },
        { tipo: "text", payload: movimiento.valor + "€" },
        { tipo: "size", payload: [0, 0] },
        { tipo: "text", payload: "Concepto" },
        { tipo: "size", payload: [1, 1] },
        { tipo: "text", payload: movimiento.concepto },
      ];

      if (movimiento.codigoBarras && movimiento.codigoBarras !== "") {
        buffer.push({
          tipo: "barcode",
          payload: [movimiento.codigoBarras.slice(0, 12), "EAN13", 4],
        });
      }
      buffer.push({
        tipo: "text",
        payload: "\n\n\n",
      });
      buffer.push({
        tipo: "cut",
        payload: "PAPER_FULL_CUT",
      });

      const options = {
        imprimirLogo: false,
        tipo: "entrada",
      };
      this.enviarMQTT(buffer, options);
    } catch (err) {
      console.log(err);
      mqttInstance.loggerMQTT(err);
    }
  }

  async imprimirDeuda(movimiento: MovimientosInterface, client: string) {
    try {
      const parametros = await parametrosInstance.getParametros();
      const moment = require("moment-timezone");
      const fechaStr = moment(movimiento._id).tz("Europe/Madrid");
      const trabajador = await trabajadoresInstance.getTrabajadorById(
        movimiento.idTrabajador
      );
      let buffer = [
        { tipo: "setCharacterCodeTable", payload: 19 },
        { tipo: "encode", payload: "CP858" },
        { tipo: "font", payload: "a" },
        { tipo: "style", payload: "b" },
        { tipo: "align", payload: "CT" },
        { tipo: "size", payload: [0, 0] },
        { tipo: "text", payload: parametros.nombreTienda },
        { tipo: "text", payload: fechaStr.format("DD-MM-YYYY HH:mm") },
        { tipo: "text", payload: "Cliente: " + client },
        {
          tipo: "text",
          payload: "Total pagado:",
        },
        { tipo: "size", payload: [1, 1] },
        { tipo: "text", payload: movimiento.valor + "€" },
        { tipo: "size", payload: [0, 0] },
        { tipo: "text", payload: "Concepto" },
        { tipo: "size", payload: [1, 1] },
        { tipo: "text", payload: movimiento.concepto },
      ];

      if (movimiento.codigoBarras && movimiento.codigoBarras !== "") {
        buffer.push({
          tipo: "barcode",
          payload: [movimiento.codigoBarras.slice(0, 12), "EAN13", 4],
        });
      }
      buffer.push({
        tipo: "text",
        payload: "\n\n\n",
      });
      buffer.push({
        tipo: "cut",
        payload: "PAPER_FULL_CUT",
      });

      const options = {
        imprimirLogo: false,
        tipo: "entrada",
      };
      this.enviarMQTT(buffer, options);
    } catch (err) {
      console.log(err);
      mqttInstance.loggerMQTT(err);
    }
  }

  // ========================================================================
  // PRINT 3G MOVEMENT
  // ========================================================================

  async imprimirMov3G(movement: MovimientosInterface, client: string) {
    try {
      const parameters = await parametrosInstance.getParametros();
      const printMov3G = parameters["params"]["imprimirMov3G"] == "Si";
      if (!printMov3G) return;

      const moment = require("moment-timezone");
      const dateStr = moment(movement._id).tz("Europe/Madrid");
      const strCliente = client ? "Cliente: " + client : "Cliente general";
      // add elements to buffer
      const addToBuffer = (tipo, payload) => buffer.push({ tipo, payload });

      const buffer = [];

      // initial configuration
      addToBuffer("setCharacterCodeTable", 19);
      addToBuffer("encode", "CP858");
      addToBuffer("font", "a");
      addToBuffer("style", "b");
      addToBuffer("align", "CT");
      addToBuffer("size", [0, 0]);

      // add text
      addToBuffer("text", parameters.nombreTienda);
      addToBuffer("text", dateStr.format("DD-MM-YYYY HH:mm"));
      addToBuffer("text", strCliente);
      addToBuffer("text", "Total 3G:");

      addToBuffer("size", [1, 1]);
      addToBuffer("text", `${movement.valor}€`);

      addToBuffer("size", [0, 0]);
      addToBuffer("text", movement?.concepto ? "Concepte" : "");
      addToBuffer("size", [1, 1]);
      addToBuffer("text", movement?.concepto || "");

      if (movement.codigoBarras && movement.codigoBarras !== "") {
        addToBuffer("barcode", [
          movement.codigoBarras.slice(0, 12),
          "EAN13",
          4,
        ]);
      }
      addToBuffer("text", "\n\n\n");
      addToBuffer("cut", "PAPER_FULL_CUT");

      const options = {
        imprimirLogo: false,
        tipo: "entrada",
      };
      this.enviarMQTT(buffer, options);
    } catch (err) {
      console.log(err);
      mqttInstance.loggerMQTT(err);
    }
  }

  async imprimirDeudaSalida(movimiento: MovimientosInterface, client: string) {
    try {
      const parametros = await parametrosInstance.getParametros();
      const moment = require("moment-timezone");
      const fechaStr = moment(movimiento._id).tz("Europe/Madrid");
      const trabajador = await trabajadoresInstance.getTrabajadorById(
        movimiento.idTrabajador
      );
      let buffer = [
        { tipo: "setCharacterCodeTable", payload: 19 },
        { tipo: "encode", payload: "CP858" },
        { tipo: "font", payload: "a" },
        { tipo: "style", payload: "b" },
        { tipo: "align", payload: "CT" },
        { tipo: "size", payload: [0, 0] },
        { tipo: "text", payload: parametros.nombreTienda },
        { tipo: "text", payload: fechaStr.format("DD-MM-YYYY HH:mm") },
        { tipo: "text", payload: "Cliente: " + client },
        {
          tipo: "text",
          payload: "Total deuda:",
        },
        { tipo: "size", payload: [1, 1] },
        { tipo: "text", payload: -1 * movimiento.valor + "€" },
        { tipo: "size", payload: [0, 0] },
        { tipo: "text", payload: "Concepto" },
        { tipo: "size", payload: [1, 1] },
        { tipo: "text", payload: movimiento.concepto },
      ];

      if (movimiento.codigoBarras && movimiento.codigoBarras !== "") {
        buffer.push({
          tipo: "barcode",
          payload: [movimiento.codigoBarras.slice(0, 12), "EAN13", 4],
        });
      }
      buffer.push({
        tipo: "text",
        payload: "\n\n\n",
      });
      buffer.push({
        tipo: "cut",
        payload: "PAPER_FULL_CUT",
      });

      const options = {
        imprimirLogo: false,
        tipo: "entrada",
      };
      this.enviarMQTT(buffer, options);
    } catch (err) {
      console.log(err);
      mqttInstance.loggerMQTT(err);
    }
  }
  async imprimirDeudasPagadas(movimiento) {}
  async imprimirTest() {
    try {
      const device = new escpos.Network("localhost");
      const options = {
        imprimirLogo: false,
      };
      this.enviarMQTT(
        [
          { tipo: "setCharacterCodeTable", payload: 19 },
          { tipo: "encode", payload: "CP858" },
          { tipo: "font", payload: "a" },
          { tipo: "style", payload: "b" },
          { tipo: "align", payload: "CT" },
          { tipo: "size", payload: [1, 1] },
          { tipo: "text", payload: "HOLA HOLA" },
          { tipo: "cut", payload: "PAPER_FULL_CUT" },
        ],
        options
      );
    } catch (err) {
      mqttInstance.loggerMQTT(err);
    }
  }

  dosDigitos(n) {
    return n < 10 ? "0" + n : n.toString();
  }
  /* Eze 4.0 */
  async imprimirCajaAsync(caja: CajaSincro) {
    try {
      const moment = require("moment-timezone");
      const fechaInicio = moment(caja.inicioTime).tz("Europe/Madrid");
      const fechaFinal = moment(caja.finalTime).tz("Europe/Madrid");
      const arrayMovimientos =
        await movimientosInstance.getMovimientosIntervalo(
          caja.inicioTime,
          caja.finalTime
        );
      const parametros = await parametrosInstance.getParametros();
      const trabajadorApertura = await trabajadoresInstance.getTrabajadorById(
        caja.idDependientaApertura
      );
      const trabajadorCierre = await trabajadoresInstance.getTrabajadorById(
        caja.idDependientaCierre
      );
      let dependientas = "";
      for (const item of caja.fichajes) {
        const nombre = (await trabajadoresInstance.getTrabajadorById(item))
          .nombre;
        dependientas += `${nombre}\n`;
      }
      let paytef = "";
      let datafono3G = "";
      let textoMovimientos = "";
      let totalDeudaCaja = 0;
      const mediaTickets = caja.mediaTickets;
      const arrayDeudasCaja = await deudasInstance.getDeudasCajaAsync();
      for (let i = 0; i < arrayDeudasCaja.length; i++) {
        switch (arrayDeudasCaja[i].estado) {
          case "SIN_PAGAR":
            totalDeudaCaja -= Number(arrayDeudasCaja[i].total.toFixed(2));
            break;
        }
      }
      const arrayTickets: TicketsInterface[] =
        await ticketsInstance.getTicketsIntervalo(
          caja.inicioTime,
          caja.finalTime
        );
      if (parametros?.params?.DesgloseVisasCierreCaja == "Si") {
        datafono3G += "Desglossament Vises 3G:\n";
        for (let i = 0; i < arrayTickets.length; i++) {
          const auxFecha = new Date(arrayTickets[i].timestamp);
          if (arrayTickets[i]?.datafono3G) {
            const signo = arrayTickets[i]?.anulado ? "" : "+";
            datafono3G += ` Quant: ${signo}${arrayTickets[i].total.toFixed(
              2
            )} Data: ${auxFecha.getDate()}/${(auxFecha.getMonth() + 1)
              .toString()
              .padStart(2, "0")}/${auxFecha.getFullYear()} ${this.dosDigitos(
              auxFecha.getHours()
            )}:${this.dosDigitos(auxFecha.getMinutes())}\n`;
          }
        }
      }
      for (let i = 0; i < arrayMovimientos.length; i++) {
        const auxFecha = new Date(arrayMovimientos[i]._id);
        switch (arrayMovimientos[i].tipo) {
          case "DEV_DATAFONO_PAYTEF":
            break;
          case "DEV_DATAFONO_3G":
            break;
          case "TARJETA":
            break;
          case "TKRS_CON_EXCESO":
            break;
          case "TKRS_SIN_EXCESO":
            break;
          case "DEUDA":
            break;
          case "SALIDA":
            if (arrayMovimientos[i].concepto == "DEUDA") {
              textoMovimientos += ` Deute deixat a deure:\n  Quant: -${arrayMovimientos[
                i
              ].valor.toFixed(2)} Data: ${auxFecha.getDate()}/${(
                auxFecha.getMonth() + 1
              )
                .toString()
                .padStart(
                  2,
                  "0"
                )}/${auxFecha.getFullYear()} ${auxFecha.getHours()}:${auxFecha.getMinutes()}\n`;
            } else if (arrayMovimientos[i].concepto == "DEUDA ALBARAN") {
              textoMovimientos += ` Deute albara deixat a deure:\n  Quant: -${arrayMovimientos[
                i
              ].valor.toFixed(2)} Data: ${auxFecha.getDate()}/${(
                auxFecha.getMonth() + 1
              )
                .toString()
                .padStart(
                  2,
                  "0"
                )}/${auxFecha.getFullYear()} ${auxFecha.getHours()}:${auxFecha.getMinutes()}\n`;
            } else {
              textoMovimientos += ` Sortida:\n  Quant: -${arrayMovimientos[
                i
              ].valor.toFixed(2)} Data: ${auxFecha.getDate()}/${(
                auxFecha.getMonth() + 1
              )
                .toString()
                .padStart(
                  2,
                  "0"
                )}/${auxFecha.getFullYear()} ${auxFecha.getHours()}:${auxFecha.getMinutes()}\n  Concepte: ${
                arrayMovimientos[i].concepto
              }\n`;
            }
            break;
          case "ENTRADA_DINERO":
            if (arrayMovimientos[i].concepto == "DEUDA") {
              textoMovimientos += ` Deute pagat:\n  Quant: +${arrayMovimientos[
                i
              ].valor.toFixed(2)} Data: ${auxFecha.getDate()}/${(
                auxFecha.getMonth() + 1
              )
                .toString()
                .padStart(
                  2,
                  "0"
                )}/${auxFecha.getFullYear()} ${auxFecha.getHours()}:${auxFecha.getMinutes()}\n`;
            } else if (arrayMovimientos[i].concepto == "DEUDA ALBARAN") {
              textoMovimientos += ` Deute albara pagat:\n  Quant: +${arrayMovimientos[
                i
              ].valor.toFixed(2)} Data: ${auxFecha.getDate()}/${(
                auxFecha.getMonth() + 1
              )
                .toString()
                .padStart(
                  2,
                  "0"
                )}/${auxFecha.getFullYear()} ${auxFecha.getHours()}:${auxFecha.getMinutes()}\n`;
            }
            {
              textoMovimientos += ` Entrada:\n  Quant: +${arrayMovimientos[
                i
              ].valor.toFixed(2)} Data: ${auxFecha.getDate()}/${(
                auxFecha.getMonth() + 1
              )
                .toString()
                .padStart(
                  2,
                  "0"
                )}/${auxFecha.getFullYear()} ${auxFecha.getHours()}:${auxFecha.getMinutes()}\n  Concepte: ${
                arrayMovimientos[i].concepto
              }\n`;
            }
            break;
          case "DATAFONO_3G":
            if (parametros?.params?.DesgloseVisasCierreCaja == "Si") {
              datafono3G += `  Quant: +${arrayMovimientos[i].valor.toFixed(
                2
              )} Data: ${auxFecha.getDate()}/${(auxFecha.getMonth() + 1)
                .toString()
                .padStart(
                  2,
                  "0"
                )}/${auxFecha.getFullYear()} ${auxFecha.getHours()}:${auxFecha.getMinutes()}\n`;
            }
          case "DEV_DATAFONO_3G":
            if (parametros?.params?.DesgloseVisasCierreCaja == "Si") {
              datafono3G += `  Quant: -${arrayMovimientos[i].valor.toFixed(
                2
              )} Data: ${auxFecha.getDate()}/${(auxFecha.getMonth() + 1)
                .toString()
                .padStart(
                  2,
                  "0"
                )}/${auxFecha.getFullYear()} ${auxFecha.getHours()}:${auxFecha.getMinutes()}\n`;
            }
            break;
        }
      }
      textoMovimientos += `\nTotal targeta: ${(
        caja.cantidadPaytef + caja.totalDatafono3G
      ).toFixed(
        2
      )}\nDeutes acumulades en la caixa: ${totalDeudaCaja}\nTotal deutes acumulades: ${caja.totalDeudas.toFixed(
        2
      )}`;

      const device = new escpos.Network("localhost");
      const printer = new escpos.Printer(device);

      const diasSemana = [
        "Diumenge",
        "Dilluns",
        "Dimarts",
        "Dimecres",
        "Dijous",
        "Divendres",
        "Dissabte",
      ];
      let buffer = [
        { tipo: "setCharacterCodeTable", payload: 19 },
        { tipo: "encode", payload: "CP858" },
        { tipo: "font", payload: "a" },
        { tipo: "style", payload: "b" },
        { tipo: "align", payload: "CT" },
        { tipo: "size", payload: [1, 1] },
        { tipo: "text", payload: "BOTIGA : " + parametros.nombreTienda },
        { tipo: "size", payload: [0, 0] },
        { tipo: "text", payload: "Resum caixa" },
        { tipo: "text", payload: "" },
        { tipo: "align", payload: "LT" },
        {
          tipo: "text",
          payload: "Resp. apertura   : " + trabajadorApertura.nombre,
        },
        {
          tipo: "text",
          payload: "Resp. cierre   : " + trabajadorCierre?.nombre,
        },
        {
          tipo: "text",
          payload: `Inici: ${
            diasSemana[fechaInicio.format("d")]
          } ${fechaInicio.format("DD-MM-YYYY HH:mm")}`,
        },
        {
          tipo: "text",
          payload: `Final: ${
            diasSemana[fechaFinal.format("d")]
          } ${fechaFinal.format("DD-MM-YYYY HH:mm")}`,
        },
        {
          tipo: "text",
          payload: "Dependents   : \n" + dependientas,
        },
        { tipo: "text", payload: "" },
        { tipo: "size", payload: [0, 1] },
      ];
      // si el parametro MostraTotalAcumulat es Si concatenamos buffer con el valor dentro del if
      if (parametros.params?.MostraTotalAcumulat == "Si") {
        buffer.push({
          tipo: "text",
          payload: "Calaix fet       :      " + caja.calaixFetZ.toFixed(2),
        });
      }
      const cambioEmergenciaApertura = caja.cambioEmergenciaApertura ?? 0;
      const cambioEmergenciaCierre = caja.cambioEmergenciaCierre ?? 0;
      // concatenamos buffer con el siguiente array despues del if
      buffer = buffer.concat([
        {
          tipo: "text",
          payload: "Descuadre        :      " + caja.descuadre.toFixed(2),
        },
        {
          tipo: "text",
          payload: "Cli. at. Caixa   :      " + caja.nClientes,
        },
        {
          tipo: "text",
          payload: "Cli. at. Taules  :      " + caja.nClientesMesas,
        },
        {
          tipo: "text",
          payload:
            "Canvi d'emergencia Apertura  :      " + cambioEmergenciaApertura,
        },
        {
          tipo: "text",
          payload:
            "Canvi d'emergencia tancament :      " + cambioEmergenciaCierre,
        },
        {
          tipo: "text",
          payload: "Mitjana de tickets:      " + mediaTickets,
        },
      ]);

      if (parametros.params?.MostraTotalAcumulat == "Si") {
        buffer.push({
          tipo: "text",
          payload: "Recaudat         :      " + caja.recaudado.toFixed(2),
        });
      }

      buffer = buffer.concat([
        {
          tipo: "text",
          payload: "Datafon 3G       :      " + caja.totalDatafono3G,
        },
        {
          tipo: "text",
          payload: "Tickets 3G       :      " + caja.cantidadLocal3G.toFixed(2),
        },
        {
          tipo: "text",
          payload: "Paytef           :      " + caja.cantidadPaytef.toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "Tickets Paytef   :      " + caja.totalLocalPaytef.toFixed(2),
        },
        {
          tipo: "text",
          payload: "Canvi inicial    :      " + caja.totalApertura.toFixed(2),
        },
        {
          tipo: "text",
          payload: "Canvi final      :      " + caja.totalCierre.toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "total Albarans      :      " + caja.totalAlbaranes.toFixed(2),
        },
        { tipo: "text", payload: "" },
        { tipo: "size", payload: [0, 0] },
        { tipo: "text", payload: "Moviments de caixa:" },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: textoMovimientos },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: datafono3G },
        { tipo: "text", payload: "" },
        {
          tipo: "text",
          payload:
            " 0.01 ----> " +
            caja.detalleApertura[0]["valor"].toFixed(2) +
            "      " +
            "0.01 ----> " +
            caja.detalleCierre[0]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            " 0.02 ----> " +
            caja.detalleApertura[1]["valor"].toFixed(2) +
            "      " +
            "0.02 ----> " +
            caja.detalleCierre[1]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            " 0.05 ----> " +
            caja.detalleApertura[2]["valor"].toFixed(2) +
            "      " +
            "0.05 ----> " +
            caja.detalleCierre[2]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            " 0.10 ----> " +
            caja.detalleApertura[3]["valor"].toFixed(2) +
            "      " +
            "0.10 ----> " +
            caja.detalleCierre[3]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            " 0.20 ----> " +
            caja.detalleApertura[4]["valor"].toFixed(2) +
            "      " +
            "0.20 ----> " +
            caja.detalleCierre[4]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            " 0.50 ----> " +
            caja.detalleApertura[5]["valor"].toFixed(2) +
            "      " +
            "0.50 ----> " +
            caja.detalleCierre[5]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            " 1.00 ----> " +
            caja.detalleApertura[6]["valor"].toFixed(2) +
            "      " +
            "1.00 ----> " +
            caja.detalleCierre[6]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            " 2.00 ----> " +
            caja.detalleApertura[7]["valor"].toFixed(2) +
            "      " +
            "2.00 ----> " +
            caja.detalleCierre[7]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            " 5.00 ----> " +
            caja.detalleApertura[8]["valor"].toFixed(2) +
            "      " +
            "5.00 ----> " +
            caja.detalleCierre[8]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            " 10.00 ---> " +
            caja.detalleApertura[9]["valor"].toFixed(2) +
            "      " +
            "10.00 ---> " +
            caja.detalleCierre[9]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            " 20.00 ---> " +
            caja.detalleApertura[10]["valor"].toFixed(2) +
            "      " +
            "20.00 ---> " +
            caja.detalleCierre[10]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            " 50.00 ---> " +
            caja.detalleApertura[11]["valor"].toFixed(2) +
            "      " +
            "50.00 ---> " +
            caja.detalleCierre[11]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            " 100.00 --> " +
            caja.detalleApertura[12]["valor"].toFixed(2) +
            "      " +
            "100.00 --> " +
            caja.detalleCierre[12]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            " 200.00 --> " +
            caja.detalleApertura[13]["valor"].toFixed(2) +
            "      " +
            "200.00 --> " +
            caja.detalleCierre[13]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            " 500.00 --> " +
            caja.detalleApertura[14]["valor"].toFixed(2) +
            "      " +
            "500.00 --> " +
            caja.detalleCierre[14]["valor"].toFixed(2),
        },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "" },
        { tipo: "cut", payload: "PAPER_FULL_CUT" },
      ]);
      const options = { imprimirLogo: true, tipo: "cierreCaja" };
      this.enviarMQTT(buffer, options);
    } catch (err) {
      console.log(err);
      logger.Error(145, err);
    }
  }

  async abrirCajon() {
    const arrayImprimir = [{ tipo: "cashdraw", payload: 2 }];
    const options = { imprimirlogo: false };
    this.enviarMQTT(arrayImprimir, options);
  }

  async mostrarVisor(data) {
    let eur = "E";

    let lengthTotal = "";
    let datosExtra = "";
    if (data.total !== undefined) {
      lengthTotal = data.total.toString();
      let prods = "Productes";
      if (data.numProductos > 99) prods = "Prods.";
      const numArticle = prods + ": " + data.numProductos;
      const total = data.total + eur;
      const size = 20 - (numArticle.length + total.length);
      const espacios = [
        "",
        " ",
        "  ",
        "   ",
        "    ",
        "     ",
        "      ",
        "       ",
        "        ",
        "         ",
        "          ",
        "           ",
        "            ",
        "             ",
        "              ",
      ];
      datosExtra = numArticle + espacios[size] + total;
    }
    if (datosExtra.length <= 2) {
      datosExtra = "";
      eur = "";
    }
    // Elimino caracteres conflictivos para el visor
    data.texto = data.texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (data.texto.includes("'")) {
      data.texto = data.texto.replace(/'/g, " ");
    }
    if (data.texto.includes("´")) {
      data.texto = data.texto.replace(/´/g, " ");
    }
    if (data.texto.includes("`")) {
      data.texto = data.texto.replace(/`/g, " ");
    }
    // Limito el texto del nombre del producto
    const maxNombreLength = 11;
    if (data.texto.length > maxNombreLength) {
      data.texto = data.texto.substring(0, maxNombreLength) + "...";
    }
    data.texto += " " + data.precio + eur;

    let string = `${datosExtra}${data.texto}                                               `;
    let lines = 2;
    string = string.padEnd(lines * 20, " ");
    let output = "";
    for (let i = 0; i < 2; i++) {
      output += string.substring(i * 20, (i + 1) * 20) + "";
    }
    mqttInstance.enviarVisor(output);
  }

  async imprimirTicketPaytef(data, copia) {
    let params = await parametrosInstance.getParametros();

    const fecha = `${data.timestamp.day}/${data.timestamp.month}/${data.timestamp.year} - ${data.timestamp.hour}:${data.timestamp.minute}`;
    const device = new escpos.Network();
    const printer = new escpos.Printer(device);
    const options = { imprimirLogo: true };
    await this.enviarMQTT(
      [
        { tipo: "setCharacterCodeTable", payload: 19 },
        { tipo: "encode", payload: "CP858" },
        { tipo: "font", payload: "a" },
        { tipo: "style", payload: "b" },
        { tipo: "align", payload: "CT" },
        { tipo: "size", payload: [2, 2] },
        { tipo: "text", payload: data.typeName },
        { tipo: "align", payload: "LT" },
        { tipo: "size", payload: [0, 0] },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: params.header },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "HCP: " + data.bankName },
        {
          tipo: "text",
          payload: "Estado: " + (data.approved ? "Aprobado" : "Denegado"),
        },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: data.country },
        {
          tipo: "text",
          payload: "Entidad Bancaria: " + data.issuerNameAndCountry,
        },
        {
          tipo: "text",
          payload: "Tarjeta: " + data.hiddenCardNumber,
        },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "Data: " + fecha },
        {
          tipo: "text",
          payload: "Nº Operación: " + data.id,
        },
        { tipo: "text", payload: "Autorización: " + data.authorisationCode },
        { tipo: "text", payload: "" },
        { tipo: "size", payload: [1, 1] },
        { tipo: "text", payload: "Importe: " + data.amountWithSign + "€" },
        { tipo: "text", payload: "" },
        { tipo: "size", payload: [0, 0] },
        {
          tipo: "text",
          payload: "Operación " + data.reference,
        },
        {
          tipo: "text",
          payload: `FIRMA NECESARIA`,
        },
        { tipo: "text", payload: "------" },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "------" },
        { tipo: "text", payload: `COPIA PARA EL ${copia}` },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "" },
        { tipo: "cut", payload: "PAPER_FULL_CUT" },
      ],
      options
    );
  }

  async imprimirEntregas() {
    const params = await parametrosInstance.getParametros();
    return axios
      .post("entregas/getEntregas", {
        database: params.database,
        licencia: params.licencia,
      })
      .then(async (res: any) => {
        try {
          const options = { imprimirLogo: true };

          this.enviarMQTT(
            [
              { tipo: "setCharacterCodeTable", payload: 19 },
              { tipo: "encode", payload: "CP858" },
              { tipo: "font", payload: "a" },
              { tipo: "style", payload: "b" },
              { tipo: "align", payload: "CT" },
              { tipo: "size", payload: [0, 0] },
              { tipo: "text", payload: res.data.info },
              { tipo: "cut", payload: "PAPER_FULL_CUT" },
            ],
            options
          );
          return { error: false, info: "OK" };
        } catch (err) {
          mqttInstance.loggerMQTT(err);
          return { error: true, info: "Error en CATCH imprimirEntregas() 2" };
        }
      })
      .catch((err) => {
        mqttInstance.loggerMQTT(err);
        return { error: true, info: "Error en CATCH imprimirEntregas() 1" };
      });
  }
  async imprimirIntervaloDeuda(fechaInicial, fechaFinal) {
    const unDiaEnMilisegundos = 86400000;
    const tmpInicial = new Date(fechaInicial).getTime();
    const tmpFinal = new Date(fechaFinal).getTime() + unDiaEnMilisegundos;
    // buscamos deudas con pagado=false des del intervalo que ha llegado a la funcion
    const deudas = await schDeudas.getIntervaloDeuda(tmpInicial, tmpFinal);

    if (deudas.length == 0)
      return { error: true, msg: "No se encontraron deudas en ese intervalo" };
    let string = "";

    // Imprimir las deudas por orden de fecha
    await deudas.forEach((deuda) => {
      const date = new Date(deuda.timestamp);
      const dateOptions: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      };
      const options = { hour12: false };
      const fecha = date.toLocaleDateString("es-ES", dateOptions);
      const hora = date.toLocaleTimeString(undefined, options);

      string += `\n${fecha} ${hora}`;
      string += `\n - cliente: ${deuda.nombreCliente}`;
      string += `\n - total: ${deuda.total} EUR`;
      string += `\n - productos:`;
      const clientes = deuda.cesta.lista;
      deuda.cesta.lista.forEach((producto) => {
        const nombreProducto = producto.nombre.substring(0, 32);
        const suplementos = producto.arraySuplementos || [];
        const productoConSuplementos = ` ${suplementos
          .map((suplemento) => `\n    ${suplemento.nombre}`)
          .join(", ")}`;
        const unidades = producto.unidades;
        string += `\n  -> ${producto.nombre}: ${unidades}u`;
        string += `${productoConSuplementos}\n`;
      });
    });
    // enviamos el string a la impresora por mqtt
    const options = { imprimirLogo: true };
    this.enviarMQTT(
      [
        { tipo: "setCharacterCodeTable", payload: 19 },
        { tipo: "encode", payload: "CP858" },
        { tipo: "font", payload: "a" },
        { tipo: "style", payload: "b" },
        { tipo: "size", payload: [0, 0] },
        { tipo: "align", payload: "LT" },
        { tipo: "text", payload: string },
        { tipo: "cut", payload: "PAPER_FULL_CUT" },
      ],
      options
    );
    return { error: false, msg: "Good work bro" };
  }
  async imprimirPedido(encargo: EncargosInterface) {
    const parametros = await parametrosInstance.getParametros();
    const trabajador: TrabajadoresInterface =
      await trabajadoresInstance.getTrabajadorById(encargo.idTrabajador);

    const cabecera = parametros?.header == undefined ? "" : parametros.header;
    const moment = require("moment-timezone");
    const fecha = moment(encargo.timestamp).tz("Europe/Madrid");
    let detalles = await this.detallesTicket(
      encargo.cesta.lista,
      encargo.idCliente
    );
    let tipoFormatoDetalle = await this.comprobarFormatoDetalle(
      encargo.cesta.lista,
      encargo.idCliente
    );
    let detalleImporte = "";
    let importe = "Total:" + encargo.total.toFixed(2) + " €";

    const detallesIva = await this.getDetallesIva(encargo.cesta.detalleIva);
    let detalleIva = "";
    detalleIva =
      detallesIva.detalleIvaTipo4 +
      detallesIva.detalleIvaTipo1 +
      detallesIva.detalleIvaTipo5 +
      detallesIva.detalleIvaTipo2 +
      detallesIva.detalleIvaTipo3;
    // mostramos las observaciones de los productos
    let observacions = "";
    for (const producto of encargo.productos) {
      if (producto.comentario != "") {
        const nombreLimpio = producto.nombre.startsWith("+")
          ? producto.nombre.substring(1)
          : producto.nombre;
        observacions += `- ${nombreLimpio}: ${producto.comentario}\n`;
      }
    }
    let fechaEncargo = encargo.fecha + " " + encargo.hora;
    try {
      const device = new escpos.Network();
      const printer = new escpos.Printer(device);
      const options = { imprimirLogo: true };

      this.enviarMQTT(
        [
          { tipo: "setCharacterCodeTable", payload: 19 },
          { tipo: "encode", payload: "CP858" },
          { tipo: "font", payload: "a" },
          { tipo: "style", payload: "b" },
          { tipo: "align", payload: "CT" },
          { tipo: "size", payload: [1, 1] },
          { tipo: "text", payload: "Comanda" },
          { tipo: "size", payload: [0, 0] },
          { tipo: "align", payload: "LT" },
          { tipo: "text", payload: cabecera },
          {
            tipo: "text",
            payload: `Data: ${fecha.format("DD-MM-YYYY HH:mm")}`,
          },
          { tipo: "text", payload: "Ates per: " + trabajador.nombreCorto },
          { tipo: "text", payload: "Data d'entrega: " + fechaEncargo },
          { tipo: "control", payload: "LF" },
          {
            tipo: "text",
            payload: formatoDetalle[tipoFormatoDetalle],
          },
          {
            tipo: "text",
            payload: "------------------------------------------",
          },
          { tipo: "align", payload: "LT" },
          { tipo: "text", payload: detalles },
          {
            tipo: "text",
            payload: "------------------------------------------",
          },
          { tipo: "text", payload: detalleImporte },
          { tipo: "text", payload: "" },
          { tipo: "size", payload: [1, 1] },
          { tipo: "text", payload: importe },
          { tipo: "text", payload: "" },
          { tipo: "text", payload: "Observacions:" },
          { tipo: "text", payload: observacions },
          { tipo: "size", payload: [0, 0] },
          { tipo: "align", payload: "CT" },
          { tipo: "text", payload: "Base IVA         IVA         IMPORT" },
          { tipo: "text", payload: detalleIva },
          { tipo: "text", payload: "-- ES COPIA --" },
          { tipo: "control", payload: "LF" },
          { tipo: "text", payload: "ID: " + random() + " - " + random() },
          {
            tipo: "barcode",
            payload: [encargo.codigoBarras.toString().slice(0, 12), "EAN13", 4],
          },

          { tipo: "cut", payload: "PAPER_FULL_CUT" },
        ],
        options
      );
      return { error: false, info: "OK" };
    } catch (err) {
      console.log(err);
      logger.Error(159, err);
      return { error: true, info: "Error en CATCH imprimirPedido()" };
    }
  }
  async imprimirEncargo(encargo: EncargosInterface) {
    const parametros = await parametrosInstance.getParametros();
    const trabajador: TrabajadoresInterface =
      await trabajadoresInstance.getTrabajadorById(encargo.idTrabajador);
    const cliente: ClientesInterface = await clienteInstance.isClienteDescuento(
      encargo.idCliente
    );
    const descuento: any =
      cliente && !cliente?.albaran && !cliente?.vip
        ? Number(cliente.descuento)
        : 0;
    const clienteEnc = cliente && cliente?.nombre ? cliente.nombre : "No en té";
    const telefono: ClientesInterface["telefono"] =
      cliente?.telefono && cliente?.telefono.length > 1
        ? cliente.telefono
        : "No en té";
    const cabecera = parametros?.header == undefined ? "" : parametros.header;
    const moment = require("moment-timezone");
    const fecha = moment(encargo.timestamp).tz("Europe/Madrid");
    let detalles = await this.detallesTicket(
      encargo.cesta.lista,
      encargo.idCliente
    );
    let tipoFormatoDetalle = await this.comprobarFormatoDetalle(
      encargo.cesta.lista,
      encargo.idCliente
    );
    let detalleImporte = "";
    let importe = "";
    if (encargo.dejaCuenta == 0) {
      if (descuento && descuento != 0) {
        detalleImporte = `Total sense descompte: ${(
          encargo.total /
          (1 - descuento / 100)
        ).toFixed(2)}€\nDescompte total: ${(
          (encargo.total * descuento) /
          100
        ).toFixed(2)}€ \n`;
      }
      importe = "Total:" + encargo.total.toFixed(2) + " €";
    } else {
      if (descuento && descuento != 0) {
        detalleImporte = `Total sense descompte: ${(
          encargo.total /
          (1 - descuento / 100)
        ).toFixed(2)}€\nDescompte total: ${(
          (encargo.total * descuento) /
          100
        ).toFixed(2)}€ \n`;
      }
      detalleImporte += `Import total:${encargo.total.toFixed(2)}\n`;
      importe =
        `Import pagat: ${encargo.dejaCuenta.toFixed(2)} €\n` +
        "Total restant:" +
        (encargo.total - encargo.dejaCuenta).toFixed(2) +
        " €";
    }

    const detallesIva = await this.getDetallesIva(encargo.cesta.detalleIva);
    let detalleIva = "";
    detalleIva =
      detallesIva.detalleIvaTipo4 +
      detallesIva.detalleIvaTipo1 +
      detallesIva.detalleIvaTipo5 +
      detallesIva.detalleIvaTipo2 +
      detallesIva.detalleIvaTipo3;
    // mostramos las observaciones de los productos
    let observacions = "";
    for (const producto of encargo.productos) {
      if (producto.comentario != "") {
        const nombreLimpio = producto.nombre.startsWith("+")
          ? producto.nombre.substring(1)
          : producto.nombre;
        observacions += `- ${nombreLimpio}: ${producto.comentario}\n`;
      }
    }
    let fechaEncargo = "";
    if (encargo.opcionRecogida == 1 && encargo.amPm == "pm") {
      encargo.hora = encargo.fecha + "torn de tarda";
    } else if (encargo.opcionRecogida == 1 && encargo.amPm == "am") {
      encargo.hora = encargo.fecha + "torn de matí";
    } else if (encargo.opcionRecogida == 3) {
      let diaSemana = "";
      switch (encargo.dias[0].dia) {
        case "Lunes":
          diaSemana = "Dilluns";
          break;
        case "Martes":
          diaSemana = "Dimarts";
          break;
        case "Miércoles":
          diaSemana = "Dimecres";
          break;
        case "Jueves":
          diaSemana = "Dijous";
          break;
        case "Viernes":
          diaSemana = "Divendres";
          break;
        case "Sábado":
          diaSemana = "Dissabte";
          break;
        case "Domingo":
          diaSemana = "Diumenge";
          break;
        default:
          break;
      }
      fechaEncargo =
        "Cada " + diaSemana + ",\n proper " + diaSemana + " " + encargo.fecha;
    } else {
      fechaEncargo = encargo.fecha + " " + encargo.hora;
    }
    try {
      const device = new escpos.Network();
      const printer = new escpos.Printer(device);
      const options = { imprimirLogo: true };

      this.enviarMQTT(
        [
          { tipo: "setCharacterCodeTable", payload: 19 },
          { tipo: "encode", payload: "CP858" },
          { tipo: "font", payload: "a" },
          { tipo: "style", payload: "b" },
          { tipo: "align", payload: "CT" },
          { tipo: "size", payload: [1, 1] },
          { tipo: "text", payload: "ENTREGA COPIA 1" },
          { tipo: "size", payload: [0, 0] },
          { tipo: "align", payload: "LT" },
          { tipo: "text", payload: cabecera },
          {
            tipo: "text",
            payload: `Data: ${fecha.format("DD-MM-YYYY HH:mm")}`,
          },
          { tipo: "text", payload: "Ates per: " + trabajador.nombreCorto },
          { tipo: "text", payload: "Client: " + clienteEnc },
          { tipo: "text", payload: "Telèfon Client: " + telefono },
          { tipo: "text", payload: "Data d'entrega: " + fechaEncargo },
          { tipo: "control", payload: "LF" },
          {
            tipo: "text",
            payload: formatoDetalle[tipoFormatoDetalle],
          },
          {
            tipo: "text",
            payload: "------------------------------------------",
          },
          { tipo: "align", payload: "LT" },
          { tipo: "text", payload: detalles },
          {
            tipo: "text",
            payload: "------------------------------------------",
          },
          { tipo: "text", payload: detalleImporte },
          { tipo: "text", payload: "" },
          { tipo: "size", payload: [1, 1] },
          { tipo: "text", payload: importe },
          { tipo: "text", payload: "" },
          { tipo: "text", payload: "Observacions:" },
          { tipo: "text", payload: observacions },
          { tipo: "size", payload: [0, 0] },
          { tipo: "align", payload: "CT" },
          { tipo: "text", payload: "Base IVA         IVA         IMPORT" },
          { tipo: "text", payload: detalleIva },
          { tipo: "text", payload: "-- ES COPIA --" },
          { tipo: "control", payload: "LF" },
          { tipo: "text", payload: "ID: " + random() + " - " + random() },
          {
            tipo: "barcode",
            payload: [encargo.codigoBarras.toString().slice(0, 12), "EAN13", 4],
          },

          { tipo: "cut", payload: "PAPER_FULL_CUT" },
          { tipo: "setCharacterCodeTable", payload: 19 },
          { tipo: "encode", payload: "CP858" },
          { tipo: "font", payload: "a" },
          { tipo: "style", payload: "b" },
          { tipo: "align", payload: "CT" },
          { tipo: "size", payload: [1, 1] },
          { tipo: "text", payload: "ENTREGA COPIA 2" },
          { tipo: "size", payload: [0, 0] },
          { tipo: "align", payload: "LT" },
          { tipo: "text", payload: cabecera },
          {
            tipo: "text",
            payload: `Data: ${fecha.format("DD-MM-YYYY HH:mm")}`,
          },
          { tipo: "text", payload: "Ates per: " + trabajador.nombreCorto },
          { tipo: "text", payload: "Client: " + clienteEnc },
          { tipo: "text", payload: "Telèfon Client: " + telefono },
          { tipo: "text", payload: "Data d'entrega: " + fechaEncargo },
          { tipo: "control", payload: "LF" },
          {
            tipo: "text",
            payload: formatoDetalle[tipoFormatoDetalle],
          },
          {
            tipo: "text",
            payload: "------------------------------------------",
          },
          { tipo: "align", payload: "LT" },
          { tipo: "text", payload: detalles },
          {
            tipo: "text",
            payload: "------------------------------------------",
          },
          { tipo: "text", payload: detalleImporte },
          { tipo: "text", payload: "" },
          { tipo: "size", payload: [1, 1] },
          { tipo: "text", payload: importe },
          { tipo: "text", payload: "" },
          { tipo: "text", payload: "Observacions:" },
          { tipo: "text", payload: observacions },
          { tipo: "size", payload: [0, 0] },
          { tipo: "align", payload: "CT" },
          { tipo: "text", payload: "Base IVA         IVA         IMPORT" },
          { tipo: "text", payload: detalleIva },
          { tipo: "text", payload: "-- ES COPIA --" },
          { tipo: "control", payload: "LF" },
          { tipo: "text", payload: "ID: " + random() + " - " + random() },
          {
            tipo: "barcode",
            payload: [encargo.codigoBarras.toString().slice(0, 12), "EAN13", 4],
          },

          { tipo: "cut", payload: "PAPER_FULL_CUT" },
          { tipo: "setCharacterCodeTable", payload: 19 },
          { tipo: "encode", payload: "CP858" },
          { tipo: "font", payload: "a" },
          { tipo: "style", payload: "b" },
          { tipo: "align", payload: "CT" },
          { tipo: "size", payload: [1, 1] },
          { tipo: "text", payload: "ENTREGA COPIA 3" },
          { tipo: "size", payload: [0, 0] },
          { tipo: "align", payload: "LT" },
          { tipo: "text", payload: cabecera },
          {
            tipo: "text",
            payload: `Data: ${fecha.format("DD-MM-YYYY HH:mm")}`,
          },
          { tipo: "text", payload: "Ates per: " + trabajador.nombreCorto },
          { tipo: "text", payload: "Client: " + clienteEnc },
          { tipo: "text", payload: "Telèfon Client: " + telefono },
          { tipo: "text", payload: "Data d'entrega: " + fechaEncargo },
          { tipo: "control", payload: "LF" },
          {
            tipo: "text",
            payload: formatoDetalle[tipoFormatoDetalle],
          },
          {
            tipo: "text",
            payload: "------------------------------------------",
          },
          { tipo: "align", payload: "LT" },
          { tipo: "text", payload: detalles },
          {
            tipo: "text",
            payload: "------------------------------------------",
          },
          { tipo: "text", payload: detalleImporte },
          { tipo: "text", payload: "" },
          { tipo: "size", payload: [1, 1] },
          { tipo: "text", payload: importe },
          { tipo: "text", payload: "" },
          { tipo: "text", payload: "Observacions:" },
          { tipo: "text", payload: observacions },
          { tipo: "size", payload: [0, 0] },
          { tipo: "align", payload: "CT" },
          { tipo: "text", payload: "Base IVA         IVA         IMPORT" },
          { tipo: "text", payload: detalleIva },
          { tipo: "text", payload: "-- ES COPIA --" },
          { tipo: "control", payload: "LF" },
          { tipo: "text", payload: "ID: " + random() + " - " + random() },
          {
            tipo: "barcode",
            payload: [encargo.codigoBarras.toString().slice(0, 12), "EAN13", 4],
          },

          { tipo: "cut", payload: "PAPER_FULL_CUT" },
        ],
        options
      );
      return { error: false, info: "OK" };
    } catch (err) {
      mqttInstance.loggerMQTT(err);
      return { error: true, info: "Error en CATCH imprimirEntregas() 2" };
    }
  }
  async comprobarFormatoDetalle(lista: ItemLista[], idCliente: string) {
    const cliente = await clienteInstance.isClienteDescuento(idCliente);
    const preuUnitari =
      (await parametrosInstance.getParametros())["params"]["PreuUnitari"] ==
      "Si";
    // comprueba si hay param dto y param iva
    const thereIsDto = lista.find((item) => "dto" in item) !== undefined;
    const thereIsDtoTienda =
      lista.find((item) => "descuentoTienda" in item) !== undefined;
    const thereIsIva = lista.find((item) => "iva" in item) !== undefined;
    if (
      cliente &&
      ((cliente.albaran && cliente.noPagaEnTienda) ||
        ((cliente?.vip || cliente?.albaran) && !cliente?.noPagaEnTienda))
    ) {
      // formato albaranNPT
      return 4;
    } else if (preuUnitari && (thereIsDto || thereIsDtoTienda)) {
      // "preuUnitari y con DTO")
      return 0;
    } else if (!preuUnitari && thereIsDto) {
      // "sin PreuU y con DTO")
      return 1;
    } else if (preuUnitari && !thereIsDto) {
      // "Con preuUnitari y  sin DTO")
      return 2;
    } else if (!preuUnitari && !thereIsDto) {
      // "Sin preuUnitari y sin DTO")
      return 3;
    }
    console.log("No se ha cumplido ninguna condicion");
    return 3;
  }
}
export const impresoraInstance = new Impresora();
