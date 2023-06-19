import { ObjectId } from "mongodb";
import { conexion } from "../conexion/mongodb";
import { DeudasInterface } from "./deudas.interface";

export async function setDeuda(deuda): Promise<boolean> {
  console.log("mongoDeuda");
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
  console.log("hola");
  const database = (await conexion).db("tocgame");
  const deudas = database.collection<DeudasInterface>("deudas");
  console.log(deudas.find({ pagado: false }).toArray());
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