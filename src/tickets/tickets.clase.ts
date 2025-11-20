import {
  maxIdTicket,
  TicketsInterface,
  TicketsInterfaceBackUp,
} from "./tickets.interface";
import * as schTickets from "./tickets.mongodb";
import { parametrosInstance } from "../parametros/parametros.clase";
import { CestasInterface } from "../cestas/cestas.interface";
import { io } from "../sockets.gateway";
import { movimientosInstance } from "../movimientos/movimientos.clase";
import axios from "axios";
import {
  convertirDineroEnPuntos,
  redondearPrecio,
} from "../funciones/funciones";
import { articulosInstance } from "../articulos/articulos.clase";
import * as schMovimientos from "../movimientos/movimientos.mongodb";
import { paytefInstance } from "../paytef/paytef.class";
import { cajaInstance } from "../caja/caja.clase";
import { ClientesInterface } from "src/clientes/clientes.interface";
import { clienteInstance } from "src/clientes/clientes.clase";
import { AlbaranesInstance } from "src/albaranes/albaranes.clase";
import { MovimientosController } from "src/movimientos/movimientos.controller";
import { deudasInstance } from "src/deudas/deudas.clase";
import { impresoraInstance } from "src/impresora/impresora.class";
import { cestasInstance } from "src/cestas/cestas.clase";
import { logger } from "src/logger";
import { getDataVersion } from "src/version/version.clase";
import { max } from "moment";
import { backupRestoreInstance } from "src/backuprestore/backup.class";

export class TicketsClase {
  /* Eze 4.0 */
  getTicketById = (idTicket: number) => schTickets.getTicketByID(idTicket);

  /* Eze 4.0 */
  async anularTicket(
    idTicket: TicketsInterface["_id"],
    reason?: TicketsInterface["justificacion"]
  ) {
    try {
      const ticket = await schTickets.getTicketByID(idTicket);
      let movimientos = await schMovimientos.getMovimientosDelTicket(idTicket);
      if (
        ticket.paytef ||
        (movimientos &&
          movimientos.length > 0 &&
          movimientos[0]?.tipo === "TARJETA")
      ) {
        let xy = await schTickets.getAnulado(idTicket);
        if (xy?.anulado?.idTicketPositivo == idTicket)
          return { res: false, tipo: "TARJETA", msg: "Ya está anulado" };
        let x = await paytefInstance.iniciarTransaccion(
          ticket.idTrabajador,
          idTicket,
          ticket.total,
          "refund"
        );
        if (!x) {
          return { res: false, tipo: "TARJETA", msg: "Anulación interrumpida" };
        }
        if (await schTickets.anularTicket(idTicket, true, reason)) {
          const devolucionCreada = await schTickets.getUltimoTicket();
          if (devolucionCreada.anulado.idTicketPositivo == idTicket) {
            await movimientosInstance.nuevoMovimiento(
              movimientos[0].valor,
              movimientos[0].concepto,
              "DEV_DATAFONO_PAYTEF",
              devolucionCreada._id,
              movimientos[0].idTrabajador
            );
            return {
              res: true,
              tipo: "TARJETA",
              idTicket: devolucionCreada._id,
            };
          }
        }
        return { res: false, tipo: "TARJETA", msg: "Error al anular" };
      } else if (
        ticket.datafono3G ||
        (movimientos &&
          movimientos.length > 0 &&
          movimientos[0].tipo === "DATAFONO_3G")
      ) {
        const allDatafono3G = movimientos.every(
          (mov) => mov.tipo === "DATAFONO_3G"
        );
        if (allDatafono3G) {
          const sumAll = movimientos.reduce((acc, mov) => acc + mov.valor, 0);
          if (sumAll == 0) {
            if (await schTickets.anularTicket(idTicket, false, reason)) {
              const devolucionCreada = await schTickets.getUltimoTicket();
              return {
                res: true,
                tipo: "EFECTIVO",
                idTicket: devolucionCreada._id,
              };
            }
            return { res: false, tipo: "EFECTIVO" };
          }
        }
        if (await schTickets.anularTicket(idTicket, true, reason)) {
          const devolucionCreada = await schTickets.getUltimoTicket();
          if (devolucionCreada.anulado.idTicketPositivo == idTicket) {
            await movimientosInstance.nuevoMovimiento(
              movimientos[0].valor,
              movimientos[0].concepto,
              "DEV_DATAFONO_3G",
              devolucionCreada._id,
              movimientos[0].idTrabajador
            );
            return {
              res: true,
              tipo: "DATAFONO_3G",
              idTicket: devolucionCreada._id,
            };
          }
        }
        return { res: false, tipo: "DATAFONO_3G" };
      }
      if (await schTickets.anularTicket(idTicket, false, reason)) {
        const devolucionCreada = await schTickets.getUltimoTicket();
        return {
          res: true,
          tipo: "EFECTIVO",
          idTicket: devolucionCreada._id,
        };
      }
      return { res: false, tipo: "EFECTIVO" };
    } catch (error) {
      console.log("error anularTicket", error);
      return { res: false, tipo: "ERROR", msg: "Excepción en la anulación" };
    }
  }
  async isTicketAnulable(idTicket: TicketsInterface["_id"]) {
    return schTickets.isTicketAnulable(idTicket);
  }
  /* Eze 4.0 */
  getTicketsIntervalo = (fechaInicio: number, fechaFinal: number) =>
    schTickets.getTicketsIntervalo(fechaInicio, fechaFinal);

