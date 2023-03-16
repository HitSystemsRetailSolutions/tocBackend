type Dias = {
    dia: string;
    nDia: number;
    checked: boolean;
}

type Productos = {
    id: number;
    nombre: string;
    comentario: string;
}

export enum OpcionRecogida {
    HOY,
    OTRO_DIA,
    REPETICION
}

export interface EncargosInterface {
    _id: string;
    amPm: string | null;
    dejaACuenta: number;
    dias: Dias[];
    fecha: string | null;
    hora: string | null;
    idCliente: string;
    opcionRecogida: OpcionRecogida,
    productos: Productos[];
    total: number;
}

