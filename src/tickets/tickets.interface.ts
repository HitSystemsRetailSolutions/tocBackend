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
  cesta: CestasInterface;
  idTrabajador: number;
  idCliente: ClientesInterface["id"];
  consumoPersonal?: boolean;
  enviado: boolean;
}

export interface TicketsInterfaceBackUp {
  _id: number;
  timestamp: number;
  total: number;
  idTrabajador: number;
  consumoPersonal?: boolean;
  enviado:boolean;
}

export interface SuperTicketInterface extends TicketsInterface {
  tipoPago: FormaPago;
  movimientos: MovimientosInterface[];
}
