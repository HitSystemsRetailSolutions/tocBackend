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
  suplementos: [];
}

export type TiposIva = 1 | 2 | 3 | 4 | 5;
