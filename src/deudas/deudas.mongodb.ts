import { ObjectId } from "mongodb";
import { conexion } from "../conexion/mongodb";
import { DeudasInterface } from "./deudas.interface";

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
  return await deudas.find({ pagado: false }).toArray();
}

export async function getDeudaById(
  idDeuda: DeudasInterface["_id"]
): Promise<DeudasInterface> {
  const database = (await conexion).db("tocgame");
  const deudas = database.collection<DeudasInterface>("deudas");
  return await deudas.findOne({ _id: new ObjectId(idDeuda) });
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
          pagado: true,
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
    .find({ timestamp: { $lte: fechaFinal, $gte: fechaInicial }, pagado: false })
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
