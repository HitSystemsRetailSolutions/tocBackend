import { TicketsInterface } from "./tickets.interface";
import * as schTickets from "./tickets.mongodb";
import { parametrosInstance } from "../parametros/parametros.clase";
import { CestasInterface } from "../cestas/cestas.interface";
import { io } from "../sockets.gateway";
import { movimientosInstance } from "../movimientos/movimientos.clase";
import axios from "axios";
import { convertirDineroEnPuntos } from "../funciones/funciones";
import { articulosInstance } from "../articulos/articulos.clase";

export class TicketsClase {
  /* Eze 4.0 */
  getTicketById = (idTicket: number) => schTickets.getTicketByID(idTicket);

  /* Eze 4.0 */
  anularTicket = (idTicket: number) => schTickets.anularTicket(idTicket);

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

  /* Eze 4.0 */
  async generarNuevoTicket(
    total: TicketsInterface["total"],
    idTrabajador: TicketsInterface["idTrabajador"],
    cesta: CestasInterface,
    consumoPersonal: boolean
  ): Promise<TicketsInterface> {
    const nuevoTicket: TicketsInterface = {
      _id: await this.getProximoId(),
      timestamp: Date.now(),
      total: consumoPersonal ? 0 : total,
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
