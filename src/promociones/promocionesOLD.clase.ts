// import { clienteInstance } from "../clientes/clientes.clase";
// import { articulosInstance } from "../articulos/articulos.clase";
// import { CestasInterface } from "../cestas/cestas.interface";
// import { PromocionesInterface } from "./promociones.interface";
// import * as schPromociones from "./promociones.mongodb";
// import { cestasInstance } from "../cestas/cestas.clase";
// import { ClientesInterface } from "../clientes/clientes.interface";

// export class PromocionesClase {
//   /* Eze 4.0 */
//   async deshacerOfertas(cesta: CestasInterface, idCliente: ClientesInterface["id"] = null): Promise<CestasInterface> {
//     let cestaAux: CestasInterface = {
//       _id: null,
//       timestamp: null,
//       detalleIva: null,
//       lista: [],
//       modo: null,
//       idCliente: idCliente
//     }; // Esta cesta no tendrá promos después del primer bucle

//     for (let i = 0; i < cesta.lista.length; i++) {
//       if (cesta.lista[i].promocion) {
//         if (cesta.lista[i].promocion.idArticuloPrincipal) {
//           const idPrincipal = cesta.lista[i].promocion.idArticuloPrincipal;
//           const articulo = await articulosInstance.getInfoArticulo(idPrincipal);
//           const unidades =
//             cesta.lista[i].unidades *
//             cesta.lista[i].promocion.cantidadArticuloPrincipal;
//           cestaAux.lista.push({
//             idArticulo: idPrincipal,
//             arraySuplementos: [],
//             gramos: null,
//             nombre: articulo.nombre,
//             precioConIva: articulo.precioConIva,
//             promocion: null,
//             regalo: false,
//             subtotal: unidades * articulo.precioConIva,
//             tipoIva: articulo.tipoIva,
//             unidades: unidades,
//           });
//         }

//         if (cesta.lista[i].promocion.idArticuloSecundario) {
//           const idSecundario = cesta.lista[i].promocion.idArticuloSecundario;
//           const unidades =
//             cesta.lista[i].unidades *
//             cesta.lista[i].promocion.cantidadArticuloSecundario;

//           const articulo = await articulosInstance.getInfoArticulo(
//             idSecundario
//           );
//           cestaAux.lista.push({
//             idArticulo: idSecundario,
//             arraySuplementos: [],
//             gramos: null,
//             nombre: articulo.nombre,
//             precioConIva: articulo.precioConIva,
//             promocion: null,
//             regalo: false,
//             subtotal: unidades * articulo.precioConIva,
//             tipoIva: articulo.tipoIva,
//             unidades: unidades,
//           });
//         }
//       } else {
//         cestaAux.lista.push(cesta.lista[i]);
//       }
//     }
//     cestaAux._id = cesta._id;
//     cestaAux.detalleIva = cesta.detalleIva;
//     cestaAux.modo = cesta.modo;
//     cestaAux.timestamp = cesta.timestamp;
//     return cestaAux;
//   }

//   /* Eze 4.0 */
//   existeArticuloParaOfertaEnCesta(
//     cesta: CestasInterface,
//     idArticulo: number,
//     unidadesNecesarias: number
//   ) {
//     for (let i = 0; i < cesta.lista.length; i++) {
//       if (
//         cesta.lista[i].idArticulo === idArticulo &&
//         cesta.lista[i].unidades >= unidadesNecesarias
//       ) {
//         return i;
//       }
//     }
//     return -1; // IMPORTANTE QUE SEA ESTE VALOR SINO HAY SECUNDARIO
//   }

//   /* Aplica las promociones en la cesta de todo tipo, tanto individuales como combos */
//   async teLoAplicoTodo(
//     necesariasPrincipal: number,
//     necesariasSecundario: number,
//     cesta: CestasInterface,
//     posicionPrincipal: number,
//     posicionSecundario: number,
//     pideDelA: number,
//     pideDelB: number,
//     precioPromo: number,
//     idPromo: string
//   ): Promise<CestasInterface> {
//     let numeroPrincipal = 0;
//     let numeroSecundario = 0;
//     let sobranPrincipal = 0;
//     let sobranSecundario = 0;
//     let nVeces = 0;

//     const idPrincipal =
//       typeof cesta.lista[posicionPrincipal] !== "undefined"
//         ? cesta.lista[posicionPrincipal].idArticulo
//         : 0;
//     const idSecundario =
//       typeof cesta.lista[posicionSecundario] !== "undefined"
//         ? cesta.lista[posicionSecundario].idArticulo
//         : 0;

