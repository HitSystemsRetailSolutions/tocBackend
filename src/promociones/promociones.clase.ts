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
    - ArticulosFaltaUnoParaPromocion contiene articulos que si se añaden a la cesta formaran una promoción
      nueva de mayor valor.
*/
import axios from "axios";
import { logger } from "../logger";
import * as schPromociones from "./promociones.mongodb";
import { TicketsInterface } from "../tickets/tickets.interface";
import { arrayClientesFacturacion, ClientesInterface } from "../clientes/clientes.interface";
import { ArticulosInterface } from "../articulos/articulos.interface";
import { CestasInterface, ItemLista, ItemLista_old, GrupoPromoEnCesta, ArticuloPromoEnCesta } from "../cestas/cestas.interface";
import { PromocionesEnServer, PromocionesInterface } from "./promociones.interface"
import { articulosInstance } from "src/articulos/articulos.clase";
const redondearPrecio = (precio: number) =>
  Math.round((precio + Number.EPSILON*100000) * 100) / 100;
import * as schCestas from "../cestas/cestas.mongodb"

export type ArticuloInfoPromoYNormal = ArticuloPromoEnCesta & {
    precioPorUnidad: number;
    puntosPorUnidad: number;
}
export class NuevaPromocion {
  private promos:PromocionesInterface[]=[]
  private promosCombo:PromocionesEnServer[]=[]
  private promosIndividuales:PromocionesEnServer[]=[]
  constructor() {
    this.promos=[];
    (async() => {
      try {
        this.recargarPromosCache()
          // el dia del cambio de versión puede haber cestas que tengan el formato antiguo
          // así que se convierten al nuevo
        let allCestas= await schCestas.getAllCestas()
        for (let cesta of allCestas) {
          let update = this.convertirAFormatoNuevoSiEsNecesario(cesta)
          if (update) {
            schCestas.updateCesta(cesta)
          }
        }
      } catch(err) {
        logger.Error(128, err);
      }
    })()
  }

  public convertirAFormatoNuevoSiEsNecesario(cesta:CestasInterface) {
    let update=false
    for (let item of cesta.lista) {
      let itemOld = (item as unknown) as ItemLista_old
      if (itemOld.promocion && itemOld.promocion.idArticuloPrincipal!=null) {
        // Promo. principal + secundario
        let dot = itemOld.nombre.indexOf(".")
        let plus = itemOld.nombre.indexOf("+")
        item.promocion.grupos = [[{
          idArticulo:itemOld.promocion.idArticuloPrincipal,
          nombre:itemOld.nombre.substring(dot==-1?0:dot+1, plus==-1?undefined:plus-1),
          unidades:itemOld.promocion.cantidadArticuloPrincipal,
          precioPromoPorUnidad:itemOld.promocion.precioRealArticuloPrincipal
        }]]
        if (itemOld.promocion.idArticuloSecundario!=null) {
          item.promocion.grupos.push([{
            idArticulo:itemOld.promocion.idArticuloSecundario,
            nombre:itemOld.nombre.substring(plus+2),
            unidades:itemOld.promocion.cantidadArticuloSecundario,
            precioPromoPorUnidad:itemOld.promocion.precioRealArticuloSecundario
          }])
        }
        delete itemOld.promocion.idArticuloPrincipal
        //item.promocion.gruposFlat=item.promocion.grupos.reduce((acc,val)=>acc.concat(val))
        update=true
      }
    }
    if (cesta.ArticulosFaltaUnoParaPromocion==null) {
      cesta.ArticulosFaltaUnoParaPromocion=[]
      update = true
    }
    return update
  }
  async getPromosCombo() {
    return await schPromociones.getPromosCombo();
  }

  async getPromosIndividuales() {
    return await schPromociones.getPromosIndividuales();
  }

  public getPromoById(idPromo: string) {
    for (let i=0; i<this.promos.length; i++) {
      if (this.promos[i]._id==idPromo) return this.promos[i]
    }
    return null
  }
  
  async descargarPromociones() {
    try {
      let resPromos: any = await axios
        .get("promociones/getPromociones")

      resPromos = resPromos?.data as PromocionesInterface[];
      if (resPromos) {
        return await schPromociones.insertarPromociones(resPromos);
      }
      throw Error("No hay promociones para descargar");
    } catch (e) {
      console.log(e);
      return false
    }
  }
  
