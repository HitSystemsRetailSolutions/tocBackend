import { conexion } from "../conexion/mongodb";
import { AlbaranesInterface } from "./albaranes.interface";

export async function setAlbaran(albaran) {
  const database = (await conexion).db("tocgame");
  const albaranes = database.collection<AlbaranesInterface>("albaranes");
  // insertar ticket
  return (await albaranes.insertOne(albaran)).acknowledged;
}
export async function getAlbaranes(): Promise<AlbaranesInterface[]> {
  const database = (await conexion).db("tocgame");
  const albaranes = database.collection<AlbaranesInterface>("albaranes");
  return await albaranes.find({ estado: "PAGADO" }).toArray();
}
export async function getUltimoAlbaran(): Promise<AlbaranesInterface> {
  const database = (await conexion).db("tocgame");
  const albaranes = database.collection<AlbaranesInterface>("albaranes");
  return await albaranes.findOne({}, { sort: { _id: -1 } });
}

export async function getAlbaranCreadoMasAntiguo(): Promise<AlbaranesInterface> {
  const database = (await conexion).db("tocgame");
  const albaranes = database.collection<AlbaranesInterface>("albaranes");
  return (await albaranes.findOne(
    { enviado: false },
    { sort: { _id: 1 } }
  )) as AlbaranesInterface;
}

export async function setAlbaranEnviado(
  idAlbaran: AlbaranesInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const albaranes = database.collection<AlbaranesInterface>("albaranes");
  return (
    await albaranes.updateOne(
      { _id: idAlbaran },
      {
        $set: {
          enviado: true,
        },
      }
    )
  ).acknowledged;
}

export async function pagarAlbaran(
  idAlbaran: AlbaranesInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const albaranes = database.collection<AlbaranesInterface>("albaranes");
  return (
    await albaranes.updateOne(
      { _id: idAlbaran },
      {
        $set: {
          estado: "PAGADO",
          finalizado: false,
        },
      }
    )
  ).acknowledged;
}

export async function setFinalizado(
  idAlbaran: AlbaranesInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const albaranes = database.collection<AlbaranesInterface>("albaranes");
  return (
    await albaranes.updateOne(
      { _id: idAlbaran },
      {
        $set: {
          finalizado: true,
        },
      }
    )
  ).acknowledged;
}

export async function getAlbaranById(idAlbaran: AlbaranesInterface["_id"]) {
  const database = (await conexion).db("tocgame");
  const albaranes = database.collection<AlbaranesInterface>("albaranes");
  return await albaranes.findOne({ _id: idAlbaran });
}
