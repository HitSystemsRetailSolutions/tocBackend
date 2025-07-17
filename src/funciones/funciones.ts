import { DetalleIvaInterface } from "../cestas/cestas.interface";
import { TiposIva } from "../articulos/articulos.interface";
import { tiposIvaInstance } from "src/tiposIva/tiposIva.clase";
import * as fs from "fs";
import Decimal from "decimal.js";
/* Eze 4.0 (REDONDEA AL SEGUNDO DECIMAL) */
export const redondearPrecio = (precio: number) =>
  Math.round(precio * 100) / 100;

/* Eze 4.0 */
export function construirObjetoIvas(
  precio: number,
  tipoIva: TiposIva,
  unidades: number,
  albaranNPT: boolean = false,
  dto: number = 0,
  timestamp: number = null
): DetalleIvaInterface {
  const arrayIvasDecimals = timestamp
    ? tiposIvaInstance.getIvasDecWithTmstpCesta(timestamp)
    : tiposIvaInstance.arrayDecimal;

  // Objeto donde se almacenarán dinámicamente las bases, valores e importes
  const resultado: DetalleIvaInterface = {};

  // Buscar el IVA correspondiente al tipo
  const ivaData = arrayIvasDecimals.find(
    (iva) => iva.tipus === tipoIva.toString()
  );
  if (!ivaData) {
    throw new Error(`IVA no encontrado para el tipo ${tipoIva}`);
  }

  const ivaRate = ivaData.iva;

  // Calcular base, valorIva e importe
  let precioDecimal = new Decimal(precio);
  let unidadesDecimal = new Decimal(unidades);
  let dtoDecimal = new Decimal(dto).div(100);
  let ivaRateDecimal = new Decimal(ivaRate);

  let baseDecimal = albaranNPT
    ? precioDecimal
        .times(unidadesDecimal)
        .minus(precioDecimal.times(unidadesDecimal).times(dtoDecimal))
    : precioDecimal
        .div(ivaRateDecimal.plus(1))
        .times(unidadesDecimal)
        .minus(
          precioDecimal
            .div(ivaRateDecimal.plus(1))
            .times(unidadesDecimal)
            .times(dtoDecimal)
        );

  let valorIvaDecimal = baseDecimal.times(ivaRate);
  let baseDecimalRedondeada = baseDecimal.toFixed(5);
  let valorIvaDecimalRedondeado = valorIvaDecimal.toFixed(5);

  let importeDecimal = new Decimal(baseDecimalRedondeada).plus(
    valorIvaDecimalRedondeado
  );

  // Redondeo al valor de FactorDecimal
  const factorDecimal = 100;
  let baseRedondeadaFactorDecimal = baseDecimal
    .mul(factorDecimal)
    .round()
    .div(factorDecimal);
  let valorIvaRedondeadoFactorDecimal = valorIvaDecimal
    .mul(factorDecimal)
    .round()
    .div(factorDecimal);
  let importeRedondeadoFactorDecimal = importeDecimal
    .mul(factorDecimal)
    .round()
    .div(factorDecimal);

  // Redondeo final a dos decimales
  // Guardar los valores redondeados en el objeto con índices dinámicos
  resultado[`base${tipoIva}`] = Number(baseRedondeadaFactorDecimal.toFixed(2));
  resultado[`valorIva${tipoIva}`] = Number(
    valorIvaRedondeadoFactorDecimal.toFixed(2)
  );
  resultado[`importe${tipoIva}`] = Number(
    importeRedondeadoFactorDecimal.toFixed(2)
  );

  return ajustarAuxDetalleIva(resultado);
}

export function ajustarAuxDetalleIva(auxDetalleIva) {
  const baseKeys = Object.keys(auxDetalleIva).filter((key) =>
    key.startsWith("base")
  );
  const ivaKeys = Object.keys(auxDetalleIva).filter((key) =>
    key.startsWith("valorIva")
  );
  const importeKeys = Object.keys(auxDetalleIva).filter((key) =>
    key.startsWith("importe")
  );

  // Verificar que las claves coincidan
  for (let i = 0; i < baseKeys.length; i++) {
    const baseKey = baseKeys[i];
    const ivaKey = ivaKeys[i];
    const importeKey = importeKeys[i];

    if (baseKey && ivaKey && importeKey) {
      let base = auxDetalleIva[baseKey];
      let valorIva = auxDetalleIva[ivaKey];
      let importe = auxDetalleIva[importeKey];

      // Ajustar la base si la suma no coincide con el importe
      const sumaActual = base + valorIva;
      if (Math.abs(sumaActual - importe) > 0.0001) {
        // Tolerancia por redondeo
        auxDetalleIva[baseKey] = importe - valorIva;
      }
    }
  }

  return auxDetalleIva;
}

export const countDecimal = (num: number) => {
  const str = num.toString();
  const index = str.indexOf(".");
  return index === -1 ? 0 : str.length - index - 1;
};


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
  const resultado: DetalleIvaInterface = {};

  const todasLasClaves = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  todasLasClaves.forEach((key) => {
    const valor1 = obj1[key as keyof DetalleIvaInterface] || 0;
    const valor2 = obj2[key as keyof DetalleIvaInterface] || 0;
    resultado[key as keyof DetalleIvaInterface] =
      Math.round((valor1 + valor2) * 100) / 100;
  });

  // Calcular automáticamente los importes
  Object.keys(resultado).forEach((key) => {
    if (key.startsWith("base")) {
      const index = key.replace("base", "");
      const base = resultado[`base${index}`] || 0;
      const valorIva = resultado[`valorIva${index}`] || 0;
      resultado[`importe${index}`] = Math.round((base + valorIva) * 100) / 100;
    }
  });
  return resultado;
}