  /* Cargar promos en formato de descarga al usado por el Backend */
  public async recargarPromosCache() {
    this.promosCombo = await this.getPromosCombo();
    this.promosIndividuales = await this.getPromosIndividuales();
    this.promos = []
    function nueva_promo(promoServer:PromocionesEnServer):PromocionesInterface {
      return {
        _id:promoServer._id,
        fechaFinal:promoServer.fechaFinal,
        fechaInicio:promoServer.fechaInicio,
        precioFinal:promoServer.precioFinal,
        grupos:[],
        sortInfo:{unidades_totales:0, unidades_por_grupo:[]}
      }      
    }
    function insertar_grupo(promo:PromocionesInterface, ar_art:number[], cantidad:number) {
      if (Array.isArray(ar_art) && ar_art.length>0 && ar_art[0]>=0) {
        promo.grupos.push({
          idsArticulos:new Set(ar_art),
          cantidad:cantidad,
        })
        return cantidad
      } else return 0
    }
    for (let promoEnServer of this.promosCombo.concat(this.promosIndividuales)) {
      let promo=nueva_promo(promoEnServer)
      let cantidad = insertar_grupo(promo, promoEnServer.principal, promoEnServer.cantidadPrincipal)
      cantidad    += insertar_grupo(promo, promoEnServer.secundario, promoEnServer.cantidadSecundario)
      // en promoIndividual el precioFinal es por unidad no es el total de la promo
      if (promoEnServer.tipo == "INDIVIDUAL") {
        promo.precioFinal=redondearPrecio(promo.precioFinal*cantidad)
      }
      for (let grupo of promo.grupos) {
        promo.sortInfo.unidades_totales+=grupo.cantidad
        promo.sortInfo.unidades_por_grupo.push(grupo.cantidad)
      }
      promo.sortInfo.unidades_por_grupo.sort((a,b)=>-(a-b))
      if (promo.grupos.length) this.promos.push(promo)
    }
    this.promos.sort((a,b)=>{
      let c = -(a.sortInfo.unidades_totales-b.sortInfo.unidades_totales)  // unidades totales desc
      if (c!=0) return c
      c = a.sortInfo.unidades_por_grupo.length-b.sortInfo.unidades_por_grupo.length // número de grupos asc
      if (c!=0) return c
      for (let i=0; i<a.sortInfo.unidades_por_grupo.length; i++) {
        c= -(a.sortInfo.unidades_por_grupo[i]-b.sortInfo.unidades_por_grupo[i]) // unidades grupo[0],[...] asc
        if (c!=0) return c
      }
      return a._id<b._id?-1:1 // por id
    })
  }

  // Este tipo de items no se usan para formar promociones
  public isItemPromocionable(item:ItemLista) {
    if (item.gramos!=null) return false
    if (item.varis) return false
    if (item.regalo) return false
    if (item.pagado) return false
    return true
  }

