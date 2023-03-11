import { conexion } from "../conexion/mongodb";
import { TicketsInterface } from "./tickets.interface";
import { UtilesModule } from "../utiles/utiles.module";
import { ticketsInstance } from "./tickets.clase";
import { parametrosInstance } from "../parametros/parametros.clase";
import { logger } from "../logger";

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
  return await tickets
    .find({ timestamp: { $lte: finalTime, $gte: inicioTime } })
    .toArray();
}

export async function getUltimoTicketIntervalo(
  inicioTime: number,
  finalTime: number
): Promise<TicketsInterface[]> {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");

  return await tickets
    .find({ timestamp: { $lte: finalTime, $gte: inicioTime } }).sort({ _id: -1 }).limit(1)
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
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  return (await tickets.insertOne(ticket)).acknowledged;
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
export async function actualizarEnviadoTicket(
  idTicket: TicketsInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const tickets = database.collection<TicketsInterface>("tickets");
  return (
    await tickets.updateOne(
      { _id: idTicket },
      {
        $set: {
          enviado: false,
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
export async function anularTicket(idTicket: TicketsInterface["_id"]): Promise<boolean> {
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
      ticket.cesta.lista.forEach((element) => {
        element.subtotal = element.subtotal * -1;
      });
      for(const property in ticket.cesta.detalleIva){
        ticket.cesta.detalleIva[property]=ticket.cesta.detalleIva[property]*-1;
      }
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
