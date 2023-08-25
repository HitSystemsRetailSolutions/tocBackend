import { conexion } from "../conexion/mongodb";
import { TicketsInterface, TicketsInterfaceBackUp } from "./tickets.interface";
import { UtilesModule } from "../utiles/utiles.module";
import { ticketsInstance } from "./tickets.clase";
import { parametrosInstance } from "../parametros/parametros.clase";
import { logger } from "../logger";
import axios from "axios";

/* Eze v23 */
export async function limpiezaTickets(): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  return (
    await tickets.deleteMany({
      enviado: true,
      timestamp: { $lte: UtilesModule.restarDiasTimestamp(Date.now()) },
    })
  ).acknowledged;
}

/* Eze v23 */
export async function getTicketByID(
  idTicket: number
): Promise<TicketsInterface> {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  return await tickets.findOne({ _id: idTicket });
}

/* Eze v23 */
export async function getTicketsIntervalo(
  inicioTime: number,
  finalTime: number
): Promise<TicketsInterface[]> {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  const defTickets = await tickets
    .find({ timestamp: { $gte: inicioTime } })
    .toArray();
  return defTickets.filter((ticket) => ticket.timestamp <= finalTime);
}

export async function getUltimoTicketIntervalo(
  inicioTime: number,
  finalTime: number
): Promise<TicketsInterface[]> {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  return await tickets
    .find({ timestamp: { $lte: finalTime, $gte: inicioTime } })
    .sort({ _id: -1 })
    .limit(1)
    .toArray();
}
export async function getUltimoTicketTarjeta(
  ticket: number
): Promise<TicketsInterface[]> {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  return await tickets
    .find({ _id: ticket })
    .sort({ _id: -1 })
    .limit(1)
    .toArray();
}
/* Eze v23 */
export async function getDedudaGlovo(
  inicioTime: number,
  finalTime: number
): Promise<number> {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  const resultado = await tickets.find({
    $and: [
      {
        cliente: {
          id: "CliBoti_000_{A83B364B-252F-464B-B0C3-AA89DA258F64}",
          ciudad: null,
          cp: null,
          direccion: null,
          esVip: true,
          nif: null,
          nombre: "GLOVOAPP23, S.L.",
        },
      },
      { timestamp: { $gte: inicioTime } },
      { timestamp: { $lte: finalTime } },
    ],
  });
  const arrayResult = await resultado.toArray();

  let suma = 0;
  for (let i = 0; i < arrayResult.length; i++) {
    suma += arrayResult[i].total;
  }
  return suma;
}

/* Eze v23 */
export async function getTotalTkrs(
  inicioTime: number,
  finalTime: number
): Promise<number> {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  const resultado = await tickets.find({
    $and: [
      { tipoPago: "TICKET_RESTAURANT" },
      { timestamp: { $gte: inicioTime } },
      { timestamp: { $lte: finalTime } },
    ],
  });
  const arrayResult = await resultado.toArray();

  let suma = 0;
  for (let i = 0; i < arrayResult.length; i++) {
    suma += arrayResult[i].total;
  }
  return suma;
}

/*  Devuelve el ticket más antiguo con estado enviado = false
    para enviarlo al servidor
    Eze v23
*/
export async function getTicketMasAntiguo(): Promise<TicketsInterface> {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  return (await tickets.findOne(
    { enviado: false },
    { sort: { _id: 1 } }
  )) as TicketsInterface;
}

/* Eze 4.0 */
export async function getUltimoTicket(): Promise<TicketsInterface> {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  return await tickets.findOne({}, { sort: { _id: -1 } });
}

/* Eze v23 */
export async function nuevoTicket(ticket: TicketsInterface): Promise<boolean> {
  // conexion con mongo
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  // insertar ticket
  return (await tickets.insertOne(ticket)).acknowledged;
}

/* Uri */
export async function nuevoTicketBackUP(
  ticket: TicketsInterfaceBackUp
): Promise<boolean> {
  let ticketExist = await this.getTicketByID(ticket._id);
  if (ticketExist != null) {
    await actualizarTotalArticulo(
      ticketExist._id,
      ticketExist.total,
      ticket.total
    );
    return;
  }
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterfaceBackUp>("tickets");
  return (await tickets.insertOne(ticket)).acknowledged;
}

