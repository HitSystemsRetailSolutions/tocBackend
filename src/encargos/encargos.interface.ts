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
    HOY = 1,
    OTRO_DIA = 2,
    REPETICION = 3
}

export enum Estat {
    NO_BUSCADO = 0,
    BUSCADO = 1
}

export enum Periodo {
    NO_PERIODO = 0,
    PERIODO = 1
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

