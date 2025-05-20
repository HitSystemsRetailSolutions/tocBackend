import { UtilesModule } from "../utiles/utiles.module";
import { conexion } from "../conexion/mongodb";
import {
  SincroFichajesInterface,
  TrabajadoresInterface,
} from "./trabajadores.interface";
import { CestasInterface } from "../cestas/cestas.interface";
import { ObjectId } from "mongodb";
import { logger } from "src/logger";

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
export async function buscarSinFichar(
  busqueda: string
): Promise<TrabajadoresInterface[]> {
  const database = (await conexion).db("tocgame");
  const trabajadores =
    database.collection<TrabajadoresInterface>("trabajadores");
  return await trabajadores
    .find(
      {
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

const getTrabajadorByName = async (name: string): Promise<TrabajadoresInterface["_id"]> => {
  const database = (await conexion).db("tocgame");
  const trabajadores =
    database.collection<TrabajadoresInterface>("trabajadores");
  return (await trabajadores.findOne({
    nombre: name,
  }))._id;
}

export const getFichajesIntervalo = async (fechaInicio, fechaFin, trabajador): Promise<any> => {
  const database = (await conexion).db("tocgame");
  const trabajadores = database.collection<SincroFichajesInterface>("sincro-fichajes");
  let [fechaInicio_year, fechaInicio_month, fechaInicio_day] = fechaInicio.split("-");
  let [fechaFin_year, fechaFin_month, fechaFin_day] = fechaFin.split("-");
  const workers = await database.collection("sincro-fichajes").aggregate([
    {
      $match: {
        "infoFichaje.fecha.year": { $gte: parseInt(fechaInicio_year), $lte: parseInt(fechaFin_year) },
        "infoFichaje.fecha.month": { $gte: parseInt(fechaInicio_month), $lte: parseInt(fechaFin_month) },
        "infoFichaje.fecha.day": { $gte: parseInt(fechaInicio_day), $lte: parseInt(fechaFin_day) },
        "infoFichaje.idTrabajador": await getTrabajadorByName(trabajador)
      }
    },
    {
      $lookup: {
        from: "trabajadores", // Colección relacionada
        localField: "infoFichaje.idTrabajador", // Campo en `sincro-fichajes`
        foreignField: "idTrabajador", // Campo en `trabajadores`
        as: "trabajadorInfo" // Resultado de la unión
      }
    },
    {
      $project: {
        _id: 0, // Excluye el campo `_id` si no lo necesitas
        "infoFichaje.idTrabajador": 1,
        "infoFichaje.fecha": 1,
        "tipo": 1,
        "trabajadorInfo.nombreCorto": 1
      }
    }
  ]).toArray();
  return workers;
}

/* Eze 4.0 */
export async function getTrabajadoresFichados(): Promise<
  TrabajadoresInterface[]
> {
  const database = (await conexion).db("tocgame");
  const trabajadores =
    database.collection<TrabajadoresInterface>("trabajadores");
  return await trabajadores
    .find({ $or: [{ fichado: true }, { descansando: true }] })
    .toArray();
}

/* Uri*/
export async function getTrabajadorFichados(
  trabajador
): Promise<TrabajadoresInterface[]> {
  const database = (await conexion).db("tocgame");
  const trabajadores =
    database.collection<TrabajadoresInterface>("trabajadores");
  return await trabajadores
    .find({
      $or: [
        { fichado: true, idTrabajador: trabajador },
        { descansando: true, idTrabajador: trabajador },
      ],
    })
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
  try {
    const database = (await conexion).db("tocgame");
    const trabajadores = database.collection("trabajadores");

    const result = await trabajadores.updateOne(
      { _id: idTrabajador },
      { $set: { activo: inUse } }
    );

    if (result.acknowledged) {
      return true; // Si se modificó correctamente el documento
    } else {
      return false;
    }
  } catch (error) {
    logger.Error(132, "Error al actualizar el estado del trabajador: " + error);
    return false;
  }
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
      { $set: { fichado: false, descansando: true, activo: false } }
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

export async function getRol(
  idTrabajador: TrabajadoresInterface["_id"]
): Promise<string> {
  const database = (await conexion).db("tocgame");
  const trabajadores =
    database.collection<TrabajadoresInterface>("trabajadores");
  const res=await trabajadores.findOne({ _id: idTrabajador });
  return res.rol || null; // Devuelve la contraseña del trabajador
}
