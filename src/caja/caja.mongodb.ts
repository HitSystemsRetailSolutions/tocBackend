import { UtilesModule } from "../utiles/utiles.module";
import { conexion } from "../conexion/mongodb";
import {
  CajaAbiertaInterface,
  CajaCerradaInterface,
  CajaSincro,
  MonedasInterface,
  TiposInfoMoneda,
} from "./caja.interface";
import { logger } from "../logger";
import { MatchKeysAndValues } from "mongodb";

/* Eze 4.0 */
export async function getInfoCajaAbierta(): Promise<CajaAbiertaInterface> {
  const database = (await conexion).db("tocgame");
  const caja = database.collection<CajaAbiertaInterface>("caja");
  return await caja.findOne();
}

/* Eze 4.0 */
export async function resetCajaAbierta(): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const caja = database.collection<CajaAbiertaInterface>("caja");
  return (
    await caja.updateMany(
      {},
      {
        $set: {
          inicioTime: null,
          idDependientaApertura: null,
          totalApertura: null,
          detalleApertura: null,
          fichajes: null,
          propina: 0,
          detalleActual: null,
          cambioEmergenciaActual: 0,
          cambioEmergenciaApertura: 0,
        },
      }
    )
  ).acknowledged;
}

/* Eze 4.0 - Excepción */
export async function limpiezaCajas(): Promise<boolean> {
  try {
    const database = (await conexion).db("tocgame");
    const sincroCajas = database.collection("sincro-cajas");
    return (
      await sincroCajas.deleteMany({
        enviado: true,
        _id: { $lte: UtilesModule.restarDiasTimestamp(Date.now()) },
      })
    ).acknowledged;
  } catch (err) {
    logger.Error(56, err);
    return false;
  }
}

/* Eze 4.0 */
export async function guardarMonedas(
  arrayMonedas: MonedasInterface["array"],
  cambioEmergencia: CajaCerradaInterface["cambioEmergenciaCierre"],
  tipo: TiposInfoMoneda
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const infoMonedas = database.collection<MonedasInterface>("infoMonedas");
  const resultado = await infoMonedas.updateOne(
    { _id: tipo },
    { $set: { array: arrayMonedas, cambioEmergencia: cambioEmergencia } },
    { upsert: true }
  );
  return resultado.acknowledged;
}

export async function getCambioDeTurno() {
  const database = (await conexion).db("tocgame");
  const caja = database.collection("cambioDeTurno");

  const resultado = await caja.drop();
  return resultado;
}

export async function getAnularTurno() {
  const database = (await conexion).db("tocgame");
  const caja = database.collection("cambioDeTurno");

  const tiempoTranscurrido = new Date();
  const fecha = tiempoTranscurrido.toLocaleDateString("es-ES");
  const hora = tiempoTranscurrido.toLocaleTimeString("es-ES");
  const resultado = await caja.insertOne({
    fecha: fecha,
    hora: hora,
    time: Date.now(),
  });

  return resultado;
}

export async function getComprovarTurno() {
  const database = (await conexion).db("tocgame");
  const caja = database.collection("cambioDeTurno");

  const tiempoTranscurrido = new Date();

  // la linea de codigo de abajo iria en otra funcion para
  // comprobar si el cambio de turno es de hoy o no:

  const fecha = tiempoTranscurrido.toLocaleDateString("es-ES");
  const buscar = await caja.findOne({ fecha: fecha });

  if (buscar) {
    const res = await caja.find().sort({ _id: -1 }).limit(1).toArray();
    return { estado: true, time: res[0].time };
  } else {
    return { estado: false, time: null };
  }
}

/* Eze 4.0 */
export async function getUltimoCierre(): Promise<CajaSincro> {
  const database = (await conexion).db("tocgame");
  const sincroCajas = database.collection<CajaSincro>("sincro-cajas");
  const res = await sincroCajas.find().sort({ _id: -1 }).limit(1).toArray();
  return res[0];
}

/* Eze 4.0 */
export async function getApeturaCaja(): Promise<CajaAbiertaInterface> {
  const database = (await conexion).db("tocgame");
  const caja = database.collection<CajaAbiertaInterface>("caja");
  const res = await caja.find().sort({ _id: -1 }).limit(1).toArray();
  return res[0];
}

