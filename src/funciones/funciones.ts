import { DetalleIvaInterface } from "../cestas/cestas.interface";
import { TiposIva } from "../articulos/articulos.interface";
import { tiposIvaInstance } from "src/tiposIva/tiposIva.clase";
/* Eze 4.0 (REDONDEA AL SEGUNDO DECIMAL) */
export const redondearPrecio = (precio: number) => Math.round(precio * 100) / 100;

/* Eze 4.0 */
export function construirObjetoIvas(
  precio: number,
  tipoIva: TiposIva,
  unidades: number,
  albaranNPT: boolean = false,
  dto: number = 0,
  timestamp: number = null,
): DetalleIvaInterface {
  const arrayIvasDecimals = timestamp ? tiposIvaInstance.getIvasDecWithTmstpCesta(timestamp) : tiposIvaInstance.arrayDecimal;
  let base1 = 0,
    base2 = 0,
    base3 = 0,
    base4 = 0,
    base5 = 0;
  let valor1 = 0,
    valor2 = 0,
    valor3 = 0,
    valor4 = 0,
    valor5 = 0;
  let importe1 = 0,
    importe2 = 0,
    importe3 = 0,
    importe4 = 0,
    importe5 = 0;
  // si es albaranNPT, parametro precio viene sin el iva.
  // En caso contrario, al precio se le quita el iva para calcular las bases y valores
  // Puede contener dto, por lo que se le aplica el dto a base
  switch (tipoIva) {
    case 1:
    default:
      const iva1 = arrayIvasDecimals.find((iva) => iva.tipus === "1")?.iva;
      const iva1Mod = 1 + iva1;
      base1 = albaranNPT
        ? precio * unidades - precio * unidades * (dto / 100)
        : (precio / iva1Mod) * unidades - (precio / iva1Mod) * unidades * (dto / 100);
      valor1 = base1 * iva1;
      importe1 = base1 + valor1;
      break;
    case 2:
      const iva2 = arrayIvasDecimals.find((iva) => iva.tipus === "2")?.iva;
      const iva2Mod = 1 + iva2;
      base2 = albaranNPT
        ? precio * unidades - precio * unidades * (dto / 100)
        : (precio / iva2Mod) * unidades - (precio / iva2Mod) * unidades * (dto / 100);
      valor2 = base2 * iva2;
      importe2 = base2 + valor2;
      break;
    case 3:
      const iva3 = arrayIvasDecimals.find((iva) => iva.tipus === "3")?.iva;
      const iva3Mod = 1 + iva3;
      base3 = albaranNPT
        ? precio * unidades - precio * unidades * (dto / 100)
        : (precio / iva3Mod) * unidades - (precio / iva3Mod) * unidades * (dto / 100);
      valor3 = base3 * iva3;
      importe3 = base3 + valor3;
      break;
    case 4:
      const iva4 = arrayIvasDecimals.find((iva) => iva.tipus === "4")?.iva;
      const iva4Mod = 1 + iva4;
      base4 = albaranNPT
        ? precio * unidades - precio * unidades * (dto / 100)
        : (precio / iva4Mod) * unidades - (precio / iva4Mod) * unidades * (dto / 100);
      valor4 = base4 * iva4;
      importe4 = base4 + valor4;
      break;
    case 5:
      const iva5 = arrayIvasDecimals.find((iva) => iva.tipus === "5")?.iva;
      const iva5Mod = 1 + iva5;
      base5 = albaranNPT
        ? precio * unidades - precio * unidades * (dto / 100)
        : (precio / iva5Mod) * unidades - (precio / iva5Mod) * unidades * (dto / 100);
      valor5 = base5 * iva5;
      importe5 = base5 + valor5;
      break;
  }
  // Redondeo con Math.Round y no con toFixed para evitar un almacenado con pérdida de precisión(6.3449999999662,6.3550000002).
  return {
    base1: Math.round(base1 * 1000) / 1000,
    base2: Math.round(base2 * 1000) / 1000,
    base3: Math.round(base3 * 1000) / 1000,
    base4: Math.round(base4 * 1000) / 1000,
    base5: Math.round(base5 * 1000) / 1000,
    valorIva1: Math.round(valor1 * 1000) / 1000,
    valorIva2: Math.round(valor2 * 1000) / 1000,
    valorIva3: Math.round(valor3 * 1000) / 1000,
    valorIva4: Math.round(valor4 * 1000) / 1000,
    valorIva5: Math.round(valor5 * 1000) / 1000,
    importe1: Math.round(importe1 * 1000) / 1000,
    importe2: Math.round(importe2 * 1000) / 1000,
    importe3: Math.round(importe3 * 1000) / 1000,
    importe4: Math.round(importe4 * 1000) / 1000,
    importe5: Math.round(importe5 * 1000) / 1000,
  };
}

/* Eze 4.0 */
export const convertirPuntosEnDinero = (
  puntos: number,
  porcentajeConversion: number
): number => Math.trunc(puntos * 0.03 * (porcentajeConversion / 100));
// en las licencias el porcentajeConversion suele ser 2%
/* Eze 4.0 */
export const convertirDineroEnPuntos = (
  total: number,
  pocentajeConversion: number
): number => Math.trunc(total / (0.03 * (pocentajeConversion / 100)));
/* Eze 4.0 */
export function fusionarObjetosDetalleIva(
  obj1: DetalleIvaInterface,
  obj2: DetalleIvaInterface
): DetalleIvaInterface {
    const base1= Math.round((obj1.base1 + obj2.base1) * 100) / 100;
    const base2= Math.round((obj1.base2 + obj2.base2) * 100) / 100;
    const base3= Math.round((obj1.base3 + obj2.base3) * 100) / 100;
    const base4= Math.round((obj1.base4 + obj2.base4) * 100) / 100;
    const base5= Math.round((obj1.base5 + obj2.base5) * 100) / 100;
    const valorIva1= Math.round((obj1.valorIva1 + obj2.valorIva1) * 100) / 100;
    const valorIva2= Math.round((obj1.valorIva2 + obj2.valorIva2) * 100) / 100;
    const valorIva3= Math.round((obj1.valorIva3 + obj2.valorIva3) * 100) / 100;
    const valorIva4= Math.round((obj1.valorIva4 + obj2.valorIva4) * 100) / 100;
    const valorIva5= Math.round((obj1.valorIva5 + obj2.valorIva5) * 100) / 100;
  return {
    base1:base1,
    base2: base2,
    base3: base3,
    base4: base4,
    base5: base5,
    valorIva1: valorIva1,
    valorIva2: valorIva2,
    valorIva3: valorIva3,
    valorIva4: valorIva4,
    valorIva5: valorIva5,
    importe1: Math.round((base1 + valorIva1) * 100) / 100,
    importe2: Math.round((base2 + valorIva2) * 100) / 100,
    importe3: Math.round((base3 + valorIva3) * 100) / 100,
    importe4: Math.round((base4+ valorIva4) * 100) / 100,
    importe5: Math.round((base5 + valorIva5) * 100) / 100,
  };
}
