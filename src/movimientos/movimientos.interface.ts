export interface MovimientosInterface {
  _id: number;
  tipo: TiposMovientos;
  valor: number;
  concepto: string;
  idTrabajador: number;
  codigoBarras: string;
  idTicket: number;
  enviado: boolean;
}

export type TiposMovientos =
  | "TARJETA"
  | "TKRS_CON_EXCESO"
  | "TKRS_SIN_EXCESO"
  | "DEUDA"
  | "ENTREGA_DIARIA"
  | "ENTRADA_DINERO"
  | "SALIDA" // Para el resto de salidas (genéricas)
  | "DATAFONO_3G";

export interface CuentaCodigoBarras {
  _id: "CUENTA";
  ultimo: number;
}

export type FormaPago =
  | "EFECTIVO"
  | "TARJETA"
  | "TKRS"
  | "CONSUMO_PERSONAL"
  | "DEUDA"
  | "TKRS + EFECTIVO"
  | "DEVUELTO"
  | "ANULADO"
  | "ERROR_DETECTADO";
