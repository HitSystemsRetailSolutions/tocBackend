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
  promocioDescompteFixe?: number;
  token: string;
  contadorPaytef: number;
  params?: any;
  ipTefpay?: string;
  ipCashlogy?: string;
  contadorPaytefDate?: string;
  tarifaMesa: string;
  payteftcod: string;
  descuentosTienda: DescuentosTienda[];
  nif?: string;
  verifactuEnabled?: Date;
}
export interface DescuentosTienda {
  descuentoFamilia: number;
  valor: number;
}
export type TiposDatafono = "3G" | "PAYTEF" | "CLEARONE";
