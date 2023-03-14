import { MonedasInterface } from "../caja/caja.interface";
import { conexion } from "../conexion/mongodb";
import { logger } from "../logger";

export async function setMonedas(
  data: MonedasInterface["array"]
): Promise<boolean> {
  try {
    const database = (await conexion).db("tocgame");
    const monedas = database.collection("monedas");
    const resultado = await monedas.replaceOne(
      { _id: "INFO_MONEDAS" },
      { data },
      { upsert: true }
    );
    return (
      resultado.acknowledged &&
      (resultado.modifiedCount > 0 || resultado.upsertedCount > 0)
    );
  } catch (err) {
    logger.Error(97, err);
    return false;
  }
}
