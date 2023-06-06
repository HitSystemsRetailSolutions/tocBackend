import { ObjectId } from "mongodb";
import { conexion } from "../conexion/mongodb";
import { DeudasInterface } from "./deudas.interface";

export async function setDeuda(deuda): Promise<boolean> {
  console.log("mongoDeuda")
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

export async function getEncargoById(
  idDeuda: DeudasInterface["_id"]
): Promise<DeudasInterface> {
  const database = (await conexion).db("tocgame");
  const cesta = database.collection<DeudasInterface>("deudas");
  return await cesta.findOne({ _id: new ObjectId(idDeuda) });
}