//     if (pideDelA !== -1 && pideDelB !== -1) {
//       numeroPrincipal =
//         cesta.lista[posicionPrincipal].unidades / necesariasPrincipal;
//       numeroSecundario =
//         cesta.lista[posicionSecundario].unidades / necesariasSecundario;
//       nVeces = Math.trunc(Math.min(numeroPrincipal, numeroSecundario));
//       sobranPrincipal =
//         cesta.lista[posicionPrincipal].unidades - nVeces * necesariasPrincipal;
//       sobranSecundario =
//         cesta.lista[posicionSecundario].unidades -
//         nVeces * necesariasSecundario;

//       cesta = await cestasInstance.limpiarCesta(
//         cesta,
//         posicionPrincipal,
//         posicionSecundario,
//         sobranPrincipal,
//         sobranSecundario,
//         pideDelA,
//         pideDelB
//       );

//       cesta = await this.insertarLineaPromoCestaCombo(
//         cesta,
//         1,
//         nVeces,
//         precioPromo * nVeces,
//         idPromo,
//         idPrincipal,
//         idSecundario,
//         necesariasPrincipal,
//         necesariasSecundario,
//         precioPromo
//       );

//     } else {
//       if (pideDelA !== -1 && pideDelB === -1) {
//         numeroPrincipal =
//           cesta.lista[posicionPrincipal].unidades / necesariasPrincipal;
//         nVeces = Math.trunc(numeroPrincipal);
//         sobranPrincipal =
//           cesta.lista[posicionPrincipal].unidades -
//           nVeces * necesariasPrincipal;

//         cesta = await cestasInstance.limpiarCesta(
//           cesta,
//           posicionPrincipal,
//           posicionSecundario,
//           sobranPrincipal,
//           sobranSecundario,
//           pideDelA,
//           pideDelB
//         );
//         cesta = await this.insertarLineaPromoCestaIndividual(
//           cesta,
//           2,
//           nVeces,
//           precioPromo * nVeces * necesariasPrincipal,
//           idPromo,
//           idPrincipal,
//           necesariasPrincipal
//         );
//       } else {
//         if (pideDelA === -1 && pideDelB !== -1) {
//           numeroSecundario =
//             cesta.lista[posicionSecundario].unidades / necesariasSecundario;
//           nVeces = Math.trunc(numeroSecundario);
//           sobranSecundario =
//             cesta.lista[posicionSecundario].unidades -
//             nVeces * necesariasSecundario;

//           cesta = await cestasInstance.limpiarCesta(
//             cesta,
//             posicionPrincipal,
//             posicionSecundario,
//             sobranPrincipal,
//             sobranSecundario,
//             pideDelA,
//             pideDelB
//           );
//           cesta = await this.insertarLineaPromoCestaIndividual(
//             cesta,
//             2,
//             nVeces,
//             precioPromo * nVeces * necesariasSecundario,
//             idPromo,
//             idPrincipal,
//             necesariasPrincipal
//           ); // se trata como si fueran principales
//         }
//       }
//     }

//     return cesta;
//   }

//   /* Eze OK. NO 4.0. Busca ofertas que se pueden aplicar en la cesta */
//   async buscarOfertas(
//     cesta: CestasInterface,
//     idCliente: ClientesInterface["id"]
//   ): Promise<CestasInterface> {
//     let hayOferta = false;
//     const promociones = await schPromociones.getPromociones();

//     if (!(await clienteInstance.tieneTarifaEspecial(idCliente))) {
//       for (let i = 0; i < promociones.length; i++) {
//         for (let j = 0; j < promociones[i].principal.length; j++) {
//           const preguntaPrincipal = this.existeArticuloParaOfertaEnCesta(
//             cesta,
//             promociones[i].principal[j],
//             promociones[i].cantidadPrincipal
//           );
//           if (
//             promociones[i].principal[j] === -1 ||
//             preguntaPrincipal >= 0
//           ) {
//             for (let z = 0; z < promociones[i].secundario.length; z++) {
//               const preguntaSecundario = this.existeArticuloParaOfertaEnCesta(
//                 cesta,
//                 promociones[i].secundario[z],
//                 promociones[i].cantidadSecundario
//               );
//               if (
//                 promociones[i].secundario[z] === -1 ||
//                 preguntaSecundario >= 0
//               ) {
//                 cesta = await this.teLoAplicoTodo(
//                   promociones[i].cantidadPrincipal,
//                   promociones[i].cantidadSecundario,
//                   cesta,
//                   preguntaPrincipal,
//                   preguntaSecundario,
//                   promociones[i].principal[j],
//                   promociones[i].secundario[z],
//                   promociones[i].precioFinal,
//                   promociones[i]._id
//                 );
//                 hayOferta = true;
//                 break;
//               }
//             }
//           }
//         }
//       }
//     }

