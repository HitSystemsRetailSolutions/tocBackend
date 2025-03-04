import { TeclasInterface } from "src/teclado/teclado.interface";
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

/* Uri */
export async function getArticulos(): Promise<ArticulosInterface[]> {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection<ArticulosInterface>("articulos");
  return await articulos.find({}).toArray();
}

/* Eze 4.0 */
export async function insertarArticulos(arrayArticulos: ArticulosInterface[]) {
  try {
    await borrarArticulos();
    const database = (await conexion).db("tocgame");
    const articulos = database.collection<ArticulosInterface>("articulos");
    const result = await articulos.insertMany(arrayArticulos);

    if (!result.acknowledged) throw new Error("Error en insertarArticulos");
    return result.acknowledged;

  } catch (error) {
    console.log("Error en insertarArticulos:", error);
    throw error;
  }
}

/* Eze 4.0 */
export async function insertarArticulosNuevos(
  nombreArticulo,
  precioConIva,
  tipoIva,
  esSumable,
  menus,
  precioBase,
  posicion
): Promise<number> {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection<ArticulosInterface>("articulos");
  const id = await articulos.findOne({}, { sort: { _id: -1 } });
  let valors: ArticulosInterface[] = [
    {
      nombre: nombreArticulo,
      precioConIva: precioConIva,
      tipoIva: tipoIva,
      esSumable: esSumable,
      familia: menus,
      puntos: null,
      precioBase: Math.round(precioBase * 100) / 100,
      impresora: null,
      _id: id["_id"] + 1,
      suplementos: null,
      pare: null,
    },
  ];
  await insertarTeclasNuevos(
    menus,
    esSumable,
    nombreArticulo,
    id["_id"] + 1,
    posicion,
    precioConIva,
    precioBase
  );
  if ((await articulos.insertMany(valors)).acknowledged) return id["_id"] + 1;
  return -1;
}

/* Eze 4.0 */
export async function insertarTeclasNuevos(
  menu,
  esSumable,
  Nombre,
  idArt,
  pos,
  preuIva,
  preuBase
) {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection<TeclasInterface>("teclas");
  const id = await articulos.findOne({}, { sort: { _id: -1 } });
  let valors: TeclasInterface[] = [
    {
      nomMenu: menu,
      idArticle: idArt,
      nombreArticulo: Nombre,
      pos: pos,
      color: 16769279,
      esSumable: esSumable,
      precioConIva: preuIva,
      precioBase: Math.round(preuBase * 1000) / 1000,
    },
  ];
  return await articulos.insertMany(valors);
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
export async function buscar(
  busqueda: string,
  familia: string,
  limit: number
): Promise<ArticulosInterface[]> {
  if (familia.toLocaleLowerCase() === "todos") familia = "";
  const database = (await conexion).db("tocgame");
  const articulos = database.collection<ArticulosInterface>("articulos");
  var articles: ArticulosInterface[] = await articulos
    .find(
      {
        nombre: { $regex: new RegExp(busqueda, "i") },
        familia: { $regex: new RegExp(familia, "i") },
      },
      { limit: limit }
    )
    .toArray();
  return articles;
}

export async function getFamilies() {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection<ArticulosInterface>("articulos");
  var articles: ArticulosInterface[] = await articulos.find().toArray();
  let familias = [{ text: "TODOS", value: "Todos" }];
  for (const x of articles) {
    if (familias.find((f) => f.text === x.familia)) continue;
    familias.push({ text: x.familia, value: x.familia });
  }
  return familias;
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
export async function editarArticulo(
  id,
  nombre,
  precioBase,
  precioConIva,
  tipoIva,
  essumable
) {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection("articulos");
  const teclas = database.collection("teclas");
  await teclas.updateMany(
    { idArticle: id },
    { $set: { nombreArticulo: nombre, esSumable: essumable } },
    { upsert: true }
  );
  return await articulos.updateOne(
    { _id: id },
    {
      $set: {
        nombre: nombre,
        precioBase: precioBase,
        precioConIva: precioConIva,
        tipoIva: tipoIva,
        esSumable: essumable,
      },
    },
    { upsert: true }
  );
}

/* uri */
export async function MoverArticulo(id, posicion, menu) {
  const database = (await conexion).db("tocgame");
  const teclas = database.collection("teclas");
  return await teclas.updateOne(
    { idArticle: id },
    { $set: { pos: posicion, nomMenu: menu } },
    { upsert: true }
  );
}

/* uri */
export async function eliminarArticulo(id) {
  const database = (await conexion).db("tocgame");
  const teclas = database.collection("teclas");
  return await teclas.deleteOne({ idArticle: id });
}
