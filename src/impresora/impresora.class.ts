import {articulosInstance} from '../articulos/articulos.clase';
import {paramsTicketInstance} from '../params-ticket/params-ticket.class';
import {ticketsInstance} from '../tickets/tickets.clase';
import {trabajadoresInstance} from '../trabajadores/trabajadores.clase';
import {TrabajadoresInterface} from '../trabajadores/trabajadores.interface';
import {clienteInstance} from '../clientes/clientes.clase';
import {parametrosInstance} from '../parametros/parametros.clase';
import {Dispositivos} from '../dispositivos';
// import {devolucionesInstance} from 'src/devoluciones/devoluciones.clase';
import axios from 'axios';
import { cajaInstance } from "../caja/caja.clase";
import { CajaSincro } from "../caja/caja.interface";
import { movimientosInstance } from '../movimientos/movimientos.clase';
import { TicketsInterface } from '../tickets/tickets.interface';
import { logger } from "../logger";
import { DevolucionesInterface } from 'src/devoluciones/devoluciones.interface';

const dispositivos = new Dispositivos();
const escpos = require('escpos');
const exec = require('child_process').exec;
const os = require('os');
escpos.USB = require('escpos-usb');
escpos.Serial = require('escpos-serialport');
escpos.Screen = require('escpos-screen');
const TIPO_ENTRADA_DINERO = 'ENTRADA';
const TIPO_SALIDA_DINERO = 'SALIDA';

function permisosImpresora() {
  try {
    exec(`  echo sa | sudo -S chmod 777 -R /dev/bus/usb/
        echo sa | sudo -S chmod 777 -R /dev/ttyS0
        echo sa | sudo -S chmod 777 -R /dev/ttyS1
        echo sa | sudo -S chmod 777 -R /dev/    
    `);
  } catch (err) {
    logger.Error(75, err);
  }
}
function random() {
  const numero = Math.floor(10000000 + Math.random() * 999999999);
  return numero.toString(16).slice(0, 8);
}

/* Función auxiliar */
function dateToString2(fecha) {
  let fechaFinal = null;
  if (typeof fecha === 'string' || typeof fecha === 'number') {
    fechaFinal = new Date(fecha);
  }

  const finalYear = `${fechaFinal.getFullYear()}`;
  let finalMonth = `${fechaFinal.getMonth() + 1}`;
  let finalDay = `${fechaFinal.getDate()}`;
  let finalHours = `${fechaFinal.getHours()}`;
  let finalMinutes = `${fechaFinal.getMinutes()}`;
  let finalSeconds = `${fechaFinal.getSeconds()}`;


  if (finalMonth.length === 1) {
    finalMonth = '0' + finalMonth;
  }
  if (finalDay.length === 1) {
    finalDay = '0' + finalDay;
  }
  if (finalHours.length === 1) {
    finalHours = '0' + finalHours;
  }
  if (finalMinutes.length === 1) {
    finalMinutes = '0' + finalMinutes;
  }
  if (finalSeconds.length === 1) {
    finalSeconds = '0' + finalSeconds;
  }
  return `${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}`;
}

export class Impresora {
  async binvenidacliente() {
    try {
      permisosImpresora();
      //   var device = new escpos.USB('0x67b','0x2303');
      const device = await dispositivos.getDeviceVisor();
      if (device != null) {
        const options = {encoding: 'iso88591'};
        const printer = new escpos.Screen(device, options);

        try {
          device.open(function() {
            printer
            // Espacios en blanco para limpiar el visor y volver a mostrar los datos en el sitio correcto
            // .text("")
                .clear()
            // .moveUp()
            // Información del artículo (artículo + precio)
                .text('Bon Dia!!')
            // .text(datosExtra)

                .close();
          });
        } catch (error) {

        }
      } else {
        logger.Error(76, 'Controlado: dispositivo es null');
      }
    } catch (err) {
      logger.Error(77,'Error1: ', err);
      // errorImpresora(err, event);
    }
  }