  /*
   */
  public async aplicarPromociones(cesta:CestasInterface, cliente: ClientesInterface) {
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
    let SetNoPromocionables:Set<ItemLista> = new Set()
    // articulos que pueden formar parte de promociones
    let MapPromocionables:Map<ArticulosInterface["_id"],ArticuloInfoPromoYNormal> = new Map()
    // deshacer promociones y pasar items normales a formato de articulo en Promo
    // Al final MapPromociones tendra ArticuloInfoPromoYNormal
    for (let item of cesta.lista) {
      if (this.isItemPromocionable(item)) {
        if (item.promocion) {
          // deshacer promoción
          for (let artGrupo of item.promocion.grupos.flat()) {
            let info = MapPromocionables.get(artGrupo.idArticulo)
            if (info != undefined) {
              info.unidades += artGrupo.unidades*item.unidades
            } else {
              let info = await articulosInstance.getInfoArticulo(artGrupo.idArticulo)
              MapPromocionables.set(artGrupo.idArticulo, { 
                ...artGrupo,
                unidades:artGrupo.unidades*item.unidades,
                precioPorUnidad:info.precioConIva,
                puntosPorUnidad:info.puntos
              })
            }
          }
        } else {
          // pasar items normales a formato ArticuloInfoPromoYNormal
          let info = MapPromocionables.get(item.idArticulo)
          if (info != undefined) {
            info.unidades += item.unidades
          } else {
            MapPromocionables.set(item.idArticulo,{
              idArticulo:item.idArticulo,
              nombre:item.nombre,
              unidades:item.unidades,
              precioPorUnidad:item.subtotal/item.unidades,
              puntosPorUnidad:item.puntos==null ? null : item.puntos/item.unidades,
              precioPromoPorUnidad:null
            })
          }
        }
      } else SetNoPromocionables.add(item)
    }
    
    let PromosAplicadasTotales:Map<string, ItemLista[]>=new Map()
    let SetArticulosFalta1ParaCompletar:Set<ArticulosInterface["_id"]>=new Set()

    for (let promo of this.promos) { // para cada promo intentar aplica la cesta
      if (!this.comprobarIntervaloFechas(promo)) continue;
      let PromoAplicada:ItemLista=null;
      while(true) { // para aplicar varias veces la misma promo
          // articulo aplicado y unidades
        let ArticulosAplicados:Map<ArticuloPromoEnCesta, number> = new Map()
        let GruposAplicados:GrupoPromoEnCesta[]=[]
        let Falta1ParaCompletarEstaPromo:Set<ArticulosInterface["_id"]>=null
        for (let grupo of promo.grupos) { // mirar por cada grupo de la promo
          let GrupoAplicado:GrupoPromoEnCesta=[]
          let cantidadGrupo = grupo.cantidad
          for (let [idArticulo, articulo] of MapPromocionables) {
            if (grupo.idsArticulos.has(idArticulo)) {
              let restanAplicables = ArticulosAplicados.get(articulo)
              if (restanAplicables == undefined) restanAplicables = articulo.unidades
              let unidadesAplicadas:number
              if (cantidadGrupo <= restanAplicables) {
                unidadesAplicadas = cantidadGrupo
              } else {
                unidadesAplicadas=restanAplicables
              }
              ArticulosAplicados.set(articulo, restanAplicables-unidadesAplicadas)
              cantidadGrupo -= unidadesAplicadas
              GrupoAplicado.push({...articulo, unidades:unidadesAplicadas})
            }  
            if (cantidadGrupo==0) {
              GrupoAplicado.sort((a,b)=>a.idArticulo-b.idArticulo)
              GruposAplicados.push(GrupoAplicado)
              break
            }
          }
          if (cantidadGrupo==0) continue
          if (cantidadGrupo==1 && Falta1ParaCompletarEstaPromo==null) {
            Falta1ParaCompletarEstaPromo=grupo.idsArticulos
            continue
          }
          if (cantidadGrupo!=0) {
            GruposAplicados=null
            Falta1ParaCompletarEstaPromo=null
            break
          }
        }
        if (Falta1ParaCompletarEstaPromo) {
          for (let art of Falta1ParaCompletarEstaPromo) SetArticulosFalta1ParaCompletar.add(art)
          GruposAplicados=null  
        }

        if (GruposAplicados) {
          // recorrer ItemsAplicados y borrar de MapPromocionables
          for (let [articulo, restan] of ArticulosAplicados) {
            if (restan==0) MapPromocionables.delete(articulo.idArticulo)
            else {
              let itemPromocionable = MapPromocionables.get(articulo.idArticulo)
              itemPromocionable.unidades = restan
            }
          }
          function gruposPromoiguales(grupos_a:GrupoPromoEnCesta[], grupos_b:GrupoPromoEnCesta[]) {
            if (grupos_a.length!=grupos_b.length) return false
            for (let i=0; i<grupos_a.length; i++) {
              if (grupos_a[i].length!=grupos_b[i].length) return false
              for (let j=0; j<grupos_a[i].length; j++) {
                if (grupos_a[i][j].idArticulo!=grupos_b[i][j].idArticulo) return false
                if (grupos_a[i][j].unidades!=grupos_b[i][j].unidades) return false
              }
            }
            return true
          }
          // PromoAplicada es la promo aplicada antes de esta
          if (PromoAplicada && gruposPromoiguales(PromoAplicada.promocion.grupos, GruposAplicados)) {
            PromoAplicada.unidades++
          } else {
            if (PromoAplicada) this.calculoFinalPromo(PromoAplicada)
            PromoAplicada = await this.crearItemListaPromo(promo, GruposAplicados)
            //PromoAplicadasTotales es un Map de nombre a array de promosAplicadas
            let promosConMismoNombrePeroDiferentesElementos = PromosAplicadasTotales.get(PromoAplicada.nombre) 
            if (promosConMismoNombrePeroDiferentesElementos) promosConMismoNombrePeroDiferentesElementos.push(PromoAplicada)
            else PromosAplicadasTotales.set(PromoAplicada.nombre, [PromoAplicada])
          } 
        } else { // !GruposAplicados
          // no se han podido aplicar más promociones, cerrar la última si existe
          if (PromoAplicada) this.calculoFinalPromo(PromoAplicada)
          break // while(true)
        }
      } // while aplicar la misma promo otra vez
    }

    function crearItemListaNormal(articulo: ArticuloInfoPromoYNormal):ItemLista {
      return {
        idArticulo:articulo.idArticulo,
        nombre: articulo.nombre,
        unidades: articulo.unidades,
        subtotal: redondearPrecio(articulo.precioPorUnidad*articulo.unidades),
        puntos: articulo.puntosPorUnidad*articulo.unidades,
        regalo: false,
        pagado: false,
        varis: false
      } as ItemLista
    }
    // crear cesta lista de salida con el mismo orden de lista de entrada
    let lista_out:ItemLista[] = []
    for (let item_in of cesta.lista) {
      if (SetNoPromocionables.has(item_in)) lista_out.push(item_in)
      else {
        if (item_in.promocion==null) {
          if (MapPromocionables.has(item_in.idArticulo)) {
            lista_out.push(crearItemListaNormal(MapPromocionables.get(item_in.idArticulo)))
            MapPromocionables.delete(item_in.idArticulo)
          }
        } else if (PromosAplicadasTotales.has(item_in.nombre)) {
          PromosAplicadasTotales.get(item_in.nombre).map(promo=>{lista_out.push(promo)})
          PromosAplicadasTotales.delete(item_in.nombre)
        }
      }
    }
    // insertar en lista articulos y promos que no estaban en la lista de entrada
    for (let articulo of MapPromocionables.values()) {
      lista_out.push(crearItemListaNormal(articulo))        
    }
    for (let promos of PromosAplicadasTotales.values()) {
      promos.map(promo=>{lista_out.push(promo)})
    }
    cesta.lista=lista_out
    cesta.ArticulosFaltaUnoParaPromocion = Array.from(SetArticulosFalta1ParaCompletar)
  }

