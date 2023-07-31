import { ArticulosInterface } from "../articulos/articulos.interface";
import { ClientesInterface } from "../clientes/clientes.interface";
import { conexion } from "../conexion/mongodb";
import { TarifaInterface } from "./tarifas.interface";

/* Eze 4.0 */
export async function insertarTarifas(
  arrayTarifas: TarifaInterface[]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const tarifas = database.collection<TarifaInterface>("tarifas");
  return (await tarifas.insertMany(arrayTarifas)).acknowledged;
}

/* Eze 4.0 */
export async function getItemTarifa(
  idArticulo: ArticulosInterface["_id"],
  idCliente: ClientesInterface["id"]
): Promise<TarifaInterface> {
  const database = (await conexion).db("tocgame");
  const tarifas = database.collection<TarifaInterface>("tarifas");
  return await tarifas.findOne({ idArticulo, idClienteFinal: idCliente });
}

/* Eze 4.0 */
export async function borrarTarifas(): Promise<void> {
  const database = (await conexion).db("tocgame");
  const collectionList = await database.listCollections().toArray();
  for (let i = 0; i < collectionList.length; i++) {
    if (collectionList[i].name === "tarifas") {
      await database.collection("tarifas").drop();
      break;
    }
  }
}

/* Eze 4.0 */
export async function tieneTarifaEspecial(
  idCliente: ClientesInterface["id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const tarifas = database.collection<TarifaInterface>("tarifas");
  return (await tarifas.findOne({ idClienteFinal: idCliente })) ? true : false;
}

/* Uri */
export async function tarifasMesas(
  idArticulo: TarifaInterface["idArticulo"]
): Promise<any> {
  const database = (await conexion).db("tocgame");
  const tarifas = database.collection<TarifaInterface>("tarifas");
  return await tarifas.findOne({
    idArticulo: idArticulo,
    idClienteFinal: "mesas",
  });
}

/* Uri */
export async function tarifasMenu(
  idArticulo: TarifaInterface["idArticulo"],
  menu
): Promise<any> {
  const database = (await conexion).db("tocgame");
  const tarifas = database.collection<TarifaInterface>("tarifas");
  return await tarifas.findOne({
    idArticulo: idArticulo,
    idClienteFinal: menu,
  });
}
/* Uri */
export async function getAllTarifas(): Promise<any> {
  const database = (await conexion).db("tocgame");
  const tarifas = database.collection<TarifaInterface>("tarifas");
  return await tarifas.find({}).toArray();
}
