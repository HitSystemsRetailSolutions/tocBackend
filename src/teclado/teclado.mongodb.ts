import { conexion } from "../conexion/mongodb";
import { TeclasInterface } from "./teclado.interface";

/* Eze 4.0 */
export async function insertarTeclas(
  arrayTeclas: TeclasInterface[]
): Promise<boolean> {
  try {
    await borrarArticulos();

    const database = (await conexion).db("tocgame");
    const teclas = database.collection<TeclasInterface>("teclas");
    const result = await teclas.insertMany(arrayTeclas);

    if (!result.acknowledged) throw new Error("Error en insertarTeclas");
    return result.acknowledged;
  } catch (error) {
    console.log("Error en insertarTeclas:", error);
    throw error;
  }
}

/* Eze 4.0 */
export async function borrarArticulos(): Promise<void> {
  const database = (await conexion).db("tocgame");
  const collectionlist = await database.listCollections().toArray();

  for (let i = 0; i < collectionlist.length; i++) {
    if (collectionlist[i].name === "teclas") {
      await database.collection("teclas").drop();
      break;
    }
  }
}

/* Eze 4.0 */
export async function getTeclas(): Promise<TeclasInterface[]> {
  const database = (await conexion).db("tocgame");
  const teclas = database.collection<TeclasInterface>("teclas");
  return await teclas.find().toArray();
}

export async function cambiarPosTecla(idArticle, nuevaPos, nombreMenu) {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection("teclas");
  const resultado = await articulos.updateOne(
    { idArticle: idArticle },
    { $set: { pos: nuevaPos, nomMenu: nombreMenu } }
  );
  return resultado;
}