  /* Eze 4.0 */
  async getFormaPago(ticket: TicketsInterface) {
    if (ticket) return await movimientosInstance.getFormaPago(ticket);

    throw Error("El ticket no existe");
  }
  /* Eze 4.0 */
  async getUltimoIdTicket() {
    const ultimoIdMongo = (await schTickets.getUltimoTicket())?._id;
    if (ultimoIdMongo) {
      return ultimoIdMongo;
    } else {
      return (await parametrosInstance.getParametros()).ultimoTicket;
    }
  }

  getUltimoTicketIntervalo = (fechaInicio: number, fechaFinal: number) =>
    schTickets.getUltimoTicketIntervalo(fechaInicio, fechaFinal);

  getUltimoTicketTarjeta = (tarjeta: number) =>
    schTickets.getUltimoTicketTarjeta(tarjeta);

  getUltimoTicket = async (): Promise<TicketsInterface> =>
    await schTickets.getUltimoTicket();

  /* Eze 4.0 */

  async getProximoId(): Promise<number> {
    const ultimoIdTicket = await this.getUltimoIdTicket(); // Última ID en la colección
    const ultimoTicketBackup: TicketsInterface =
      backupRestoreInstance.recoverSingleTicket(); // Última ID en el backup
    const maxIdTicketValue = maxIdTicket;

    if (typeof ultimoIdTicket !== "number") {
      throw new Error("No se pudo obtener el último ID de ticket");
    }

    let newId = ultimoIdTicket + 1;

    // Si el ID generado es igual al de la última transacción de Paytef, incrementarlo
    if (paytefInstance.dentroIniciarTransaccion) {
      throw new Error(
        "El ID generado no puede generarse en mitad de una transacción de Paytef"
      );
    }

    // Comprobar si el ID del último ticket en backup no está en MongoDB
    if (
      ultimoTicketBackup &&
      typeof ultimoTicketBackup._id === "number" &&
      ultimoTicketBackup._id == newId &&
      ultimoTicketBackup._id <= maxIdTicketValue
    ) {
      logger.Info(
        `El ID del último ticket en backup no se encuentra en mongo. Insertando...`
      );
      newId = ultimoTicketBackup._id + 1;
      await schTickets.nuevoTicket(ultimoTicketBackup);
    }

    // Resetea el ID
    if (newId > maxIdTicketValue) {
      newId = 1;
    }

    return newId;
  }

