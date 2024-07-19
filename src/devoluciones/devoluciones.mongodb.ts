import { ObjectId } from "mongodb";
import { conexion } from "../conexion/mongodb";
import { DevolucionesInterface } from "./devoluciones.interface";

/* Eze 4.0 */
export async function insertarDevolucion(
  devolucion: DevolucionesInterface
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const devoluciones =
    database.collection<DevolucionesInterface>("devoluciones");
  return (await devoluciones.insertOne(devolucion)).acknowledged;
}

/* Eze 4.0 */
export async function getDevolucionMasAntigua(): Promise<DevolucionesInterface> {
  const database = (await conexion).db("tocgame");
  const devolucion = database.collection<DevolucionesInterface>("devoluciones");
  return await devolucion.findOne(
    { enviado: false },
    { sort: { timestamp: 1 } }
  );
}

/* Eze 4.0 */
export async function actualizarEstadoDevolucion(
  devolucion: DevolucionesInterface
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const sincroFichajes =
    database.collection<DevolucionesInterface>("devoluciones");

  const res = await sincroFichajes.updateOne(
    { _id: new ObjectId(devolucion._id) },
    {
      $set: {
        enviado: devolucion.enviado,
      },
    }
  );
  return res.acknowledged;
}

/* Eze 4.0 */
export async function getDevolucionById(
  id: ObjectId
): Promise<DevolucionesInterface> {
  const database = (await conexion).db("tocgame");
  const devoluciones =
    database.collection<DevolucionesInterface>("devoluciones");
  return await devoluciones.findOne({ _id: id });
}

export async function verifyCurrentBoxReturns(
  inicioTime: number
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const devoluciones =
    database.collection<DevolucionesInterface>("devoluciones");
  return (await devoluciones.countDocuments({ timestamp: { $gt: inicioTime } })) > 0;
}