  async imprimirUltimoCierre(): Promise<void> {
    try {
      const ultimoCierre: CajaSincro = await cajaInstance.getUltimoCierre();
      const nombreTrabajadorApertura = (await trabajadoresInstance.getTrabajadorById(ultimoCierre.idDependientaApertura)).nombreCorto;
      const nombreTrabajadorCierre = (await trabajadoresInstance.getTrabajadorById(ultimoCierre.idDependientaCierre)).nombreCorto;
      const arrayMovimientos = await movimientosInstance.getMovimientosIntervalo(ultimoCierre.inicioTime, ultimoCierre.finalTime);
      const parametros = await parametrosInstance.getParametros();

      this.imprimirCaja(
        ultimoCierre.calaixFetZ,
        nombreTrabajadorApertura,
        ultimoCierre.descuadre,
        ultimoCierre.nClientes,
        ultimoCierre.recaudado,
        arrayMovimientos,
        parametros.nombreTienda,
        ultimoCierre.inicioTime,
        ultimoCierre.finalTime,
        ultimoCierre.totalApertura,
        ultimoCierre.totalCierre,
        parametros.tipoImpresora,
      );
    } catch (err) {
      logger.Error(78, err);
    }
  }

  async despedircliente() {
    try {
      permisosImpresora();
      //   var device = new escpos.USB('0x67b','0x2303');
      const device = await dispositivos.getDeviceVisor();
      if (device != null) {
        const options = {encoding: 'iso88591'};
        const printer = new escpos.Screen(device, options);
        try {
          device.open(function() {
            printer
            // Espacios en blanco para limpiar el visor y volver a mostrar los datos en el sitio correcto
            // .text("")
                .clear()
            // .moveUp()
            // Información del artículo (artículo + precio)
                .text(' Moltes Gracies !!')
            // .text(datosExtra)
                .close();
          });
        } catch (error) {

        }
      } else {
        logger.Error(79, 'Controlado: dispositivo es null');
      }
    } catch (err) {
      logger.Error(80, 'Error1: ', err);
      // errorImpresora(err, event);
    }
  }
  async imprimirTicket(idTicket: TicketsInterface["_id"], esDevolucion = false) {
    const paramsTicket = await paramsTicketInstance.getParamsTicket();
    // const infoTicket: TicketsInterface = await ticketsInstance.getTicketByID(idTicket);
    let infoTicket;
    if (!esDevolucion) {
      infoTicket = await ticketsInstance.getTicketById(idTicket);
    }
    // logger.Error(infoTicket)
    const infoTrabajador: TrabajadoresInterface = await trabajadoresInstance.getTrabajadorById(infoTicket.idTrabajador);
    const parametros = await parametrosInstance.getParametros();
    let sendObject;

    if (infoTicket != null) {
      if (infoTicket.cliente != null && infoTicket.tipoPago != 'DEUDA' && infoTicket.cliente != undefined) {
        const infoClienteAux = await clienteInstance.getClienteByID(infoTicket.cliente);
        const infoCliente = infoClienteAux;
        let auxNombre = '';
        let puntosCliente = 0;
        if (infoCliente != null) {
          auxNombre = infoCliente.nombre;
          puntosCliente = await clienteInstance.getPuntosCliente(infoTicket.cliente);
        } else {
          auxNombre = '';
        }

        sendObject = {
          numFactura: infoTicket._id,
          arrayCompra: infoTicket.lista,
          total: infoTicket.total,
          visa: infoTicket.tipoPago,
          tiposIva: infoTicket.tiposIva,
          cabecera: paramsTicket[0] !== undefined ? paramsTicket[0].valorDato: '',
          pie: paramsTicket[1] !== undefined ? paramsTicket[1].valorDato: '',
          nombreTrabajador: (infoTrabajador.nombreCorto != null) ? (infoTrabajador.nombreCorto): (''),
          impresora: parametros.tipoImpresora,
          infoClienteVip: infoTicket.infoClienteVip,
          infoCliente: {
            nombre: auxNombre,
            puntos: puntosCliente,
          },
        };
        this._venta(sendObject, infoTicket.recibo);
      } else {
        sendObject = {
          numFactura: infoTicket._id,
          arrayCompra: infoTicket.lista,
          total: infoTicket.total,
          visa: infoTicket.tipoPago,
          tiposIva: infoTicket.tiposIva,
          cabecera: paramsTicket[0] !== undefined ? paramsTicket[0].valorDato: '',
          pie: paramsTicket[1] !== undefined ? paramsTicket[1].valorDato: '',
          nombreTrabajador: (infoTrabajador.nombreCorto != null) ? (infoTrabajador.nombreCorto): (''),
          impresora: parametros.tipoImpresora,
          infoClienteVip: infoTicket.infoClienteVip,
          infoCliente: null,
        };

        this._venta(sendObject);
      }
    }
  }

