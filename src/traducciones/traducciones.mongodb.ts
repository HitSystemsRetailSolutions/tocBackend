import { conexion } from "../conexion/mongodb";
import { TraduccionesInterface } from "./traducciones.interface";

export async function getTraducciones(): Promise<TraduccionesInterface[]> {
  // Este código devuelve todas las traducciones.
  const database = (await conexion).db("tocgame");
  const traducciones =
    database.collection<TraduccionesInterface>("traducciones");
  return await traducciones.find().toArray();
}

export async function setTraducciones(traduccionesArr): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const traducciones =
    database.collection<TraduccionesInterface>("traducciones");
  // Primero hay que borrar todas las traducciones.
  await traducciones.deleteMany({});
  // Insertamos todas las traducciones en la tabla traducciones.
  return traducciones
    .insertMany(traduccionesArr)
    .then(() => true)
    .catch(() => false);
}
