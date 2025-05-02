export interface PromocionesEnServer {
  _id: string;
  cantidadPrincipal: number;
  cantidadSecundario: number;
  fechaFinal: string;
  fechaInicio: string;
  precioFinal: number;
  principal: number[];
  secundario: number[];
  tipo: "COMBO" | "INDIVIDUAL";
}

export interface PromocionesInterface {
  _id:string;
  fechaFinal: string;
  fechaInicio: string;
  precioFinal: number;
  grupos:GrupoEnPromocion[];
  sortInfo:{unidades_totales:number, unidades_por_grupo:number[]}
}
export interface GrupoEnPromocion {
  idsArticulos:Set<number>;
  cantidad:number;
  familia_o_nombre?:string;
}