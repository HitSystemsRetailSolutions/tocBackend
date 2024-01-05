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
import { ClientesInterface } from "src/clientes/clientes.interface";
import { clienteInstance } from "src/clientes/clientes.clase";
import { AlbaranesInstance } from "src/albaranes/albaranes.clase";

export class TicketsClase {
  /* Eze 4.0 */
  getTicketById = (idTicket: number) => schTickets.getTicketByID(idTicket);

  /* Eze 4.0 */
  async anularTicket(idTicket: TicketsInterface["_id"]) {
    const ticket = await schTickets.getTicketByID(idTicket);
    if (ticket.paytef) {
      let xy = await schTickets.getAnulado(idTicket);
      if (xy?.anulado?.idTicketPositivo == idTicket)
        return { res: false, tipo: "TARJETA" };
      let x = await paytefInstance.iniciarTransaccion(
        ticket.idTrabajador,
        idTicket,
        ticket.total,
        "refund"
      );
      const devolucionCreada = await schTickets.getUltimoTicket();
      if (devolucionCreada.anulado.idTicketPositivo == idTicket) {
        return { res: true, tipo: "TARJETA" };
      } else {
        return { res: false, tipo: "TARJETA" };
      }
    } else if (ticket.datafono3G) {
      return {
        res: await schTickets.anularTicket(idTicket, true),
        tipo: "DATAFONO_3G",
      };
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

  getUltimoTicketTarjeta = (tarjeta: number) =>
    schTickets.getUltimoTicketTarjeta(tarjeta);

  getUltimoTicket = async (): Promise<TicketsInterface> =>
    await schTickets.getUltimoTicket();

  /* Eze 4.0 */
  async getProximoId(): Promise<number> {
    const ultimoIdTicket = await this.getUltimoIdTicket();

    if (typeof ultimoIdTicket === "number") {
      return ultimoIdTicket + 1;
    }

    throw Error("El ultimoIdTicket no es correcto");
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
      const resDescuento: any = await axios
        .post("clientes/descontarPuntos", {
          idCliente: ticket.cesta.idCliente,
          puntos: cantidadRegalada,
        })
        .catch((e) => {
          console.log(e);
        });

      if (resDescuento?.data) return await schTickets.nuevoTicket(ticket);

      throw Error("No se han podido descontar los puntos");
    }
    // si no tenemos que descontar dinero, simplemente insertamos el ticket
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
    paytef: TicketsInterface["paytef"],
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

    const nuevoTicket: TicketsInterface = {
      _id: await this.getProximoId(),
      timestamp: Date.now(),
      total: consumoPersonal ? 0 : Number(total.toFixed(2)),
      dejaCuenta: dejaCuenta,
      datafono3G: datafono3G,
      honei: !!honei,
      tkrs: tkrs,
      paytef: paytef,
      idCliente: cesta.idCliente,
      idTrabajador,
      cesta,
      enviado: false,
      consumoPersonal: consumoPersonal ? true : false,
    };
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

  /* Eze 4.0 */
  actualizarEstadoTicket = (ticket: TicketsInterface) =>
    schTickets.actualizarEstadoTicket(ticket);

  /* Eze 4.0 */
  setTicketEnviado = (idTicket: TicketsInterface["_id"]) =>
    schTickets.setTicketEnviado(idTicket);

  /* Uri 4.0 */
  setPagadoPaytef = (idTicket: TicketsInterface["_id"]) =>
    schTickets.setPagadoPaytef(idTicket);

  getTotalLocalPaytef = () => schTickets.getTotalLocalPaytef();
  cantidadLocal3G = async () => {
    const cajaAbiertaActual = await cajaInstance.getInfoCajaAbierta();
    const inicioTurnoCaja = cajaAbiertaActual.inicioTime;
    const finalTime = Date.now();
    const array3G = await schTickets.getTotalLocal3G();
    const tkrs = await movimientosInstance.getMovTkrsSinExcIntervalo(
      inicioTurnoCaja,
      finalTime
    );

    const tkrsIndexado = tkrs.reduce((acc, el) => {
      acc[el.idTicket] = el;
      return acc;
    }, {});
    let total3G = 0;
    array3G.forEach((ticket) => {
      const idTicketVenta = ticket._id;
      const entradaCorrespondiente = tkrsIndexado[idTicketVenta];
      if (entradaCorrespondiente) {
        total3G += ticket.total - entradaCorrespondiente.valor;
      } else {
        for (const item of ticket.cesta.lista) {
          if (!item?.pagado) {
            total3G += item.subtotal;
          }
        }
      }
    });

    return total3G;
  };

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
