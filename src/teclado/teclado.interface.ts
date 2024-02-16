export interface TeclasInterface {
  nomMenu: string;
  idArticle: number;
  nombreArticulo: string;
  pos: number;
  color: number;
  esSumable: boolean;
  precioConIva: number;
  suplementos?: number[];
  stock?: number;
}
