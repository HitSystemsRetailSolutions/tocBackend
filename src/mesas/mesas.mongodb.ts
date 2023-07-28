import { conexion } from "../conexion/mongodb";
import { MesaInterface, ItemMesaCollection } from "./mesas.interface";

export async function getMesas() {
  try {
    const db = (await conexion).db("tocgame");
    const mesasCollection = db.collection<ItemMesaCollection>("mesas");
    const resItemMesaCollection = await mesasCollection.findOne({
      _id: "MESAS",
    });
    if (resItemMesaCollection && resItemMesaCollection.estructura) {
      for (let i = 0; i < resItemMesaCollection.estructura.length; i++) {
        resItemMesaCollection.estructura[i]._id = i;
      }
      return resItemMesaCollection.estructura;
    }

    return null;
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function deleteMesas() {
  const db = (await conexion).db("tocgame");
  const collectionList = await db.listCollections().toArray();
  for (let i = 0; i < collectionList.length; i++) {
    if (collectionList[i].name === "mesas") {
      await db.collection("mesas").drop();
      break;
    }
  }
}

export async function insertMesas(arrayMesas: MesaInterface[]) {
  await deleteMesas();
  const db = (await conexion).db("tocgame");
  const mesasCollection = db.collection<ItemMesaCollection>("mesas");
  const resultado = await mesasCollection.replaceOne(
    { _id: "MESAS" },
    {
      _id: "MESAS",
      estructura: arrayMesas,
    },
    { upsert: true }
  );
  return (
    resultado.acknowledged &&
    (resultado.modifiedCount > 0 || resultado.upsertedCount > 0)
  );
}
