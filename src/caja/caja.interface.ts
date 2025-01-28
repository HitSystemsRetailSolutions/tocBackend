import { ObjectId } from "mongodb";
import { VersionInterface } from "src/version/version.interface";

export interface CajaAbiertaInterface {
  _id?: ObjectId;
  inicioTime: number;
  idDependientaApertura: number;
  totalApertura: number;
  detalleApertura: DetalleMonedas;
  detalleActual?: DetalleMonedas;
  cambioEmergenciaApertura: number;
  cambioEmergenciaActual: number;
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
  cantidadLocal3G: number;
  totalHonei: number;
  propina: number;
  totalAlbaranes: number;
  totalDeudas: number;
  cantidadPaytef: number;
  totalLocalPaytef: number;
  totalDeuda: number;
  totalTkrsSinExceso: number;
  totalTkrsConExceso: number;
  ultimoTicket: number;
  calaixFetZ: number;
  detalleCierre: DetalleMonedas;
  mediaTickets: number;
  cambioEmergenciaCierre: number;
  motivoDescuadre?: string;
}

export interface CajaSincro extends VersionInterface{
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
  nClientesMesas: number;
  primerTicket: number;
  totalSalidas: number;
  totalEntradas: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalLocalPaytef: number;
  cantidadLocal3G: number;
  totalDatafono3G: number;
  totalAlbaranes: number;
  totalDeudas: number;
  cantidadPaytef: number;
  totalDeuda: number;
  totalTkrsSinExceso: number;
  totalTkrsConExceso: number;
  ultimoTicket: number;
  calaixFetZ: number;
  detalleCierre: DetalleMonedas;
  mediaTickets: number;
  cambioEmergenciaApertura: number;
  cambioEmergenciaCierre: number;
  enviado: boolean;
  motivoDescuadre?: string;
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

export type CierreCajaResultado = {
  exito: boolean;
  mensaje?: string;
  descuadre?: number;
};