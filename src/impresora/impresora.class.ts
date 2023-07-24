import { articulosInstance } from "../articulos/articulos.clase";
import { ticketsInstance } from "../tickets/tickets.clase";
import { trabajadoresInstance } from "../trabajadores/trabajadores.clase";
import { TrabajadoresInterface } from "../trabajadores/trabajadores.interface";
import { clienteInstance } from "../clientes/clientes.clase";
import { parametrosInstance } from "../parametros/parametros.clase";
import axios from "axios";
import { mqttInstance } from "../mqtt";
import { ClientesInterface } from "../clientes/clientes.interface";
import { ItemLista } from "../cestas/cestas.interface";
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
moment.locale("es");
const escpos = require("escpos");
const exec = require("child_process").exec;
const os = require("os");
const mqtt = require("mqtt");
escpos.Network = require("escpos-network");
const TIPO_ENTRADA_DINERO = "ENTRADA";
const TIPO_SALIDA_DINERO = "SALIDA";

function random() {
  const numero = Math.floor(10000000 + Math.random() * 999999999);
  return numero.toString(16).slice(0, 8);
}

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
  async imprimirTicket(idTicket: number) {
    // recoge el ticket por la id
    const ticket = await ticketsInstance.getTicketById(idTicket);
    const parametros = await parametrosInstance.getParametros();

    const trabajador: TrabajadoresInterface =
      await trabajadoresInstance.getTrabajadorById(ticket.idTrabajador);
    // Preparamos el objeto que vamos a mandar a la impresora
    let sendObject: Object;
    // Si el ticket existe y el trabajador tambien
    if (ticket && trabajador) {
      // Si el ticket tiene cliente imprimimos los datos del cliente tambien
      if (ticket.idCliente && ticket.idCliente != "") {
        // recogemos los datos del cliente
        let infoCliente = await clienteInstance.getClienteById(
          ticket.idCliente
        );
        const puntos = await clienteInstance.getPuntosCliente(ticket.idCliente);
        // preparamos los parametros que vamos a enviar a la impresora
        sendObject = {
          numFactura: ticket._id,
          timestamp: ticket.timestamp,
          arrayCompra: ticket.cesta.lista,
          total: ticket.total,
          visa: await ticketsInstance.getFormaPago(ticket),
          tiposIva: ticket.cesta.detalleIva,
          cabecera: parametros.header,
          pie: parametros.footer,
          nombreTrabajador: trabajador.nombreCorto,
          infoClienteVip: null, // Mirar bien para terminar todo
          infoCliente: {
            nombre: infoCliente.nombre,
            puntos: puntos,
          },
          dejaCuenta: ticket.dejaCuenta,
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
          cabecera: parametros.header,
          pie: parametros.footer,
          nombreTrabajador: trabajador.nombreCorto,
          infoClienteVip: null, // Mirar bien para terminar todo
          infoCliente: null,
          dejaCuenta: ticket.dejaCuenta,
        };
      }
      // enviamos el objeto
      await this._venta(sendObject);
    }
  }

  async imprimirFirma(idTicket: number) {
    const ticket = await ticketsInstance.getTicketById(idTicket);
    const parametros = await parametrosInstance.getParametros();
    const trabajador: TrabajadoresInterface =
      await trabajadoresInstance.getTrabajadorById(ticket.idTrabajador);

    let sendObject;

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
          cabecera: parametros.header,
          pie: parametros.footer,
          nombreTrabajador: trabajador.nombreCorto,
          infoClienteVip: null, // Mirar bien para terminar todo
          infoCliente: {
            nombre: infoCliente.nombre,
            puntos: puntos,
          },
          dejaCuenta: ticket.dejaCuenta,
          firma: true,
        };
      } else {
        sendObject = {
          numFactura: ticket._id,
          timestamp: ticket.timestamp,
          arrayCompra: ticket.cesta.lista,
          total: ticket.total,
          visa: await ticketsInstance.getFormaPago(ticket),
          tiposIva: ticket.cesta.detalleIva,
          cabecera: parametros.header,
          pie: parametros.footer,
          nombreTrabajador: trabajador.nombreCorto,
          infoClienteVip: null, // Mirar bien para terminar todo
          infoCliente: null,
          dejaCuenta: ticket.dejaCuenta,
          firma: true,
        };
      }
      await this._venta(sendObject);
    }
  }

  /* Eze 4.0 */
  async imprimirDevolucion(idDevolucion: ObjectId) {
    try {
      const devolucion = await devolucionesInstance.getDevolucionById(
        idDevolucion
      );
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
          cabecera: parametros.header,
          pie: parametros.footer,
          nombreTrabajador: trabajador.nombreCorto,
          infoClienteVip: null, // Mirar bien para terminar todo
          infoCliente: null,
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
        { tipo: "align", payload: "LT" },
        { tipo: "text", payload: lista },
        { tipo: "cut", payload: "PAPER_FULL_CUT" },
      ],
      options
    );
  }
  private async imprimirRecibo(recibo: string) {
    mqttInstance.loggerMQTT("imprimir recibo");
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
          { tipo: "text", payload: recibo },
          { tipo: "cut", payload: "PAPER_FULL_CUT" },
        ],
        options
      );
    } catch (err) {
      mqttInstance.loggerMQTT("Error impresora: " + err);
    }
  }
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
  // recovimos los datos de la impresion
  private enviarMQTT(encodedData, options) {
    // conectamos con el cliente
    var client =
      mqtt.connect(process.env.MQTT_URL) ||
      mqtt.connect("mqtt://127.0.0.1:1883", {
        username: "ImpresoraMQTT",
      });
    const enviar = {
      arrayImprimir: encodedData,
      options: options,
    };
    // cuando se conecta enviamos los datos
    client.on("connect", function () {
      client.publish("hit.hardware/printer", JSON.stringify(enviar));
    });
  }

  private enviarMQTTCajon(encodedData) {
    // conectamos con el cliente
    var client =
      mqtt.connect(process.env.MQTT_URL) ||
      mqtt.connect("mqtt://127.0.0.1:1883", {
        username: "ImpresoraMQTT",
      });
    // cuando se conecta enviamos los datos
    client.on("connect", function () {
      let buff = Buffer.from(encodedData, "utf8");
      client.publish("hit.hardware/cajon", buff);
    });
  }

  private async _venta(info, recibo = null) {
    // recojemos datos de los parametros
    const numFactura = info.numFactura;
    const arrayCompra: ItemLista[] = info.arrayCompra;
    const total =
      info.dejaCuenta > 0
        ? nuevaInstancePromociones.redondearDecimales(
            info.total + info.dejaCuenta,
            2
          )
        : info.total;
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
    if (recibo != null && recibo != undefined) {
      strRecibo = recibo;
    }

    let detalles = await this.precioUnitario(arrayCompra);
    let pagoTarjeta = "";
    let pagoTkrs = "";
    let detalleClienteVip = "";
    let detalleNombreCliente = "";
    let detallePuntosCliente = "";
    let detalleEncargo = "";
    let detalleDejaCuenta = "";
    if (infoClienteVip && infoClienteVip.esVip) {
      detalleClienteVip = `Nom: ${infoClienteVip.nombre}\nNIF: ${infoClienteVip.nif}\nCP: ${infoClienteVip.cp}\nCiutat: ${infoClienteVip.ciudad}\nAdr: ${infoClienteVip.direccion}\n`;
    }
    // recojemos datos del cliente si nos los han mandado
    if (infoCliente != null) {
      detalleNombreCliente = infoCliente.nombre;
      detallePuntosCliente = "PUNTOS: " + infoCliente.puntos;
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
      detalleEncargo = "Precio encargo: " + info.total;
      detalleDejaCuenta = "Pago recibido: " + info.dejaCuenta;
    }

    const detallesIva = await this.getDetallesIva(tiposIva);
    let detalleIva = "";
    detalleIva =
      detallesIva.detalleIva0 +
      detallesIva.detalleIva4 +
      detallesIva.detalleIva5 +
      detallesIva.detalleIva10 +
      detallesIva.detalleIva21;

    let infoConsumoPersonal = "";
    if (tipoPago == "CONSUMO_PERSONAL") {
      infoConsumoPersonal = "---------------- Dte. 100% --------------";
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
      { tipo: "text", payload: "Factura simplificada N: " + numFactura },
      { tipo: "text", payload: "Ates per: " + nombreDependienta },
      { tipo: "text", payload: detalleClienteVip },
      { tipo: "text", payload: detalleNombreCliente },
      { tipo: "text", payload: detallePuntosCliente },
      { tipo: "control", payload: "LF" },
      { tipo: "control", payload: "LF" },
      { tipo: "control", payload: "LF" },
      {
        tipo: "text",
        payload: `Quantitat      Article   ${
          preuU ? "  Preu U." : ""
        }   Import (€)`,
      },
      { tipo: "text", payload: "-----------------------------------------" },
      { tipo: "align", payload: "LT" },
      { tipo: "text", payload: detalles },
      { tipo: "align", payload: "CT" },
      { tipo: "text", payload: pagoTarjeta },
      { tipo: "text", payload: pagoTkrs },
      { tipo: "align", payload: "LT" },
      { tipo: "text", payload: infoConsumoPersonal },
      { tipo: "align", payload: "CT" },
      {
        tipo: "text",
        payload: "----------------------------------------------",
      },
      { tipo: "align", payload: "LT" },
      { tipo: "size", payload: [1, 1] },
      { tipo: "text", payload: pagoDevolucion },
      { tipo: "text", payload: detalleEncargo },
      { tipo: "text", payload: detalleDejaCuenta },
      { tipo: "text", payload: "TOTAL: " + total.toFixed(2) + " €" },
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
    };
    // lo mandamos a la funcion enviarMQTT que se supone que imprime
    this.enviarMQTT(arrayImprimir, options);
  }
  async getDetallesIva(tiposIva) {
    let str1 = "          ";
    let str2 = "                 ";
    let str3 = "              ";
    let base = "";
    let valorIva = "";
    let importe = "";
    const detalle = {
      detalleIva4: "",
      detalleIva10: "",
      detalleIva21: "",
      detalleIva0: "",
      detalleIva5: "",
    };
    if (tiposIva.importe1 > 0) {
      base = tiposIva.base1.toFixed(2) + " €";
      valorIva = "4%: " + tiposIva.valorIva1.toFixed(2) + " €";
      importe = tiposIva.importe1.toFixed(2) + " €\n";
      detalle.detalleIva4 =
        str1.substring(0, str1.length - base.length) +
        base +
        str2.substring(0, str2.length - valorIva.length) +
        valorIva +
        str3.substring(0, str3.length - importe.length) +
        importe;
    }
    if (tiposIva.importe2 > 0) {
      base = tiposIva.base2.toFixed(2) + " €";
      valorIva = "10%: " + tiposIva.valorIva2.toFixed(2) + " €";
      importe = tiposIva.importe2.toFixed(2) + " €\n";
      detalle.detalleIva10 =
        str1.substring(0, str1.length - base.length) +
        base +
        str2.substring(0, str2.length - valorIva.length) +
        valorIva +
        str3.substring(0, str3.length - importe.length) +
        importe;
    }
    if (tiposIva.importe3 > 0) {
      base = tiposIva.base3.toFixed(2) + " €";
      valorIva = "21%: " + tiposIva.valorIva3.toFixed(2) + " €";
      importe = tiposIva.importe3.toFixed(2) + " €\n";
      detalle.detalleIva21 =
        str1.substring(0, str1.length - base.length) +
        base +
        str2.substring(0, str2.length - valorIva.length) +
        valorIva +
        str3.substring(0, str3.length - importe.length) +
        importe;
    }
    if (tiposIva.importe4 > 0) {
      base = tiposIva.base4.toFixed(2) + " €";
      valorIva = "0%: " + tiposIva.valorIva4.toFixed(2) + " €";
      importe = tiposIva.importe4.toFixed(2) + " €\n";
      detalle.detalleIva0 =
        str1.substring(0, str1.length - base.length) +
        base +
        str2.substring(0, str2.length - valorIva.length) +
        valorIva +
        str3.substring(0, str3.length - importe.length) +
        importe;
    }
    if (tiposIva.importe5 > 0) {
      base = tiposIva.base5.toFixed(2) + " €";
      valorIva = "5%: " + tiposIva.valorIva5.toFixed(2) + " €";
      importe = tiposIva.importe5.toFixed(2) + " €\n";
      detalle.detalleIva5 =
        str1.substring(0, str1.length - base.length) +
        base +
        str2.substring(0, str2.length - valorIva.length) +
        valorIva +
        str3.substring(0, str3.length - importe.length) +
        importe;
    }

    return detalle;
  }
  async precioUnitario(arrayCompra) {
    let detalles = "";
    //const preuUnitari =
    // recojemos los productos del ticket
    const preuUnitari =
      (await parametrosInstance.getParametros())["params"]["PreuUnitari"] ==
      "Si";
    for (let i = 0; i < arrayCompra.length; i++) {
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
        detalles += `${arrayCompra[i].unidades}     ${arrayCompra[
          i
        ].nombre.slice(0, 20)} +      \n`;
        for (let j = 0; j < arrayCompra[i].arraySuplementos.length; j++) {
          if (j == arrayCompra[i].arraySuplementos.length - 1) {
            detalles += `       ${arrayCompra[i].arraySuplementos[
              j
            ].nombre.slice(0, 20)}${
              preuUnitari ? "     " + arrayCompra[i]["preuU"] : ""
            }         ${arrayCompra[i].subtotal.toFixed(2)}\n`;
          } else {
            detalles += `       ${arrayCompra[i].arraySuplementos[
              j
            ].nombre.slice(0, 20)} +      \n`;
          }
        }
      } else {
        if (arrayCompra[i].nombre.length < 20) {
          while (arrayCompra[i].nombre.length < 20) {
            arrayCompra[i].nombre += " ";
          }
        }
        detalles += `${arrayCompra[i].unidades}     ${arrayCompra[
          i
        ].nombre.slice(0, 20)}${
          preuUnitari ? "     " + arrayCompra[i]["preuU"] : ""
        }       ${arrayCompra[i].subtotal.toFixed(2)}\n`;
      }
    }
    return detalles;
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
      };
      this.enviarMQTT(buffer, options);
    } catch (err) {
      console.log(err);
      mqttInstance.loggerMQTT(err);
    }
  }

  async imprimirTest() {
    const parametros = parametrosInstance.getParametros();
    try {
      // if(parametros.tipoImpresora === 'USB')
      // {
      //     const arrayDevices = escpos.USB.findPrinter();
      //     if (arrayDevices.length > 0) {
      //         /* Solo puede haber un dispositivo USB */
      //         const dispositivoUnico = arrayDevices[0];
      //         var device = new escpos.USB(dispositivoUnico); //USB
      //     } else if (arrayDevices.length == 0) {
      //         throw 'Error, no hay ningún dispositivo USB conectado';
      //     } else {
      //         throw 'Error, hay más de un dispositivo USB conectado';
      //     }
      // }
      // else if(parametros.tipoImpresora === 'SERIE') {
      //     var device = new escpos.Serial('/dev/ttyS0', {
      //         baudRate: 115000,
      //         stopBit: 2
      //     });
      // }
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

  /* Eze 4.0 */
  async imprimirCaja(caja: CajaSincro) {
    const fechaInicio = new Date(caja.inicioTime);
    const fechaFinalx = new Date(caja.finalTime);
    const moment = require("moment-timezone");
    const fechaFinal = moment(caja.finalTime).tz("Europe/Madrid");
    const arrayMovimientos = await movimientosInstance.getMovimientosIntervalo(
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
    let sumaTarjetas = 0;
    let textoMovimientos = "";
    for (let i = 0; i < arrayMovimientos.length; i++) {
      const auxFecha = new Date(arrayMovimientos[i]._id);
      switch (arrayMovimientos[i].tipo) {
        case "TARJETA":
          sumaTarjetas += arrayMovimientos[i].valor;
          break;
        case "TKRS_CON_EXCESO":
          break;
        case "TKRS_SIN_EXCESO":
          break;
        case "DEUDA":
          break;
        case "ENTREGA_DIARIA":
          textoMovimientos += `${
            i + 1
          }: Salida:\n           Cantidad: -${arrayMovimientos[i].valor.toFixed(
            2
          )}\n           Fecha: ${auxFecha.getDate()}/${auxFecha.getMonth()}/${auxFecha.getFullYear()}  ${auxFecha.getHours()}:${auxFecha.getMinutes()}\n           Concepto: ${
            arrayMovimientos[i].concepto
          }\n`;
          break;
        case "ENTRADA_DINERO":
          textoMovimientos += `${
            i + 1
          }: Entrada:\n            Cantidad: +${arrayMovimientos[
            i
          ].valor.toFixed(
            2
          )}\n            Fecha: ${auxFecha.getDate()}/${auxFecha.getMonth()}/${auxFecha.getFullYear()}  ${auxFecha.getHours()}:${auxFecha.getMinutes()}\n            Concepto: ${
            arrayMovimientos[i].concepto
          }\n`;
          break;
        case "DATAFONO_3G":
          sumaTarjetas += arrayMovimientos[i].valor;
          break;
      }
    }

    textoMovimientos =
      `\nTotal targeta:      ${sumaTarjetas.toFixed(2)}\n` + textoMovimientos;

    const mesInicial = fechaInicio.getMonth() + 1;
    const mesFinal = fechaFinal.getMonth() + 1;
    const device = new escpos.Network("localhost");
    const printer = new escpos.Printer(device);
    const options = {
      imprimirLogo: true,
    };
    this.enviarMQTT(
      [
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
          payload: "Resp. cierre   : " + trabajadorCierre.nombre,
        },
        {
          tipo: "text",
          payload: `Inici: ${fechaInicio.getDate()}-${mesInicial}-${fechaInicio.getFullYear()} ${
            (fechaInicio.getHours() < 10 ? "0" : "") + fechaInicio.getHours()
          }:${
            (fechaInicio.getMinutes() < 10 ? "0" : "") +
            fechaInicio.getMinutes()
          }`,
        },
        {
          tipo: "text",
          payload: `Final: ${fechaFinal.getDate()}-${mesFinal}-${fechaFinal.getFullYear()} ${
            (fechaFinal.getHours() < 10 ? "0" : "") + fechaFinal.getHours()
          }:${
            (fechaFinal.getMinutes() < 10 ? "0" : "") + fechaFinal.getMinutes()
          }`,
        },
        { tipo: "text", payload: "" },
        { tipo: "size", payload: [0, 1] },
        {
          tipo: "text",
          payload: "Calaix fet       :      " + caja.calaixFetZ.toFixed(2),
        },
        {
          tipo: "text",
          payload: "Descuadre        :      " + caja.descuadre.toFixed(2),
        },
        { tipo: "text", payload: "Clients atesos   :      " + caja.nClientes },
        {
          tipo: "text",
          payload: "Recaudat         :      " + caja.recaudado.toFixed(2),
        },
        {
          tipo: "text",
          payload: "Datafon 3g       :      " + caja.totalDatafono3G,
        },
        {
          tipo: "text",
          payload: "Canvi inicial    :      " + caja.totalApertura.toFixed(2),
        },
        {
          tipo: "text",
          payload: "Canvi final      :      " + caja.totalCierre.toFixed(2),
        },
        { tipo: "text", payload: "" },
        { tipo: "size", payload: [0, 0] },
        { tipo: "text", payload: "Moviments de caixa" },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: textoMovimientos },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "" },
        {
          tipo: "text",
          payload:
            "       0.01 --> " +
            caja.detalleApertura[0]["valor"].toFixed(2) +
            "      " +
            "0.01 --> " +
            caja.detalleCierre[0]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "       0.02 --> " +
            caja.detalleApertura[1]["valor"].toFixed(2) +
            "      " +
            "0.02 --> " +
            caja.detalleCierre[1]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "       0.05 --> " +
            caja.detalleApertura[2]["valor"].toFixed(2) +
            "      " +
            "0.05 --> " +
            caja.detalleCierre[2]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "       0.10 --> " +
            caja.detalleApertura[3]["valor"].toFixed(2) +
            "      " +
            "0.10 --> " +
            caja.detalleCierre[3]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "       0.20 --> " +
            caja.detalleApertura[4]["valor"].toFixed(2) +
            "      " +
            "0.20 --> " +
            caja.detalleCierre[4]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "       0.50 --> " +
            caja.detalleApertura[5]["valor"].toFixed(2) +
            "      " +
            "0.50 --> " +
            caja.detalleCierre[5]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "       1.00 --> " +
            caja.detalleApertura[6]["valor"].toFixed(2) +
            "      " +
            "1.00 --> " +
            caja.detalleCierre[6]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "       2.00 --> " +
            caja.detalleApertura[7]["valor"].toFixed(2) +
            "      " +
            "2.00 --> " +
            caja.detalleCierre[7]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "       5.00 --> " +
            caja.detalleApertura[8]["valor"].toFixed(2) +
            "      " +
            "5.00 --> " +
            caja.detalleCierre[8]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "       10.00 --> " +
            caja.detalleApertura[9]["valor"].toFixed(2) +
            "     " +
            "10.00 --> " +
            caja.detalleCierre[9]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "       20.00 --> " +
            caja.detalleApertura[10]["valor"].toFixed(2) +
            "    " +
            "20.00 --> " +
            caja.detalleCierre[10]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "       50.00 --> " +
            caja.detalleApertura[11]["valor"].toFixed(2) +
            "    " +
            "50.00 --> " +
            caja.detalleCierre[11]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "       100.00 --> " +
            caja.detalleApertura[12]["valor"].toFixed(2) +
            "   " +
            "100.00 --> " +
            caja.detalleCierre[12]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "       200.00 --> " +
            caja.detalleApertura[13]["valor"].toFixed(2) +
            "   " +
            "200.00 --> " +
            caja.detalleCierre[13]["valor"].toFixed(2),
        },
        {
          tipo: "text",
          payload:
            "       500.00 --> " +
            caja.detalleApertura[14]["valor"].toFixed(2) +
            "   " +
            "500.00 --> " +
            caja.detalleCierre[14]["valor"].toFixed(2),
        },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "" },
        { tipo: "cut", payload: "PAPER_FULL_CUT" },
      ],
      options
    );
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
      let sumaTarjetas = 0;
      let textoMovimientos = "";

      for (let i = 0; i < arrayMovimientos.length; i++) {
        const auxFecha = new Date(arrayMovimientos[i]._id);
        switch (arrayMovimientos[i].tipo) {
          case "TARJETA":
            sumaTarjetas += arrayMovimientos[i].valor;
            break;
          case "TKRS_CON_EXCESO":
            break;
          case "TKRS_SIN_EXCESO":
            break;
          case "DEUDA":
            break;
          case "SALIDA":
            textoMovimientos += `Salida:\n           Cantidad: -${arrayMovimientos[
              i
            ].valor.toFixed(
              2
            )}\n           Fecha: ${auxFecha.getDate()}/${auxFecha.getMonth()}/${auxFecha.getFullYear()}  ${auxFecha.getHours()}:${auxFecha.getMinutes()}\n           Concepto: ${
              arrayMovimientos[i].concepto
            }\n`;
            break;
          case "ENTRADA_DINERO":
            textoMovimientos += `Entrada:\n            Cantidad: +${arrayMovimientos[
              i
            ].valor.toFixed(
              2
            )}\n            Fecha: ${auxFecha.getDate()}/${auxFecha.getMonth()}/${auxFecha.getFullYear()}  ${auxFecha.getHours()}:${auxFecha.getMinutes()}\n            Concepto: ${
              arrayMovimientos[i].concepto
            }\n`;
            break;
          case "DATAFONO_3G":
            sumaTarjetas += arrayMovimientos[i].valor;
            break;
        }
      }

      textoMovimientos =
        `\n` +
        textoMovimientos +
        `Total targeta:      ${sumaTarjetas.toFixed(2)}\n`;

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

      const options = { imprimirLogo: true };
      this.enviarMQTT(
        [
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
            payload: "Resp. cierre   : " + trabajadorCierre.nombre,
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
          { tipo: "text", payload: "" },
          { tipo: "size", payload: [0, 1] },
          {
            tipo: "text",
            payload: "Calaix fet       :      " + caja.calaixFetZ.toFixed(2),
          },
          {
            tipo: "text",
            payload: "Descuadre        :      " + caja.descuadre.toFixed(2),
          },
          {
            tipo: "text",
            payload: "Clients atesos   :      " + caja.nClientes,
          },
          {
            tipo: "text",
            payload: "Recaudat         :      " + caja.recaudado.toFixed(2),
          },
          {
            tipo: "text",
            payload: "Datafon 3g       :      " + caja.totalDatafono3G,
          },
          {
            tipo: "text",
            payload: "Canvi inicial    :      " + caja.totalApertura.toFixed(2),
          },
          {
            tipo: "text",
            payload: "Canvi final      :      " + caja.totalCierre.toFixed(2),
          },
          { tipo: "text", payload: "" },
          { tipo: "size", payload: [0, 0] },
          { tipo: "text", payload: "Moviments de caixa" },
          { tipo: "text", payload: "" },
          { tipo: "text", payload: "" },
          { tipo: "text", payload: textoMovimientos },
          { tipo: "text", payload: "" },
          { tipo: "text", payload: "" },
          { tipo: "text", payload: "" },
          {
            tipo: "text",
            payload:
              "       0.01 --> " +
              caja.detalleApertura[0]["valor"].toFixed(2) +
              "      " +
              "0.01 --> " +
              caja.detalleCierre[0]["valor"].toFixed(2),
          },
          {
            tipo: "text",
            payload:
              "       0.02 --> " +
              caja.detalleApertura[1]["valor"].toFixed(2) +
              "      " +
              "0.02 --> " +
              caja.detalleCierre[1]["valor"].toFixed(2),
          },
          {
            tipo: "text",
            payload:
              "       0.05 --> " +
              caja.detalleApertura[2]["valor"].toFixed(2) +
              "      " +
              "0.05 --> " +
              caja.detalleCierre[2]["valor"].toFixed(2),
          },
          {
            tipo: "text",
            payload:
              "       0.10 --> " +
              caja.detalleApertura[3]["valor"].toFixed(2) +
              "      " +
              "0.10 --> " +
              caja.detalleCierre[3]["valor"].toFixed(2),
          },
          {
            tipo: "text",
            payload:
              "       0.20 --> " +
              caja.detalleApertura[4]["valor"].toFixed(2) +
              "      " +
              "0.20 --> " +
              caja.detalleCierre[4]["valor"].toFixed(2),
          },
          {
            tipo: "text",
            payload:
              "       0.50 --> " +
              caja.detalleApertura[5]["valor"].toFixed(2) +
              "      " +
              "0.50 --> " +
              caja.detalleCierre[5]["valor"].toFixed(2),
          },
          {
            tipo: "text",
            payload:
              "       1.00 --> " +
              caja.detalleApertura[6]["valor"].toFixed(2) +
              "      " +
              "1.00 --> " +
              caja.detalleCierre[6]["valor"].toFixed(2),
          },
          {
            tipo: "text",
            payload:
              "       2.00 --> " +
              caja.detalleApertura[7]["valor"].toFixed(2) +
              "      " +
              "2.00 --> " +
              caja.detalleCierre[7]["valor"].toFixed(2),
          },
          {
            tipo: "text",
            payload:
              "       5.00 --> " +
              caja.detalleApertura[8]["valor"].toFixed(2) +
              "      " +
              "5.00 --> " +
              caja.detalleCierre[8]["valor"].toFixed(2),
          },
          {
            tipo: "text",
            payload:
              "       10.00 --> " +
              caja.detalleApertura[9]["valor"].toFixed(2) +
              "     " +
              "10.00 --> " +
              caja.detalleCierre[9]["valor"].toFixed(2),
          },
          {
            tipo: "text",
            payload:
              "       20.00 --> " +
              caja.detalleApertura[10]["valor"].toFixed(2) +
              "    " +
              "20.00 --> " +
              caja.detalleCierre[10]["valor"].toFixed(2),
          },
          {
            tipo: "text",
            payload:
              "       50.00 --> " +
              caja.detalleApertura[11]["valor"].toFixed(2) +
              "    " +
              "50.00 --> " +
              caja.detalleCierre[11]["valor"].toFixed(2),
          },
          {
            tipo: "text",
            payload:
              "       100.00 --> " +
              caja.detalleApertura[12]["valor"].toFixed(2) +
              "   " +
              "100.00 --> " +
              caja.detalleCierre[12]["valor"].toFixed(2),
          },
          {
            tipo: "text",
            payload:
              "       200.00 --> " +
              caja.detalleApertura[13]["valor"].toFixed(2) +
              "   " +
              "200.00 --> " +
              caja.detalleCierre[13]["valor"].toFixed(2),
          },
          {
            tipo: "text",
            payload:
              "       500.00 --> " +
              caja.detalleApertura[14]["valor"].toFixed(2) +
              "   " +
              "500.00 --> " +
              caja.detalleCierre[14]["valor"].toFixed(2),
          },
          { tipo: "text", payload: "" },
          { tipo: "text", payload: "" },
          { tipo: "text", payload: "" },
          { tipo: "cut", payload: "PAPER_FULL_CUT" },
        ],
        options
      );
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
    const params = await parametrosInstance.getParametros();
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
        { tipo: "text", payload: data.operationTypeName },
        { tipo: "align", payload: "LT" },
        { tipo: "size", payload: [0, 0] },
        { tipo: "text", payload: data.commerceText },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "HCP: " + data.bankName },
        {
          tipo: "text",
          payload: "Aplicación: " + data.cardInformation.emvApplicationID,
        },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: data.cardInformation.emvApplicationLabel },
        {
          tipo: "text",
          payload: "Entidad Bancaria: " + data.issuerNameAndCountry,
        },
        {
          tipo: "text",
          payload: "Tarjeta: " + data.cardInformation.hiddenCardNumber,
        },
        { tipo: "text", payload: "" },
        { tipo: "text", payload: "Fecha: " + fecha },
        {
          tipo: "text",
          payload: "Nº Operación: " + data.paytefOperationNumber,
        },
        { tipo: "text", payload: "Autorización: " + data.authorisationCode },
        { tipo: "text", payload: "" },
        { tipo: "size", payload: [1, 1] },
        { tipo: "text", payload: "Importe: " + data.amountWithSign + "€" },
        { tipo: "text", payload: "" },
        { tipo: "size", payload: [0, 0] },
        {
          tipo: "text",
          payload: "Operación " + data.cardInformation.dataEntryLetter,
        },
        {
          tipo: "text",
          payload: `FIRMA ${
            data.needsSignature == false ? "NO " : ""
          }NECESARIA`,
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
          const device = new escpos.Network("localhost");
          const printer = new escpos.Printer(device);
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
      const options = { hour12: false };
      const fecha = date.toLocaleDateString();
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
    const device = new escpos.Network();
    const printer = new escpos.Printer(device);
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

  async imprimirEncargo(encargo) {
    const parametros = await parametrosInstance.getParametros();
    const trabajador: TrabajadoresInterface =
      await trabajadoresInstance.getTrabajadorById(encargo.cesta.idTrabajador);

    const cabecera = parametros.header;
    const moment = require("moment-timezone");
    const fecha = moment(encargo.timestamp).tz("Europe/Madrid");

    let detalles = await this.precioUnitario(encargo.cesta.lista);

    let detalleImporte = "";
    let importe = "";
    if (encargo.dejaCuenta == 0) {
      importe = "TOTAL:" + encargo.total.toFixed(2) + " €";
    } else {
      detalleImporte = `IMPORT TOTAL: ${encargo.total.toFixed(
        2
      )} €\nIMPORT PAGAT: ${encargo.dejaCuenta.toFixed(2)} €`;
      importe =
        "IMPORT RESTANT:" +
        (encargo.total - encargo.dejaCuenta).toFixed(2) +
        " €";
    }
    const detallesIva = await this.getDetallesIva(encargo.cesta.detalleIva);
    let detalleIva = "";
    detalleIva =
      detallesIva.detalleIva0 +
      detallesIva.detalleIva4 +
      detallesIva.detalleIva5 +
      detallesIva.detalleIva10 +
      detallesIva.detalleIva21;

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
          { tipo: "text", payload: "ENTREGA" },
          { tipo: "size", payload: [0, 0] },
          { tipo: "align", payload: "LT" },
          { tipo: "text", payload: cabecera },
          {
            tipo: "text",
            payload: `Data: ${fecha.format("d")} ${fecha.format(
              "DD-MM-YYYY HH:mm"
            )}`,
          },
          { tipo: "text", payload: "Ates per: " + encargo.nombreTrabajador },
          { tipo: "text", payload: "Client: " + encargo.nombreCliente },
          { tipo: "text", payload: "Data d'entrega: " + encargo.fecha },
          { tipo: "control", payload: "LF" },
          {
            tipo: "text",
            payload: "Quantitat        Article        Import (€)",
          },
          {
            tipo: "text",
            payload: "----------------------------------------------",
          },
          { tipo: "align", payload: "LT" },
          { tipo: "text", payload: detalles },
          {
            tipo: "text",
            payload: "----------------------------------------------",
          },
          { tipo: "text", payload: detalleImporte },
          { tipo: "size", payload: [1, 1] },
          { tipo: "text", payload: importe },
          { tipo: "size", payload: [0, 0] },
          { tipo: "align", payload: "CT" },
          { tipo: "text", payload: "Base IVA         IVA         IMPORT" },
          { tipo: "text", payload: detalleIva },
          { tipo: "text", payload: "-- ES COPIA --" },
          { tipo: "control", payload: "LF" },
          { tipo: "text", payload: "ID: " + random() + " - " + random() },
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
}
export const impresoraInstance = new Impresora();
