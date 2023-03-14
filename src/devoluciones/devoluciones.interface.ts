import { ObjectId } from "mongodb";
import { CestasInterface } from "../cestas/cestas.interface";

export interface DevolucionesInterface {
  _id: ObjectId;
  timestamp: number;
  total: number;
  cesta: CestasInterface;
  idTrabajador: number;
  cliente: {
    id: string;
    esVip: boolean;
    nif: string;
    nombre: string;
    cp: string;
    direccion: string;
    ciudad: string;
  };
  enviado: boolean;
}
