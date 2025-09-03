import { ObjectId } from "mongodb";
import { ArticulosMenu, CestasInterface } from "../cestas/cestas.interface";
import { VersionInterface } from "src/version/version.interface";

type Dias = {
  dia: string;
  nDia: number;
  checked: boolean;
};

type Productos = {
  id: number;
  idGraella: string;
  idGraellaPromoArtSecundario: null|string;
  nombre: string;
  comentario: string;
  descuentoTienda?: number;
  articulosMenu: ArticulosMenu[] | null;
  total: number;
  idMenu?: string;
};

export enum OpcionRecogida {
  HOY = 1,
  OTRO_DIA = 2,
  REPETICION = 3,
}

export enum Estat {
  NO_BUSCADO = 0,
  BUSCADO = 1,
}

export enum Periodo {
  NO_PERIODO = 0,
  PERIODO = 1,
}

export interface EncargosInterface extends VersionInterface{
  _id?: ObjectId | string | undefined;
  nombreCliente: string;
  amPm: string | null;
  dejaCuenta: number;
  dias: Dias[];
  idRepartidor?: number;
  fecha: string;
  hora: string | null;
  idCliente: string;
  opcionRecogida: OpcionRecogida;
  productos: Productos[];
  cesta: CestasInterface;
  idTrabajador: number;
  total: number;
  codigoBarras: number;
  timestamp:number;
  nombreDependienta?: string;
  pedido?: boolean;
  enviado?: boolean;
  finalizado?: boolean;
  estado: "SIN_RECOGER" | "RECOGIDO" | "ANULADO" | "PEDIDOS";
}
