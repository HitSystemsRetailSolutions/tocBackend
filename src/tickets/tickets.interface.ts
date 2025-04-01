import { ClientesInterface } from "../clientes/clientes.interface";
import { CestasInterface } from "../cestas/cestas.interface";
import {
  FormaPago,
  MovimientosInterface,
} from "../movimientos/movimientos.interface";
import { VersionInterface } from "src/version/version.interface";

export interface TicketsInterface extends VersionInterface{
  _id: number;
  timestamp: number;
  total: number;
  dejaCuenta?: number;
  datafono3G?: boolean;
  honei?: boolean;
  tkrs?: boolean;
  paytef?: boolean;
  cesta: CestasInterface;
  idTrabajador: number;
  idCliente: ClientesInterface["id"];
  consumoPersonal: boolean;
  anulado?: Anulado;
  imprimir?: boolean;
  restante?: number;
  enviado: boolean;
  otrosModificado?: boolean;
  justificacion?: string;
}
export interface Anulado {
  idTicketPositivo: number;
}
export interface TicketsInterfaceBackUp extends VersionInterface{
  _id: number;
  timestamp: number;
  total: number;
  idTrabajador: number;
  consumoPersonal?: boolean;
  idCliente: ClientesInterface["id"];
  enviado: boolean;
}

export interface SuperTicketInterface extends TicketsInterface {
  tipoPago: FormaPago;
  movimientos: MovimientosInterface[];
}
