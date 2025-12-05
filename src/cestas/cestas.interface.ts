import { ClientesInterface } from "../clientes/clientes.interface";
import { ArticulosInterface } from "../articulos/articulos.interface";
import { ObjectId } from "mongodb";

export interface CestasInterface {
  _id: ObjectId;
  timestamp: number;
  detalleIva: DetalleIvaInterface;
  lista: ItemLista[];
  modo: ModoCesta;
  idPedido?: ObjectId;
  idCliente: ClientesInterface["id"];
  nombreCliente?: string;
  indexMesa?: number;
  albaran?: boolean;
  vip?: boolean;
  encargadoMesa?: number;
  trabajador: number;
  trabajadores: ObjectId[];
  comensales: number;
  ArticulosFaltaUnoParaPromocion: ArticulosInterface["_id"][];
  dataVersion?: string;
}

export interface CestasCombinadaInterface extends CestasInterface {
  listaDeudas?: ItemLista[];
  detalleIvaTickets?: DetalleIvaInterface;
  detalleIvaDeudas?: DetalleIvaInterface;
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

export type ItemLista_old = {
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
  tipoIva?: number;
  descuentoTienda?: number;
  puntos: number;
  gramos: number;
  impresora: string;
  printed?: number;
  regalo: boolean;
  dto?: number;
  iva?: number;
  pagado?: boolean;
  tarifaEsp?: boolean;
  varis?: boolean;
  instanceId?: string;
};

export type ItemLista = {
  idArticulo: number;
  nombre: string;
  unidades: number;
  subtotal: number;
  precioOrig?: number;
  arraySuplementos: ArticulosInterface[];
  suplementosPorArticulo?: {
    unidades: number;
    suplementos: ItemLista["arraySuplementos"];
  }[];
  articulosMenu?: ArticulosMenu[];
  promocion: {
    idPromocion: string;
    grupos: GrupoPromoEnCesta[];
    unidadesOferta: number;
    precioFinalPorPromo: number;
  };
  tipoIva?: number;
  descuentoTienda?: number;
  puntos: number;
  gramos: number;
  impresora: string;
  printed?: number;
  regalo: boolean;
  dto?: number;
  iva?: number;
  pagado?: boolean;
  tarifaEsp?: boolean;
  varis?: boolean;
  isPrecioFrontend?: boolean;
  instanceId?: string;
  // Array de instancias individuales - cada elemento representa 1 unidad
  instancias?: {
    instanceId: string;
    printed: boolean;
  }[];
};
export type ArticulosMenu = {
  idArticulo: number;
  gramos: number | null;
  unidades: number;
  arraySuplementos: ArticulosInterface[] | null;
  nombre: string;
};
export type GrupoPromoEnCesta = ArticuloPromoEnCesta[];
export type ArticuloPromoEnCesta = {
  idArticulo: number;
  nombre: string;
  unidades: number;
  printed?: number;
  precioPromoPorUnidad: number;
  precioPorUnidad?: number;
  puntosPorUnidad?: number;
  impresora: string;
  suplementosPorArticulo?: {
    unidades: number;
    suplementos: ItemLista["arraySuplementos"];
  }[];
  instanceId?: string;
  // Array de instancias individuales
  instancias?: {
    instanceId: string;
    printed: boolean;
  }[];
};

export type DetalleIvaInterface = {
  [key: `base${number}`]: number;
  [key: `valorIva${number}`]: number;
  [key: `importe${number}`]: number;
};

export type TiposPromociones = "COMBO" | "INDIVIDUAL";
export type ModoCesta =
  | "VENTA"
  | "CONSUMO_PERSONAL"
  | "DEVOLUCION"
  | "PAGO SEPARADO"
  | "PAGO DEUDA"
  | "RECOGER ENCARGO"
  | "PAGO COMBINADO"
  | "MODIFICAR PEDIDO";
