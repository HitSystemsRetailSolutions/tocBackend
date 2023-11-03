import { ObjectId } from "mongodb";

export interface CajaAbiertaInterface {
  inicioTime: number;
  idDependientaApertura: number;
  totalApertura: number;
  detalleApertura: DetalleMonedas;
  fichajes: number[];
  propina?: number;
}

export interface CajaCerradaInterface {
  finalTime: number;
  idDependientaCierre: number;
  totalCierre: number;
  descuadre: number;
  recaudado: number;
  nClientes: number;
  nClientesMesas: number;
  primerTicket: number;
  totalSalidas: number;
  totalEntradas: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalDatafono3G: number;
  totalHonei: number;
  propina: number;
  totalDeudas: number;
  cantidadPaytef: number;
  totalTicketDatafono3G: number;
  totalDeuda: number;
  totalTkrsSinExceso: number;
  totalTkrsConExceso: number;
  ultimoTicket: number;
  calaixFetZ: number;
  detalleCierre: DetalleMonedas;
  mediaTickets: number;
}

export interface CajaSincro {
  _id?: ObjectId;
  inicioTime: number;
  idDependientaApertura: number;
  totalApertura: number;
  detalleApertura: DetalleMonedas;
  fichajes: number[];
  finalTime: number;
  idDependientaCierre: number;
  totalCierre: number;
  descuadre: number;
  recaudado: number;
  nClientes: number;
  primerTicket: number;
  totalSalidas: number;
  totalEntradas: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalDatafono3G: number;
  totalDeudas: number;
  cantidadPaytef: number;
  totalDeuda: number;
  totalTkrsSinExceso: number;
  totalTkrsConExceso: number;
  ultimoTicket: number;
  calaixFetZ: number;
  detalleCierre: DetalleMonedas;
  mediaTickets: number;
  enviado: boolean;
}

export type TiposInfoMoneda = "CLAUSURA" | "APERTURA";

export interface MonedasInterface {
  _id: TiposInfoMoneda;
  array: number[];
}

export type DetalleMonedas = {
  _id: string;
  valor: number;
  unidades: number;
}[];
