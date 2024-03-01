import { ClientesInterface } from "../clientes/clientes.interface";
import { ArticulosInterface } from "../articulos/articulos.interface";
import { ObjectId } from "mongodb";

export interface CestasInterface {
  _id: ObjectId;
  timestamp: number;
  detalleIva: DetalleIvaInterface;
  lista: ItemLista[];
  modo: ModoCesta;
  idCliente: ClientesInterface["id"];
  nombreCliente?: string;
  indexMesa?: boolean;
  albaran?: boolean;
  vip?: boolean;
  trabajador: number;
  trabajadores: ObjectId[];
  comensales: number;
}

export type itemHonei = {
  id: string;
  comments: string;
  metadata: object;
  modifiers: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  name: string;
  price: number;
  quantity: number;
};

export type ItemLista = {
  idArticulo: number;
  nombre: string;
  unidades: number;
  subtotal: number;
  precioOrig?: number;
  arraySuplementos: ArticulosInterface[];
  promocion: {
    idPromocion: string;
    idArticuloPrincipal: number;
    cantidadArticuloPrincipal: number;
    idArticuloSecundario: number;
    cantidadArticuloSecundario: number;
    precioRealArticuloPrincipal: number;
    precioRealArticuloSecundario: number;
    unidadesOferta: number;
    tipoPromo: TiposPromociones;
  };
  puntos: number;
  gramos: number;
  impresora: string;
  regalo: boolean;
  dto?: number;
  iva?: number;
  pagado?: boolean;
};

export type DetalleIvaInterface = {
  base1: number;
  base2: number;
  base3: number;
  base4: number;
  base5: number;
  valorIva1: number;
  valorIva2: number;
  valorIva3: number;
  valorIva4: number;
  valorIva5: number;
  importe1: number;
  importe2: number;
  importe3: number;
  importe4: number;
  importe5: number;
};

export type TiposPromociones = "COMBO" | "INDIVIDUAL";
export type ModoCesta =
  | "VENTA"
  | "CONSUMO_PERSONAL"
  | "DEVOLUCION"
  | "PAGO SEPARADO";
