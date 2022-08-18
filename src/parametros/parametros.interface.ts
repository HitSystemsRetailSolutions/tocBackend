export interface ParametrosInterface {
    _id: string,
    codigoTienda: number,
    database: string,
    licencia: number,
    nombreEmpresa: string,
    nombreTienda: string,
    tipoDatafono: TiposDatafono,
    tipoImpresora: TiposImpresora,
    impresoraCafeteria: string,
    clearOneCliente?: number,
    clearOneTienda?: number,
    clearOneTpv?: number,
    botonesConPrecios?: string,
    prohibirBuscarArticulos?: string,
    ultimoTicket: number,
    visor?:string,
    token: string,
    impresoraUsbInfo: {
        vid: string,
        pid: string
    },
    ipTefpay?: string
}

export type TiposImpresora = "USB" | "SERIE";
export type TiposDatafono = "3G" | "PAYTEF" | "CLEARONE";