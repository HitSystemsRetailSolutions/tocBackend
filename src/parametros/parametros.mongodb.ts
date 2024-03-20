const moment = require("moment-timezone");

import { logger } from "../logger";
import { conexion } from "../conexion/mongodb";
import { ParametrosInterface } from "./parametros.interface";

/* Eze 4.0 */
export async function getParametros(): Promise<ParametrosInterface> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection<ParametrosInterface>("parametros");
  return await parametros.findOne({ _id: "PARAMETROS" });
}

/* Eze 4.0 */
export async function setParametros(
  params: ParametrosInterface
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection("parametros");
  await parametros.updateOne(
    { _id: "PARAMETROS" },
    {
      $unset: {
        BotonsPreu: "",
        EntrarCanviEnMonedes: "",
        JustificarAnul: "",
        NoEntradaDiners: "",
        ProhibirAnulacioTicket: "",
        ProhibirCercaArticles: "",
        SuperFidelitza: "",
        TriaTaula: "",
        PreuUnitari: "",
        prohibirAnular3g: "",
        verInformesVentas: "",
        prohibirAnularTkAlbaran: "",
      },
    }
  );
  return (
    await parametros.updateOne(
      { _id: "PARAMETROS" },
      { $set: params },
      { upsert: true }
    )
  ).acknowledged;
}

/* Eze 4.0 */
export async function setUltimoTicket(idTicket: number): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection("parametros");
  return (
    await parametros.updateOne(
      { _id: "PARAMETROS" },
      { $set: { ultimoTicket: idTicket } },
      { upsert: true }
    )
  ).acknowledged;
}

/* Uri */
/* Actualizacion: yasai :D */
export async function setIpPaytef(ip: string): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection("parametros");
  return (
    await parametros.updateOne(
      { _id: "PARAMETROS" },
      { $set: { ipTefpay: ip, tipoDatafono: "PAYTEF" } },
      { upsert: true }
    )
  ).acknowledged;
}

export async function setTcodPaytef(tcod: string): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection("parametros");
  return (
    await parametros.updateOne(
      { _id: "PARAMETROS" },
      { $set: { payteftcod: tcod } },
      { upsert: true }
    )
  ).acknowledged;
}

export async function totalPaytef(): Promise<number> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection<ParametrosInterface>("parametros");
  return (await parametros.findOne({ _id: "PARAMETROS" }))?.contadorPaytef;
}
export async function totalPaytefHour(): Promise<string> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection<ParametrosInterface>("parametros");
  return (await parametros.findOne({ _id: "PARAMETROS" }))?.contadorPaytefDate;
}

/* Uri */
export async function setContadoDatafono(
  tipo: number,
  suma: number
): Promise<boolean> {
  let valor = 0;
  switch (tipo) {
    case 1:
      valor = suma;
      break;
    default:
      valor = (await totalPaytef()) + suma;
      break;
  }
  const database = (await conexion).db("tocgame");
  const now = moment().format("YYYY-MM-DD HH:mm:ss");
  const parametros = database.collection("parametros");
  if (valor && now)
    logger.Info(
      991,
      "setContadoDatafono",
      `valor: ${valor}, fecha: ${now}`,
      "parametros.mongodb.ts",
      "setContadoDatafono"
    );
  return (
    await parametros.updateOne(
      { _id: "PARAMETROS" },
      { $set: { contadorPaytef: valor, contadorPaytefDate: now } },
      { upsert: true }
    )
  ).acknowledged;
}

/* yasai :D */
export async function set3G(): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection("parametros");
  return (
    await parametros.updateOne(
      { _id: "PARAMETROS" },
      { $set: { ipTefpay: "", tipoDatafono: "3G" } },
      { upsert: true }
    )
  ).acknowledged;
}

/* Eze 4.0 */
export async function actualizarPropiedad(params: any): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection("parametros");
  return (
    await parametros.updateOne({ _id: "PARAMETROS" }, { $set: { params } })
  ).acknowledged;
}
