import { archivosInterface } from "./archivos.interface";
import { conexion } from "../conexion/mongodb";

export async function getArchivos(): Promise<archivosInterface[]> {
  return [];
}

export async function getArchivoByTipo(
  tipo: string
): Promise<archivosInterface> {
  const database = (await conexion).db("tocgame");
  const archivos = database.collection<archivosInterface>("archivos");

  return await archivos.findOne({ tipo: tipo });
}

export async function getLogo(): Promise<archivosInterface> {
  const database = (await conexion).db("tocgame");
  const archivos = database.collection<archivosInterface>("archivos");

  return await archivos.findOne({ tipo: "logo" });
}

export async function insertarArchivo(
  tipo: string,
  extension: string,
  archivo: string
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const archivos = database.collection<archivosInterface>("archivos");

  const resp = await archivos.insertOne({
    timestamp: Date.now(),
    tipo: tipo,
    extension: extension,
    archivo: archivo,
  });

  return resp.acknowledged;
}
