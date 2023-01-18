import { conexion } from "../conexion/mongodb";
import { ArticulosInterface } from "./articulos.interface";

/* Eze 4.0 */
export async function getInfoArticulo(
  idArticulo: ArticulosInterface["_id"]
): Promise<ArticulosInterface> {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection<ArticulosInterface>("articulos");
  return await articulos.findOne({ _id: idArticulo });
}

/* Eze 4.0 */
export async function insertarArticulos(arrayArticulos: ArticulosInterface[]) {
  await borrarArticulos();
  const database = (await conexion).db("tocgame");
  const articulos = database.collection<ArticulosInterface>("articulos");
  return (await articulos.insertMany(arrayArticulos)).acknowledged;
}

/* Eze 4.0 */
export async function borrarArticulos(): Promise<void> {
  const database = (await conexion).db("tocgame");
  const collectionList = await database.listCollections().toArray();
  for (let i = 0; i < collectionList.length; i++) {
    if (collectionList[i].name === "articulos") {
      await database.collection("articulos").drop();
    }
  }
}

/* Eze 4.0 */
export async function buscar(busqueda: string): Promise<ArticulosInterface[]> {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection<ArticulosInterface>("articulos");
  return await articulos
    .find(
      {
        nombre: { $regex: new RegExp(busqueda, "i") },
      },
      { limit: 20 }
    )
    .toArray();
}

export async function getSuplementos(suplementos) {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection("articulos");
  const suplementosData = [];
  for (const i in suplementos) {
    const resultado = await (
      await articulos.find({ _id: suplementos[i] })
    ).toArray();
    suplementosData.push(resultado[0]);
  }
  return suplementosData;
}
