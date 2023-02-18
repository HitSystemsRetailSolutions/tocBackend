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
  await parametros.updateOne({_id: "PARAMETROS"},{$unset: {BotonsPreu:"",
    EntrarCanviEnMonedes:"",
    JustificarAnul:"",
    NoEntradaDiners:"",
    ProhibirAnulacioTicket:"",
    ProhibirCercaArticles:"",
    SuperFidelitza:"",
    TriaTaula:""}});
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

/* Eze 4.0 */
export async function setVidAndPid(vid: string, pid: string): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection("parametros");
  return (
    await parametros.updateOne(
      { _id: "PARAMETROS" },
      {
        $set: {
          impresoraUsbInfo: { vid: vid, pid: pid },
          tipoImpresora: "USB",
        },
      },
      { upsert: true }
    )
  ).acknowledged;
}

/* Eze 4.0 */
export async function setIpPaytef(ip: string): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection("parametros");
  return (
    await parametros.updateOne(
      { _id: "PARAMETROS" },
      { $set: { ipTefpay: ip } },
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

/* Eze 4.0 */
export async function setTipoImpresora(
  tipo: ParametrosInterface["tipoImpresora"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection("parametros");
  return (
    await parametros.updateOne(
      { _id: "PARAMETROS" },
      { $set: { tipoImpresora: tipo } },
      { upsert: true }
    )
  ).acknowledged;
}

export async function setVisor(
  tipo: ParametrosInterface["visor"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const parametros = database.collection("parametros");
  return (
    await parametros.updateOne(
      { _id: "PARAMETROS" },
      { $set: { visor: tipo } },
      { upsert: true }
    )
  ).acknowledged;
}
