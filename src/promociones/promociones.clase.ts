import axios from "axios";
import { clienteInstance } from "../clientes/clientes.clase";
import { articulosInstance } from "../articulos/articulos.clase";
import { ArticulosInterface } from "../articulos/articulos.interface";
import { CestasInterface, ItemLista } from "../cestas/cestas.interface";
import { logger } from "../logger";
import {
  PromocionesInterface,
  //InfoPromocionIndividual,
  InfoPromocionCombo,
  PreciosReales,
  MediaPromoEncontrada,
  InfoPromoAplicar,
} from "./promociones.interface";
import * as schPromociones from "./promociones.mongodb";
import { TicketsInterface } from "../tickets/tickets.interface";
import { arrayClientesFacturacion } from "../clientes/clientes.interface";
import { promises } from "dns";
import { unwatchFile } from "fs";
import { impresoraInstance } from "src/impresora/impresora.class";
import { cestasInstance } from "src/cestas/cestas.clase";
import { convertirDineroEnPuntos } from "src/funciones/funciones";
import { parametrosInstance } from "src/parametros/parametros.clase";

export class NuevaPromocion {
  private promosIndividuales: PromocionesInterface[] = [];
  private promosCombo: PromocionesInterface[] = [];
  constructor() {
    schPromociones
      .getPromosCombo()
      .then((combos) => {
        this.promosCombo = combos;
      })
      .catch((err) => {
        logger.Error(128, err);
        this.promosCombo = [];
      });

    schPromociones
      .getPromosIndividuales()
      .then((individuales) => {
        this.promosIndividuales = individuales;
      })
      .catch((err) => {
        logger.Error(129, err);
        this.promosIndividuales = [];
      });
  }

  async getPromosCombo() {
    return await schPromociones.getPromosCombo();
  }

  async getPromosIndividuales() {
    return await schPromociones.getPromosIndividuales();
  }

  async getPromoById(idPromo) {
    return await schPromociones.getPromoById(idPromo);
  }

  async descargarPromociones() {
    try {
      let resPromos: any = await axios
        .get("promociones/getPromociones")
        .catch((e) => {});

      resPromos = resPromos?.data as PromocionesInterface[];
      if (resPromos && resPromos.length > 0) {
        return await schPromociones.insertarPromociones(resPromos);
      }
      throw Error("No hay promociones para descargar");
    } catch (e) {
      console.log(e);
    }
  }

