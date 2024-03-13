import { UtilesModule } from "../utiles/utiles.module";
import { conexion } from "../conexion/mongodb";
import { TicketsInterface } from "../tickets/tickets.interface";
import { CajaAbiertaInterface } from "src/caja/caja.interface";
import { screenInfo } from "./pantallaManager.interface";

export async function setPantallas(pantallas: screenInfo[]): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection("parametros");
  return (
    await parametros.updateOne(
      { _id: "PARAMETROS" },
      { $set: { pantallas: pantallas } },
      { upsert: true }
    )
  ).acknowledged;
}

export async function getScreen(): Promise<screenInfo[]> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection("parametros");
  const res = (await parametros.findOne({ _id: "PARAMETROS" })) || null;
  return res.pantallas;
}
