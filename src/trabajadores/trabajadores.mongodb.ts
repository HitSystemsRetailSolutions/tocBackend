import { UtilesModule } from "../utiles/utiles.module";
import { conexion } from "../conexion/mongodb";
import {
  SincroFichajesInterface,
  TrabajadoresInterface,
} from "./trabajadores.interface";
import { CestasInterface } from "../cestas/cestas.interface";
import { ObjectId } from "mongodb";

/* Eze 4.0 */
export async function limpiezaFichajes(): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const fichajes = database.collection("sincro-fichajes");
  return (
    await fichajes.deleteMany({
      enviado: true,
      _id: { $lte: UtilesModule.restarDiasTimestamp(Date.now()) },
    })
  ).acknowledged;
}

/* Eze 4.0 */
export async function buscar(
  busqueda: string
): Promise<TrabajadoresInterface[]> {
  const database = (await conexion).db("tocgame");
  const trabajadores =
    database.collection<TrabajadoresInterface>("trabajadores");
  return await trabajadores
    .find(
      {
        fichado: { $ne: true },
        $or: [
          { nombre: { $regex: new RegExp(busqueda, "i") } },
          { nombreCorto: { $regex: new RegExp(busqueda, "i") } },
        ],
      },
      { limit: 4 }
    )
    .toArray();
}

/* Eze 4.0 */
export async function getTrabajador(
  idTrabajador: number
): Promise<TrabajadoresInterface> {
  const database = (await conexion).db("tocgame");
  const trabajadores =
    database.collection<TrabajadoresInterface>("trabajadores");
  return await trabajadores.findOne({
    _id: idTrabajador,
  });
}

/* Uri */
export async function removeActiveEmployers(): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const trabajadores =
    database.collection<TrabajadoresInterface>("trabajadores");
  let activos = await trabajadores.find({
    activo: true,
  });
  activos.forEach((trabajador) => {
    trabajadores.updateOne(
      { _id: trabajador._id },
      { $set: { activo: false } }
    );
  });
  return true;
}

/* Eze 4.0 */
export async function getTrabajadoresFichados(): Promise<
  TrabajadoresInterface[]
> {
  const database = (await conexion).db("tocgame");
  const trabajadores =
    database.collection<TrabajadoresInterface>("trabajadores");
  return await trabajadores.find({ fichado: true }).toArray();
}

/* Uri*/
export async function getTrabajadorFichados(
  trabajador
): Promise<TrabajadoresInterface[]> {
  const database = (await conexion).db("tocgame");
  const trabajadores =
    database.collection<TrabajadoresInterface>("trabajadores");
  return await trabajadores
    .find({ fichado: true, idTrabajador: trabajador })
    .toArray();
}

/* Eze 4.0 */
export async function getTrabajadoresDescansando(): Promise<
  TrabajadoresInterface[]
> {
  const database = (await conexion).db("tocgame");
  const trabajadores =
    database.collection<TrabajadoresInterface>("trabajadores");
  return await trabajadores.find({ descansando: true }).toArray();
}

/* Eze 4.0 */
export async function ficharTrabajador(idTrabajador: number): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const trabajadores = database.collection("trabajadores");
  return (
    await trabajadores.updateOne(
      { _id: idTrabajador },
      { $set: { fichado: true, descansando: false } }
    )
  ).acknowledged;
}

/* Uri */
export async function usarTrabajador(
  idTrabajador: number,
  inUse: boolean
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const trabajadores = database.collection("trabajadores");
  (
    await trabajadores.updateOne(
      { _id: idTrabajador },
      { $set: { activo: inUse } }
    )
  ).acknowledged;
  return true;
}

/* Uri */
export async function setTrabajadorActivo(id) {
  const database = (await conexion).db("tocgame");
  const trabajadores = database.collection("trabajadores");
  return (await trabajadores.updateOne({ _id: id }, { $set: { activo: true } }))
    .acknowledged;
}

/* Uri*/
export async function trabajadorActivo(
  trabajador: number
): Promise<TrabajadoresInterface> {
  const database = (await conexion).db("tocgame");
  const trabajadores =
    database.collection<TrabajadoresInterface>("trabajadores");
  return await trabajadores.findOne({ _id: trabajador });
}

/* Eze 4.0 */
export async function desficharTrabajador(
  idTrabajador: number
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const trabajadores = database.collection("trabajadores");
  return (
    await trabajadores.updateOne(
      { _id: idTrabajador },
      { $set: { fichado: false } }
    )
  ).acknowledged;
}

/* Eze 4.0 */
export async function inicioDescanso(idTrabajador: number): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const trabajadores = database.collection("trabajadores");
  return (
    await trabajadores.updateOne(
      { _id: idTrabajador },
      { $set: { fichado: false, descansando: true } }
    )
  ).acknowledged;
}

/* Eze 4.0 */
export async function finalDescanso(idTrabajador: number): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const trabajadores = database.collection("trabajadores");
  return (
    await trabajadores.updateOne(
      { _id: idTrabajador },
      { $set: { fichado: true, descansando: false } }
    )
  ).acknowledged;
}

/* Eze 4.0 */
export async function insertNuevoFichaje(data): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const sincrofichajes = database.collection("sincro-fichajes");
  return (await sincrofichajes.insertOne(data)).acknowledged;
}

/* Eze 4.0 */
export async function borrarTrabajadores(): Promise<void> {
  const database = (await conexion).db("tocgame");
  const collectionList = await database.listCollections().toArray();
  for (let i = 0; i < collectionList.length; i++) {
    if (collectionList[i].name === "trabajadores") {
      await database.collection("trabajadores").drop();
      break;
    }
  }
}

/* Eze 4.0 */
export async function insertarTrabajadores(
  arrayTrabajadores: TrabajadoresInterface[]
): Promise<boolean> {
  await borrarTrabajadores();
  const database = (await conexion).db("tocgame");
  const trabajadores =
    database.collection<TrabajadoresInterface>("trabajadores");
  return (await trabajadores.insertMany(arrayTrabajadores)).acknowledged;
}

/* Eze 4.0 */
export async function getFichajeMasAntiguo(): Promise<SincroFichajesInterface> {
  const database = (await conexion).db("tocgame");
  const sincroFichajes =
    database.collection<SincroFichajesInterface>("sincro-fichajes");
  return await sincroFichajes.findOne({ enviado: false }, { sort: { _id: 1 } });
}

/* Eze 4.0 */
export async function actualizarEstadoFichaje(
  fichaje: SincroFichajesInterface
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const sincroFichajes = database.collection("sincro-fichajes");
  return (
    await sincroFichajes.updateOne(
      { _id: fichaje._id },
      {
        $set: {
          enviado: fichaje.enviado,
        },
      }
    )
  ).acknowledged;
}

/* Eze 4.0 */
export async function setIdCestaTrabajador(
  idTrabajador: TrabajadoresInterface["_id"],
  idCesta: CestasInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const trabajadores =
    database.collection<TrabajadoresInterface>("trabajadores");
  const resultado = await trabajadores.updateOne(
    { _id: idTrabajador },
    {
      $set: {
        idCesta: new ObjectId(idCesta),
      },
    }
  );
  return resultado.acknowledged && resultado.modifiedCount > 0;
}
