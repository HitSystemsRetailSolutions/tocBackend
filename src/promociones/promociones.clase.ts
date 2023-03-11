import axios from "axios";
import { clienteInstance } from "../clientes/clientes.clase";
import { articulosInstance } from "../articulos/articulos.clase";
import { ArticulosInterface } from "../articulos/articulos.interface";
import { CestasInterface } from "../cestas/cestas.interface";
import { logger } from "../logger";
import {
  PromocionesInterface,
  InfoPromocionIndividual,
  InfoPromocionCombo,
  PreciosReales,
  MediaPromoEncontrada,
  InfoPromoAplicar,
} from "./promociones.interface";
import * as schPromociones from "./promociones.mongodb";
import { TicketsInterface } from "../tickets/tickets.interface";

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

  async descargarPromociones() {
    const resPromos = (await axios.get("promociones/getPromociones"))
      .data as PromocionesInterface[];
    if (resPromos && resPromos.length > 0) {
      return await schPromociones.insertarPromociones(resPromos);
    }
    throw Error("No hay promociones para descargar");
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
      }
    }

    for (let i = 0; i < cesta.lista.length; i++) {
      if (cesta.lista[i].idArticulo === idArticulo) {
        unidadesTotales += cesta.lista[i].unidades;
        index1 = i;
        break;
      }
    }

    /* INDIVIDUALES */
    const promoIndividual = await this.buscarPromocionesIndividuales(
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

    /* COMBO */
    // const mediaPromo = this.buscarPromo(idArticulo, unidadesTotales);
    const promosPosibles = this.buscarPromo(idArticulo, unidadesTotales, cesta);
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
                this.aplicarSobraComboPrincipal(cesta, infoFinal);
              if (infoFinal.sobranSecundario > 0)
                this.aplicarSobraComboSecundario(cesta, infoFinal);
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
              const articuloPrincipal = await articulosInstance.getInfoArticulo(
                idArticulo
              );
              const articuloSecundario =
                await articulosInstance.getInfoArticulo(
                  cesta.lista[otraMediaPartePromo.indexCesta].idArticulo
                );

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
                this.aplicarSobraComboPrincipal(cesta, infoFinal);
              if (infoFinal.sobranSecundario > 0)
                this.aplicarSobraComboSecundario(cesta, infoFinal);
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
                this.aplicarSobraComboPrincipal(cesta, infoFinal);
              if (infoFinal.sobranSecundario > 0)
                this.aplicarSobraComboSecundario(cesta, infoFinal);
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
              const articuloPrincipal = await articulosInstance.getInfoArticulo(
                idArticulo
              );
              const articuloSecundario =
                await articulosInstance.getInfoArticulo(
                  cesta.lista[otraMediaPartePromo.indexCesta].idArticulo
                );

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
                this.aplicarSobraComboPrincipal(cesta, infoFinal);
              if (infoFinal.sobranSecundario > 0)
                this.aplicarSobraComboSecundario(cesta, infoFinal);
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
            unidadesTotales >= this.promosIndividuales[i].cantidadPrincipal
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
        this.promosIndividuales[i].secundario.length > 0
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

  private buscarPromo(
    idArticulo: ArticulosInterface["_id"],
    unidadesTotales: number,
    cesta: CestasInterface,
  ): {
    promosSecundarios: MediaPromoEncontrada[];
    promosPrincipales: MediaPromoEncontrada[];
  } {
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
                    this.promosCombo[i].principal[k] === cesta.lista[c].idArticulo
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
                for (let k = 0; k < this.promosCombo[i].secundario.length; k++) {
                  if (
                    this.promosCombo[i].secundario[k] === cesta.lista[c].idArticulo
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
      if (cesta.lista[i].idArticulo === idIgnorarArticulo) continue;
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
      if (cesta.lista[i].idArticulo === idIgnorarArticulo) continue;
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

  private aplicarPromoIndividual(
    cesta: CestasInterface,
    data: InfoPromocionIndividual
  ) {
    let nom="Promo. " + data.nombreArticulo;
    let promocioNou=true;
    for (let i = 0; i < cesta.lista.length; i++) {
      
      if (nom==cesta.lista[i].nombre && promocioNou) {
        cesta.lista[i].unidades++;
        cesta.lista[i].subtotal= Number((cesta.lista[i].subtotal+data.precioConIva).toFixed(2));
        promocioNou=false;
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

  private aplicarPromoCombo(
    cesta: CestasInterface,
    data: InfoPromocionCombo,
    articuloPrincipal: ArticulosInterface,
    articuloSecundario: ArticulosInterface,
    preciosReales: PreciosReales
  ) {
    let nom=`Promo. ${articuloPrincipal.nombre} + ${articuloSecundario.nombre}`;
    let promocioNou=true;
    for (let i = 0; i < cesta.lista.length; i++) {
      
      if (nom==cesta.lista[i].nombre && promocioNou) {
        cesta.lista[i].unidades++;
        cesta.lista[i].subtotal+=data.precioPromoUnitario * data.seAplican;
        promocioNou=false;
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
        subtotal: data.precioPromoUnitario * data.seAplican, // No será necesario, se hace desde el recalcularIvas Cesta
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
      devolver.precioRealPrincipal * data.cantidadNecesariaPrincipal +
        devolver.precioRealSecundario * data.cantidadNecesariaSecundario !==
      data.precioPromoUnitario
    ) {
      const diferencia =
        devolver.precioRealPrincipal * data.cantidadNecesariaPrincipal +
        devolver.precioRealSecundario * data.cantidadNecesariaSecundario -
        data.precioPromoUnitario;
      devolver.precioRealPrincipal += diferencia * -1;
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
      regalo: false,
      subtotal: null,
      unidades: data.sobran,
    });
  }

  private aplicarSobraComboPrincipal(
    cesta: CestasInterface,
    data: InfoPromocionCombo
  ) {
    cesta.lista.push({
      arraySuplementos: null,
      gramos: 0,
      idArticulo: data.idArticuloPrincipal,
      nombre: data.nombrePrincipal,
      promocion: null,
      regalo: false,
      subtotal: null,
      unidades: data.sobranPrincipal,
    });
  }
  private aplicarSobraComboSecundario(
    cesta: CestasInterface,
    data: InfoPromocionCombo
  ) {
    cesta.lista.push({
      arraySuplementos: null,
      gramos: 0,
      idArticulo: data.idArticuloSecundario,
      nombre: data.nombreSecundario,
      promocion: null,
      regalo: false,
      subtotal: null,
      unidades: data.sobranSecundario,
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
  public deshacerPromociones(ticket: TicketsInterface) {
    for (let i = 0; i < ticket.cesta.lista.length; i++) {
      if (ticket.cesta.lista[i].promocion) {
        if (ticket.cesta.lista[i].promocion.tipoPromo === "COMBO") {
          ticket.cesta.lista.push({
            arraySuplementos: null,
            gramos: null,
            idArticulo: ticket.cesta.lista[i].promocion.idArticuloPrincipal,
            regalo: false,
            promocion: null,
            unidades:
              ticket.cesta.lista[i].promocion.unidadesOferta *
              ticket.cesta.lista[i].promocion.cantidadArticuloPrincipal,
            subtotal:
              ticket.cesta.lista[i].promocion.precioRealArticuloPrincipal *
              ticket.cesta.lista[i].promocion.unidadesOferta *
              ticket.cesta.lista[i].promocion.cantidadArticuloPrincipal,
            nombre: "ArtículoDentroDePromo",
          });
          ticket.cesta.lista.push({
            arraySuplementos: null,
            gramos: null,
            idArticulo: ticket.cesta.lista[i].promocion.idArticuloSecundario,
            regalo: false,
            promocion: null,
            unidades:
              ticket.cesta.lista[i].promocion.unidadesOferta *
              ticket.cesta.lista[i].promocion.cantidadArticuloSecundario,
            subtotal:
              ticket.cesta.lista[i].promocion.precioRealArticuloSecundario *
              ticket.cesta.lista[i].promocion.unidadesOferta *
              ticket.cesta.lista[i].promocion.cantidadArticuloSecundario,
            nombre: "ArtículoDentroDePromo",
          });
          ticket.cesta.lista.splice(i, 1);
        } else if (ticket.cesta.lista[i].promocion.tipoPromo === "INDIVIDUAL") {
          ticket.cesta.lista.push({
            arraySuplementos: null,
            gramos: null,
            idArticulo: ticket.cesta.lista[i].promocion.idArticuloPrincipal,
            regalo: false,
            promocion: null,
            unidades:
              ticket.cesta.lista[i].promocion.unidadesOferta *
              ticket.cesta.lista[i].promocion.cantidadArticuloPrincipal,
            subtotal:
              ticket.cesta.lista[i].promocion.precioRealArticuloPrincipal *
              ticket.cesta.lista[i].promocion.unidadesOferta *
              ticket.cesta.lista[i].promocion.cantidadArticuloPrincipal,
            nombre: "ArtículoDentroDePromo",
          });
          ticket.cesta.lista.splice(i, 1);
        } else
          throw Error(
            "Tipo de promoción no es válido, no se puede deshacer promo"
          );
      }
    }
  }
}

export const nuevaInstancePromociones = new NuevaPromocion();
