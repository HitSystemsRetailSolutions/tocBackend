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
export async function insertarArticulosNuevos(arrayArticulos: ArticulosInterface[]) {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection<ArticulosInterface>("articulos");
  const id = await articulos.findOne({}, { sort: { _id: -1 } });
  console.log("id >> "+id['_id'])
  arrayArticulos['_id'] = id['_id'] + 1;
  return (await articulos.insertMany(arrayArticulos)).acknowledged;
}

/* Eze 4.0 */
export async function insertarTeclasNuevos(arrayArticulos: ArticulosInterface[]) {
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

/* Eze 4.0 */
export async function getSuplementos(suplementos: ArticulosInterface[]) {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection<ArticulosInterface>("articulos");
  const suplementosData: ArticulosInterface[] = [];

  for (const i in suplementos) {
    const artSuplemento = await articulos.findOne({ _id: suplementos[i] });
    if (artSuplemento) suplementosData.push(artSuplemento);
  }
  return suplementosData;
}

/* uri */
export async function editarArticulo(id, nombre, precioBase, precioConIva,tipoIva,essumable) {
  const database = (await conexion).db('tocgame');
  const articulos = database.collection('articulos');
  const teclas = database.collection('teclas');
  await teclas.updateMany({idArticle: id}, {$set: {'nombreArticulo': nombre}}, {upsert: true});
  return await articulos.updateOne({_id: id}, {$set: {'nombre': nombre, 'precioBase': precioBase, 'precioConIva': precioConIva, 'tipoIva': tipoIva, 'esSumable':essumable}}, {upsert: true});
}

/* uri */
export async function MoverArticulo(id,posicion) {
  const database = (await conexion).db('tocgame');
  const teclas = database.collection('teclas');
  return await teclas.updateOne({idArticle: id}, {$set: {'pos': posicion, }}, {upsert: true});
}