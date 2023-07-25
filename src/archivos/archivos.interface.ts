import { ObjectId } from "mongodb";

export interface archivosInterface {
  _id?: ObjectId; // id de mongo
  timestamp: number; // fecha
  tipo: string; // tipo de archivo. EJ: "logo"
  extension: string; // extension del archivo. EJ: "png"
  archivo: string; // archivo en hexadecimal
}
