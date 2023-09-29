import { DetalleIvaInterface } from "../cestas/cestas.interface";
import { TiposIva } from "../articulos/articulos.interface";

/* Eze 4.0 (REDONDEA AL SEGUNDO DECIMAL) */
const redondearPrecio = (precio: number) => Math.round(precio * 100) / 100;

/* Eze 4.0 */
export function construirObjetoIvas(
  precioConIva: number,
  tipoIva: TiposIva,
  unidades: number
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

  switch (tipoIva) {
    case 1:
      base1 = (precioConIva / 1.04) * unidades;
      valor1 = (precioConIva / 1.04) * 0.04 * unidades;
      importe1 = precioConIva * unidades;
      break;
    case 2:
      base2 = (precioConIva / 1.1) * unidades;
      valor2 = (precioConIva / 1.1) * 0.1 * unidades;
      importe2 = precioConIva * unidades;
      break;
    case 3:
      base3 = (precioConIva / 1.21) * unidades;
      valor3 = (precioConIva / 1.21) * 0.21 * unidades;
      importe3 = precioConIva * unidades;
      break;
    case 4:
      base4 = (precioConIva / 1) * unidades;
      valor4 = (precioConIva / 1) * 0 * unidades;
      importe4 = precioConIva * unidades;
      break;
    case 5:
      base5 = (precioConIva / 1.05) * unidades;
      valor5 = (precioConIva / 1.05) * 0.05 * unidades;
      importe5 = precioConIva * unidades;
      break;
    default:
      break;
  }

  return {
    base1: base1,
    base2: base2,
    base3: base3,
    base4: base4,
    base5: base5,
    valorIva1: valor1,
    valorIva2: valor2,
    valorIva3: valor3,
    valorIva4: valor4,
    valorIva5: valor5,
    importe1: importe1,
    importe2: importe2,
    importe3: importe3,
    importe4: importe4,
    importe5: importe5,
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
    base1: obj1.base1 + obj2.base1,
    base2: obj1.base2 + obj2.base2,
    base3: obj1.base3 + obj2.base3,
    base4: obj1.base4 + obj2.base4,
    base5: obj1.base5 + obj2.base5,
    valorIva1: obj1.valorIva1 + obj2.valorIva1,
    valorIva2: obj1.valorIva2 + obj2.valorIva2,
    valorIva3: obj1.valorIva3 + obj2.valorIva3,
    valorIva4: obj1.valorIva4 + obj2.valorIva4,
    valorIva5: obj1.valorIva5 + obj2.valorIva5,
    importe1: obj1.importe1 + obj2.importe1,
    importe2: obj1.importe2 + obj2.importe2,
    importe3: obj1.importe3 + obj2.importe3,
    importe4: obj1.importe4 + obj2.importe4,
    importe5: obj1.importe5 + obj2.importe5,
  };
}