/* Uri */
export async function actualizarTotalArticulo(existTicketId, total, sum) {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  return (
    await tickets.updateOne(
      { _id: existTicketId },
      {
        $set: {
          total: total + sum,
        },
      }
    )
  ).acknowledged;
}
/* yasai :D */
export async function toggle3G(existTicketId, oldValue = false) {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  const result = await tickets.updateOne(
    { _id: existTicketId },
    {
      $set: {
        datafono3G: !oldValue,
      },
    }
  );
  const ticket = await tickets.findOne({ _id: existTicketId });
  const santaAnaResult = await axios
    .post("/tickets/enviarTicket", {
      ticket,
    })
    .catch((e) => {
      //  console.log(e);
    });

  return result.acknowledged;
}

/* Uri */
export async function setPagadoPaytef(Ticket) {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  const result = await tickets.updateOne(
    { _id: Ticket },
    {
      $set: {
        paytef: true,
      },
    }
  );
  const ticket = await tickets.findOne({ _id: Ticket });
  const santaAnaResult = await axios
    .post("/tickets/enviarTicket", {
      ticket,
    })
    .catch((e) => {
      //  console.log(e);
    });

  return result.acknowledged;
}

/* Eze v23 */
export async function desbloquearTicket(idTicket: number) {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  return (
    await tickets.updateOne(
      { _id: idTicket },
      { $set: { bloqueado: false } },
      { upsert: true }
    )
  ).acknowledged;
}

/* Eze v23 */
export async function actualizarEstadoTicket(
  ticket: TicketsInterface
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  return (
    await tickets.updateOne(
      { _id: ticket._id },
      {
        $set: {
          enviado: ticket.enviado,
        },
      }
    )
  ).acknowledged;
}

/* Eze v4 */
export async function setTicketEnviado(
  idTicket: TicketsInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  return (
    await tickets.updateOne(
      { _id: idTicket },
      {
        $set: {
          enviado: true,
        },
      }
    )
  ).acknowledged;
}

/* Eze v23 */
export async function borrarTicket(idTicket: number): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  const resultado = await tickets.deleteOne({ _id: idTicket });
  const resSetUltimoTicket = await parametrosInstance.setUltimoTicket(
    idTicket - 1 < 0 ? 0 : idTicket - 1
  );
  return resultado.acknowledged && resSetUltimoTicket;
}

/* Eze v23 - Solo se invoca manualmente desde la lista de tickets (frontend dependienta) */
export async function anularTicket(
  idTicket: TicketsInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const ticketsAnulados = database.collection("ticketsAnulados");
  const resultado = await ticketsAnulados.findOne({
    idTicketAnulado: idTicket,
  });
  if (resultado === null) {
    let ticket = await getTicketByID(idTicket);
    if (ticket.total > 0) {
      const id = await ticketsInstance.getProximoId();
      ticket.enviado = false;
      ticket._id = id;
      ticket.timestamp = Date.now();
      ticket.total = ticket.total * -1;
      ticket.datafono3G = false;
      ticket.cesta.lista.forEach((element) => {
        element.subtotal = element.subtotal * -1;
        element.unidades = element.unidades * -1;
        if (element.promocion != null) {
          element.promocion.precioRealArticuloPrincipal *= -1;
          element.promocion.unidadesOferta *= -1;
          element.promocion.cantidadArticuloPrincipal *= -1;
          if (element.promocion.cantidadArticuloSecundario != null) {
            element.promocion.cantidadArticuloPrincipal *= -1;
          }
          if (element.promocion.precioRealArticuloSecundario != null) {
            element.promocion.precioRealArticuloSecundario *= -1;
          }
        }
      });
      for (const property in ticket.cesta.detalleIva) {
        ticket.cesta.detalleIva[property] =
          ticket.cesta.detalleIva[property] * -1;
      }
      ticket.anulado = { idTicketPositivo: idTicket };
      const tickets = database.collection<TicketsInterface>("tickets");
      const resultado = (await tickets.insertOne(ticket)).acknowledged;
      await ticketsAnulados.insertOne({ idTicketAnulado: idTicket });
      const resSetUltimoTicket = await parametrosInstance.setUltimoTicket(
        ticket._id
      );
      ticketsInstance.actualizarTickets();
      return resultado && resSetUltimoTicket;
    }
  }
  return false;
}
