import { conexion } from "../conexion/mongodb";

export async function setItemStock(item: number, stock: number) {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection("articulos");
  return await articulos.updateOne(
    { _id: item },
    { $set: { stock: stock } },
    { upsert: true }
  );
}
