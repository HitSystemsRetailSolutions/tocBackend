import { CestasInterface } from "../cestas/cestas.interface";

export interface TrabajadoresInterface {
  _id: number; // IGUAL A idTrabajador
  idTrabajador: number; // IGUAL A _id
  nombre: string;
  nombreCorto: string;
  fichado: boolean;
  idCesta: CestasInterface["_id"];
  satelite: string;
  descansando: boolean;
  activo: boolean;
}

export interface SincroFichajesInterface {
  _id: number;
  infoFichaje: {
    idTrabajador: number;
    fecha: {
      year: number;
      month: number;
      day: number;
      hours: number;
      minutes: number;
      seconds: number;
    };
  };
  tipo: "ENTRADA" | "SALIDA" | "DESCANSO" | "FINDESCANSO";
  enviado: boolean;
}

export type TiposSincroFichaje =
  | "ENTRADA"
  | "SALIDA"
  | "DESCANSO"
  | "FINDESCANSO";

export const trabajadorVacio = {
  _id: -1,
  idTrabajador: -1,
  nombre: "",
  nombreCorto: "",
  fichado: false,
  idCesta: null,
  satelite: null,
  descansando: false,
};
