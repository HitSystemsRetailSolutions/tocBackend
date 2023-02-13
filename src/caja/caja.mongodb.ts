import { UtilesModule } from "../utiles/utiles.module";
import { conexion } from "../conexion/mongodb";
import {
  CajaAbiertaInterface,
  CajaSincro,
  MonedasInterface,
  TiposInfoMoneda,
} from "./caja.interface";
import { logger } from "../logger";

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
  tipo: TiposInfoMoneda
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const infoMonedas = database.collection<MonedasInterface>("infoMonedas");
  const resultado = await infoMonedas.updateOne(
    { _id: tipo },
    { $set: { array: arrayMonedas } },
    { upsert: true }
  );
  return resultado.acknowledged;
}

export async function getCambioDeTurno() {
  const database = (await conexion).db('tocgame');
  const caja = database.collection('cambioDeTurno');

  const resultado = await  caja.drop();
  return resultado;

  
}

export async function getAnularTurno() {

  const database = (await conexion).db('tocgame');
  const caja = database.collection('cambioDeTurno');
 

  const tiempoTranscurrido = new Date();
  const fecha = tiempoTranscurrido.toLocaleDateString('es-ES');
  const hora =tiempoTranscurrido.toLocaleTimeString('es-ES');
  const resultado = await  caja.insertOne({"fecha":fecha,"hora":hora,"time":Date.now()});
  // la linea de codigo de abajo iria en otra funcion para
  // comprobar si el cambio de turno es de hoy o no:

  // const fecha = tiempoTranscurrido.toLocaleDateString('es-ES');
  // const buscar= await caja.findOne({fecha:fecha});
  // console.log(buscar);
 
  // if (buscar!=null) {
  //   return true;
  // } else {
  //   return false;
  // }
 
  return resultado;

}

export async function getComprovarTurno() {

  const database = (await conexion).db('tocgame');
  const caja = database.collection('cambioDeTurno');
 

  const tiempoTranscurrido = new Date();
 
  // la linea de codigo de abajo iria en otra funcion para
  // comprobar si el cambio de turno es de hoy o no:

  const fecha = tiempoTranscurrido.toLocaleDateString('es-ES');
  const buscar= await caja.findOne({fecha:fecha});
 
  if (buscar!=null) {
    const res=await caja.find().sort({ _id: -1 }).limit(1).toArray();
    return {estado:true,time:res[0].time};
  } else {
    return {estado:false,time:null};
  }

}

/* Eze 4.0 */
export async function getUltimoCierre(): Promise<CajaSincro> {
  const database = (await conexion).db("tocgame");
  const sincroCajas = database.collection<CajaSincro>("sincro-cajas");
  const res=await sincroCajas.find().sort({ _id: -1 }).limit(1).toArray();
  return res[0];
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
  const resultado = await caja.updateMany({}, { $set: data }, { upsert: true });
  return (
    resultado.acknowledged &&
    (resultado.modifiedCount > 0 || resultado.upsertedCount > 0)
  );
}

/* Eze 4.0 (No se usa, pero aquí está) */
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