//     if (cestasInstance.updateCesta(cesta)) return cesta;

//     throw Error("No se ha podido actualizar la cesta");
//   }

//   /* Inserta la línea de la oferta combinada en la cesta */
//   async insertarLineaPromoCestaCombo(
//     cesta: CestasInterface,
//     tipoPromo: number,
//     unidades: number,
//     total: number,
//     idPromo: string,
//     idPrincipal: number,
//     idSecundario: number,
//     cantidadPrincipal: number,
//     cantidadSecundario: number,
//     precioPromoGdt: number
//   ) {
//     const dtoAplicado = await this.calcularPrecioRealCombo(
//       tipoPromo,
//       idPrincipal,
//       idSecundario,
//       cantidadPrincipal,
//       cantidadSecundario,
//       unidades,
//       total
//     );

//     if (tipoPromo === 1) {
//       // COMBO
//       let precioRealPromo =
//         dtoAplicado.precioRealPrincipal * cantidadPrincipal +
//         dtoAplicado.precioRealSecundario * cantidadSecundario;
//       if (precioPromoGdt != precioRealPromo) {
//         const diferencia = precioPromoGdt - precioRealPromo;
//         precioRealPromo += diferencia;
//         dtoAplicado.precioRealSecundario += diferencia;
//       }

//       cesta.lista.push({
//         idArticulo: -2,
//         nombre: "Oferta combo",
//         unidades: unidades,
//         arraySuplementos: [],
//         gramos: null,
//         precioConIva: precioPromoGdt,
//         subtotal: total,
//         tipoIva: null,
//         promocion: {
//           idPromocion: idPromo,
//           idArticuloPrincipal: idPrincipal,
//           cantidadArticuloPrincipal: cantidadPrincipal,
//           idArticuloSecundario: idSecundario,
//           cantidadArticuloSecundario: cantidadSecundario,
//           precioRealArticuloPrincipal: dtoAplicado.precioRealPrincipal,
//           precioRealArticuloSecundario: dtoAplicado.precioRealSecundario,
//           unidadesOferta: unidades,
//           tipoPromo: "COMBO",
//         },
//         regalo: false,
//       });
//     }
//     return cesta;
//   }

//   /* Eze OK. NO 4.0. Inserta la línea de la oferta individual en la cesta */
//   async insertarLineaPromoCestaIndividual(
//     cesta: CestasInterface,
//     tipoPromo: number,
//     unidades: number,
//     total: number,
//     idPromo: string,
//     idPrincipal: number,
//     cantidadPrincipal: number
//   ) {
//     const dtoAplicado = await this.calcularPrecioRealIndividual(
//       tipoPromo,
//       idPrincipal,
//       cantidadPrincipal,
//       unidades,
//       total
//     );

//     if (tipoPromo === 2) {
//       // INDIVIDUAL
//       cesta.lista.push({
//         idArticulo: -2,
//         nombre: "Oferta individual",
//         unidades: unidades,
//         subtotal: total,
//         promocion: {
//           idPromocion: idPromo,
//           idArticuloPrincipal: idPrincipal,
//           cantidadArticuloPrincipal: cantidadPrincipal,
//           idArticuloSecundario: 0,
//           cantidadArticuloSecundario: 0,
//           precioRealArticuloPrincipal: dtoAplicado.precioRealPrincipal,
//           precioRealArticuloSecundario: 0,
//           unidadesOferta: unidades,
//           tipoPromo: "INDIVIDUAL",
//         },
//         regalo: false,
//         arraySuplementos: [],
//         gramos: null,
//         precioConIva: total/unidades,
//         tipoIva: null
//       });
//     }

//     return cesta;
//   }

