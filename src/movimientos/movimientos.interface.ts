import { VersionInterface } from "src/version/version.interface";

export interface MovimientosInterface extends VersionInterface{
  _id: number;
  tipo: TiposMovientos;
  valor: number;
  concepto: string;
  idTrabajador: number;
  codigoBarras: string;
  idTicket: number;
  nombreCliente?: string;
  enviado: boolean;
  ExtraData: object;
}

export type TiposMovientos =
  | "TARJETA"
  | "TKRS_CON_EXCESO"
  | "TKRS_SIN_EXCESO"
  | "DEUDA"
  | "ENTREGA_DIARIA"
  | "ENTRADA_DINERO"
  | "SALIDA" // Para el resto de salidas (genéricas)
  | "DATAFONO_3G"
  | "DEV_DATAFONO_3G"
  | "DEV_DATAFONO_PAYTEF";

export interface CuentaCodigoBarras {
  _id: "CUENTA";
  ultimo: number;
}

export type FormaPago =
  | "EFECTIVO"
  | "TARJETA"
  | "TARJETA-INPAGADO"
  | "TKRS"
  | "CONSUMO_PERSONAL"
  | "TKRS + EFECTIVO"
  | "TKRS + DATAFONO_3G"
  | "DEVUELTO"
  | "ANULADO"
  | "ERROR_DETECTADO"
  | "DATAFONO_3G"
  | "DEUDA"
  | "HONEI"
  | "HONEI + EFECTIVO"
  | "TKRS + HONEI"
  | "TKRS + HONEI + EFECTIVO"
  | "HONEI + TARJETA"
  | "HONEI + DATAFONO_3G"
  | "DEV_DATAFONO_3G"
  | "DEV_DATAFONO_PAYTEF";
