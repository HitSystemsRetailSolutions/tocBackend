import { CestasInterface } from "src/cestas/cestas.interface";

export interface DeudasInterface {
    _id: string;
    idTicket:string;
    data:number;
    total: number;
    idTrabajador: string;
    nombreCliente: string;
    idCliente: string;
    cesta: CestasInterface;
    pagado: boolean;
}