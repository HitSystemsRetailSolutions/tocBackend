import { ObjectId } from "mongodb";
import { CestasInterface } from "src/cestas/cestas.interface";
import { VersionInterface } from "src/version/version.interface";

export interface DeudasInterface extends VersionInterface {
  _id: ObjectId | string;
  idTicket: string;
  idSql: string;
  timestamp: number;
  total: number;
  idTrabajador: string;
  nombreCliente: string;
  idCliente: string;
  cesta: CestasInterface;
  dejaCuenta: number;
  enviado?: boolean;
  finalizado?: boolean;
  estado: "SIN_PAGAR" | "PAGADO" | "ANULADO";
}
