export interface ArticulosInterface {
  _id: number;
  tipoIva: TiposIva;
  precioConIva: number;
  precioBase: number;
  nombre: string;
  familia: string;
  esSumable: boolean;
  puntos: number;
  impresora: string;
  pare: string;
  suplementos: [];
  varis?: boolean;
  stock?: number;
}

export type TiposIva = 1 | 2 | 3 | 4 | 5;
