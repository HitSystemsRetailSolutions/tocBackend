import { CestasInterface } from "src/cestas/cestas.interface";

export interface DeudasInterface {
    _id: string;
    idTicket:string;
    idSql: string,
    timestamp:number;
    total: number;
    idTrabajador: string;
    nombreCliente: string;
    idCliente: string;
    cesta: CestasInterface;
    enviado: boolean;
    estado: "SIN_PAGAR" | "PAGADO" | "ANULADO";
}