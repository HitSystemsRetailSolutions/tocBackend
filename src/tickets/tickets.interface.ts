import { ClientesInterface } from "../clientes/clientes.interface";
import { CestasInterface } from "../cestas/cestas.interface";
import {
  FormaPago,
  MovimientosInterface,
} from "../movimientos/movimientos.interface";

export interface TicketsInterface {
  _id: number;
  timestamp: number;
  total: number;
  dejaCuenta?: number;
  datafono3G: boolean;
  paytef: boolean;
  cesta: CestasInterface;
  idTrabajador: number;
  idCliente: ClientesInterface["id"];
  consumoPersonal: boolean;
  anulado?: Anulado;
  enviado: boolean;
}
export interface Anulado {
  idTicketPositivo: number;
}
export interface TicketsInterfaceBackUp {
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