  /* Eze 4.0 */
  async insertarTicket(ticket: TicketsInterface): Promise<boolean> {
    // miramos que la lista tenga elementos
    if (ticket.cesta.lista.length == 0)
      throw Error("Error al insertar ticket: la lista está vacía");
    // calculamos el dinero que se descuenta
    let cantidadRegalada = 0;

    for (let i = 0; i < ticket.cesta.lista.length; i++) {
      if (ticket.cesta.lista[i].regalo === true) {
        // let puntos = (
        //   await articulosInstance.getInfoArticulo(
        //     ticket.cesta.lista[i].idArticulo
        //   )
        // ).precioConIva * ticket.cesta.lista[i].unidades;
        cantidadRegalada += ticket.cesta.lista[i].puntos;
      }
    }
    // si tenemos que descontar dinero lo hacemos
    if (cantidadRegalada > 0) {
      const resDescuento: any = await this.tryDescontarPuntos({
        idCliente: ticket.idCliente,
        puntos: cantidadRegalada,
      });
      if (!resDescuento) throw Error("No se han podido descontar los puntos");
    }
    const res = await schTickets.nuevoTicket(ticket);
    // si ha ido bien actualizamos el último ticket
    if (res) await parametrosInstance.updLastTicket(ticket._id);
    return res;
  }

  async tryDescontarPuntos(data: {
    idCliente: ClientesInterface["id"];
    puntos: number;
  }): Promise<boolean> {
    const url = "clientes/descontarPuntos";
    const delay = 1000;

    try {
      const response = await axios.post(url, data, { timeout: delay });

      // aunque la petición dé error, se devuelve  true para generar el ticket ya pagado.
      if (!response?.data)
        throw Error("La petición no ha podido descontar los puntos");
      return true;
    } catch (e) {
      logger.Error(1074, `Intento de descontar puntos cliente fallido:`, e);
      return true;
    }
  }
  /* Uri 4.0 */
  async InsertatTicketBackUp(
    _id,
    timestamp,
    total,
    idTrabajador,
    consumoPersonal
  ): Promise<boolean> {
    let date = new Date(timestamp);
    date.setHours(date.getHours() - 2);
    let ticket: TicketsInterfaceBackUp = {
      _id: _id,
      timestamp: Date.parse(date.toString()),
      total: total,
      idTrabajador: idTrabajador,
      consumoPersonal: consumoPersonal,
      idCliente: null,
      enviado: true,
      dataVersion: getDataVersion(),
    };
    return await schTickets.nuevoTicketBackUP(ticket);
  }

  /* Uri 4.0 */
  async editarTotalTicket(_id, total): Promise<boolean> {
    let ticketExist = await schTickets.getTicketByID(_id);
    return await schTickets.actualizarTotalArticulo(
      ticketExist._id,
      ticketExist.total,
      total
    );
  }

  esConsumoPersonal(tipo: string, modo: CestasInterface["modo"]): boolean {
    // Agregar toda la lógica necesaria para determinar si es consumo personal
    return tipo === "CONSUMO_PERSONAL" || modo === "CONSUMO_PERSONAL";
  }

  validarNIF(nif: string) {
    nif = nif.toUpperCase().trim();

    const letrasDNI = "TRWAGMYFPDXBNJZSQVHLCKE";

    // DNI: 8 dígitos + letra
    if (/^\d{8}[A-Z]$/.test(nif)) {
      const numero = parseInt(nif.slice(0, 8), 10);
      const letraEsperada = letrasDNI[numero % 23];
      return nif[8] === letraEsperada;
    }

    // NIE: empieza por X, Y o Z
    if (/^[XYZ]\d{7}[A-Z]$/.test(nif)) {
      const letrasIniciales = { X: 0, Y: 1, Z: 2 };
      const numero = letrasIniciales[nif[0]] + nif.slice(1, 8);
      const letraEsperada = letrasDNI[parseInt(numero, 10) % 23];
      return nif[8] === letraEsperada;
    }

    // CIF: letra inicial + 7 dígitos + dígito control
    if (/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/.test(nif)) {
      const letraInicial = nif[0];
      const digitos = nif.slice(1, -1);
      const control = nif.slice(-1);

      let sumaPar = 0;
      let sumaImpar = 0;

      for (let i = 0; i < digitos.length; i++) {
        let n = parseInt(digitos[i], 10);
        if (i % 2 === 0) {
          // posiciones impares (índice par)
          let doble = n * 2;
          if (doble > 9) doble -= 9;
          sumaImpar += doble;
        } else {
          sumaPar += n;
        }
      }

      const sumaTotal = sumaPar + sumaImpar;
      const digitoControl = (10 - (sumaTotal % 10)) % 10;
      const letrasControl = "JABCDEFGHI";

      if ("PQRSNW".includes(letraInicial)) {
        return control === letrasControl[digitoControl]; // debe ser letra
      } else if ("ABEH".includes(letraInicial)) {
        return control === String(digitoControl); // debe ser número
      } else {
        // puede ser letra o número
        return (
          control === String(digitoControl) ||
          control === letrasControl[digitoControl]
        );
      }
    }

    return false;
  }

