/* Yasai :D */
export interface FiskalyInterface {
    API_KEY: string;
    API_SECRET: string;
    baseUrl: string;
    client: string;
    enabled: boolean;
};

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
  fiskaly?: FiskalyInterface;
}

export type TiposDatafono = "3G" | "PAYTEF" | "CLEARONE";