  async imprimirDevolucion(idDevolucion: DevolucionesInterface["_id"]) {
    const paramsTicket = await paramsTicketInstance.getParamsTicket();
    let infoTicket;
    const infoTrabajador: TrabajadoresInterface = await trabajadoresInstance.getTrabajadorById(infoTicket.idTrabajador);
    const parametros = await parametrosInstance.getParametros();
    let sendObject;

    if (infoTicket != null) {
      if (infoTicket.cliente != null && infoTicket.tipoPago != 'DEUDA' && infoTicket.cliente != undefined) {
        const infoClienteAux = await clienteInstance.getClienteByID(infoTicket.cliente);
        const infoCliente = infoClienteAux;
        let auxNombre = '';
        let puntosCliente = 0;
        if (infoCliente != null) {
          auxNombre = infoCliente.nombre;
          puntosCliente = await clienteInstance.getPuntosCliente(infoTicket.cliente);
        } else {
          auxNombre = '';
        }

        sendObject = {
          numFactura: infoTicket._id,
          arrayCompra: infoTicket.lista,
          total: infoTicket.total,
          visa: infoTicket.tipoPago,
          tiposIva: infoTicket.tiposIva,
          cabecera: paramsTicket[0] !== undefined ? paramsTicket[0].valorDato: '',
          pie: paramsTicket[1] !== undefined ? paramsTicket[1].valorDato: '',
          nombreTrabajador: (infoTrabajador.nombreCorto != null) ? (infoTrabajador.nombreCorto): (''),
          impresora: parametros.tipoImpresora,
          infoClienteVip: infoTicket.infoClienteVip,
          infoCliente: {
            nombre: auxNombre,
            puntos: puntosCliente,
          },
        };
        this._venta(sendObject, infoTicket.recibo);
      } else {
        sendObject = {
          numFactura: infoTicket._id,
          arrayCompra: infoTicket.lista,
          total: infoTicket.total,
          visa: infoTicket.tipoPago,
          tiposIva: infoTicket.tiposIva,
          cabecera: paramsTicket[0] !== undefined ? paramsTicket[0].valorDato: '',
          pie: paramsTicket[1] !== undefined ? paramsTicket[1].valorDato: '',
          nombreTrabajador: (infoTrabajador.nombreCorto != null) ? (infoTrabajador.nombreCorto): (''),
          impresora: parametros.tipoImpresora,
          infoClienteVip: infoTicket.infoClienteVip,
          infoCliente: null,
        };

        this._venta(sendObject);
      }
    }
  }



  private async imprimirRecibo(recibo: string) {
    logger.Error(81, 'imprimir recibo');
    try {
      permisosImpresora();
      const device = await dispositivos.getDevice();
      if (device == null) {
        throw 'Error controlado: El dispositivo es null';
      }
      const printer = new escpos.Printer(device);

      device.open(function() {
        printer
            .setCharacterCodeTable(19)
            .encode('CP858')
            .font('a')
            .style('b')
            .size(0, 0)
            .text(recibo)
            .cut('PAPER_FULL_CUT')
            .close();
      });
    } catch (err) {
      logger.Error(82, 'Error impresora: ', err);
    }
  }