  /* Eze 4.0 */
  async generarNuevoTicket(
    total: TicketsInterface["total"],
    idTrabajador: TicketsInterface["idTrabajador"],
    cesta: CestasInterface,
    consumoPersonal: boolean,
    honei: TicketsInterface["honei"],
    tkrs: boolean,
    dejaCuenta?: TicketsInterface["dejaCuenta"]
  ): Promise<TicketsInterface> {
    /*const cliente = await clienteInstance.getClienteById(cesta.idCliente);
   if (cliente && cliente.descuento) {
      cesta.lista.forEach((art, index) => {
        cesta.lista[index].subtotal =
          art.subtotal - art.subtotal * (cliente.descuento / 100);
      });
    }*/
    try {
      let nif = (await parametrosInstance.getParametros())?.nif;
      if (nif) nif = nif.toString();
      else nif = "";
      if (!this.validarNIF(nif)) {
        parametrosInstance.setNif();
      }
    } catch (e) {
      console.log(e);
    }
    const nuevoTicket: TicketsInterface = {
      _id: await this.getProximoId(),
      timestamp: Date.now(),
      total: Number(total.toFixed(2)),
      dejaCuenta: dejaCuenta,
      honei: !!honei,
      tkrs: tkrs,
      idCliente: cesta.idCliente,
      idTrabajador,
      cesta,
      enviado: false,
      consumoPersonal: consumoPersonal ? true : false,
      dataVersion: getDataVersion(),
    };
    if (dejaCuenta && dejaCuenta > 0) {
      nuevoTicket.restante = redondearPrecio(nuevoTicket.total - dejaCuenta);
    }
    return nuevoTicket;
  }
  /* Yasai :D */
  async getTotalHonei() {
    // calcula el total de dinero hecho con honei
    const ticketsHonei = await schTickets.getTicketsHonei();
    let total = 0;
    ticketsHonei.forEach((ticket) => {
      ticket.cesta.lista.forEach((item) => {
        if (item.pagado) {
          total += item.subtotal;
        }
      });
    });

    return total;
  }

  /* Eze 4.0 */
  getTicketMasAntiguo = () => schTickets.getTicketMasAntiguo();

  getTicketOtrosModificadoMasAntiguo = () =>
    schTickets.getTicketOtrosModificadoMasAntiguo();

  /* Eze 4.0 */
  actualizarEstadoTicket = (ticket: TicketsInterface) =>
    schTickets.actualizarEstadoTicket(ticket);

  /* Eze 4.0 */
  setTicketEnviado = (
    idTicket: TicketsInterface["_id"],
    enviado: boolean = true
  ) => schTickets.setTicketEnviado(idTicket, enviado);
  /**
   * marcar valor a true o false en otrosModificado
   * @param idTicket interficie de ticket
   * @param otrosModificado booleano que indica si se ha modificado el ticket en bbdd
   * @returns resultado de la operación
   */
  setTicketOtrosModificado = (
    idTicket: TicketsInterface["_id"],
    otrosModificado: boolean = true
  ) => schTickets.setTicketOtrosModificado(idTicket, otrosModificado);
  /* Uri 4.0 */
  setPagadoPaytef = async (idTicket: TicketsInterface["_id"]) => {
    let ticket = await schTickets.getTicketByID(idTicket);
    if (ticket)
      return movimientosInstance.nuevoMovimiento(
        ticket.total,
        "Paytef",
        "TARJETA",
        idTicket,
        ticket.idTrabajador
      );
  };

