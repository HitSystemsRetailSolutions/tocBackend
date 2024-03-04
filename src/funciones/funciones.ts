import { DetalleIvaInterface } from "../cestas/cestas.interface";
import { TiposIva } from "../articulos/articulos.interface";

/* Eze 4.0 (REDONDEA AL SEGUNDO DECIMAL) */
const redondearPrecio = (precio: number) => Math.round(precio * 100) / 100;

/* Eze 4.0 */
export function construirObjetoIvas(
  precio: number,
  tipoIva: TiposIva,
  unidades: number,
  albaranNPT: boolean = false,
  dto: number = 0
): DetalleIvaInterface {
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
      base1 = albaranNPT
        ? precio * unidades - precio * unidades * (dto / 100)
        : (precio / 1.04) * unidades - (precio / 1.04) * unidades * (dto / 100);
      valor1 = base1 * 0.04;
      importe1 = base1 + valor1;
      break;
    case 2:
      base2 = albaranNPT
        ? precio * unidades - precio * unidades * (dto / 100)
        : (precio / 1.1) * unidades - (precio / 1.1) * unidades * (dto / 100);
      valor2 = base2 * 0.1;
      importe2 = base2 + valor2;
      break;
    case 3:
      base3 = albaranNPT
        ? precio * unidades - precio * unidades * (dto / 100)
        : (precio / 1.21) * unidades - (precio / 1.21) * unidades * (dto / 100);
      valor3 = base3 * 0.21;
      importe3 = base3 + valor3;
      break;
    case 4:
      base4 = albaranNPT
        ? precio * unidades - precio * unidades * (dto / 100)
        : (precio / 1) * unidades - (precio / 1) * unidades * (dto / 100);
      valor4 = base4 * 0;
      importe4 = base4 + valor4;
      break;
    case 5:
      base5 = albaranNPT
        ? precio * unidades - precio * unidades * (dto / 100)
        : (precio / 1.05) * unidades - (precio / 1.05) * unidades * (dto / 100);
      valor5 = base5 * 0.05;
      importe5 = base5 + valor5;
      break;
    default:
      break;
  }
// Redondeo con Math.Round y no con toFixed para evitar un almacenado con pérdida de precisión(6.3449999999662,6.3550000002).
  return {
    base1: Math.round(base1*1000)/1000,
    base2: Math.round(base2*1000)/1000,
    base3: Math.round(base3*1000)/1000,
    base4: Math.round(base4*1000)/1000,
    base5: Math.round(base5*1000)/1000,
    valorIva1: Math.round(valor1*1000)/1000,
    valorIva2: Math.round(valor2*1000)/1000,
    valorIva3: Math.round(valor3*1000)/1000,
    valorIva4: Math.round(valor4*1000)/1000,
    valorIva5: Math.round(valor5*1000)/1000,
    importe1: Math.round(importe1*1000)/1000,
    importe2: Math.round(importe2*1000)/1000,
    importe3: Math.round(importe3*1000)/1000,
    importe4: Math.round(importe4*1000)/1000,
    importe5: Math.round(importe5*1000)/1000,
  };
}

/* Eze 4.0 */
export const convertirPuntosEnDinero = (puntos: number): number =>
  Math.trunc(puntos * 0.03 * 0.02);

/* Eze 4.0 */
export const convertirDineroEnPuntos = (total: number): number =>
  Math.trunc(total / (0.03 * 0.02));
/* Eze 4.0 */
export function fusionarObjetosDetalleIva(
  obj1: DetalleIvaInterface,
  obj2: DetalleIvaInterface
): DetalleIvaInterface {
  return {
    base1: Math.round((obj1.base1 + obj2.base1)*100)/100,
    base2: Math.round((obj1.base2 + obj2.base2)*100)/100,
    base3: Math.round((obj1.base3 + obj2.base3)*100)/100,
    base4: Math.round((obj1.base4 + obj2.base4)*100)/100,
    base5: Math.round((obj1.base5 + obj2.base5)*100)/100,
    valorIva1: Math.round((obj1.valorIva1 + obj2.valorIva1)*100)/100,
    valorIva2: Math.round((obj1.valorIva2 + obj2.valorIva2)*100)/100,
    valorIva3: Math.round((obj1.valorIva3 + obj2.valorIva3)*100)/100,
    valorIva4: Math.round((obj1.valorIva4 + obj2.valorIva4)*100)/100,
    valorIva5: Math.round((obj1.valorIva5 + obj2.valorIva5)*100)/100,
    importe1: Math.round((obj1.importe1 + obj2.importe1)*100)/100,
    importe2: Math.round((obj1.importe2 + obj2.importe2)*100)/100,
    importe3: Math.round((obj1.importe3 + obj2.importe3)*100)/100,
    importe4: Math.round((obj1.importe4 + obj2.importe4)*100)/100,
    importe5: Math.round((obj1.importe5 + obj2.importe5)*100)/100,
  };
}
