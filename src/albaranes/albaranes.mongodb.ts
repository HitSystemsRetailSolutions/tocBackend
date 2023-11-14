import { conexion } from "../conexion/mongodb";
import { AlbaranesInterface } from "./albaranes.interface";

export async function setAlbaran(albaran) {
  const database = (await conexion).db("tocgame");
  const albaranes = database.collection<AlbaranesInterface>("albaranes");
  // insertar ticket
  return (await albaranes.insertOne(albaran)).acknowledged;
}