  getTotalLocalPaytef = () => schTickets.getTotalLocalPaytef();

  getTotalDatafono3G = async (horaInici, horaFinal) => {
    const arrayMov3G = await schMovimientos.getMovsDatafono3G(
      horaInici,
      horaFinal
    );
    let total3G = 0;
    for (const mov of arrayMov3G) {
      switch (mov.tipo) {
        case "DATAFONO_3G":
          total3G += mov.valor;
          break;
        case "DEV_DATAFONO_3G":
          total3G -= mov.valor;
          break;
      }
    }
    total3G = Math.round(total3G * 100) / 100;
    return total3G;
  };
  // getTotalDatafono3G = async () => {
  //   const superTicket = await movimientosInstance.construirArrayVentas();
  //   let total3G = 0;
  //   const cajaAbiertaActual = await cajaInstance.getInfoCajaAbierta();
  //   const inicioTurnoCaja = cajaAbiertaActual.inicioTime;
  //   const finalTime = Date.now();
  //   // recogemos los movimientos de DATAFONO_3G concepto deuda pagada
  //   const mov3G = await movimientosInstance.getDat3GDeudaPagada(
  //     inicioTurnoCaja,
  //     finalTime
  //   );
  //   if (superTicket && superTicket.length > 0) {
  //     const tkrs = await movimientosInstance.getMovTkrsSinExcIntervalo(
  //       inicioTurnoCaja,
  //       finalTime
  //     );

