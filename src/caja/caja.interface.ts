import { ObjectId } from "mongodb";

export interface CajaAbiertaInterface {
  inicioTime: number;
  idDependientaApertura: number;
  totalApertura: number;
  detalleApertura: DetalleMonedas;
}

export interface CajaCerradaInterface {
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
  totalDeuda: number;
  totalTkrsSinExceso: number;
  totalTkrsConExceso: number;
  totalConsumoPersonal: number;
  ultimoTicket: number;
  calaixFetZ: number;
  detalleCierre: DetalleMonedas;
  mediaTickets: number;
}

export interface CajaSincro {
  _id: ObjectId;
  inicioTime: number;
  idDependientaApertura: number;
  totalApertura: number;
  detalleApertura: DetalleMonedas;
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
  totalDeuda: number;
  totalTkrsSinExceso: number;
  totalTkrsConExceso: number;
  totalConsumoPersonal: number;
  ultimoTicket: number;
  calaixFetZ: number;
  detalleCierre: DetalleMonedas;
  mediaTickets: number;
  enviado: boolean;
}

export type TiposInfoMoneda = "CLAUSURA" | "APERTURA";

export interface MonedasInterface {
  _id: TiposInfoMoneda;
  array: [
    {
      valor: number;
      style: string;
    },
    {
      valor: number;
      style: string;
    },
    {
      valor: number;
      style: string;
    },
    {
      valor: number;
      style: string;
    },
    {
      valor: number;
      style: string;
    },
    {
      valor: number;
      style: string;
    },
    {
      valor: number;
      style: string;
    },
    {
      valor: number;
      style: string;
    },
    {
      valor: number;
      style: string;
    },
    {
      valor: number;
      style: string;
    },
    {
      valor: number;
      style: string;
    },
    {
      valor: number;
      style: string;
    },
    {
      valor: number;
      style: string;
    },
    {
      valor: number;
      style: string;
    },
    {
      valor: number;
      style: string;
    }
  ];
}

export type DetalleMonedas = {
  _id: string;
  valor: number;
  unidades: number;
}[];
