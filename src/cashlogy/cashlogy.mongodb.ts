import { conexion } from "../conexion/mongodb";
import { logger } from "../logger";

/*
export async function loadProceso() {
    const database = (await conexion).db("tocgame");
    const collection = database.collection("cashlogy");
    return await collection.findOne({_id:"proceso"});
}

export async function saveProceso(proceso) {
    const database = (await conexion).db("tocgame");
    const collection = database.collection("cashlogy");
    await collection.updateOne({ _id:"proceso" }, { $set: proceso },{ "upsert":true });
}
*/
export async function loadGrupoProcesosDB() {
    const database = (await conexion).db("tocgame");
    const collection = database.collection("cashlogy");
    return await collection.findOne({_id:"grupo_procesos"});
}

export async function saveGrupoProcesosDB(grupo_procesos) {
    const database = (await conexion).db("tocgame");
    const collection = database.collection("cashlogy");
    if (grupo_procesos) {
        await collection.updateOne({ _id:"grupo_procesos" }, { $set: grupo_procesos },{ "upsert":true });
    } else {
        await collection.deleteMany({ _id:"grupo_procesos" });
    }
}

export async function loadFondoCajaDB() {
    const database = (await conexion).db("tocgame");
    const collection = database.collection("cashlogy");
    return await collection.findOne({_id:"fondoCaja"});
}

export async function saveFondoCajaDB(fondoCaja) {
    const database = (await conexion).db("tocgame");
    const collection = database.collection("cashlogy");
    await collection.updateOne({ _id:"fondoCaja" }, { $set: fondoCaja },{ "upsert":true });
}