  private async _venta(info, recibo = null) {
    const numFactura = info.numFactura;
    const arrayCompra = info.arrayCompra;
    const total = info.total;
    const tipoPago = info.visa;
    // logger.Error(tipoPago)
    const tiposIva = info.tiposIva;
    const cabecera = info.cabecera;
    const pie = info.pie;
    const nombreDependienta = info.nombreTrabajador;
    const tipoImpresora = info.impresora;
    const infoClienteVip = info.infoClienteVip;
    const infoCliente = info.infoCliente;
    let strRecibo = '';
    if (recibo != null && recibo != undefined) {
      strRecibo = recibo;
    }
    try {
      permisosImpresora();

      // if(tipoImpresora === 'USB')
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
      // else
      // {
      //     if(tipoImpresora === 'SERIE')
      //     {
      //         var device = new escpos.Serial('/dev/ttyS0', {
      //             baudRate: 115200,
      //             stopBit: 2
      //         });
      //     }
      // }
      const device = await dispositivos.getDevice();
      if (device == null) {
        throw 'Error controlado: El dispositivo es null';
      }
      const printer = new escpos.Printer(device);

      let detalles = '';
      let pagoTarjeta = '';
      let pagoTkrs = '';
      let detalleClienteVip = '';
      let detalleNombreCliente = '';
      let detallePuntosCliente = '';
      if (infoClienteVip && infoClienteVip.esVip) {
        detalleClienteVip = `Nom: ${infoClienteVip.nombre}\nNIF: ${infoClienteVip.nif}\nCP: ${infoClienteVip.cp}\nCiutat: ${infoClienteVip.ciudad}\nAdr: ${infoClienteVip.direccion}\n`;
      }

      if (infoCliente != null) {
        detalleNombreCliente = infoCliente.nombre;
        detallePuntosCliente = 'PUNTOS: ' + infoCliente.puntos;
      }

      for (let i = 0; i < arrayCompra.length; i++) {
        if (arrayCompra[i].promocion.esPromo) {
          let nombrePrincipal = (await articulosInstance.getInfoArticulo(arrayCompra[i].promocion.infoPromo.idPrincipal)).nombre;
          nombrePrincipal = 'Oferta ' + nombrePrincipal;
          while (nombrePrincipal.length < 20) {
            nombrePrincipal += ' ';
          }
          detalles += `${arrayCompra[i].unidades*arrayCompra[i].promocion.infoPromo.cantidadPrincipal}     ${nombrePrincipal.slice(0, 20)}       ${arrayCompra[i].promocion.infoPromo.precioRealPrincipal.toFixed(2)}\n`;
          if (arrayCompra[i].promocion.infoPromo.cantidadSecundario > 0) {
            let nombreSecundario = (await articulosInstance.getInfoArticulo(arrayCompra[i].promocion.infoPromo.idSecundario)).nombre;
            nombreSecundario = 'Oferta ' + nombreSecundario;
            while (nombreSecundario.length < 20) {
              nombreSecundario += ' ';
            }
            detalles += `${arrayCompra[i].unidades*arrayCompra[i].promocion.infoPromo.cantidadSecundario}     ${nombreSecundario.slice(0, 20)}       ${arrayCompra[i].promocion.infoPromo.precioRealSecundario.toFixed(2)}\n`;
          }
        } else {
          if (arrayCompra[i].nombre.length < 20) {
            while (arrayCompra[i].nombre.length < 20) {
              arrayCompra[i].nombre += ' ';
            }
          }
          detalles += `${arrayCompra[i].unidades}     ${arrayCompra[i].nombre.slice(0, 20)}       ${arrayCompra[i].subtotal.toFixed(2)}\n`;
        }
      }
      const fecha = new Date();
      if (tipoPago == 'TARJETA') {
        pagoTarjeta = '----------- PAGADO CON TARJETA ---------\n';
      }
      if (tipoPago == 'TICKET_RESTAURANT') {
        pagoTkrs = '----- PAGADO CON TICKET RESTAURANT -----\n';
      }
      let pagoDevolucion: string = '';

      if (tipoPago == 'DEVOLUCION') {
        // logger.Error('Entramos en tipo pago devolucion')
        pagoDevolucion = '-- ES DEVOLUCION --\n';
      }


      let detalleIva4 = '';
      let detalleIva10 = '';
      let detalleIva21 = '';
      let detalleIva = '';
      if (tiposIva.importe1 > 0) {
        detalleIva4 = `${tiposIva.base1.toFixed(2)}€      4%: ${tiposIva.valorIva1.toFixed(2)}€     ${tiposIva.importe1.toFixed(2)}€\n`;
      }
      if (tiposIva.importe2 > 0) {
        detalleIva10 = `${tiposIva.base2.toFixed(2)}€      10%: ${tiposIva.valorIva2.toFixed(2)}€     ${tiposIva.importe2.toFixed(2)}€\n`;
      }
      if (tiposIva.importe3 > 0) {
        detalleIva21 = `${tiposIva.base3.toFixed(2)}€     21%: ${tiposIva.valorIva3.toFixed(2)}€     ${tiposIva.importe3.toFixed(2)}€\n`;
      }
      detalleIva = detalleIva4 + detalleIva10 + detalleIva21;
      let infoConsumoPersonal = '';
      if (tipoPago == 'CONSUMO_PERSONAL') {
        infoConsumoPersonal = '---------------- Dte. 100% --------------';
        detalleIva = '';
      }

      const diasSemana = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];


      device.open(function() {
        printer

            .setCharacterCodeTable(19)
            .encode('CP858')
            .font('a')
            .style('b')
            .size(0, 0)
            .text(cabecera)
            .text(`Data: ${diasSemana[fecha.getDay()]} ${fecha.getDate()}-${fecha.getMonth() + 1}-${fecha.getFullYear()}  ${(fecha.getHours()<10?'0':'') + fecha.getHours()}:${(fecha.getMinutes()<10?'0':'') + fecha.getMinutes()}`)
            .text('Factura simplificada N: ' + numFactura)
            .text('Ates per: ' + nombreDependienta)
            .text(detalleClienteVip)
            .text(detalleNombreCliente)
            .text(detallePuntosCliente)
            .control('LF')
            .control('LF')
            .control('LF')
            .text('Quantitat      Article        Import (EUR)')
            .text('-----------------------------------------')
            .align('LT')
            .text(detalles)
            .align('CT')
            .text(pagoTarjeta)
            .text(pagoTkrs)
            .align('LT')
            .text(infoConsumoPersonal)
            .size(1, 1)
            .text(pagoDevolucion)
            .text('TOTAL: ' + total.toFixed(2) + ' €')
            .control('LF')
            .size(0, 0)
            .align('CT')
            .text('Base IVA         IVA         IMPORT')
            .text(detalleIva)
            .text('-- ES COPIA --')
            .control('LF')
            .text('ID: '+ random() +' - '+ random())
            .text(pie)
            .control('LF')
            .control('LF')
            .control('LF')
            .cut('PAPER_FULL_CUT')
            .close();
      });
    } catch (err) {
      logger.Error(83, 'Error impresora: ', err);
    }
  }

  async imprimirSalida(cantidad: number, fecha: number, nombreTrabajador: string, nombreTienda: string, concepto: string, tipoImpresora: string, codigoBarras: string) {
    try {
      const fechaStr = dateToString2(fecha);
      permisosImpresora();

      // if(tipoImpresora === 'USB')
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
      // else if(tipoImpresora === 'SERIE') {
      //     var device = new escpos.Serial('/dev/ttyS0', {
      //         baudRate: 115000,
      //         stopBit: 2
      //     });
      // }
      const device = await dispositivos.getDevice();

      const options = {encoding: 'GB18030'};
      const printer = new escpos.Printer(device, options);
      device.open(function() {
        printer
            .setCharacterCodeTable(19)
            .encode('CP858')
            .font('a')
            .style('b')
            .align('CT')
            .size(0, 0)
            .text(nombreTienda)
            .text(fechaStr)
            .text('Dependienta: ' + nombreTrabajador)
            .text('Retirada efectivo: ' + cantidad)
            .size(1, 1)
            .text(cantidad)
            .size(0, 0)
            .text('Concepto')
            .size(1, 1)
            .text(concepto)
            .text('')
            .barcode(codigoBarras.slice(0, 12), 'EAN13', 4)
            .text('')
            .text('')
            .text('')
            .cut()
            .close();
      });
    } catch (err) {
      logger.Error(84, err);
    }
  }

  async imprimirEntrada(totalIngresado: number, fecha: number, nombreDependienta: string) {
    const parametros = await parametrosInstance.getParametros();
    try {
      const fechaStr = dateToString2(fecha);
      permisosImpresora();
      const device = await dispositivos.getDevice();

      const options = {encoding: 'GB18030'};
      const printer = new escpos.Printer(device, options);
      device.open(function() {
        printer
            .setCharacterCodeTable(19)
            .encode('CP858')
            .font('a')
            .style('b')
            .align('CT')
            .size(0, 0)
            .text(parametros.nombreTienda)
            .text(fechaStr)
            .text('Dependienta: ' + nombreDependienta)
            .text('Ingreso efectivo: ' + totalIngresado)
            .size(1, 1)
            .text(totalIngresado)
            .size(0, 0)
            .text('')
            .size(1, 1)
            .text('')
            .text('')
            .text('')
            .cut()
            .close();
      });
    } catch (err) {
      logger.Error(85, err);
    }
  }

  async imprimirTest() {
    const parametros = parametrosInstance.getParametros();
    try {
      permisosImpresora();
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
      const device = await dispositivos.getDevice();

      const options = {encoding: 'GB18030'};
      const printer = new escpos.Printer(device, options);
      device.open(function() {
        printer
            .setCharacterCodeTable(19)
            .encode('CP858')
            .font('a')
            .style('b')
            .align('CT')
            .size(1, 1)
            .text('HOLA HOLA')
            .cut()
            .close();
      });
    } catch (err) {
      logger.Error(86, err);
    }
  }

  async imprimirCaja(calaixFet, nombreTrabajador, descuadre, nClientes, recaudado, arrayMovimientos: any[], nombreTienda, fI, fF, cInicioCaja, cFinalCaja, tipoImpresora) {
    try {
      const fechaInicio = new Date(fI);
      const fechaFinal = new Date(fF);
      let sumaTarjetas = 0;
      let textoMovimientos = '';
      for (let i = 0; i < arrayMovimientos.length; i++) {
        const auxFecha = new Date(arrayMovimientos[i]._id);
        if (arrayMovimientos[i].tipo === TIPO_SALIDA_DINERO) {
          if (arrayMovimientos[i].concepto == 'Targeta' || arrayMovimientos[i].concepto == 'Targeta 3G') {
            sumaTarjetas += arrayMovimientos[i].valor;
          } else {
            textoMovimientos += `${i + 1}: Salida:\n           Cantidad: -${arrayMovimientos[i].valor.toFixed(2)}\n           Fecha: ${auxFecha.getDate()}/${auxFecha.getMonth()}/${auxFecha.getFullYear()}  ${auxFecha.getHours()}:${auxFecha.getMinutes()}\n           Concepto: ${arrayMovimientos[i].concepto}\n`;
          }
        }
        if (arrayMovimientos[i].tipo === TIPO_ENTRADA_DINERO) {
          textoMovimientos += `${i + 1}: Entrada:\n            Cantidad: +${arrayMovimientos[i].valor.toFixed(2)}\n            Fecha: ${auxFecha.getDate()}/${auxFecha.getMonth()}/${auxFecha.getFullYear()}  ${auxFecha.getHours()}:${auxFecha.getMinutes()}\n            Concepto: ${arrayMovimientos[i].concepto}\n`;
        }
      }
      textoMovimientos = `\nTotal targeta:      ${sumaTarjetas.toFixed(2)}\n` + textoMovimientos;

      permisosImpresora();
      // if(tipoImpresora === 'USB')
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
      // else {
      //     if(tipoImpresora === 'SERIE')
      //     {
      //         var device = new escpos.Serial('/dev/ttyS0', {
      //             baudRate: 115000,
      //             stopBit: 2
      //           })
      //     }
      // }
      const device = await dispositivos.getDevice();
      const options = {encoding: 'ISO-8859-15'}; // "GB18030" };
      const printer = new escpos.Printer(device, options);
      const mesInicial = fechaInicio.getMonth()+1;
      const mesFinal = fechaFinal.getMonth()+1;
      device.open(function() {
        printer
            .setCharacterCodeTable(19)
            .encode('CP858')
            .font('a')
            .style('b')
            .align('CT')
            .size(1, 1)
            .text('BOTIGA : ' + nombreTienda)
            .size(0, 0)
            .text('Resum caixa')
            .text('')
            .align('LT')
            .text('Resp.   : ' + nombreTrabajador)
            .text(`Inici: ${fechaInicio.getDate()}-${mesInicial}-${fechaInicio.getFullYear()} ${(fechaInicio.getHours()<10?'0':'') + fechaInicio.getHours()}:${(fechaInicio.getMinutes()<10?'0':'') + fechaInicio.getMinutes()}`)
            .text(`Final: ${fechaFinal.getDate()}-${mesFinal}-${fechaFinal.getFullYear()} ${(fechaFinal.getHours()<10?'0':'') + fechaFinal.getHours()}:${(fechaFinal.getMinutes()<10?'0':'') + fechaFinal.getMinutes()}`)
            .text('')
            .size(0, 1)
            .text('Calaix fet       :      ' + calaixFet.toFixed(2))
            .text('Descuadre        :      ' + descuadre.toFixed(2))
            .text('Clients atesos   :      ' + nClientes)
            .text('Recaudat         :      ' + recaudado.toFixed(2))
            .text('Canvi inicial    :      ' + cInicioCaja.toFixed(2))
            .text('Canvi final      :      ' + cFinalCaja.toFixed(2))
            .text('')
            .size(0, 0)
            .text('Moviments de caixa')
            .text('')
            .text('')
            .text(textoMovimientos)
            .text('')
            .cut()
            .close();
      });
    } catch (err) {
      logger.Error(87, err);
    }
  }

  async abrirCajon() {
    const parametros = parametrosInstance.getParametros();
    try {
      if (os.platform() === 'linux') {
        permisosImpresora();
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
        // } else {
        //     if(parametros.tipoImpresora === 'SERIE') {
        //         var device = new escpos.Serial('/dev/ttyS0', {
        //             baudRate: 115000,
        //             stopBit: 2
        //           });
        //     }
        // }
        const device = await dispositivos.getDevice();
        const printer = new escpos.Printer(device);

        device.open(function() {
          printer
              .cashdraw(2)
              .close();
        });
      }
    } catch (err) {
      logger.Error(88, err);
    }
  }
  async mostrarVisor(data) {
    // var eur = String.fromCharCode(128);
    let eur = 'E';

    let limitNombre = 0;
    let lengthTotal = '';
    let datosExtra = '';
    if (data.total !== undefined) {
      lengthTotal = (data.total).toString();
      if (lengthTotal.length == 1) limitNombre = 17;
      else if (lengthTotal.length == 2) limitNombre = 16;
      else if (lengthTotal.length == 3) limitNombre = 15;
      else if (lengthTotal.length == 4) limitNombre = 14;
      else if (lengthTotal.length == 5) limitNombre = 13;
      else if (lengthTotal.length == 6) limitNombre = 12;
      else if (lengthTotal.length == 7) limitNombre = 11;

      const dependienta = data.dependienta.substring(0, limitNombre);
      const total = data.total + eur;
      const espacio= ' ';
      const size = 20-(dependienta.length + total.length);

      const espacios = ['', ' ', '  ', '   ', '    ', '      ', '       ', '        ', '        ', '         ', '         ', '           ', '            ', '            ', '              '];
      datosExtra = dependienta +espacios[size] + total;
    }
    if (datosExtra.length <= 2) {
      datosExtra = '';
      eur = '';
    }
    // Limito el texto a 14, ya que la línea completa tiene 20 espacios. (1-14 -> artículo, 15 -> espacio en blanco, 16-20 -> precio)
    data.texto = data.texto.substring(0, 14);
    data.texto += ' ' + data.precio + eur;
    try {
      permisosImpresora();
      //   var device = new escpos.USB('0x67b','0x2303');
      const device = await dispositivos.getDeviceVisor();
      if (device != null) {
        const options = {encoding: 'iso88591'};
        const printer = new escpos.Screen(device, options);

        try {
          device.open(function() {
            printer
            // Espacios en blanco para limpiar el visor y volver a mostrar los datos en el sitio correcto
            // .text("")
                .clear()
            // .moveUp()
            // Información del artículo (artículo + precio)
                .text(datosExtra )
                .text(data.texto)

            // .text(datosExtra)

                .close();
          });
        } catch (error) {

        }
      } else {
        logger.Error(89, 'Controlado: dispositivo es null');
      }
    } catch (err) {
      logger.Error(90, 'Error2: ', err);
      // errorImpresora(err, event);
    }
    // logger.Error('El visor da muchos problemas');
  }
  async imprimirEntregas() {
    const params = await parametrosInstance.getParametros();
    return axios.post('entregas/getEntregas', {database: params.database, licencia: params.licencia}).then(async (res: any) => {
      try {
        permisosImpresora();
        const device = await dispositivos.getDevice();
        if (device != null) {
          const options = {encoding: 'ISO-8859-15'}; // "GB18030" };
          const printer = new escpos.Printer(device, options);
          device.open(function() {
            printer
                .setCharacterCodeTable(19)
                .encode('CP858')
                .font('a')
                .style('b')
                .align('CT')
                .size(0, 0)
                .text(res.data.info)
                .cut()
                .close();
          });
          return {error: false, info: 'OK'};
        }
        return {error: true, info: 'Error, no se encuentra la impresora'};
      } catch (err) {
        logger.Error(91, err);
        return {error: true, info: 'Error en CATCH imprimirEntregas() 2'};
      }
    }).catch((err) => {
      logger.Error(92, err);
      return {error: true, info: 'Error en CATCH imprimirEntregas() 1'};
    });
  }
}
export const impresoraInstance = new Impresora();
