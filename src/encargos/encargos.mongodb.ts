import { conexion } from "../conexion/mongodb";
import { EncargosInterface } from "./encargos.interface";

export async function setEncargo(encargo): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const encargos =
    database.collection<EncargosInterface>("encargos");
  // Insertamos todas las traducciones en la tabla traducciones.
  return encargos
    .insertOne(encargo)
    .then(() => true)
    .catch((err: any) => { console.log(err); return false});
}
