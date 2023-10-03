/* Yasai :D */
export interface ParametrosInterface {
  _id: string;
  codigoTienda: number;
  database: string;
  licencia: number;
  nombreEmpresa: string;
  nombreTienda: string;
  tipoDatafono: TiposDatafono;
  ultimoTicket: number;
  header: string;
  footer: string;
  token: string;
  contadorPaytef: number;
  params?: any;
  ipTefpay?: string;
  tarifaMesa: string;
  payteftcod: string;
}

export type TiposDatafono = "3G" | "PAYTEF" | "CLEARONE";
