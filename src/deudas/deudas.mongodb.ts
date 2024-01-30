import { ObjectId } from "mongodb";
import { conexion } from "../conexion/mongodb";
import { DeudasInterface } from "./deudas.interface";
import { log } from "console";
import { logger } from "src/logger";

export async function setDeuda(deuda): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const deudas = database.collection<DeudasInterface>("deudas");
  // Insertamos todas las traducciones en la tabla traducciones.
  return deudas
    .insertOne(deuda)
    .then(() => true)
    .catch((err: any) => {
      return false;
    });
}
export async function getDeudas(): Promise<DeudasInterface[]> {
  const database = (await conexion).db("tocgame");
  const deudas = database.collection<DeudasInterface>("deudas");
  return await deudas.find({ estado: "SIN_PAGAR" }).toArray();
}
export async function getAllDeudas(): Promise<DeudasInterface[]> {
  const database = (await conexion).db("tocgame");
  const deudas = database.collection<DeudasInterface>("deudas");
  return await deudas.find().toArray();
}
export async function getDeudaById(
  idDeuda: DeudasInterface["_id"]
): Promise<DeudasInterface> {
  const database = (await conexion).db("tocgame");
  const deudas = database.collection<DeudasInterface>("deudas");
  return await deudas.findOne({ _id: new ObjectId(idDeuda) });
}
export async function setEnviado(
  idDeuda: DeudasInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const deudas = database.collection<DeudasInterface>("deudas");
  return (
    await deudas.updateOne(
      { _id: new ObjectId(idDeuda) },
      {
        $set: {
          enviado: true,
        },
      }
    )
  ).acknowledged;
}
export async function setFinalizado(
  idDeuda: DeudasInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const deudas = database.collection<DeudasInterface>("deudas");
  return (
    await deudas.updateOne(
      { _id: new ObjectId(idDeuda) },
      {
        $set: {
          finalizado: true,
        },
      }
    )
  ).acknowledged;
}
export async function setPagado(
  idDeuda: DeudasInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const deudas = database.collection<DeudasInterface>("deudas");
  return (
    await deudas.updateOne(
      { _id: new ObjectId(idDeuda) },
      {
        $set: {
          finalizado: false,
          estado: "PAGADO",
        },
      }
    )
  ).acknowledged;
}
export async function setAnulado(
  idDeuda: DeudasInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const deudas = database.collection<DeudasInterface>("deudas");
  return (
    await deudas.updateOne(
      { _id: new ObjectId(idDeuda) },
      {
        $set: {
          finalizado: false,
          estado: "ANULADO",
        },
      }
    )
  ).acknowledged;
}
export async function getIntervaloDeuda(
  fechaInicial: DeudasInterface["timestamp"],
  fechaFinal: DeudasInterface["timestamp"]
): Promise<DeudasInterface[]> {
  const database = (await conexion).db("tocgame");
  const deudas = database.collection<DeudasInterface>("deudas");
  return await deudas
    .find({
      timestamp: { $lte: fechaFinal, $gte: fechaInicial },
      estado: "SIN_PAGAR",
    })
    .toArray();
}
export async function getDeudasCajaAsync(
  fechaInicial: DeudasInterface["timestamp"],
  fechaFinal: DeudasInterface["timestamp"]
): Promise<DeudasInterface[]> {
  const database = (await conexion).db("tocgame");
  const deudas = database.collection<DeudasInterface>("deudas");
  return await deudas
    .find({ timestamp: { $lte: fechaFinal, $gte: fechaInicial } })
    .toArray();
}
export async function borrarDeudas(): Promise<void> {
  const database = (await conexion).db("tocgame");
  const collectionlist = await database.listCollections().toArray();

  for (let i = 0; i < collectionlist.length; i++) {
    if (collectionlist[i].name === "deudas") {
      await database.collection("deudas").drop();
      break;
    }
  }
}

export async function getUpdateDeudas(): Promise<boolean> {
  try {
    const database = (await conexion).db("tocgame");
    const deudas = database.collection<DeudasInterface>("deudas");

    const documento = await deudas.findOne({ pagado: { $exists: true } });

    if (documento) {
      return false; // Existe al menos una deuda, devuelve false.
    } else {
      return true; // No existen deudas, devuelve true.
    }
  } catch (error) {
    console.error("Error al buscar documentos: ", error);
    throw error; // Lanza el error si ocurre un problema durante la búsqueda.
  }
}

export async function getDeudaCreadaMasAntiguo(): Promise<DeudasInterface> {
  const database = (await conexion).db("tocgame");
  const deudas = database.collection<DeudasInterface>("deudas");
  return (await deudas.findOne(
    { enviado: false },
    { sort: { _id: 1 } }
  )) as DeudasInterface;
}

export async function getDeudaFinalizadaMasAntiguo(): Promise<DeudasInterface> {
  const database = (await conexion).db("tocgame");
  const deudas = database.collection<DeudasInterface>("deudas");
  return (await deudas.findOne(
    { finalizado: false },
    { sort: { _id: 1 } }
  )) as DeudasInterface;
}

export async function getDeudaByIdTicket(
  idTicket: DeudasInterface["idTicket"],
  timestamp: DeudasInterface["timestamp"]
): Promise<DeudasInterface> {
  try {
    const database = (await conexion).db("tocgame");
    const deudas = database.collection<DeudasInterface>("deudas");
    const deuda = await deudas.findOne({
      idTicket: idTicket,
      timestamp: timestamp,
    });
    if (!deuda) {
      throw new Error("Deuda no encontrada en mongodb.");
    }
    return deuda;
  } catch (error) {
    logger.Error(501, error);
  }
}