//   /* Eze 4.0 .Calcula el precio real que tienen los artículos de una promoción tipo combo. Se reparten en porcentaje */
//   async calcularPrecioRealCombo(
//     tipoPromo: number,
//     idPrincipal: number,
//     idSecundario: number,
//     cantidadPrincipal: number,
//     cantidadSecundario: number,
//     unidadesOferta: number,
//     precioTotalOferta: number
//   ) {
//     let precioSinOfertaPrincipal = 0;
//     let precioSinOfertaSecundario = 0;
//     let precioTotalSinOferta = 0;

//     if (idPrincipal != 0) {
//       precioSinOfertaPrincipal = (
//         await articulosInstance.getInfoArticulo(idPrincipal)
//       ).precioConIva;
//     }

//     if (idSecundario != 0) {
//       precioSinOfertaSecundario = (
//         await articulosInstance.getInfoArticulo(idSecundario)
//       ).precioConIva;
//     }

//     if (tipoPromo === 1) {
//       // COMBO
//       precioTotalSinOferta =
//         (precioSinOfertaPrincipal * cantidadPrincipal +
//           precioSinOfertaSecundario * cantidadSecundario) *
//         unidadesOferta;
//     }

//     const dto =
//       (precioTotalSinOferta - precioTotalOferta) / precioTotalSinOferta;

//     const precioRealPrincipalDecimales =
//       ((precioSinOfertaPrincipal - precioSinOfertaPrincipal * dto) *
//         unidadesOferta) %
//       1;
//     const precioRealSecundarioDecimales =
//       ((precioSinOfertaSecundario - precioSinOfertaSecundario * dto) *
//         unidadesOferta) %
//       1;

//     if (
//       Math.round(
//         (precioRealPrincipalDecimales * cantidadPrincipal +
//           precioRealSecundarioDecimales * cantidadSecundario) *
//           100
//       ) /
//         100 ===
//       1
//     ) {
//       const sumaCentimos = 0.01 / cantidadPrincipal;
//       return {
//         precioRealPrincipal:
//           Math.round(
//             (precioSinOfertaPrincipal - precioSinOfertaPrincipal * dto) *
//               unidadesOferta *
//               100
//           ) /
//             100 +
//           sumaCentimos,
//         precioRealSecundario:
//           Math.round(
//             (precioSinOfertaSecundario - precioSinOfertaSecundario * dto) *
//               unidadesOferta *
//               100
//           ) / 100,
//       };
//     }

//     return {
//       precioRealPrincipal:
//         Math.round(
//           (precioSinOfertaPrincipal - precioSinOfertaPrincipal * dto) *
//             unidadesOferta *
//             100
//         ) / 100,
//       precioRealSecundario:
//         Math.round(
//           (precioSinOfertaSecundario - precioSinOfertaSecundario * dto) *
//             unidadesOferta *
//             100
//         ) / 100,
//     };
//   }

//   /* Eze 4.0 . Calcula el precio real que tienen los artículos de una promoción tipo individual. Se reparten dividido sus unidades */
//   async calcularPrecioRealIndividual(
//     tipoPromo: number,
//     idPrincipal: number,
//     cantidadPrincipal: number,
//     unidadesOferta: number,
//     precioTotalOferta: number
//   ) {
//     let precioSinOfertaPrincipal = 0;
//     let precioTotalSinOferta = 0;
//     if (idPrincipal != 0) {
//       precioSinOfertaPrincipal = (
//         await articulosInstance.getInfoArticulo(idPrincipal)
//       ).precioConIva;
//     }

//     if (tipoPromo === 2) {
//       // INDIVIDUAL
//       if (idPrincipal != 0) {
//         precioTotalSinOferta =
//           precioSinOfertaPrincipal * cantidadPrincipal * unidadesOferta;
//       }
//     }

//     const dto =
//       (precioTotalSinOferta - precioTotalOferta) / precioTotalSinOferta;

//     return {
//       precioRealPrincipal:
//         Math.round(
//           (precioSinOfertaPrincipal - precioSinOfertaPrincipal * dto) *
//             unidadesOferta *
//             cantidadPrincipal *
//             100
//         ) / 100,
//     };
//   }

//   /* Eze 4.0 */
//   insertarPromociones = async (
//     arrayPromociones: PromocionesInterface[]
//   ) => await schPromociones.insertarPromociones(arrayPromociones);

//   /* Eze 4.0 */
//   getPromociones = async() => schPromociones.getPromociones();
// }

// export const promocionesInstance = new PromocionesClase();