/* Yasai :D */
export async function aumentarPropina(propina: number) {
  const database = (await conexion).db("tocgame");
  const caja = database.collection("caja");
  const resultado = await caja.updateOne(
    {},
    {
      $inc: {
        propina: propina,
      },
    }
  );
  return resultado.acknowledged;
}

/* Yasai :D */
export async function getPropina(): Promise<number> {
  const database = (await conexion).db("tocgame");
  const caja = database.collection("caja");
  const resultado = await caja.findOne();
  return resultado.propina;
}

/* Eze 4.0 */
export async function getMonedas(
  tipo: TiposInfoMoneda
): Promise<MonedasInterface> {
  const database = (await conexion).db("tocgame");
  const infoMonedas = database.collection<MonedasInterface>("infoMonedas");
  return await infoMonedas.findOne({ _id: tipo });
}

/* Eze 4.0 */
export async function setInfoCaja(data: CajaAbiertaInterface) {
  const database = (await conexion).db("tocgame");
  const caja = database.collection<CajaAbiertaInterface>("caja");
  // Obtener la propina actual
  const propinaActual = await caja.findOne({}, { projection: { propina: 1 } });

  // Verificar si la propina actual es mayor a 0
  const actualizarPropina =
    propinaActual && "propina" in propinaActual && propinaActual.propina > 0;

  // Si la propina actual es mayor a 0, no se actualiza
  if (actualizarPropina) {
    data.propina = propinaActual.propina;
  }

  // Actualizar la colección
  const resultado = await caja.updateMany({}, { $set: data as MatchKeysAndValues<CajaAbiertaInterface> }, { upsert: true });
  return (
    resultado.acknowledged &&
    (resultado.modifiedCount > 0 || resultado.upsertedCount > 0)
  );
}

/* Eze 4.0 */
export async function borrarCaja(): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const collectionList = await database.listCollections().toArray();
  for (let i = 0; i < collectionList.length; i++) {
    if (collectionList[i].name === "caja") {
      await database.collection("caja").drop();
      break;
    }
  }
  return true;
}

/* Eze 4.0 */
export async function nuevoItemSincroCajas(caja: CajaSincro): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const sincroCajas = database.collection("sincro-cajas");
  return (await sincroCajas.insertOne(caja)).acknowledged;
}

/* Eze 4.0 */
export async function confirmarCajaEnviada(
  idCaja: CajaSincro["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const sincroCajas = database.collection("sincro-cajas");
  const resultado = await sincroCajas.updateOne(
    { _id: idCaja },
    {
      $set: {
        enviado: true,
      },
    }
  );
  return resultado.acknowledged && resultado.modifiedCount > 0;
}

/* Eze 4.0 */
export async function getCajaSincroMasAntigua(): Promise<CajaSincro> {
  const database = (await conexion).db("tocgame");
  const sincroCajas = database.collection<CajaSincro>("sincro-cajas");
  return await sincroCajas.findOne(
    { enviado: false },
    { sort: { finalTime: 1 } }
  );
}

export async function postfichajesCaja(
  arrayFichados: CajaAbiertaInterface["fichajes"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const caja = database.collection("caja");
  return (
    await caja.updateMany(
      {},
      {
        $set: {
          fichajes: arrayFichados,
        },
      }
    )
  ).acknowledged;
}

export async function setCambioEmActual(valor: number): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const caja = database.collection("caja");
  return (
    await caja.updateOne(
      {},
      {
        $set: {
          cambioEmergenciaActual: valor,
        },
      }
    )
  ).acknowledged;
}

export async function getCambioEmActual(): Promise<number> {
  const database = (await conexion).db("tocgame");
  const caja = database.collection<CajaAbiertaInterface>("caja");
  const buscar = await caja.findOne();
  return buscar.cambioEmergenciaActual;
}

export async function setDetalleActual(detalleActual): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const caja = database.collection("caja");
  return (
    await caja.updateOne(
      {},
      {
        $set: {
          detalleActual: detalleActual,
        },
      }
    )
  ).acknowledged;
}

export async function getDetalleActual(): Promise<
  CajaAbiertaInterface["detalleActual"] | false
> {
  const database = (await conexion).db("tocgame");
  const caja = database.collection<CajaAbiertaInterface>("caja");
  const buscar = await caja.findOne();
  if (buscar && "detalleActual" in buscar) {
    return buscar.detalleActual;
  } else {
    // Devuelve false si no se encuentra el parámetro detalleActual
    return false;
  }
}
