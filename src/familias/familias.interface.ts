import { ObjectId } from "mongodb";

export interface FamiliasInterface {
  _id: ObjectId;
  nombre: string;
  padre: string;
}