  public async recargarPromosCache() {
    this.promosCombo = await this.getPromosCombo();
    this.promosIndividuales = await this.getPromosIndividuales();
  }
  public async gestionarPromociones(
    cesta: CestasInterface,
    idArticulo: ArticulosInterface["_id"],
    unidades: number
  ): Promise<boolean> {
    let unidadesTotales = unidades;
    let index1 = null;

    if (cesta.modo === "CONSUMO_PERSONAL" || cesta.modo === "DEVOLUCION")
      return false;

    if (cesta.idCliente) {
      const cliente = await clienteInstance.getClienteById(cesta.idCliente);
      if (cliente.albaran === true) {
        // No se les hace promociones a estos clientes
        return false;
      } else if (arrayClientesFacturacion.includes(cesta.idCliente)) {
        return false;
      }
    }

    for (let i = 0; i < cesta.lista.length; i++) {
      if (cesta.lista[i].idArticulo === idArticulo && !cesta.lista[i].regalo) {
        unidadesTotales += cesta.lista[i].unidades;
        index1 = i;
        break;
      }
    }

    /* INDIVIDUALES */

    /*    const promoIndividual = await this.buscarPromocionesIndividuales(
      idArticulo,
      unidadesTotales
    );
    if (promoIndividual) {
      if (index1 != null) cesta.lista.splice(index1, 1);
      this.aplicarPromoIndividual(cesta, promoIndividual);
      if (promoIndividual.sobran > 0)
        this.aplicarSobraIndividual(cesta, idArticulo, promoIndividual);
      return true;
    }
*/
    if (
      await this.intentarAplicarPromocionIndividual(cesta, idArticulo, unidades)
    )
      return true;

    /* COMBO */
    // const mediaPromo = this.buscarPromo(idArticulo, unidadesTotales);
    const promosPosibles = await this.buscarPromo(
      idArticulo,
      unidadesTotales,
      cesta
    );
    if (promosPosibles?.promosPrincipales?.length > 0) {
      for (let i = 0; i < promosPosibles.promosPrincipales.length; i++) {
        let mediaPromo = promosPosibles.promosPrincipales[i];
        if (mediaPromo) {
          let otraMediaPartePromo: MediaPromoEncontrada = null;
          let infoPromoAplicar: InfoPromoAplicar = null;

          if (mediaPromo.tipo === "SECUNDARIO") {
            otraMediaPartePromo = this.buscarPrincipal(
              mediaPromo,
              cesta,
              idArticulo
            );
            if (otraMediaPartePromo) {
              infoPromoAplicar = this.cuantasSePuedenAplicar(
                otraMediaPartePromo,
                mediaPromo
              );
              const articuloPrincipal = await articulosInstance.getInfoArticulo(
                cesta.lista[otraMediaPartePromo.indexCesta].idArticulo
              );
              const articuloSecundario =
                await articulosInstance.getInfoArticulo(idArticulo);

                const puntosArtPrinc = articuloPrincipal.puntos;
                const puntosArtSec = articuloSecundario.puntos;
              const infoFinal: InfoPromocionCombo = {
                ...infoPromoAplicar,
                indexListaOriginalPrincipal: otraMediaPartePromo.indexCesta,
                indexListaOriginalSecundario: index1,
                idArticuloPrincipal:
                  cesta.lista[otraMediaPartePromo.indexCesta].idArticulo,
                idArticuloSecundario: idArticulo,
                precioPromoUnitario:
                  this.promosCombo[mediaPromo.indexPromo].precioFinal,
                idPromocion: this.promosCombo[mediaPromo.indexPromo]._id,
                cantidadNecesariaPrincipal:
                  this.promosCombo[mediaPromo.indexPromo].cantidadPrincipal,
                cantidadNecesariaSecundario:
                  this.promosCombo[mediaPromo.indexPromo].cantidadSecundario,
                nombrePrincipal: articuloPrincipal.nombre,
                nombreSecundario: articuloSecundario.nombre,
              };
              this.deleteIndexCestaCombo(
                cesta,
                infoFinal.indexListaOriginalPrincipal,
                infoFinal.indexListaOriginalSecundario
              );
              const preciosReales = this.calcularPrecioRealCombo(
                infoFinal,
                articuloPrincipal,
                articuloSecundario
              );
              this.aplicarPromoCombo(
                cesta,
                infoFinal,
                articuloPrincipal,
                articuloSecundario,
                preciosReales
              );
              if (infoFinal.sobranPrincipal > 0)
                this.aplicarSobraComboPrincipal(cesta, infoFinal, puntosArtPrinc);
              if (infoFinal.sobranSecundario > 0)
                this.aplicarSobraComboSecundario(cesta, infoFinal, puntosArtSec);
              return true;
            }
          } else if (mediaPromo.tipo === "PRINCIPAL") {
            otraMediaPartePromo = this.buscarSecundario(
              mediaPromo,
              cesta,
              idArticulo
            );
            if (otraMediaPartePromo) {
              infoPromoAplicar = this.cuantasSePuedenAplicar(
                mediaPromo,
                otraMediaPartePromo
              );
              const articuloPrincipal =
                await articulosInstance.getInfoArticulo(idArticulo);
              const articuloSecundario =
                await articulosInstance.getInfoArticulo(
                  cesta.lista[otraMediaPartePromo.indexCesta].idArticulo
                );
                const puntosArtPrinc = articuloPrincipal.puntos;
                const puntosArtSec = articuloSecundario.puntos;

              const infoFinal: InfoPromocionCombo = {
                ...infoPromoAplicar,
                indexListaOriginalPrincipal: index1,
                indexListaOriginalSecundario: otraMediaPartePromo.indexCesta,
                idArticuloPrincipal: idArticulo,
                idArticuloSecundario:
                  cesta.lista[otraMediaPartePromo.indexCesta].idArticulo,
                precioPromoUnitario:
                  this.promosCombo[mediaPromo.indexPromo].precioFinal,
                idPromocion: this.promosCombo[mediaPromo.indexPromo]._id,
                cantidadNecesariaPrincipal:
                  this.promosCombo[mediaPromo.indexPromo].cantidadPrincipal,
                cantidadNecesariaSecundario:
                  this.promosCombo[mediaPromo.indexPromo].cantidadSecundario,
                nombrePrincipal: articuloPrincipal.nombre,
                nombreSecundario: articuloSecundario.nombre,
              };
              this.deleteIndexCestaCombo(
                cesta,
                infoFinal.indexListaOriginalPrincipal,
                infoFinal.indexListaOriginalSecundario
              );
              const preciosReales = this.calcularPrecioRealCombo(
                infoFinal,
                articuloPrincipal,
                articuloSecundario
              );
              this.aplicarPromoCombo(
                cesta,
                infoFinal,
                articuloPrincipal,
                articuloSecundario,
                preciosReales
              );
              if (infoFinal.sobranPrincipal > 0)
                this.aplicarSobraComboPrincipal(cesta, infoFinal, puntosArtPrinc);
              if (infoFinal.sobranSecundario > 0)
                this.aplicarSobraComboSecundario(cesta, infoFinal, puntosArtSec);
              return true;
            }
          }
        }
      }
    } else if (promosPosibles.promosSecundarios?.length > 0) {
      for (let i = 0; i < promosPosibles.promosSecundarios.length; i++) {
        let mediaPromo = promosPosibles.promosSecundarios[i];
        if (mediaPromo) {
          let otraMediaPartePromo: MediaPromoEncontrada = null;
          let infoPromoAplicar: InfoPromoAplicar = null;

          if (mediaPromo.tipo === "SECUNDARIO") {
            otraMediaPartePromo = this.buscarPrincipal(
              mediaPromo,
              cesta,
              idArticulo
            );
            if (otraMediaPartePromo) {
              infoPromoAplicar = this.cuantasSePuedenAplicar(
                otraMediaPartePromo,
                mediaPromo
              );
              const articuloPrincipal = await articulosInstance.getInfoArticulo(
                cesta.lista[otraMediaPartePromo.indexCesta].idArticulo
              );
              const articuloSecundario =
                await articulosInstance.getInfoArticulo(idArticulo);
              const puntosArtPrinc = articuloPrincipal.puntos;
              const puntosArtSec = articuloSecundario.puntos;
              const infoFinal: InfoPromocionCombo = {
                ...infoPromoAplicar,
                indexListaOriginalPrincipal: otraMediaPartePromo.indexCesta,
                indexListaOriginalSecundario: index1,
                idArticuloPrincipal:
                  cesta.lista[otraMediaPartePromo.indexCesta].idArticulo,
                idArticuloSecundario: idArticulo,
                precioPromoUnitario:
                  this.promosCombo[mediaPromo.indexPromo].precioFinal,
                idPromocion: this.promosCombo[mediaPromo.indexPromo]._id,
                cantidadNecesariaPrincipal:
                  this.promosCombo[mediaPromo.indexPromo].cantidadPrincipal,
                cantidadNecesariaSecundario:
                  this.promosCombo[mediaPromo.indexPromo].cantidadSecundario,
                nombrePrincipal: articuloPrincipal.nombre,
                nombreSecundario: articuloSecundario.nombre,
              };
              this.deleteIndexCestaCombo(
                cesta,
                infoFinal.indexListaOriginalPrincipal,
                infoFinal.indexListaOriginalSecundario
              );
              const preciosReales = this.calcularPrecioRealCombo(
                infoFinal,
                articuloPrincipal,
                articuloSecundario
              );
              this.aplicarPromoCombo(
                cesta,
                infoFinal,
                articuloPrincipal,
                articuloSecundario,
                preciosReales
              );
              if (infoFinal.sobranPrincipal > 0)
                this.aplicarSobraComboPrincipal(cesta, infoFinal, puntosArtPrinc);
              if (infoFinal.sobranSecundario > 0)
                this.aplicarSobraComboSecundario(cesta, infoFinal, puntosArtSec);
              return true;
            }
          } else if (mediaPromo.tipo === "PRINCIPAL") {
            otraMediaPartePromo = this.buscarSecundario(
              mediaPromo,
              cesta,
              idArticulo
            );
            if (otraMediaPartePromo) {
              infoPromoAplicar = this.cuantasSePuedenAplicar(
                mediaPromo,
                otraMediaPartePromo
              );
              const articuloPrincipal =
                await articulosInstance.getInfoArticulo(idArticulo);
              const articuloSecundario =
                await articulosInstance.getInfoArticulo(
                  cesta.lista[otraMediaPartePromo.indexCesta].idArticulo
                );
              const puntosArtPrinc = articuloPrincipal.puntos;
              const puntosArtSec = articuloSecundario.puntos;

              const infoFinal: InfoPromocionCombo = {
                ...infoPromoAplicar,
                indexListaOriginalPrincipal: index1,
                indexListaOriginalSecundario: otraMediaPartePromo.indexCesta,
                idArticuloPrincipal: idArticulo,
                idArticuloSecundario:
                  cesta.lista[otraMediaPartePromo.indexCesta].idArticulo,
                precioPromoUnitario:
                  this.promosCombo[mediaPromo.indexPromo].precioFinal,
                idPromocion: this.promosCombo[mediaPromo.indexPromo]._id,
                cantidadNecesariaPrincipal:
                  this.promosCombo[mediaPromo.indexPromo].cantidadPrincipal,
                cantidadNecesariaSecundario:
                  this.promosCombo[mediaPromo.indexPromo].cantidadSecundario,
                nombrePrincipal: articuloPrincipal.nombre,
                nombreSecundario: articuloSecundario.nombre,
              };
              this.deleteIndexCestaCombo(
                cesta,
                infoFinal.indexListaOriginalPrincipal,
                infoFinal.indexListaOriginalSecundario
              );
              const preciosReales = this.calcularPrecioRealCombo(
                infoFinal,
                articuloPrincipal,
                articuloSecundario
              );
              this.aplicarPromoCombo(
                cesta,
                infoFinal,
                articuloPrincipal,
                articuloSecundario,
                preciosReales
              );
              if (infoFinal.sobranPrincipal > 0)
                this.aplicarSobraComboPrincipal(
                  cesta,
                  infoFinal,
                  puntosArtPrinc
                );
              if (infoFinal.sobranSecundario > 0)
                this.aplicarSobraComboSecundario(
                  cesta,
                  infoFinal,
                  puntosArtSec
                );
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  /* Eze 4.0 */
  private cuantasSePuedenAplicar(
    mediaPromoPrincipal: MediaPromoEncontrada,
    mediaPromoSecundaria: MediaPromoEncontrada
  ): InfoPromoAplicar {
    const unidadesPromo = Math.min(
      mediaPromoPrincipal.cantidadPromos,
      mediaPromoSecundaria.cantidadPromos
    );
    const sobranPrincipal =
      (mediaPromoPrincipal.cantidadPromos - unidadesPromo) *
        this.promosCombo[mediaPromoPrincipal.indexPromo].cantidadPrincipal +
      mediaPromoPrincipal.sobran;
    const sobranSecundario =
      (mediaPromoSecundaria.cantidadPromos - unidadesPromo) *
        this.promosCombo[mediaPromoSecundaria.indexPromo].cantidadSecundario +
      mediaPromoSecundaria.sobran;
    return { seAplican: unidadesPromo, sobranPrincipal, sobranSecundario };
  }

  // mssql datetime no tiene timezone, al pasar a JSON la date se pasa a string con timezone Z (UTC)
  // las fechas en la tabla del sql del WEB productespromocionats se refieren a la timezone local de la tienda (mirar documentación de HIT)
  private mssqlDateToJsDate(strdate: string) {
    // quitar timezone Z, si la fecha no tiene timezone se usa la local (si la fecha es fecha-hora)
    if (strdate.endsWith("Z")) strdate = strdate.slice(0, -1);
    return new Date(strdate);
  }

  private async comprovarIntervaloFechas(promocion) {
    let fechaInicio = promocion.fechaInicio;
    let fechaFinal = promocion.fechaFinal;
    let diaInicio = this.obtenerDiaSemana(fechaInicio);
    let diaFinal = this.obtenerDiaSemana(fechaFinal);
    let anoPromocion = this.obtenerAno(fechaInicio);
    let fechaActual = new Date();
    var diaActual = fechaActual.getDay();

    var dateInicio = this.mssqlDateToJsDate(fechaInicio);
    var dateFinal = this.mssqlDateToJsDate(fechaFinal);

    // condicion para saber si la promocion es de una fecha en especifico
    if (anoPromocion == 2007) {
      // si da 7, la promocion esta activa todos los dias
      if (
        (diaActual == diaInicio && diaActual == diaFinal) ||
        diaInicio == 7 ||
        diaFinal == 7 // diaInicio puede ser diferente a diaFinal ?
      ) {
        // En los casos en los que solo se mira la hora, los segundos son 00 en la base de datos, solo comprobar hora y minutos
        // la hora final se entiende que es inclusiva <=
        var m_inicio = dateInicio.getHours() * 60 + dateInicio.getMinutes(); // minutos desde las 00:00 de fechaInicio
        var m_final = dateFinal.getHours() * 60 + dateFinal.getMinutes(); // minutos de fechaFinal

        var m_actual = fechaActual.getHours() * 60 + fechaActual.getMinutes(); // minutos de fechaActual

        if (m_inicio <= m_actual && m_actual <= m_final) return true;
      }
      // comprovacion si la fecha de hoy esta en el intervalo utilizado.
    } else if (
      fechaActual.getTime() >= dateInicio.getTime() &&
      fechaActual.getTime() <= dateFinal.getTime()
    ) {
      return true;
    }
    // devolvemos false si la promocion no esta activa hoy.
    return false;
  }
  private obtenerDiaSemana(fecha) {
    var dia = parseInt(fecha.slice(8, 10), 10);

    // Ajustar el día de la semana para que 08 sea lunes, 09 sea martes, etc.
    switch (dia) {
      case 1:
        return 7;
      case 8:
        return 1; // Lunes
      case 9:
        return 2; // Martes
      case 10:
        return 3; // Miércoles
      case 11:
        return 4; // Jueves
      case 12:
        return 5; // Viernes
      case 13:
        return 6; // Sábado
      case 14:
        return 0; // Domingo
      default:
        return -1; // Valor inválido
    }
  }
  private obtenerAno(fecha) {
    var ano = parseInt(fecha.slice(0, 4), 10);

    // Ajustar el día de la semana para que 08 sea lunes, 09 sea martes, etc.
    return ano;
  }

  /*
    intentar aplicar una promo individual nueva con las unidades de idArticulo a añadir,
    false: si no se ha se han modificado las promos individuales que ya estaban aplicadas, las unidades se tendran que añadir a la cesta despues,
    true: las unidades de articulo han modificado las promos y ya se han añadido.
  */
  private async intentarAplicarPromocionIndividual(
    cesta: CestasInterface,
    idArticulo: ArticulosInterface["_id"],
    unidades: number
  ): Promise<boolean> {
    // itemsCestaPromo: Map con los items de la cesta que son promos individuales del articulo (key:id promocion)
    let itemsCestaPromo = new Map<string, ItemLista>();
    let itemCestaSinPromo: ItemLista; // item de la cesta del articulo normal (sin promo)

    // calcular las unidadesTotales del articulo en los items de la cesta (promos indiciduales y item sin promo) + unidades a añadir
    let unidadesTotales = unidades;

    for (let itemCesta of cesta.lista) {
      if (!itemCesta.regalo) {
        // no contar para la promo los items de la cesta de regalo
        if (itemCesta.idArticulo === idArticulo) {
          unidadesTotales += itemCesta.unidades;
          itemCestaSinPromo = itemCesta;
        } else if (
          itemCesta.promocion &&
          itemCesta.promocion.tipoPromo == "INDIVIDUAL" &&
          itemCesta.promocion.idArticuloPrincipal === idArticulo
        ) {
          unidadesTotales +=
            itemCesta.unidades * itemCesta.promocion.cantidadArticuloPrincipal;
          itemsCestaPromo.set(itemCesta.promocion.idPromocion, itemCesta);
        }
      }
    }

    // promos individuales que contienen el articulo y que se pueden aplicar (número de unidades<=totales e intervalo de fecha promo)
    let promosArt: {
      unidadesPorPromo: number;
      promoInd: PromocionesInterface;
    }[] = [];
    for (let promoInd of this.promosIndividuales) {
      let idsArticulos: number[];
      let unidadesPorPromo: number;

      if (promoInd.principal?.length > 0) {
        idsArticulos = promoInd.principal;
        unidadesPorPromo = promoInd.cantidadPrincipal;
      } else if (promoInd.secundario?.length > 0) {
        idsArticulos = promoInd.secundario;
        unidadesPorPromo = promoInd.cantidadSecundario;
      } else {
        continue;
      }

      for (let idArt of idsArticulos) {
        if (
          idArt === idArticulo &&
          unidadesTotales >= unidadesPorPromo &&
          (await this.comprovarIntervaloFechas(promoInd))
        ) {
          promosArt.push({ unidadesPorPromo, promoInd });
        }
      }
    }
    promosArt.sort((a, b) => b.unidadesPorPromo - a.unidadesPorPromo); // ordenar por unidadesPorPromo descendiente

    const articulo = await articulosInstance.getInfoArticulo(idArticulo);
    const conversorPuntos =
      (await parametrosInstance.getParametros()).promocioDescompteFixe || 0;
    let puntos = convertirDineroEnPuntos(
      articulo.precioConIva,
      conversorPuntos
    );
    let cambioEnPromos = false; // modificar, añadir o eliminar alguna promo de las que estaban aplicadas
    let unidadesRestantes = unidadesTotales;
    for (let promoArt of promosArt) {
      let cantidadPromos = Math.trunc(
        unidadesRestantes / promoArt.unidadesPorPromo
      );
      if (cantidadPromos > 0) {
        let precioUnidad = promoArt.promoInd.precioFinal;
        unidadesRestantes -= cantidadPromos * promoArt.unidadesPorPromo;
        let itemCesta = itemsCestaPromo.get(promoArt.promoInd._id);
        if (itemCesta) {
          // promo ya existe en la cesta
          if (itemCesta.unidades != cantidadPromos) {
            // se ha modificado la cantidad de promos de esta promo
            cambioEnPromos = true;
            itemCesta.unidades = cantidadPromos;
            itemCesta.subtotal = Number(
              (
                cantidadPromos *
                promoArt.unidadesPorPromo *
                precioUnidad
              ).toFixed(2)
            );
            itemCesta.puntos =
              puntos * cantidadPromos * promoArt.unidadesPorPromo;
            itemCesta.promocion.unidadesOferta = cantidadPromos;
          }
          itemsCestaPromo.delete(promoArt.promoInd._id); // promo ya procesada, eliminar de los items por procesar
        } else {
          // promo no existe en la cesta, crear item y añadirlo a la cesta
          cambioEnPromos = true;
          //let promoMenosCantidad = (promosArt[promosArt.length-1] == promoArt);
          puntos = puntos * promoArt.unidadesPorPromo * cantidadPromos;
          cesta.lista.push({
            arraySuplementos: null,
            gramos: 0,
            idArticulo: -1,
            unidades: cantidadPromos,
            nombre:
              "Promo. " +
              articulo.nombre /*+ (promoMenosCantidad ? "" : " ("+promoArt.cantidad+")")*/,
            impresora: null,
            regalo: false,
            subtotal: Number(
              (
                cantidadPromos *
                promoArt.unidadesPorPromo *
                precioUnidad
              ).toFixed(2)
            ),
            puntos: puntos,
            promocion: {
              idPromocion: promoArt.promoInd._id,
              tipoPromo: "INDIVIDUAL",
              unidadesOferta: cantidadPromos,
              idArticuloPrincipal: idArticulo,
              cantidadArticuloPrincipal: promoArt.unidadesPorPromo,
              cantidadArticuloSecundario: null,
              idArticuloSecundario: null,
              precioRealArticuloPrincipal: precioUnidad,
              precioRealArticuloSecundario: null,
            },
          });
        }
      }
    }

    // borrar de la cesta los items de promo que ahora tienen 0 unidades
    for (let itemCesta of itemsCestaPromo.values()) {
      cambioEnPromos = true;
      cesta.lista.splice(cesta.lista.indexOf(itemCesta), 1);
    }

    if (!cambioEnPromos) return false; // No han habido promociones nuevas, los articulos se añadiran como un item de la cesta normal(sin promo)

    // borrar item cesta sin promo y crear nueva si es necesaria
    if (itemCestaSinPromo)
      cesta.lista.splice(cesta.lista.indexOf(itemCestaSinPromo), 1);
    if (unidadesRestantes) {
      let subtotal = Number(
        (unidadesRestantes * articulo.precioConIva).toFixed(2)
      );
      let porcentajeConversion =
        (await parametrosInstance.getParametros()).promocioDescompteFixe || 0;
      let puntos = convertirDineroEnPuntos(subtotal, porcentajeConversion);
      cesta.lista.push({
        arraySuplementos: null,
        gramos: null,
        idArticulo,
        nombre: articulo.nombre,
        promocion: null,
        puntos: puntos,
        impresora: articulo.impresora,
        regalo: false,
        subtotal: subtotal,
        unidades: unidadesRestantes,
      });
    }
    let numProductos = 0;
    let total = 0;
    for (let i = 0; i < cesta.lista.length; i++) {
      if (cesta.lista[i].gramos == null) {
        numProductos += cesta.lista[i].unidades;
      } else {
        numProductos++;
      }
      total += cesta.lista[i].subtotal;
    }
    impresoraInstance.mostrarVisor({
      total: total.toFixed(2),
      precio: articulo.precioConIva.toFixed(2),
      texto: articulo.nombre,
      numProductos: numProductos,
    });
    return true;
  }

  /*

  private async buscarPromocionesIndividuales(
    idArticulo: ArticulosInterface["_id"],
    unidadesTotales: number
  ): Promise<InfoPromocionIndividual> {
    for (let i = 0; i < this.promosIndividuales.length; i++) {
      if (
        this.promosIndividuales[i].principal &&
        this.promosIndividuales[i].principal.length > 0
      ) {
        for (let j = 0; j < this.promosIndividuales[i].principal.length; j++) {
          if (
            this.promosIndividuales[i].principal[j] === idArticulo &&
            unidadesTotales >= this.promosIndividuales[i].cantidadPrincipal &&
            // comprovar si la promocion esta activada hoy
            (await this.comprovarIntervaloFechas(this.promosIndividuales[i]))
          ) {
            // Hay oferta
            const cantidadPromos = Math.trunc(
              unidadesTotales / this.promosIndividuales[i].cantidadPrincipal
            );
            const sobran =
              unidadesTotales % this.promosIndividuales[i].cantidadPrincipal;
            const nombreArticulo = (
              await articulosInstance.getInfoArticulo(idArticulo)
            ).nombre;
            return {
              cantidadPromos,
              sobran,
              precioConIva:
                this.promosIndividuales[i].precioFinal *
                cantidadPromos *
                this.promosIndividuales[i].cantidadPrincipal,
              idPromocion: this.promosIndividuales[i]._id,
              nombreArticulo,
              idArticulo,
              cantidadNecesaria: this.promosIndividuales[i].cantidadPrincipal,
              precioUnidad: this.promosIndividuales[i].precioFinal,
            };
          }
        }
      } else if (
        this.promosIndividuales[i].secundario &&
        this.promosIndividuales[i].secundario.length > 0 &&
        // comprovar si la promocion esta activada hoy
        (await this.comprovarIntervaloFechas(this.promosIndividuales[i]))
      ) {
        for (let j = 0; j < this.promosIndividuales[i].secundario.length; j++) {
          if (
            this.promosIndividuales[i].secundario[j] === idArticulo &&
            unidadesTotales >= this.promosIndividuales[i].cantidadSecundario
          ) {
            // Hay oferta
            const cantidadPromos = Math.trunc(
              unidadesTotales / this.promosIndividuales[i].cantidadSecundario
            );
            const sobran =
              unidadesTotales % this.promosIndividuales[i].cantidadSecundario;
            const nombreArticulo = (
              await articulosInstance.getInfoArticulo(idArticulo)
            ).nombre;
            return {
              cantidadPromos,
              sobran,
              precioConIva:
                this.promosIndividuales[i].precioFinal *
                cantidadPromos *
                this.promosIndividuales[i].cantidadSecundario,
              idPromocion: this.promosIndividuales[i]._id,
              nombreArticulo,
              idArticulo,
              cantidadNecesaria: this.promosIndividuales[i].cantidadSecundario,
              precioUnidad: this.promosIndividuales[i].precioFinal,
            };
          }
        }
      }
    }
    return null;
  }
*/
  private async buscarPromo(
    idArticulo: ArticulosInterface["_id"],
    unidadesTotales: number,
    cesta: CestasInterface
  ): Promise<{
    promosSecundarios: MediaPromoEncontrada[];
    promosPrincipales: MediaPromoEncontrada[];
  }> {
    const promosSecundarios = [];
    const promosPrincipales = [];

    for (let c = 0; c < cesta.lista.length; c++) {
      cesta.lista[c].idArticulo;

      for (let i = 0; i < this.promosCombo.length; i++) {
        if (
          this.promosCombo[i].secundario &&
          this.promosCombo[i].secundario.length > 0
        ) {
          // Buscar comenzando por el secundario en el else
          for (let j = 0; j < this.promosCombo[i].secundario.length; j++) {
            if (
              this.promosCombo[i].secundario[j] === idArticulo &&
              unidadesTotales >= this.promosCombo[i].cantidadSecundario
            ) {
              if (this.promosCombo[i]?.principal?.length > 0) {
                // Buscar comenzando por el secundario en el else
                for (let k = 0; k < this.promosCombo[i].principal.length; k++) {
                  if (
                    this.promosCombo[i].principal[k] ===
                      cesta.lista[c].idArticulo &&
                    !cesta.lista[c].regalo &&
                    // comprovar si la promocion esta activada hoy
                    (await this.comprovarIntervaloFechas(this.promosCombo[i]))
                  ) {
                    const cantidadPromos = Math.trunc(
                      unidadesTotales / this.promosCombo[i].cantidadSecundario
                    );
                    const sobran =
                      unidadesTotales % this.promosCombo[i].cantidadSecundario;
                    promosSecundarios.push({
                      indexPromo: i,
                      cantidadPromos,
                      sobran,
                      tipo: "SECUNDARIO",
                      indexCesta: null,
                    });
                  }
                }
              }
            }
          }
        }

        if (this.promosCombo[i]?.principal?.length > 0) {
          for (let j = 0; j < this.promosCombo[i].principal.length; j++) {
            if (
              this.promosCombo[i].principal[j] === idArticulo &&
              unidadesTotales >= this.promosCombo[i].cantidadPrincipal
            ) {
              if (this.promosCombo[i]?.secundario?.length > 0) {
                // Buscar comenzando por el secundario en el else
                for (
                  let k = 0;
                  k < this.promosCombo[i].secundario.length;
                  k++
                ) {
                  if (
                    this.promosCombo[i].secundario[k] ===
                      cesta.lista[c].idArticulo &&
                    !cesta.lista[c].regalo &&
                    // comprovar si la promocion esta activada hoy
                    (await this.comprovarIntervaloFechas(this.promosCombo[i]))
                  ) {
                    const cantidadPromos = Math.trunc(
                      unidadesTotales / this.promosCombo[i].cantidadPrincipal
                    );
                    const sobran =
                      unidadesTotales % this.promosCombo[i].cantidadPrincipal;
                    promosPrincipales.push({
                      indexPromo: i,
                      cantidadPromos,
                      sobran,
                      tipo: "PRINCIPAL",
                      indexCesta: null,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
    return {
      promosSecundarios,
      promosPrincipales,
    };
  }

  /* Eze 4.0 */
  private buscarSecundario(
    mediaPromo: MediaPromoEncontrada,
    cesta: CestasInterface,
    idIgnorarArticulo: number
  ): MediaPromoEncontrada {
    for (let i = 0; i < cesta.lista.length; i++) {
      if (
        cesta.lista[i].idArticulo === idIgnorarArticulo ||
        cesta.lista[i].regalo
      )
        continue;
      for (
        let j = 0;
        j < this.promosCombo[mediaPromo.indexPromo].secundario.length;
        j++
      ) {
        if (
          cesta.lista[i].idArticulo ===
            this.promosCombo[mediaPromo.indexPromo].secundario[j] &&
          cesta.lista[i].unidades >=
            this.promosCombo[mediaPromo.indexPromo].cantidadSecundario
        ) {
          const cantidadPromos = Math.trunc(
            cesta.lista[i].unidades /
              this.promosCombo[mediaPromo.indexPromo].cantidadSecundario
          );
          const sobran =
            cesta.lista[i].unidades %
            this.promosCombo[mediaPromo.indexPromo].cantidadSecundario;
          return {
            indexPromo: mediaPromo.indexPromo,
            cantidadPromos,
            sobran,
            tipo: "SECUNDARIO",
            indexCesta: i,
          };
        }
      }
    }
    return null;
  }

  /* Eze 4.0 */
  private buscarPrincipal(
    mediaPromo: MediaPromoEncontrada,
    cesta: CestasInterface,
    idIgnorarArticulo: number
  ): MediaPromoEncontrada {
    for (let i = 0; i < cesta.lista.length; i++) {
      if (
        cesta.lista[i].idArticulo === idIgnorarArticulo ||
        cesta.lista[i].regalo
      )
        continue;
      for (
        let j = 0;
        j < this.promosCombo[mediaPromo.indexPromo].principal.length;
        j++
      ) {
        if (
          cesta.lista[i].idArticulo ===
            this.promosCombo[mediaPromo.indexPromo].principal[j] &&
          cesta.lista[i].unidades >=
            this.promosCombo[mediaPromo.indexPromo].cantidadPrincipal
        ) {
          const cantidadPromos = Math.trunc(
            cesta.lista[i].unidades /
              this.promosCombo[mediaPromo.indexPromo].cantidadPrincipal
          );
          const sobran =
            cesta.lista[i].unidades %
            this.promosCombo[mediaPromo.indexPromo].cantidadPrincipal;
          return {
            indexPromo: mediaPromo.indexPromo,
            cantidadPromos,
            sobran,
            tipo: "PRINCIPAL",
            indexCesta: i,
          };
        }
      }
    }
    return null;
  }
  /*
  private aplicarPromoIndividual(
    cesta: CestasInterface,
    data: InfoPromocionIndividual
  ) {
    let nom = "Promo. " + data.nombreArticulo;
    let promocioNou = true;
    for (let i = 0; i < cesta.lista.length; i++) {
      if (nom == cesta.lista[i].nombre && promocioNou) {
        data.cantidadPromos > 1
          ? (cesta.lista[i].unidades += data.cantidadPromos)
          : cesta.lista[i].unidades++;

        cesta.lista[i].subtotal = Number(
          (cesta.lista[i].subtotal + data.precioConIva).toFixed(2)
        );
        promocioNou = false;
      }
    }
    if (promocioNou) {
      cesta.lista.push({
        arraySuplementos: null,
        gramos: 0,
        idArticulo: -1,
        unidades: data.cantidadPromos,
        nombre: "Promo. " + data.nombreArticulo,
        regalo: false,
        subtotal: Number(data.precioConIva.toFixed(2)),
        puntos: null,
        impresora: null,
        promocion: {
          idPromocion: data.idPromocion,
          tipoPromo: "INDIVIDUAL",
          unidadesOferta: data.cantidadPromos,
          idArticuloPrincipal: data.idArticulo,
          cantidadArticuloPrincipal: data.cantidadNecesaria,
          cantidadArticuloSecundario: null,
          idArticuloSecundario: null,
          precioRealArticuloPrincipal: data.precioUnidad,
          precioRealArticuloSecundario: null,
        },
      });
    }
  }
*/
  private aplicarPromoCombo(
    cesta: CestasInterface,
    data: InfoPromocionCombo,
    articuloPrincipal: ArticulosInterface,
    articuloSecundario: ArticulosInterface,
    preciosReales: PreciosReales
  ) {
    let nom = `Promo. ${articuloPrincipal.nombre} + ${articuloSecundario.nombre}`;
    let promocioNou = true;
    for (let i = 0; i < cesta.lista.length; i++) {
      if (nom == cesta.lista[i].nombre && promocioNou) {
        cesta.lista[i].unidades++;
        cesta.lista[i].subtotal += data.precioPromoUnitario * data.seAplican;
        promocioNou = false;
      }
    }
    if (promocioNou) {
      cesta.lista.push({
        arraySuplementos: null,
        gramos: 0,
        idArticulo: -1,
        unidades: data.seAplican,
        nombre: `Promo. ${articuloPrincipal.nombre} + ${articuloSecundario.nombre}`,
        regalo: false,
        puntos: articuloPrincipal.puntos + articuloSecundario.puntos,
        subtotal: data.precioPromoUnitario * data.seAplican,
        impresora: null,
        promocion: {
          idPromocion: data.idPromocion,
          tipoPromo: "COMBO",
          unidadesOferta: data.seAplican,
          idArticuloPrincipal: data.idArticuloPrincipal,
          cantidadArticuloPrincipal: data.cantidadNecesariaPrincipal,
          cantidadArticuloSecundario: data.cantidadNecesariaSecundario,
          idArticuloSecundario: data.idArticuloSecundario,
          precioRealArticuloPrincipal: preciosReales.precioRealPrincipal,
          precioRealArticuloSecundario: preciosReales.precioRealSecundario,
        },
      });
    }
    let numProductos = 0;
    let total = 0;
    for (let i = 0; i < cesta.lista.length; i++) {
      if (cesta.lista[i].gramos == null) {
        numProductos += cesta.lista[i].unidades;
      } else {
        numProductos++;
      }
      total += cesta.lista[i].subtotal;
    }
    impresoraInstance.mostrarVisor({
      total: total,
      precio: data.precioPromoUnitario * data.seAplican,
      texto: `Promo. ${articuloPrincipal.nombre} + ${articuloSecundario.nombre}`,
      numProductos: numProductos,
    });
  }
  public redondearDecimales(numero, decimales) {
    let numeroRegexp = new RegExp("\\d\\.(\\d){" + decimales + ",}"); // Expresion regular para numeros con un cierto numero de decimales o mas
    if (numeroRegexp.test(numero)) {
      // Ya que el numero tiene el numero de decimales requeridos o mas, se realiza el redondeo
      return Number(numero.toFixed(decimales));
    } else {
      return Number(numero.toFixed(decimales)) === 0 ? 0 : numero; // En valores muy bajos, se comprueba si el numero es 0 (con el redondeo deseado), si no lo es se devuelve el numero otra vez.
    }
  }
  calcularPrecioRealCombo(
    data: InfoPromocionCombo,
    articuloPrincipal: ArticulosInterface,
    articuloSecundario: ArticulosInterface
  ): PreciosReales {
    let precioTotalSinOferta = 0;

    const precioSinOfertaPrincipal = articuloPrincipal.precioConIva;
    const precioSinOfertaSecundario = articuloSecundario.precioConIva;

    precioTotalSinOferta =
      (precioSinOfertaPrincipal * data.cantidadNecesariaPrincipal +
        precioSinOfertaSecundario * data.cantidadNecesariaSecundario) *
      data.seAplican;

    const dto =
      (precioTotalSinOferta - data.precioPromoUnitario) / precioTotalSinOferta;

    // const precioRealPrincipalDecimales = ((precioSinOfertaPrincipal - precioSinOfertaPrincipal * dto) * data.seAplican) % 1;
    // const precioRealSecundarioDecimales = ((precioSinOfertaSecundario - precioSinOfertaSecundario * dto) * data.seAplican) % 1;

    // if (
    //   Math.round(
    //     (precioRealPrincipalDecimales * data.cantidadNecesariaPrincipal +
    //       precioRealSecundarioDecimales * data.cantidadNecesariaSecundario) *
    //       100
    //   ) /
    //     100 ===
    //   1
    // ) {
    //   const sumaCentimos = 0.01 / data.cantidadNecesariaPrincipal;
    //   return {
    //     precioRealPrincipal:
    //       Math.round(
    //         (precioSinOfertaPrincipal - precioSinOfertaPrincipal * dto) *
    //           data.seAplican *
    //           100
    //       ) /
    //         100 +
    //       sumaCentimos,
    //     precioRealSecundario:
    //       Math.round(
    //         (precioSinOfertaSecundario - precioSinOfertaSecundario * dto) *
    //           data.seAplican *
    //           100
    //       ) / 100,
    //   };
    // }

    const devolver = {
      precioRealPrincipal:
        Math.round(
          (precioSinOfertaPrincipal - precioSinOfertaPrincipal * dto) *
            data.seAplican *
            100
        ) / 100,
      precioRealSecundario:
        Math.round(
          (precioSinOfertaSecundario - precioSinOfertaSecundario * dto) *
            data.seAplican *
            100
        ) / 100,
    };

    if (
      this.redondearDecimales(
        devolver.precioRealPrincipal * data.cantidadNecesariaPrincipal +
          devolver.precioRealSecundario * data.cantidadNecesariaSecundario,
        2
      ) !== data.precioPromoUnitario
    ) {
      const diferencia = this.redondearDecimales(
        devolver.precioRealPrincipal * data.cantidadNecesariaPrincipal +
          devolver.precioRealSecundario * data.cantidadNecesariaSecundario -
          data.precioPromoUnitario,
        2
      );

      if (data.cantidadNecesariaPrincipal < data.cantidadNecesariaSecundario) {
        devolver.precioRealPrincipal += diferencia * -1;
      } else {
        devolver.precioRealSecundario += diferencia * -1;
      }
    }
    return devolver;
  }

  private deleteIndexCestaCombo(
    cesta: CestasInterface,
    indexPrincipal: number,
    indexSecundario: number
  ) {
    const deleteIndexes: number[] = [];
    if (indexPrincipal != null && indexPrincipal != undefined) {
      deleteIndexes.push(indexPrincipal);
    }

    if (indexSecundario != null && indexSecundario != undefined) {
      deleteIndexes.push(indexSecundario);
    }
    deleteIndexes.sort();
    for (let i = deleteIndexes.length - 1; i >= 0; i--) {
      cesta.lista.splice(deleteIndexes[i], 1);
    }
  }

  /*
  private aplicarSobraIndividual(
    cesta: CestasInterface,
    idArticulo: ArticulosInterface["_id"],
    data: InfoPromocionIndividual
  ) {
    cesta.lista.push({
      arraySuplementos: null,
      gramos: 0,
      idArticulo,
      nombre: data.nombreArticulo,
      promocion: null,
      puntos: null,
      regalo: false,
      impresora: null,
      subtotal: null,
      unidades: data.sobran,
    });
  }
*/
  private aplicarSobraComboPrincipal(
    cesta: CestasInterface,
    data: InfoPromocionCombo,
    puntos: number
  ) {
    cesta.lista.push({
      idArticulo: data.idArticuloPrincipal,
      nombre: data.nombrePrincipal,
      arraySuplementos: null,
      promocion: null,
      varis: false,
      regalo: false,
      puntos: puntos * data.sobranPrincipal,
      impresora: null,
      subtotal: null,
      unidades: data.sobranPrincipal,
      gramos: null,
    });
  }
  private aplicarSobraComboSecundario(
    cesta: CestasInterface,
    data: InfoPromocionCombo,
    puntos: number
  ) {
    cesta.lista.push({
      idArticulo: data.idArticuloSecundario,
      nombre: data.nombreSecundario,
      arraySuplementos: null,
      promocion: null,
      varis: false,
      regalo: false,
      puntos: puntos * data.sobranSecundario,
      impresora: null,
      subtotal: null,
      unidades: data.sobranSecundario,
      gramos: null,
    });
  }

  /* Eze 4.0 */
  public insertarPromociones = async (
    arrayPromociones: PromocionesInterface[]
  ) => {
    if (arrayPromociones && arrayPromociones.length > 0) {
      await schPromociones.insertarPromociones(arrayPromociones);
    }
    return null;
  };

  /* Eze 4.0 */
  public deshacerPromociones(
    ticket: TicketsInterface
  ): TicketsInterface["cesta"]["lista"] {
    let valor = ticket.total < 0 ? -1 : 1;
    const nuevaLista = [];
    for (let i = 0; i < ticket.cesta.lista.length; i++) {
      if (ticket.cesta.lista[i].promocion) {
        if (ticket.cesta.lista[i].promocion.tipoPromo === "COMBO") {
          nuevaLista.push({
            arraySuplementos: null,
            gramos: null,
            idArticulo: ticket.cesta.lista[i].promocion.idArticuloPrincipal,
            regalo: false,
            puntos: null,
            promocion: null,
            unidades:
              ticket.cesta.lista[i].unidades *
              ticket.cesta.lista[i].promocion.cantidadArticuloPrincipal *
              valor, //unidades pierde el simbolo negativo cuando es un ticket anulado y se le multiplica -1
            subtotal: this.redondearDecimales(
              ticket.cesta.lista[i].promocion.precioRealArticuloPrincipal *
                ticket.cesta.lista[i].unidades *
                ticket.cesta.lista[i].promocion.cantidadArticuloPrincipal,
              2
            ),
            nombre: "ArtículoDentroDePromoP",
          });
          nuevaLista.push({
            arraySuplementos: null,
            gramos: null,
            idArticulo: ticket.cesta.lista[i].promocion.idArticuloSecundario,
            regalo: false,
            puntos: null,
            promocion: null,
            unidades:
              ticket.cesta.lista[i].unidades *
              ticket.cesta.lista[i].promocion.cantidadArticuloSecundario *
              valor,
            subtotal: this.redondearDecimales(
              ticket.cesta.lista[i].promocion.precioRealArticuloSecundario *
                ticket.cesta.lista[i].unidades *
                ticket.cesta.lista[i].promocion.cantidadArticuloSecundario,
              2
            ),
            nombre: "ArtículoDentroDePromoS",
          });
        } else if (ticket.cesta.lista[i].promocion.tipoPromo === "INDIVIDUAL") {
          nuevaLista.push({
            arraySuplementos: null,
            gramos: null,
            puntos: null,
            idArticulo: ticket.cesta.lista[i].promocion.idArticuloPrincipal,
            regalo: false,
            promocion: null,
            unidades:
              ticket.cesta.lista[i].unidades *
              ticket.cesta.lista[i].promocion.cantidadArticuloPrincipal *
              valor,
            subtotal: ticket.cesta.lista[i]?.regalo ? 0 : this.redondearDecimales(
              ticket.cesta.lista[i].promocion.precioRealArticuloPrincipal *
                ticket.cesta.lista[i].unidades *
                ticket.cesta.lista[i].promocion.cantidadArticuloPrincipal,
              2
            ),
            nombre: "ArtículoDentroDePromoI",
          });
        } else {
          throw Error(
            "Tipo de promoción no es válido, no se puede deshacer promo"
          );
        }
      } else {
        nuevaLista.push(ticket.cesta.lista[i]);
      }
    }
    ticket.cesta.lista = nuevaLista;
    return ticket.cesta.lista;
  }
}

export const nuevaInstancePromociones = new NuevaPromocion();
