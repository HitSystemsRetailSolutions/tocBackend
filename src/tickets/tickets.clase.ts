import { TicketsInterface, TicketsInterfaceBackUp } from "./tickets.interface";
import * as schTickets from "./tickets.mongodb";
import { parametrosInstance } from "../parametros/parametros.clase";
import { CestasInterface } from "../cestas/cestas.interface";
import { io } from "../sockets.gateway";
import { movimientosInstance } from "../movimientos/movimientos.clase";
import axios from "axios";
import { convertirDineroEnPuntos } from "../funciones/funciones";
import { articulosInstance } from "../articulos/articulos.clase";
import * as schMovimientos from "../movimientos/movimientos.mongodb";
import { paytefInstance } from "../paytef/paytef.class";
import { cajaInstance } from "../caja/caja.clase";

export class TicketsClase {
  /* Eze 4.0 */
  getTicketById = (idTicket: number) => schTickets.getTicketByID(idTicket);

  /* Eze 4.0 */
  async anularTicket(idTicket: TicketsInterface["_id"]) {
    const ticket = await schMovimientos.getMovimientosDelTicket(idTicket);
    if (ticket[0]?.tipo == "TARJETA") {
      await paytefInstance.iniciarTransaccion(
        ticket[0].idTrabajador,
        ticket[0].idTicket,
        ticket[0].valor,
        "refund"
      );
      const devolucionCreada = schTickets.getTicketByID(idTicket + 1);
      if (devolucionCreada) {
        return { res: true, tipo: "TARJETA" };
      } else {
        return { res: false, tipo: "TARJETA" };
      }
    }
    return { res: await schTickets.anularTicket(idTicket), tipo: "EFECTIVO" };
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

  getUltimoTicket = async (): Promise<TicketsInterface> =>
    await schTickets.getUltimoTicket();

  /* Eze 4.0 */
  async getProximoId(): Promise<number> {
    const ultimoIdTicket = await this.getUltimoIdTicket();
    if (typeof ultimoIdTicket === "number") return ultimoIdTicket + 1;
    throw Error("El ultimoIdTicket no es correcto");
  }

  /* Eze 4.0 */
  async insertarTicket(ticket: TicketsInterface): Promise<boolean> {
    if (ticket.cesta.lista.length == 0)
      throw Error("Error al insertar ticket: la lista está vacía");

    let cantidadRegalada = 0;

    for (let i = 0; i < ticket.cesta.lista.length; i++) {
      if (ticket.cesta.lista[i].regalo === true) {
        cantidadRegalada +=
          (
            await articulosInstance.getInfoArticulo(
              ticket.cesta.lista[i].idArticulo
            )
          ).precioConIva * ticket.cesta.lista[i].unidades;
      }
    }

    if (cantidadRegalada > 0) {
      const resDescuento = await axios.post("clientes/descontarPuntos", {
        idCliente: ticket.cesta.idCliente,
        puntos: convertirDineroEnPuntos(cantidadRegalada),
      });

      if (resDescuento.data) return await schTickets.nuevoTicket(ticket);

      throw Error("No se han podido descontar los puntos");
    }
    return await schTickets.nuevoTicket(ticket);
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

  /* Eze 4.0 */
  async generarNuevoTicket(
    total: TicketsInterface["total"],
    idTrabajador: TicketsInterface["idTrabajador"],
    cesta: CestasInterface,
    consumoPersonal: boolean,
    datafono3G: TicketsInterface["datafono3G"],
    dejaCuenta?: TicketsInterface["dejaCuenta"]
  ): Promise<TicketsInterface> {
    const nuevoTicket: TicketsInterface = {
      _id: await this.getProximoId(),
      timestamp: Date.now(),
      total: consumoPersonal ? 0 : total,
      dejaCuenta: dejaCuenta,
      datafono3G: datafono3G,
      idCliente: cesta.idCliente,
      idTrabajador,
      cesta,
      enviado: false,
      consumoPersonal: consumoPersonal ? true : false,
    };
    return nuevoTicket;
  }

  /* Eze 4.0 */
  getTicketMasAntiguo = () => schTickets.getTicketMasAntiguo();

  /* Eze 4.0 */
  actualizarEstadoTicket = (ticket: TicketsInterface) =>
    schTickets.actualizarEstadoTicket(ticket);

  /* Eze 4.0 */
  setTicketEnviado = (idTicket: TicketsInterface["_id"]) =>
    schTickets.setTicketEnviado(idTicket);

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
}

export const ticketsInstance = new TicketsClase();
