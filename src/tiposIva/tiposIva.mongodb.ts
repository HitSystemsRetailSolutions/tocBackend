import { conexion } from "../conexion/mongodb";
import { TiposIvaFormat, TiposIvaInterface } from "./tiposIva.interface";

export async function getTypesOfIVA(): Promise<TiposIvaFormat[]> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection<TiposIvaInterface>("tiposIVA");
  const result = await parametros.findOne({ _id: "IVA" });

  // Verificar si el documento existe
  if (!result || !result.tiposIVA) {
    return [];
  }

  return result.tiposIVA;

}

export async function setTypesOfIVA(ivas: TiposIvaFormat[]): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const tiposIVA = database.collection<TiposIvaInterface>("tiposIVA");
  return (
    await tiposIVA.updateOne(
      { _id: "IVA" },
      { $set: { tiposIVA: ivas } },
      { upsert: true }
    )
  ).acknowledged;
}
