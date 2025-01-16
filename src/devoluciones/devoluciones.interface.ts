import { ObjectId } from "mongodb";
import { CestasInterface } from "../cestas/cestas.interface";
import { VersionInterface } from "src/version/version.interface";

export interface DevolucionesInterface extends VersionInterface {
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