  public async crearItemListaPromo(promo:PromocionesInterface, grupos:GrupoPromoEnCesta[]):Promise<ItemLista> {
    let nombres:string[]=[]
    for (let grupo of promo.grupos) {
      // el nombre de la promo es familia del primer articulo si hay más de un articulo en la promo sino el nombre
      if (grupo.familia_o_nombre == null) {
        // famili_o_nombre se inicializa aqui ya que en descarga de promos puede que no existieran articulos aún en el mongo
        let art = await articulosInstance.getInfoArticulo(Array.from(grupo.idsArticulos)[0])
        if (grupo.idsArticulos.size > 1) {
          // 0312 - Oferta Bocadillos BG (eliminar numeros iniciales y guion)
          let m = /(?:^\d+ - )?(.*)/.exec(art.familia) 
          grupo.familia_o_nombre = m==null ? art.familia : m[1]
        } else grupo.familia_o_nombre = art.nombre
      }
      nombres.push(grupo.familia_o_nombre)
    }

    return {
      idArticulo:-1,
      nombre: "Promo. "+nombres.join(" + "),
      unidades:1,
      promocion: {
        idPromocion: promo._id,
        grupos:grupos,
        unidadesOferta: 1,
        precioFinalPorPromo:promo.precioFinal
      },
      regalo: false,
      pagado: false,
      varis: false
    } as ItemLista
  }

