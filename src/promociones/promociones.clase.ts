/*  promociones
    - Las promociones que vienen del santaAna tiene el formato:
        idArticuloPrincipal (array de ids), cantidad
        idArticuloSecundario (array de ids) , cantidad
        tipo = INDIVIDUAL o COMBO
        (ver PromocionesEnServer)
    - Para evitar tratar diferente las individuales y las combo en TocBackend tienen el formato
        grupo = { [idArticulo,...], cantidad }
        las individuales tienen un grupo y las combo dos.
        (ver PromocionesInterface)
    - Promociones en la cesta:
      - Como los grupos pueden tener varios ids, se crean subgrupos uno por cada id 
        ver GrupoPromoEnCesta (grupos), ArticuloPromoEnCesta (subgrupos) en cesta.lista[i].promocion
      - Cada vez que se inserta un articulo en la cesta se deshacen las promociones y se vuelven a intentar aplicar 
        con el articulo nuevo. ArticuloInfoPromoYNormal guarda información necesaria (nombre, precioPorUnidad, puntos)
        para poder formar de nuevo un item de la cesta sin tener que buscarlo en la base de datos.
    - Orden de aplicación de promociones:
      - se ordenan por:
          mayor suma de elementos en los grupos
          menor cantidad de grupos
          mayor cantidad de elementos del primer grupo
          por id
    - Las promos se guardan en mongoDB con el formato que viene de SantaAna ya que el formato que usa el backend
        usa Sets y Maps que no se pueden guardar en la db.
*/
import axios from "axios";
import { logger } from "../logger";
import * as schPromociones from "./promociones.mongodb";
import { TicketsInterface } from "../tickets/tickets.interface";
import {
  arrayClientesFacturacion,
  ClientesInterface,
} from "../clientes/clientes.interface";
import { ArticulosInterface } from "../articulos/articulos.interface";
import {
  CestasInterface,
  ItemLista,
  ItemLista_old,
  GrupoPromoEnCesta,
  ArticuloPromoEnCesta,
} from "../cestas/cestas.interface";
import {
  PromocionesEnServer,
  PromocionesInterface,
} from "./promociones.interface";
import { articulosInstance } from "src/articulos/articulos.clase";
const redondearPrecio = (precio: number) =>
  Math.round((precio + Number.EPSILON * 100000) * 100) / 100;
import * as schCestas from "../cestas/cestas.mongodb";

export type ArticuloInfoPromoYNormal = ArticuloPromoEnCesta & {
  precioPorUnidad: number;
  puntosPorUnidad: number;
};
export class NuevaPromocion {
  private promos: PromocionesInterface[] = [];
  private promosCombo: PromocionesEnServer[] = [];
  private promosIndividuales: PromocionesEnServer[] = [];
  constructor() {
    this.promos = [];
    (async () => {
      try {
        this.recargarPromosCache();
        // el dia del cambio de versión puede haber cestas que tengan el formato antiguo
        // así que se convierten al nuevo
        let allCestas = await schCestas.getAllCestas();
        for (let cesta of allCestas) {
          let update = this.convertirAFormatoNuevoSiEsNecesario(cesta);
          if (update) {
            schCestas.updateCesta(cesta);
          }
        }
      } catch (err) {
        logger.Error(128, err);
      }
    })();
  }

  public convertirAFormatoNuevoSiEsNecesario(cesta: CestasInterface) {
    let update = false;
    for (let item of cesta.lista) {
      let itemOld = item as unknown as ItemLista_old;
      if (itemOld.promocion && itemOld.promocion.idArticuloPrincipal != null) {
        // Promo. principal + secundario
        let dot = itemOld.nombre.indexOf(".");
        let plus = itemOld.nombre.indexOf("+");
        item.promocion.grupos = [
          [
            {
              idArticulo: itemOld.promocion.idArticuloPrincipal,
              nombre: itemOld.nombre.substring(
                dot == -1 ? 0 : dot + 1,
                plus == -1 ? undefined : plus - 1
              ),
              unidades: itemOld.promocion.cantidadArticuloPrincipal,
              precioPromoPorUnidad:
                itemOld.promocion.precioRealArticuloPrincipal,
            },
          ],
        ];
        if (itemOld.promocion.idArticuloSecundario != null) {
          item.promocion.grupos.push([
            {
              idArticulo: itemOld.promocion.idArticuloSecundario,
              nombre: itemOld.nombre.substring(plus + 2),
              unidades: itemOld.promocion.cantidadArticuloSecundario,
              precioPromoPorUnidad:
                itemOld.promocion.precioRealArticuloSecundario,
            },
          ]);
        }
        delete itemOld.promocion.idArticuloPrincipal;
        //item.promocion.gruposFlat=item.promocion.grupos.reduce((acc,val)=>acc.concat(val))
        update = true;
      }
    }
    return update;
  }
  async getPromosCombo() {
    return await schPromociones.getPromosCombo();
  }

