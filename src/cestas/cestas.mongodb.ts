import { ObjectId } from "mongodb";
import { conexion } from "../conexion/mongodb";
import { CestasCombinadaInterface, CestasInterface } from "./cestas.interface";
import { nuevaInstancePromociones } from "src/promociones/promociones.clase";
import { TrabajadoresInterface } from "src/trabajadores/trabajadores.interface";
import { log } from "console";
import { logger } from "src/logger";

/* Eze 4.0 */
export async function getCestaById(
  idCesta: CestasInterface["_id"]
): Promise<CestasInterface> {
  const database = (await conexion).db("tocgame");
  const cesta = database.collection<CestasInterface>("cestas");
  return await cesta.findOne({ _id: new ObjectId(idCesta) });
}

export async function getCestaByMesa(
  mesa: CestasInterface["indexMesa"]
): Promise<CestasInterface> {
  const database = (await conexion).db("tocgame");
  const cesta = database.collection<CestasInterface>("cestas");
  return await cesta.findOne({ indexMesa: mesa });
}

/* Eze 4.0 */
export async function deleteCesta(
  trabajador: TrabajadoresInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const cesta = database.collection<CestasInterface>("cestas");
  const resultado = await cesta.deleteMany({
    trabajador: trabajador,
    indexMesa: null,
  });
  return resultado.acknowledged && resultado.deletedCount === 1;
}

/* Uri */
export async function deleteCestaMesa(
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
  return await cesta.find().sort({ indexMesa: 1 }).toArray();
}

/* Eze 4.0 */
export async function updateCesta(cesta: CestasInterface): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const unaCesta = database.collection<CestasInterface>("cestas");
  for (let i = 0; i < cesta.lista.length; i++) {
    nuevaInstancePromociones.redondearDecimales(cesta.lista[i].subtotal, 2);
  }

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
        albaran: cesta?.albaran,
        vip: cesta?.vip,
      },
    }
  );
  return resultado.acknowledged && resultado.matchedCount === 1;
}

export async function updateCestaCombinada(cesta: CestasCombinadaInterface): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const unaCesta = database.collection<CestasCombinadaInterface>("cestas");
  for (let i = 0; i < cesta.lista.length; i++) {
    nuevaInstancePromociones.redondearDecimales(cesta.lista[i].subtotal, 2);
  }

  const resultado = await unaCesta.updateOne(
    { _id: new ObjectId(cesta._id) },
    {
      $set: {
        detalleIva: cesta.detalleIva,
        detalleIvaDeudas: cesta.detalleIvaDeudas,
        detalleIvaTickets: cesta.detalleIvaTickets,
        idCliente: cesta.idCliente,
        lista: cesta.lista,
        listaDeudas: cesta.listaDeudas,
        modo: cesta.modo,
        timestamp: cesta.timestamp,
        nombreCliente: cesta.nombreCliente,
        albaran: cesta?.albaran,
        vip: cesta?.vip,
      },
    }
  );
  return resultado.acknowledged && resultado.matchedCount === 1;
}

/* Uri */
export async function eliminarTrabajadorDeCesta(trabajador): Promise<boolean> {
  try {
    const database = (await conexion).db("tocgame");
    const unaCesta = database.collection<CestasInterface>("cestas");
    let trabajadoresEnCesta = await unaCesta.findOne({
      trabajadores: trabajador,
    });
    let trab = trabajadoresEnCesta.trabajadores;
    for (let i = 0; i < trab.length; i++) {
      if (trabajadoresEnCesta.trabajadores[i] == trabajador) trab.splice(i, 1);
    }
    await unaCesta.updateOne(
      { _id: new ObjectId(trabajadoresEnCesta._id) },
      {
        $set: {
          trabajadores: trab,
        },
      }
    );
    return true;
  } catch (e) {
    return false;
  }
}

/* Uri */
export async function trabajadorEnCesta(idcesta, trabajador): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const unaCesta = database.collection<CestasInterface>("cestas");
  await eliminarTrabajadorDeCesta(trabajador);
  let trabajadoresEnCesta = await unaCesta.findOne({
    _id: new ObjectId(idcesta),
  });
  let x = trabajadoresEnCesta?.trabajadores;
  if (x == undefined) x = [];
  x.push(trabajador);
  const resultado = await unaCesta.updateOne(
    { _id: new ObjectId(idcesta) },
    {
      $set: {
        trabajadores: x,
      },
    }
  );
  return resultado.acknowledged;
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

/* Uri */
export async function haveCesta(trabajador: number) {
  const database = (await conexion).db("tocgame");
  const cestasColeccion = database.collection<CestasInterface>("cestas");
  return (await cestasColeccion.findOne({ trabajador: trabajador }))
    ?.trabajador == undefined
    ? false
    : true;
}

/* Eze 4.0 */
export async function createCesta(cesta: CestasInterface): Promise<boolean> {
  if ((await haveCesta(cesta?.trabajador)) && cesta.modo != "DEVOLUCION")
    return;
  const database = (await conexion).db("tocgame");
  const cestasColeccion = database.collection<CestasInterface>("cestas");
  return (await cestasColeccion.insertOne(cesta)).acknowledged;
}

export async function setClients(
  clients: CestasInterface["comensales"],
  cestaId: CestasInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const cestas = database.collection("cestas");
  const resultado = await cestas.updateOne(
    { _id: new ObjectId(cestaId) },
    { $set: { comensales: clients } }
  );
  return true;
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

export async function findCestaDevolucion(
  idTrabajador: CestasInterface["trabajador"]
) {
  const database = (await conexion).db("tocgame");
  const cestas = database.collection<CestasInterface>("cestas");
  const resultado = await cestas.findOne({
    trabajador: idTrabajador,
    modo: "DEVOLUCION",
  });
  return resultado;
}

export async function borrarCestas() {
  try {
    const database = (await conexion).db("tocgame");
    const cestas = database.collection<CestasInterface>("cestas");
    const resultado = await cestas.deleteMany({
      indexMesa: null,
    });
    return resultado.acknowledged;
  } catch (error) {
    logger.Error('777', error);
  }
}