  // cerrar promo calculando precio por articulo
  public calculoFinalPromo(item:ItemLista) {
    let gruposFlat = item.promocion.grupos.flat() as ArticuloInfoPromoYNormal[]
    item.promocion.unidadesOferta = item.unidades
    item.subtotal = redondearPrecio(item.promocion.precioFinalPorPromo * item.unidades)
    let totalSinPromocion=0, puntos=null
    for (let artGrupo of gruposFlat) {
      totalSinPromocion += artGrupo.precioPorUnidad * artGrupo.unidades
      if (artGrupo.puntosPorUnidad!=null) {
        if (puntos==null) puntos=0
        puntos += artGrupo.puntosPorUnidad * artGrupo.unidades
      }
    }
    
    item.puntos = puntos*item.unidades

    let promo_individual = (item.promocion.grupos.length==1)
    let precioPorUnidadPromoIndividual:number
    if (promo_individual) { // si es promo individual todos los articulos tienen el mismo precio
      let unidades=0
      for (let artGrupo of gruposFlat) {
        unidades += artGrupo.unidades
      }
      precioPorUnidadPromoIndividual = redondearPrecio(item.promocion.precioFinalPorPromo/unidades)
    } 
    let resto=item.promocion.precioFinalPorPromo
    for (let i=0; i<gruposFlat.length-1; i++) {
      let artGrupo = gruposFlat[i]
      artGrupo.precioPromoPorUnidad = promo_individual ? precioPorUnidadPromoIndividual : 
        redondearPrecio(artGrupo.precioPorUnidad*(item.promocion.precioFinalPorPromo/totalSinPromocion))
      resto -= artGrupo.precioPromoPorUnidad*artGrupo.unidades
    }
    let ultimoArtGrupo = gruposFlat[gruposFlat.length-1]
    if (ultimoArtGrupo.unidades==1) {
      ultimoArtGrupo.precioPromoPorUnidad = redondearPrecio(resto)
    } else {
      ultimoArtGrupo.precioPromoPorUnidad = promo_individual ? precioPorUnidadPromoIndividual :
        redondearPrecio(resto/ultimoArtGrupo.unidades)
      resto -= redondearPrecio(ultimoArtGrupo.precioPromoPorUnidad*(ultimoArtGrupo.unidades-1))
      resto = redondearPrecio(resto)
      if (resto != ultimoArtGrupo.precioPromoPorUnidad) {
        ultimoArtGrupo.unidades--
        let restoUltimoArtGrupo:ArticuloPromoEnCesta = {
          ...ultimoArtGrupo,
          unidades:1,
          precioPromoPorUnidad:resto
        }
        // crear otro subgrupo para el último elemento con el resto
        item.promocion.grupos[item.promocion.grupos.length-1].push(restoUltimoArtGrupo)
      }
    }
    // borrar información de ArticuloInfoPromoYNormal y convertirlo en ArticuloPromoEnCesta
    gruposFlat = item.promocion.grupos.flat() as ArticuloInfoPromoYNormal[]
    for (let artGrupo of gruposFlat) {
      delete artGrupo.precioPorUnidad
      delete artGrupo.puntosPorUnidad
    }
  }


// mssql datetime no tiene timezone, al pasar a JSON la date se pasa a string con timezone Z (UTC)
  // las fechas en la tabla del sql del WEB productespromocionats se refieren a la timezone local de la tienda (mirar documentación de HIT)
  private mssqlDateToJsDate(strdate: string) {
    // quitar timezone Z, si la fecha no tiene timezone se usa la local (si la fecha es fecha-hora)
    if (strdate.endsWith("Z")) strdate = strdate.slice(0, -1);
    return new Date(strdate);
  }

  private async comprobarIntervaloFechas(promocion) {
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
        for (let artGrupo of item.promocion.grupos.flat()) {
          nuevaLista.push({
            arraySuplementos: null,
            gramos: null,
            idArticulo: artGrupo.idArticulo,
            regalo: false,
            puntos: null,
            promocion: null,
            unidades: item.unidades * artGrupo.unidades * valor , //unidades pierde el simbolo negativo cuando es un ticket anulado y se le multiplica -1
            subtotal: redondearPrecio(artGrupo.precioPromoPorUnidad * item.unidades * artGrupo.unidades),
            nombre: "ArtículoDentroDePromo "+artGrupo.nombre,
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