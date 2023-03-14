import { ObjectId } from "mongodb";

export interface MesaInterface {
  nombre: string;
  color: string;
  idCesta: ObjectId;
}

export interface ItemMesaCollection {
  _id: "MESAS";
  estructura: MesaInterface[];
}
