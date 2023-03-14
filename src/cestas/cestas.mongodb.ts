import { ObjectId } from "mongodb";
import { conexion } from "../conexion/mongodb";
import { CestasInterface } from "./cestas.interface";

/* Eze 4.0 */
export async function getCestaById(
  idCesta: CestasInterface["_id"]
): Promise<CestasInterface> {
  const database = (await conexion).db("tocgame");
  const cesta = database.collection<CestasInterface>("cestas");
  return await cesta.findOne({ _id: new ObjectId(idCesta) });
}

/* Eze 4.0 */
export async function deleteCesta(
  idCesta: CestasInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const cesta = database.collection<CestasInterface>("cestas");
  const resultado = await cesta.deleteOne({ _id: new ObjectId(idCesta) });
  return resultado.acknowledged && resultado.deletedCount === 1;
}

/* Eze 4.0 */
export async function getAllCestas(): Promise<CestasInterface[]> {
  const database = (await conexion).db("tocgame");
  const cesta = database.collection<CestasInterface>("cestas");
  return await cesta.find().toArray();
}

/* Eze 4.0 */
export async function updateCesta(cesta: CestasInterface): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const unaCesta = database.collection<CestasInterface>("cestas");
  const resultado = await unaCesta.updateOne(
    { _id: new ObjectId(cesta._id) },
    {
      $set: {
        detalleIva: cesta.detalleIva,
        idCliente: cesta.idCliente,
        lista: cesta.lista,
        modo: cesta.modo,
        timestamp: cesta.timestamp,
        nombreCliente: cesta.nombreCliente,
      },
    }
  );
  return resultado.acknowledged && resultado.matchedCount === 1;
}

/* Eze 4.0 */
export async function vaciarCesta(
  idCesta: CestasInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const unaCesta = database.collection<CestasInterface>("cestas");
  const resultado = await unaCesta.updateOne(
    { _id: new ObjectId(idCesta) },
    {
      $set: {
        detalleIva: {
          base1: 0,
          base2: 0,
          base3: 0,
          base4: 0,
          base5: 0,
          valorIva1: 0,
          valorIva2: 0,
          valorIva3: 0,
          valorIva4: 0,
          valorIva5: 0,
          importe1: 0,
          importe2: 0,
          importe3: 0,
          importe4: 0,
          importe5: 0,
        },
        lista: [],
        idCliente: null,
        nombreCliente: null,
      },
    }
  );
  return resultado.acknowledged && resultado.matchedCount === 1;
}

/* Eze 4.0 */
export async function createCesta(cesta: CestasInterface): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const cestasColeccion = database.collection<CestasInterface>("cestas");
  return (await cestasColeccion.insertOne(cesta)).acknowledged;
}

export async function modificarNombreCesta(cestaId, miCesta) {
  const database = (await conexion).db("tocgame");
  const cestas = database.collection("cestas");
  const resultado = await cestas.updateOne(
    { _id: cestaId },
    { $set: { lista: miCesta } }
  );
  return resultado;
}