  //     const tkrsIndexado = tkrs.reduce((acc, el) => {
  //       acc[el.idTicket] = el;
  //       return acc;
  //     }, {});
  //     const mov3GIndexado = mov3G.reduce((acc, el) => {
  //       acc[el.idTicket] = el;
  //       return acc;
  //     }, {});
  //     superTicket.forEach((ticket) => {
  //       const idTicketVenta = ticket._id;
  //       const entradaCorrespondiente = tkrsIndexado[idTicketVenta];
  //       // revisamos si el ticket tiene un movimiento de 3G concepto Deuda Pagada
  //       // para no sumarlo al total3G. Se sumará esos movs al terminar el foreach
  //       const mov3GCorrespondiente = mov3GIndexado[idTicketVenta];
  //       if (
  //         !mov3GCorrespondiente &&
  //         entradaCorrespondiente &&
  //         (ticket.tipoPago.includes("DATAFONO_3G") || ticket.datafono3G)
  //       ) {
  //         total3G += ticket.total - entradaCorrespondiente.valor;
  //       } else if (
  //         (!mov3GCorrespondiente && ticket.tipoPago.includes("DATAFONO_3G")) ||
  //         (ticket.anulado && ticket.datafono3G)
  //       ) {
  //         for (const item of ticket.cesta.lista) {
  //           if (!item?.pagado) {
  //             total3G += item.subtotal;
  //             total3G = Math.round(total3G * 100) / 100;
  //           }
  //         }
  //       }
  //     });
  //   }
  //   // sumamos los movimientos de 3G concepto Deuda Pagada.
  //   // Se hacen fuera del foreach para no sumarlos varias veces
  //   // y algunas tienen un idTicket de otra caja
  //   mov3G.forEach((mov) => {
  //     total3G += mov.valor;
  //     total3G = Math.round(total3G * 100) / 100;
  //   });
  //   return total3G;
  // };
  async finalizarTicket(
    ticket: TicketsInterface,
    idTrabajador: number,
    tipo: string,
    concepto: string,
    cesta: CestasInterface,
    tkrsData: any
  ) {
    await cestasInstance.borrarArticulosCesta(cesta._id, true, true, false);
    await cestasInstance.setClients(0, cesta._id);
    if (tipo === "TARJETA") {
      // paytefInstance.iniciarTransaccion(idTrabajador, ticket._id, total);
      this.setPagadoPaytef(ticket._id);
    } else if (
      (tipo === "TKRS" && tkrsData) ||
      (tkrsData?.cantidadTkrs > 0 &&
        (tipo === "EFECTIVO" || tipo === "DATAFONO_3G"))
    ) {
      if (tkrsData.cantidadTkrs > ticket.total) {
        await movimientosInstance.nuevoMovimiento(
          ticket.total,
          "",
          "TKRS_SIN_EXCESO",
          ticket._id,
          idTrabajador
        );
        await movimientosInstance.nuevoMovimiento(
          redondearPrecio(tkrsData.cantidadTkrs - ticket.total),
          "",
          "TKRS_CON_EXCESO",
          ticket._id,
          idTrabajador
        );
      } else if (tkrsData.cantidadTkrs < ticket.total) {
        if (tipo === "DATAFONO_3G") {
          let total3G =
            Math.round((ticket.total - tkrsData.cantidadTkrs) * 100) / 100;
          await movimientosInstance.nuevoMovimiento(
            total3G,
            "",
            "DATAFONO_3G",
            ticket._id,
            idTrabajador
          );
        }
        await movimientosInstance.nuevoMovimiento(
          tkrsData.cantidadTkrs,
          "",
          "TKRS_SIN_EXCESO",
          ticket._id,
          idTrabajador
        );
      } else if (tkrsData.cantidadTkrs === ticket.total) {
        await movimientosInstance.nuevoMovimiento(
          ticket.total,
          "",
          "TKRS_SIN_EXCESO",
          ticket._id,
          idTrabajador
        );
      }
    } else if (tipo === "DATAFONO_3G") {
      await movimientosInstance.nuevoMovimiento(
        ticket.total,
        "",
        "DATAFONO_3G",
        ticket._id,
        idTrabajador
      );
    } else if (tipo === "DEUDA") {
      const cliente = await clienteInstance.getClienteById(cesta.idCliente);
      //como tipo DEUDA se utilizaba antes de crear deudas en la tabla deudas
      // se diferenciara su uso cuando el concepto sea igual a DEUDA
      if (concepto && concepto == "DEUDA") {
        await movimientosInstance.nuevoMovimiento(
          ticket.total,
          "DEUDA",
          "SALIDA",
          ticket._id,
          idTrabajador,
          cliente.nombre
        );
        var deuda = {
          idTicket: ticket._id,
          cesta: cesta,
          idTrabajador: idTrabajador,
          idCliente: cesta.idCliente,
          nombreCliente: cesta.nombreCliente,
          total: ticket.total,
          timestamp: ticket.timestamp,
        };
        await deudasInstance.setDeuda(deuda);
      } else {
        await movimientosInstance.nuevoMovimiento(
          ticket.total,
          "",
          "DEUDA",
          ticket._id,
          idTrabajador
        );
      }
    } else if (tipo !== "EFECTIVO" && tipo != "CONSUMO_PERSONAL") {
      throw Error(
        "Falta información del tkrs o bien ninguna forma de pago es correcta"
      );
    }
    if (tipo !== "TARJETA" && concepto == "DEUDA") {
      await impresoraInstance.abrirCajon();
    }
    this.actualizarTickets();
    return ticket._id;
  }
  actualizarTickets = async () => {
    const arrayVentas = await movimientosInstance.construirArrayVentas();
    if (arrayVentas) io.emit("cargarVentas", arrayVentas.reverse());
    // {
    //   logger.Error(
    //     130,
    //     "No se ha podido enviar los tickets actualizados por socket debido a problemas con la caja"
    //   );
    // }
  };

  insertImprimir = (idTicket: TicketsInterface["_id"]) =>
    schTickets.insertImprimir(idTicket);
}

export const ticketsInstance = new TicketsClase();