  async getPromosIndividuales() {
    return await schPromociones.getPromosIndividuales();
  }

  public getPromoById(idPromo: string) {
    for (let i = 0; i < this.promos.length; i++) {
      if (this.promos[i]._id == idPromo) return this.promos[i];
    }
    return null;
  }

  async descargarPromociones() {
    try {
      let resPromos: any = await axios.get("promociones/getPromociones");

      resPromos = resPromos?.data as PromocionesInterface[];
      if (resPromos) {
        return await schPromociones.insertarPromociones(resPromos);
      }
      throw Error("No hay promociones para descargar");
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  /* Cargar promos en formato de descarga al usado por el Backend */
  public async recargarPromosCache() {
    this.promosCombo = await this.getPromosCombo();
    this.promosIndividuales = await this.getPromosIndividuales();
    this.promos = [];
    function nueva_promo(
      promoServer: PromocionesEnServer
    ): PromocionesInterface {
      return {
        _id: promoServer._id,
        fechaFinal: promoServer.fechaFinal,
        fechaInicio: promoServer.fechaInicio,
        precioFinal: promoServer.precioFinal,
        grupos: [],
        sortInfo: { unidades_totales: 0, unidades_por_grupo: [] },
      };
    }
    function insertar_grupo(
      promo: PromocionesInterface,
      ar_art: number[],
      cantidad: number
    ) {
      if (Array.isArray(ar_art) && ar_art.length > 0 && ar_art[0] >= 0) {
        promo.grupos.push({
          idsArticulos: new Set(ar_art),
          cantidad: cantidad,
        });
        return cantidad;
      } else return 0;
    }
    for (let promoEnServer of this.promosCombo.concat(
      this.promosIndividuales
    )) {
      let promo = nueva_promo(promoEnServer);
      let cantidad = insertar_grupo(
        promo,
        promoEnServer.principal,
        promoEnServer.cantidadPrincipal
      );
      cantidad += insertar_grupo(
        promo,
        promoEnServer.secundario,
        promoEnServer.cantidadSecundario
      );
      // en promoIndividual el precioFinal es por unidad no es el total de la promo
      if (promoEnServer.tipo == "INDIVIDUAL") {
        promo.precioFinal = redondearPrecio(promo.precioFinal * cantidad);
      }
      for (let grupo of promo.grupos) {
        promo.sortInfo.unidades_totales += grupo.cantidad;
        promo.sortInfo.unidades_por_grupo.push(grupo.cantidad);
      }
      promo.sortInfo.unidades_por_grupo.sort((a, b) => -(a - b));
      if (promo.grupos.length) this.promos.push(promo);
    }
    this.promos.sort((a, b) => {
      let c = -(a.sortInfo.unidades_totales - b.sortInfo.unidades_totales); // unidades totales desc
      if (c != 0) return c;
      c = -(
        a.sortInfo.unidades_por_grupo.length -
        b.sortInfo.unidades_por_grupo.length
      ); // número de grupos asc
      if (c != 0) return c;
      for (let i = 0; i < a.sortInfo.unidades_por_grupo.length; i++) {
        c = -(
          a.sortInfo.unidades_por_grupo[i] - b.sortInfo.unidades_por_grupo[i]
        ); // unidades grupo[0],[...] asc
        if (c != 0) return c;
      }
      return a._id < b._id ? -1 : 1; // por id
    });
  }

  // Este tipo de items no se usan para formar promociones
  public isItemPromocionable(item: ItemLista) {
    if (item.gramos != null) return false;
    if (item.varis) return false;
    if (item.regalo) return false;
    if (item.pagado) return false;
    return true;
  }

  /*
   */
  public async aplicarPromociones(
    cesta: CestasInterface,
    cliente: ClientesInterface
  ) {
    if (cesta.modo === "CONSUMO_PERSONAL" || cesta.modo === "DEVOLUCION")
      return false;

    if (cesta.idCliente) {
      if (cliente.albaran === true) {
        // No se les hace promociones a estos clientes
        return false;
      } else if (arrayClientesFacturacion.includes(cesta.idCliente)) {
        return false;
      }
    }
    // articulos que no entran en promociones
    let SetNoPromocionables: Set<ItemLista> = new Set();
    // articulos que pueden formar parte de promociones
    let MapPromocionables: Map<
      ArticulosInterface["_id"],
      ArticuloInfoPromoYNormal
    > = new Map();
    // deshacer promociones y pasar items normales a formato de articulo en Promo
    // Al final MapPromociones tendra ArticuloInfoPromoYNormal
    for (let item of cesta.lista) {
      if (this.isItemPromocionable(item)) {
        if (item.promocion) {
          // deshacer promoción
          for (let artGrupo of item.promocion.grupos.flat()) {
            let info = MapPromocionables.get(artGrupo.idArticulo);
            if (info != undefined) {
              info.unidades += artGrupo.unidades * item.unidades;
            } else {
              let info = await articulosInstance.getInfoArticulo(
                artGrupo.idArticulo
              );
              MapPromocionables.set(artGrupo.idArticulo, {
                ...artGrupo,
                unidades: artGrupo.unidades * item.unidades,
                precioPorUnidad: info.precioConIva,
                puntosPorUnidad: info.puntos,
              });
            }
          }
        } else {
          // pasar items normales a formato ArticuloInfoPromoYNormal
          let info = MapPromocionables.get(item.idArticulo);
          if (info != undefined) {
            info.unidades += item.unidades;
          } else {
            MapPromocionables.set(item.idArticulo, {
              idArticulo: item.idArticulo,
              nombre: item.nombre,
              unidades: item.unidades,
              precioPorUnidad: item.subtotal / item.unidades,
              puntosPorUnidad:
                item.puntos == null ? null : item.puntos / item.unidades,
              precioPromoPorUnidad: null,
            });
          }
        }
      } else SetNoPromocionables.add(item);
    }

    let PromosAplicadasTotales: Map<string, ItemLista[]> = new Map();

    // promos que tiene items de cesta suficientes para llenarse, puede que no se llene si estos items van a otra promo.
    let PromosCandidatas: PromocionesInterface[] = [];
    for (let promo of this.promos) {
      let candidata = true;
      let n: number[] = Array(promo.grupos.length).fill(0);
      for (let idxG = 0; idxG < promo.grupos.length; idxG++) {
        if( this.comprobarIntervaloFechas(promo) === false) {
          candidata = false;
          break;
        }
        let grupo = promo.grupos[idxG];
        for (let [idArticulo, articulo] of MapPromocionables) {
          if (grupo.idsArticulos.has(idArticulo)) n[idxG] += articulo.unidades;
        }
        n[idxG] = Math.trunc(n[idxG] / grupo.cantidad); // numero de grupos llenos posibles
        if (n[idxG] == 0) {
          candidata = false;
          break;
        }
      }
      if (candidata) {
        let min_n = n.reduce((acc, val) => (acc <= val ? acc : val)); // coger min n de grupos llenos posibles
        for (let m = 0; m < min_n; m++) {
          PromosCandidatas.push(promo); // promos posibles
        }
      }
    }
    let total_articulos_candidatos = 0;
    // items de cesta que pueden ir a alguna promo candidata,
    // una unidad por cada elemento del array,
    // PG array con p promoción y g grupo son indices al array PromoCandidatas
    // el último elemento es null que indica que no aplica ninguna promo en el algoritmo de recorrido
    let ArticulosCandidatos: {
      idArticulo: number;
      PG: { p: number; g: number }[];
    }[] = []; // PG array de promocion grupo en PromosCandidatas
    let MapNoCandidatos: Map<number, ArticuloInfoPromoYNormal> = new Map();
    for (let [idArticulo, articulo] of MapPromocionables) {
      let ArticuloCandidato: {
        idArticulo: number;
        PG: { p: number; g: number }[];
      } = { idArticulo: idArticulo, PG: [] };
      let valido = false;
      for (let idxP = 0; idxP < PromosCandidatas.length; idxP++) {
        let promo = PromosCandidatas[idxP];
        for (let idxG = 0; idxG < promo.grupos.length; idxG++) {
          let grupo = promo.grupos[idxG];
          if (grupo.idsArticulos.has(idArticulo)) {
            valido = true;
            total_articulos_candidatos +=
              articulo.precioPorUnidad * articulo.unidades;
            ArticuloCandidato.PG.push({ p: idxP, g: idxG });
          }
        }
      }
      if (valido) {
        ArticuloCandidato.PG.push(null);
        for (let u = 0; u < articulo.unidades; u++) {
          ArticulosCandidatos.push(ArticuloCandidato); // un elemento por unidad
        }
      } else {
        MapNoCandidatos.set(idArticulo, articulo);
      }
    }

    // Estado de las promos mientras se calcula el vector de longitud dinamica
    // indices p y g promo y grupo a PromocionesCandidatas y el valor es resto de unidades para llenar
    let Estado_PG_r: number[][] = [];
    for (let promo of PromosCandidatas) {
      let pg_r: number[] = [];
      for (let grupo of promo.grupos) {
        pg_r.push(grupo.cantidad); // inicializar estado
      }
      Estado_PG_r.push(pg_r);
    }
    let min = Number.POSITIVE_INFINITY;
    let min_V: number[] = Array(ArticulosCandidatos.length).fill(null);
    // vector de longitud dinamica de indices al PG de ArticulosCandidatos
    // cada elemento del vector se corresponde con el elemento de ArticulosCandidatos y el valor es el
    // indice al PG de ese elemento
    let v_idxAC_PG: number[] = [];
    let time0 = Date.now();
    function bucle_buscar_min(prev_idxPG?: number) {
      if (Date.now() - time0 > 0.5 * 1000) return; // si tarda más de 0.5 segundos parar y cojer la distribución actual
      let len_v_idxAC_PG = v_idxAC_PG.length;
      if (len_v_idxAC_PG == ArticulosCandidatos.length) {
        // si el vector tiene la longitud máxima, ver promociones que se han formado
        let SetP: Set<number> = new Set();
        let total_v = 0,
          total_p = 0;
        for (let idx_v = 0; idx_v < v_idxAC_PG.length; idx_v++) {
          let pg = ArticulosCandidatos[idx_v].PG[v_idxAC_PG[idx_v]];
          if (pg != null) {
            let promo_completa = true;
            for (let idx_g = 0; idx_g < Estado_PG_r[pg.p].length; idx_g++) {
              if (Estado_PG_r[pg.p][idx_g] > 0) {
                promo_completa = false;
                break;
              }
            }
            if (promo_completa) {
              SetP.add(pg.p);
              total_v += MapPromocionables.get(
                ArticulosCandidatos[idx_v].idArticulo
              ).precioPorUnidad;
            }
          }
        }
        for (let idxPromo of Array.from(SetP)) {
          total_p += PromosCandidatas[idxPromo].precioFinal;
        }
        if (min > total_articulos_candidatos - total_v + total_p) {
          // guardar promo
          min = total_articulos_candidatos - total_v + total_p;
          min_V = v_idxAC_PG.map((a) => a); // copiar
        }
        return;
      }
      let ultimoIDPromo = null;
      let idxPG = 0;
      if (
        len_v_idxAC_PG > 0 &&
        ArticulosCandidatos[len_v_idxAC_PG] ==
          ArticulosCandidatos[len_v_idxAC_PG - 1]
      ) {
        // empezar por idx ya que es el mismo articulo y daría una combinación repetida si se empieza por 0
        idxPG = prev_idxPG;
        if (idxPG > ArticulosCandidatos[len_v_idxAC_PG].PG.length - 1)
          idxPG = ArticulosCandidatos[len_v_idxAC_PG].PG.length - 1; // caso null
      }
      // cada paso del bucle se aplican las promociones del indice del vector actual len_v_idxAC_PG
      for (; idxPG < ArticulosCandidatos[len_v_idxAC_PG].PG.length; idxPG++) {
        let PG = ArticulosCandidatos[len_v_idxAC_PG].PG[idxPG];
        if (PG == null) {
          // null significa que no se aplica este item a ninguna promo
          v_idxAC_PG.push(null);
          bucle_buscar_min(idxPG);
          v_idxAC_PG.pop();
        } else {
          if (Estado_PG_r[PG.p][PG.g] == 0) {
            // no se puede aplicar este item a la promo PG porque ya esta llena
            continue;
          } else {
            if (
              PG.p > 0 &&
              PromosCandidatas[PG.p] == PromosCandidatas[PG.p - 1] &&
              ArticulosCandidatos[len_v_idxAC_PG].PG[idxPG - 1].g == PG.g
            ) {
              let igual_estado = true;
              for (let idxG = 0; idxG < Estado_PG_r[PG.p].length; idxG++) {
                if (Estado_PG_r[PG.p][PG.g] != Estado_PG_r[PG.p - 1][PG.g]) {
                  igual_estado = false;
                  break;
                }
              }
              // Este articulo ya se intento aplicar a la misma promoción anterior y el estado era el mismo
              if (igual_estado) continue;
            }
            //ultimoIDPromo=PromosCandidatas[PG.p]._id
            Estado_PG_r[PG.p][PG.g]--;
            v_idxAC_PG.push(idxPG);
            bucle_buscar_min(idxPG);
            Estado_PG_r[PG.p][PG.g]++;
            v_idxAC_PG.pop();
          }
        }
      }
    }
    bucle_buscar_min(-1);
    //inicializar estado
    Estado_PG_r = [];
    for (let promo of PromosCandidatas) {
      let pg_r: number[] = [];
      for (let grupo of promo.grupos) {
        pg_r.push(grupo.cantidad);
      }
      Estado_PG_r.push(pg_r);
    }
    // Aplicar min_V al estado
    for (let idx_v = 0; idx_v < min_V.length; idx_v++) {
      let PG = ArticulosCandidatos[idx_v].PG[min_V[idx_v]];
      if (PG != null) Estado_PG_r[PG.p][PG.g]--;
    }
    // Estado PromosCandidatas true: promo aplicadada
    let Estado_P: boolean[] = [];
    for (let grupo_r of Estado_PG_r) {
      let completo = true;
      for (let r of grupo_r) {
        if (r > 0) completo = false;
      }
      Estado_P.push(completo);
    }

    // ArticulosAplicadosEnPromo [promo][grupo] Map<idArticulo, unidades>
    let ArticulosAplicadosEnPromo: Map<number, number>[][] = [];
    // Inicializar ArticulosAplicadosEnPromo
    for (let idx = 0; idx < PromosCandidatas.length; idx++) {
      if (Estado_P[idx]) {
        let ar: Map<number, number>[] = [];
        for (let g of PromosCandidatas[idx].grupos) {
          ar.push(new Map());
        }
        ArticulosAplicadosEnPromo.push(ar);
      } else ArticulosAplicadosEnPromo.push(null);
    }
    let ArticulosEnNingunaPromocion: Map<number, number> = new Map();

    for (let idx_v = 0; idx_v < min_V.length; idx_v++) {
      let idArticulo = ArticulosCandidatos[idx_v].idArticulo;
      let pg = ArticulosCandidatos[idx_v].PG[min_V[idx_v]];
      if (pg != null && Estado_P[pg.p]) {
        let n = ArticulosAplicadosEnPromo[pg.p][pg.g].get(idArticulo);
        if (n == null) n = 1;
        else n++;
        ArticulosAplicadosEnPromo[pg.p][pg.g].set(idArticulo, n);
      } else {
        let n = ArticulosEnNingunaPromocion.get(idArticulo);
        if (n == null) n = 1;
        else n++;
        ArticulosEnNingunaPromocion.set(idArticulo, n);
      }
    }

    let UltimaPromoAplicada: ItemLista = null;
    //let PromocionesAplicadas:ItemLista[]=[]
    for (let idx_p = 0; idx_p < PromosCandidatas.length; idx_p++) {
      if (ArticulosAplicadosEnPromo[idx_p]) {
        let grupos: GrupoPromoEnCesta[] = [];
        for (let map of ArticulosAplicadosEnPromo[idx_p]) {
          let Articulos: ArticuloPromoEnCesta[] = [];
          for (let [idArticulo, unidades] of map) {
            Articulos.push({
              ...MapPromocionables.get(idArticulo),
              unidades,
            });
          }
          Articulos.sort((a, b) => a.idArticulo - b.idArticulo);
          grupos.push(Articulos);
        }
        let PromoAplicada = await this.crearItemListaPromo(
          PromosCandidatas[idx_p],
          grupos
        );
        if (
          UltimaPromoAplicada &&
          PromosIguales(PromoAplicada, UltimaPromoAplicada)
        )
          UltimaPromoAplicada.unidades++;
        else {
          if (UltimaPromoAplicada) this.calculoFinalPromo(UltimaPromoAplicada);
          let promosConMismoNombrePeroDiferentesElementos =
            PromosAplicadasTotales.get(PromoAplicada.nombre);
          if (promosConMismoNombrePeroDiferentesElementos)
            promosConMismoNombrePeroDiferentesElementos.push(PromoAplicada);
          else
            PromosAplicadasTotales.set(PromoAplicada.nombre, [PromoAplicada]);
          UltimaPromoAplicada = PromoAplicada;
        }
      }
    }
    if (UltimaPromoAplicada) this.calculoFinalPromo(UltimaPromoAplicada);

    function PromosIguales(A: ItemLista, B: ItemLista) {
      let Ap = A.promocion,
        Bp = B.promocion;
      if (Ap.idPromocion != Bp.idPromocion) return false;
      if (Ap.grupos.length != Bp.grupos.length) return false;
      for (let i = 0; i < Ap.grupos.length; i++) {
        if (Ap.grupos[i].length != Ap.grupos[i].length) return false;
        for (let j = 0; j < Ap.grupos[i].length; j++) {
          if (Ap.grupos[i][j].idArticulo != Bp.grupos[i][j].idArticulo)
            return false;
          if (Ap.grupos[i][j].unidades != Bp.grupos[i][j].unidades)
            return false;
        }
      }
      return true;
    }

    function crearItemListaNormal(
      articulo: ArticuloInfoPromoYNormal,
      suplementos: ItemLista["arraySuplementos"] = null
    ): ItemLista {
      let totalSuplementos = 0;
      if (suplementos) {
        for (let suplemento of suplementos) {
          totalSuplementos += suplemento.precioConIva;
        }
      }
      return {
        idArticulo: articulo.idArticulo,
        nombre: articulo.nombre,
        arraySuplementos: suplementos,
        unidades: articulo.unidades,
        subtotal: redondearPrecio(
          (articulo.precioPorUnidad + totalSuplementos) * articulo.unidades
        ),
        puntos: articulo.puntosPorUnidad * articulo.unidades,
        regalo: false,
        pagado: false,
        varis: false,
      } as ItemLista;
    }
    // crear cesta lista de salida con el mismo orden de lista de entrada
    let lista_out: ItemLista[] = [];
    for (let item_in of cesta.lista) {
      if (SetNoPromocionables.has(item_in)) lista_out.push(item_in);
      else {
        if (item_in.promocion == null) {
          if (ArticulosEnNingunaPromocion.has(item_in.idArticulo)) {
            const suplementos = item_in?.arraySuplementos || [];
            lista_out.push(
              crearItemListaNormal(
                {
                  ...MapPromocionables.get(item_in.idArticulo),
                  unidades: ArticulosEnNingunaPromocion.get(item_in.idArticulo),
                },
                suplementos
              )
            );
            ArticulosEnNingunaPromocion.delete(item_in.idArticulo);
          } else if (MapNoCandidatos.has(item_in.idArticulo)) {
            const suplementos = item_in?.arraySuplementos || [];
            lista_out.push(
              crearItemListaNormal(
                MapNoCandidatos.get(item_in.idArticulo),
                suplementos
              )
            );
            MapNoCandidatos.delete(item_in.idArticulo);
          }
        } else if (PromosAplicadasTotales.has(item_in.nombre)) {
          PromosAplicadasTotales.get(item_in.nombre).forEach((promo) => {
            lista_out.push(promo);
          });
          PromosAplicadasTotales.delete(item_in.nombre);
        }
      }
    }
    // insertar en lista articulos y promos que no estaban en la lista de entrada
    for (let [idArticulo, unidades] of ArticulosEnNingunaPromocion) {
      lista_out.push(
        crearItemListaNormal({
          ...MapPromocionables.get(idArticulo),
          unidades,
        })
      );
    }
    for (let articulo of MapNoCandidatos.values()) {
      lista_out.push(crearItemListaNormal(articulo));
    }
    for (let promos of PromosAplicadasTotales.values()) {
      promos.forEach((promo) => {
        lista_out.push(promo);
      });
    }
    cesta.lista = lista_out;
  }

  public async crearItemListaPromo(
    promo: PromocionesInterface,
    grupos: GrupoPromoEnCesta[]
  ): Promise<ItemLista> {
    let nombres: string[] = [];
    for (let grupo of promo.grupos) {
      // el nombre de la promo es familia del primer articulo si hay más de un articulo en la promo sino el nombre
      if (grupo.familia_o_nombre == null) {
        // famili_o_nombre se inicializa aqui ya que en descarga de promos puede que no existieran articulos aún en el mongo
        let art = await articulosInstance.getInfoArticulo(
          Array.from(grupo.idsArticulos)[0]
        );
        if (grupo.idsArticulos.size > 1) {
          // 0312 - Oferta Bocadillos BG (eliminar numeros iniciales y guion)
          let m = /(?:^\d+ - )?(.*)/.exec(art.familia);
          grupo.familia_o_nombre = m == null ? art.familia : m[1];
        } else grupo.familia_o_nombre = art.nombre;
      }
      nombres.push(grupo.familia_o_nombre);
    }

    return {
      idArticulo: -1,
      nombre: "Promo. " + nombres.join(" + "),
      unidades: 1,
      promocion: {
        idPromocion: promo._id,
        grupos: grupos,
        unidadesOferta: 1,
        precioFinalPorPromo: promo.precioFinal,
      },
      regalo: false,
      pagado: false,
      varis: false,
    } as ItemLista;
  }

  // cerrar promo calculando precio por articulo
  public calculoFinalPromo(item: ItemLista) {
    let gruposFlat = item.promocion.grupos.flat() as ArticuloInfoPromoYNormal[];
    item.promocion.unidadesOferta = item.unidades;
    item.subtotal = redondearPrecio(
      item.promocion.precioFinalPorPromo * item.unidades
    );
    let totalSinPromocion = 0,
      puntos = null;
    for (let artGrupo of gruposFlat) {
      totalSinPromocion += artGrupo.precioPorUnidad * artGrupo.unidades;
      if (artGrupo.puntosPorUnidad != null) {
        if (puntos == null) puntos = 0;
        puntos += artGrupo.puntosPorUnidad * artGrupo.unidades;
      }
    }

    item.puntos = puntos * item.unidades;

    let promo_individual = item.promocion.grupos.length == 1;
    let precioPorUnidadPromoIndividual: number;
    if (promo_individual) {
      // si es promo individual todos los articulos tienen el mismo precio
      let unidades = 0;
      for (let artGrupo of gruposFlat) {
        unidades += artGrupo.unidades;
      }
      precioPorUnidadPromoIndividual = redondearPrecio(
        item.promocion.precioFinalPorPromo / unidades
      );
    }
    let resto = item.promocion.precioFinalPorPromo;
    for (let i = 0; i < gruposFlat.length - 1; i++) {
      let artGrupo = gruposFlat[i];
      artGrupo.precioPromoPorUnidad = promo_individual
        ? precioPorUnidadPromoIndividual
        : redondearPrecio(
            artGrupo.precioPorUnidad *
              (item.promocion.precioFinalPorPromo / totalSinPromocion)
          );
      resto -= artGrupo.precioPromoPorUnidad * artGrupo.unidades;
    }
    let ultimoArtGrupo = gruposFlat[gruposFlat.length - 1];
    if (ultimoArtGrupo.unidades == 1) {
      ultimoArtGrupo.precioPromoPorUnidad = redondearPrecio(resto);
    } else {
      ultimoArtGrupo.precioPromoPorUnidad = promo_individual
        ? precioPorUnidadPromoIndividual
        : redondearPrecio(resto / ultimoArtGrupo.unidades);
      resto -= redondearPrecio(
        ultimoArtGrupo.precioPromoPorUnidad * (ultimoArtGrupo.unidades - 1)
      );
      resto = redondearPrecio(resto);
      if (resto != ultimoArtGrupo.precioPromoPorUnidad) {
        ultimoArtGrupo.unidades--;
        let restoUltimoArtGrupo: ArticuloPromoEnCesta = {
          ...ultimoArtGrupo,
          unidades: 1,
          precioPromoPorUnidad: resto,
        };
        // crear otro subgrupo para el último elemento con el resto
        item.promocion.grupos[item.promocion.grupos.length - 1].push(
          restoUltimoArtGrupo
        );
      }
    }
    // borrar información de ArticuloInfoPromoYNormal y convertirlo en ArticuloPromoEnCesta
    gruposFlat = item.promocion.grupos.flat() as ArticuloInfoPromoYNormal[];
    for (let artGrupo of gruposFlat) {
      delete artGrupo.precioPorUnidad;
      delete artGrupo.puntosPorUnidad;
    }
  }

  // mssql datetime no tiene timezone, al pasar a JSON la date se pasa a string con timezone Z (UTC)
  // las fechas en la tabla del sql del WEB productespromocionats se refieren a la timezone local de la tienda (mirar documentación de HIT)
  private mssqlDateToJsDate(strdate: string) {
    // quitar timezone Z, si la fecha no tiene timezone se usa la local (si la fecha es fecha-hora)
    if (strdate.endsWith("Z")) strdate = strdate.slice(0, -1);
    return new Date(strdate);
  }

  private comprobarIntervaloFechas(promocion) {
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
    var dia = parseInt(fecha.slice(8, 10), 10); // YYYY-MM-(DD)Thh:mm:ss

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
    var ano = parseInt(fecha.slice(0, 4), 10); // (YYYY)-MM-DDThh:mm:ss

    // Ajustar el día de la semana para que 08 sea lunes, 09 sea martes, etc.
    return ano;
  }

  /* Eze 4.0 */
  public insertarPromociones = async (
    arrayPromociones: PromocionesEnServer[]
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
    for (let item of ticket.cesta.lista) {
      if (item.promocion) {
        const grupos = item.promocion.grupos.flat();
        let puntosAcumulados = 0;
        const puntosTotales = item?.puntos ? item.puntos : 0;

        for (let i = 0; i < grupos.length; i++) {
          const artGrupo = grupos[i];
          let puntosAsignados=null;

          // Calcular puntos por articulo al deshacer la promo de un regalo
          if (item?.regalo) {
            if (i < grupos.length - 1) {
              puntosAsignados = Math.round(puntosTotales / grupos.length);
              puntosAcumulados += puntosAsignados;
            } else {
              puntosAsignados = puntosTotales - puntosAcumulados;
            }
          }

          nuevaLista.push({
            arraySuplementos: null,
            gramos: null,
            idArticulo: artGrupo.idArticulo,
            regalo: item?.regalo ? true : false,
            puntos: puntosAsignados,
            promocion: null,
            unidades: item.unidades * artGrupo.unidades * valor,
            subtotal: item?.regalo
              ? 0
              : redondearPrecio(
                  artGrupo.precioPromoPorUnidad *
                    item.unidades *
                    artGrupo.unidades
                ),
            nombre: "ArtículoDentroDePromo " + artGrupo.nombre,
          });
        }
      } else {
        nuevaLista.push(item);
      }
    }
    ticket.cesta.lista = nuevaLista;
    return ticket.cesta.lista;
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
}

export const nuevaInstancePromociones = new NuevaPromocion();
