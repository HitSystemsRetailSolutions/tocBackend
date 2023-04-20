import { ObjectId } from "mongodb";
import { conexion } from "../conexion/mongodb";
import { EncargosInterface } from "./encargos.interface";

export async function getEncargos(): Promise<EncargosInterface[]> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");
  console.log(await encargos.find({ recogido: false }).toArray());
  return await encargos.find({ recogido: false }).toArray();
}
export async function setEncargo(encargo): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");
  // Insertamos todas las traducciones en la tabla traducciones.
  return encargos
    .insertOne(encargo)
    .then(() => true)
    .catch((err: any) => {
      console.log(err);
      return false;
    });
}
export async function getEncargoById(
  idEncargo: EncargosInterface["_id"]
): Promise<EncargosInterface> {
  const database = (await conexion).db("tocgame");
  const cesta = database.collection<EncargosInterface>("encargos");
  return await cesta.findOne({ _id: new ObjectId(idEncargo) });
}
export async function setEntregado(
  id: EncargosInterface["_id"]
): Promise<boolean> {
  console.log("idmongo",id)
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");

  return (
    await encargos.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          recogido: true,
        },
      }
    )
  ).acknowledged;
}
