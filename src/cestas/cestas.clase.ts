import * as schCestas from "./cestas.mongodb";
import {
  CestasInterface,
  DetalleIvaInterface,
  ItemLista,
  ModoCesta,
  itemHonei,
} from "./cestas.interface";
import {
  construirObjetoIvas,
  fusionarObjetosDetalleIva,
} from "../funciones/funciones";
import { Articulos, articulosInstance } from "../articulos/articulos.clase";
import { cajaInstance } from "../caja/caja.clase";
import { ArticulosInterface } from "../articulos/articulos.interface";
import { ClientesInterface } from "../clientes/clientes.interface";
import { ObjectId } from "mongodb";
import { logger } from "../logger";
import { io } from "../sockets.gateway";
import { nuevaInstancePromociones } from "../promociones/promociones.clase";
import { clienteInstance } from "../clientes/clientes.clase";
import { impresoraInstance } from "../impresora/impresora.class";
import axios from "axios";
import { parametrosInstance } from "src/parametros/parametros.clase";
import { TrabajadoresInterface } from "src/trabajadores/trabajadores.interface";
import { tarifasInstance } from "src/tarifas/tarifas.class";

export class CestaClase {
  /* Eze 4.0 */
  async actualizarCestas() {
    const arrayCestas = await cestasInstance.getAllCestas();
    io.emit("cargarCestas", arrayCestas);
    // cestasInstance
    //   .getAllCestas()
    //   .then((arrayCestas) => {

    //   })
    //   .catch((err) => {
    //     logger.Error(119, err);
    //   });
  }

  /* Eze 4.0 */
  getCestaById = async (idCesta: CestasInterface["_id"]) =>
    await schCestas.getCestaById(idCesta);

  /* Eze 4.0 */
  private generarObjetoCesta(
    nuevoId: CestasInterface["_id"],
    modoV: ModoCesta = "VENTA",
    trabajador: CestasInterface["trabajador"] = null
  ): CestasInterface {
    return {
      _id: nuevoId,
      timestamp: Date.now(),
      detalleIva: {
        base1: 0,
        base2: 0,
        base3: 0,
        base4: 0,
        base5: 0,
        valorIva1: 0,
        valorIva2: 0,
        valorIva3: 0,
        valorIva4: 0,
        valorIva5: 0,
        importe1: 0,
        importe2: 0,
        importe3: 0,
        importe4: 0,
        importe5: 0,
      },
      lista: [],
      modo: modoV,
      idCliente: null,
      indexMesa: null,
      trabajador: trabajador,
      trabajadores: [],
      comensales: 1,
    };
  }

  /* Eze 4.0 */
  getAllCestas = async () => await schCestas.getAllCestas();

  /* Uri */
  setClients = async (clients, cesta) => {
    let res = await schCestas.setClients(clients, cesta);
    this.actualizarCestas();
    return res;
  };

  /* Uri */

  setTrabajadorCesta = async (idcesta, trabajador) =>
    await schCestas.trabajadorEnCesta(idcesta, trabajador);

  /* Eze 4.0 */
  deleteCesta = async (trabajador: TrabajadoresInterface["_id"]) =>
    await schCestas.deleteCesta(trabajador);

  borrarTrabajadores = async (trabajador: TrabajadoresInterface["_id"]) =>
    schCestas.eliminarTrabajadorDeCesta(trabajador);

  /* Uri*/
  deleteCestaMesa = async (idCesta: CestasInterface["_id"]) =>
    await schCestas.deleteCestaMesa(idCesta);

  /* Eze 4.0 */
  async crearCesta(
    indexMesa = null,
    trabajador = null
  ): Promise<CestasInterface["_id"]> {
    const nuevaCesta = await this.generarObjetoCesta(
      new ObjectId(),
      "VENTA",
      trabajador
    );
    nuevaCesta.indexMesa = indexMesa;
    if (await schCestas.createCesta(nuevaCesta)) return nuevaCesta._id;
    // return  Error("Error, no se ha podido crear la cesta");
    return undefined;
  }

  /* Uri */
  async crearCestaDevolucion(
    trabajador = null
  ): Promise<CestasInterface["_id"]> {
    const nuevaCesta = this.generarObjetoCesta(
      new ObjectId(),
      "DEVOLUCION",
      trabajador
    );
    if (await schCestas.createCesta(nuevaCesta)) return nuevaCesta._id;
    throw Error("Error, no se ha podido crear la cesta");
  }

  async CestaPagoSeparado(articulos) {
    const nuevaCesta = this.generarObjetoCesta(new ObjectId(), "PAGO SEPARADO");
    nuevaCesta.indexMesa = null;
    let id = undefined;
    if (await schCestas.createCesta(nuevaCesta)) id = nuevaCesta._id;
    if (id != undefined) {
      for (let i = 0; i < articulos.length; i++) {
        let e = articulos[i];
        await this.clickTeclaArticulo(
          e.idArticulo,
          e.gramos,
          id,
          e.unidades,
          e.arraySuplementos,
          "",
          ""
        );
      }
      return id;
    }
  }

  async DevolverCestaPagoSeparado(cesta, articulos) {
    for (let i = 0; i < articulos.length; i++) {
      let e = articulos[i];
      await this.clickTeclaArticulo(
        e.idArticulo,
        e.gramos,
        cesta,
        e.unidades,
        e.arraySuplementos,
        "",
        ""
      );
    }
    return true;
  }

  /* Eze 4.0 */
  getTotalCesta = (cesta: CestasInterface) =>
    cesta.detalleIva.importe1 +
    cesta.detalleIva.importe2 +
    cesta.detalleIva.importe3 +
    cesta.detalleIva.importe4 +
    cesta.detalleIva.importe5;

  /* Eze 4.0 */
  async borrarItemCesta(
    idCesta: CestasInterface["_id"],
    index: number
  ): Promise<boolean> {
    try {
      let cesta = await this.getCestaById(idCesta);
      if (cesta.lista[index].pagado) return null;
      let productos = [];
      productos.push(cesta.lista[index]);
      await this.registroLogSantaAna(cesta, productos);

      cesta.lista.splice(index, 1);
      // Enviar por socket
      await this.recalcularIvas(cesta);
      if (await this.updateCesta(cesta)) {
        let numProductos = 0;
        let total = 0;
        for (let i = 0; i < cesta.lista.length; i++) {
          numProductos += cesta.lista[i].unidades;
          total += cesta.lista[i].subtotal;
        }
        let precio =
          cesta.lista[cesta.lista.length - 1]?.subtotal == undefined
            ? 0
            : cesta.lista[cesta.lista.length - 1]?.subtotal;
        let nombre =
          cesta.lista[cesta.lista.length - 1]?.nombre == undefined
            ? ""
            : cesta.lista[cesta.lista.length - 1]?.nombre;
        impresoraInstance.mostrarVisor({
          total: total.toFixed(2),
          precio: precio,
          texto: nombre,
          numProductos: numProductos,
        });
        this.actualizarCestas();
        return true;
      }
      throw Error(
        "Error, no se ha podido actualizar la cesta borrarItemCesta()"
      );
    } catch (err) {
      console.log(err);
      logger.Error(57, err);
      return false;
    }
  }

  /* Eze 4.0 */
  async borrarUnicoItemCesta(
    idCesta: CestasInterface["_id"],
    articulos: any
  ): Promise<boolean> {
    try {
      let cesta = await this.getCestaById(idCesta);
      for (let x = 0; x < articulos.length; x++) {
        let i = cesta.lista.findIndex(
          (z) => z.idArticulo == articulos[x].idArticulo
        );
        if (cesta.lista[i].unidades > 1) {
          cesta.lista[i].unidades -= 1;
        } else {
          cesta.lista.splice(i, 1);
        }
      }
      // Enviar por socket
      await this.recalcularIvas(cesta);
      if (await this.updateCesta(cesta)) {
        await this.actualizarCestas();
        return true;
      }
      throw Error(
        "Error, no se ha podido actualizar la cesta borrarItemCesta()"
      );
    } catch (err) {
      logger.Error(57, err);
      return false;
    }
  }

  /* Eze: este nombre no vale, hace otra cosa */
  async limpiarCesta(
    unaCesta: CestasInterface,
    posicionPrincipal: number,
    posicionSecundario: number,
    sobraCantidadPrincipal: number,
    sobraCantidadSecundario: number,
    pideDelA: number,
    pideDelB: number
  ) {
    if (pideDelA != -1) {
      if (sobraCantidadPrincipal > 0) {
        const datosArticulo = await articulosInstance.getInfoArticulo(
          unaCesta.lista[posicionPrincipal].idArticulo
        );
        unaCesta.lista[posicionPrincipal].unidades = sobraCantidadPrincipal;
        unaCesta.lista[posicionPrincipal].subtotal =
          sobraCantidadPrincipal * datosArticulo.precioConIva;
      } else {
        unaCesta.lista.splice(posicionPrincipal, 1);
      }
    }

    if (pideDelB != -1) {
      if (sobraCantidadSecundario > 0) {
        const datosArticulo = await articulosInstance.getInfoArticulo(
          unaCesta.lista[posicionSecundario].idArticulo
        );
        unaCesta.lista[posicionSecundario].unidades = sobraCantidadSecundario;
        unaCesta.lista[posicionSecundario].subtotal =
          sobraCantidadSecundario * datosArticulo.precioConIva;
      } else {
        if (posicionSecundario > posicionPrincipal) {
          unaCesta.lista.splice(posicionSecundario - 1, 1);
        } else {
          unaCesta.lista.splice(posicionSecundario, 1);
        }
      }
    }
    return unaCesta;
  }

  async pasarCestas(
    idOrigen: CestasInterface["_id"],
    idDestino: CestasInterface["_id"]
  ): Promise<boolean> {
    try {
      let cestaOrigen = await this.getCestaById(idOrigen);

      for (let i = 0; i < cestaOrigen.lista.length; i++) {
        let item = cestaOrigen.lista[i];
        await this.clickTeclaArticulo(
          item.idArticulo,
          item.gramos,
          idDestino,
          item.unidades,
          item.arraySuplementos,
          item.nombre,
          ""
        );
      }
      this.borrarArticulosCesta(idOrigen);
      return true;
    } catch (e) {
      return false;
    }
  }

  /* Uri*/
  async insertarArticulo(
    articulo: ArticulosInterface,
    unidades: number,
    idCesta: CestasInterface["_id"],
    arraySuplementos: ItemLista["arraySuplementos"], // Los suplentos no deben tener tarifa especial para simplificar.
    gramos: ItemLista["gramos"],
    nombre = "",
    menu = "",
    regalar: boolean = false
  ): Promise<CestasInterface> {
    // recojemos la cesta
    let cesta = await this.getCestaById(idCesta);
    let articuloNuevo = true;
    // si es una promocion lo gestionamos de otra forma
    if (
      !(await nuevaInstancePromociones.gestionarPromociones(
        cesta,
        articulo._id,
        unidades
      ))
    ) {
      articulo["menu"] = menu;
      // recojemos los datos del articulo
      // let infoArticulo = await articulosInstance.getInfoArticulo(articulo._id);
      // recorremos la cesta
      for (let i = 0; i < cesta.lista.length; i++) {
        // si el articulo ya esta en la cesta
        if (
          cesta.lista[i].idArticulo === articulo._id &&
          cesta.lista[i].gramos == null &&
          cesta.lista[i].regalo == regalar &&
          cesta.lista[i].promocion == null &&
          // aqui basicamente compruebo de que si el articulo es especial y tiene un nombre diferente que no se sume
          (cesta.lista[i].nombre == nombre || nombre.length == 0) &&
          // comrpuebo que no se sumen articulos pagados con no pagados
          !(menu === "pagados" && !cesta.lista[i].pagado) &&
          !(menu !== "pagados" && cesta.lista[i].pagado)
        ) {
          if (
            arraySuplementos &&
            cesta.lista[i]?.arraySuplementos &&
            cesta.lista[i]?.arraySuplementos?.length == arraySuplementos?.length
          ) {
            let subCesta = cesta.lista[i].arraySuplementos;

            subCesta = subCesta.sort(function (a, b) {
              return a._id - b._id;
            });

            arraySuplementos = arraySuplementos.sort(function (a, b) {
              return a._id - b._id;
            });
            let igual = 0;
            let precioSuplementos = 0;
            for (let j = 0; j < arraySuplementos.length; j++) {
              if (arraySuplementos[j]._id === subCesta[j]._id) {
                precioSuplementos += arraySuplementos[j].precioConIva;
                igual++;
              }
            }
            // articulos pagados y no pagados de honei
            if (igual == cesta.lista[i].arraySuplementos.length) {
              cesta.lista[i].unidades += unidades;
              cesta.lista[i].puntos += articulo.puntos;
              cesta.lista[i].subtotal =
                nuevaInstancePromociones.redondearDecimales(
                  cesta.lista[i].subtotal + unidades * articulo.precioConIva,
                  2
                );

              articuloNuevo = false;
              break;
            }
          } else if (
            cesta.lista[i].arraySuplementos == null &&
            cesta.lista[i].regalo == regalar
          ) {
            cesta.lista[i].unidades += unidades;
            cesta.lista[i].puntos += articulo.puntos;
            if (!regalar) {
              cesta.lista[i].subtotal = Number(
                (
                  cesta.lista[i].subtotal +
                  unidades * articulo.precioConIva
                ).toFixed(2)
              );
            }
            articuloNuevo = false;
            break;
          }
        }
      }
      const pagado = menu === "pagados";

      if (articuloNuevo) {
        cesta.lista.push({
          idArticulo: articulo._id,
          nombre: articulo.nombre,
          arraySuplementos: arraySuplementos,
          promocion: null,
          regalo: false,
          puntos: articulo.puntos,
          subtotal: unidades * articulo.precioConIva,
          unidades: unidades,
          gramos: gramos,
          pagado,
        });
      }
      let numProductos = 0;
      let total = 0;
      for (let i = 0; i < cesta.lista.length; i++) {
        numProductos += cesta.lista[i].unidades;
        total += cesta.lista[i].subtotal;
      }
      if (menu != "honei" && menu != "pagados") {
        impresoraInstance.mostrarVisor({
          total: total.toFixed(2),
          precio: articulo.precioConIva.toFixed(2).toString(),
          texto: articulo.nombre,
          numProductos: numProductos,
        });
      }
    }

    await this.recalcularIvas(cesta, menu);
    if (await schCestas.updateCesta(cesta)) return cesta;

    throw Error("Error updateCesta() - cesta.clase.ts");
  }
  /* Yasai :D */
  async insertarArticulosHonei(
    idCesta: CestasInterface["_id"],
    articulos: itemHonei[]
  ) {
    for (const articulo of articulos) {
      // cogemos el articulo
      const artInsertar: ArticulosInterface =
        await articulosInstance.getInfoArticulo(Number(articulo.id));
      let suplementos: ArticulosInterface[] = [];
      // cargamos los suplementos
      if (articulo.modifiers.length > 0) {
        suplementos = await Promise.all(
          articulo.modifiers.map(async (suplemento) => {
            return await articulosInstance.getInfoArticulo(
              Number(suplemento.id)
            );
          })
        );
      }

      // insertamos el articulo
      await this.insertarArticulo(
        artInsertar,
        articulo.quantity,
        idCesta,
        suplementos,
        null,
        "",
        "honei"
      );
    }
    this.actualizarCestas();
    return { ok: true };
  }

  async insertarArticulosPagados(
    idCesta: CestasInterface["_id"],
    articulos: itemHonei[]
  ) {
    for (const articulo of articulos) {
      // cogemos el articulo
      const artInsertar: ArticulosInterface =
        await articulosInstance.getInfoArticulo(Number(articulo.id));
      let suplementos: ArticulosInterface[] = [];
      // cargamos los suplementos
      if (articulo.modifiers.length > 0) {
        suplementos = await Promise.all(
          articulo.modifiers.map(async (suplemento) => {
            return await articulosInstance.getInfoArticulo(
              Number(suplemento.id)
            );
          })
        );
      }

      // insertamos el articulo
      await this.insertarArticulo(
        artInsertar,
        articulo.quantity,
        idCesta,
        suplementos,
        null,
        "",
        "pagados"
      );
    }

    return { ok: true };
  }

  /* Yasai :D */
  async clickTeclaArticulo(
    idArticulo: ArticulosInterface["_id"],
    gramos: ItemLista["gramos"],
    idCesta: CestasInterface["_id"],
    unidades: number,
    arraySuplementos: ItemLista["arraySuplementos"],
    nombre: string,
    menu: string,
    regalar: boolean = false
  ) {
    if (await cajaInstance.cajaAbierta()) {
      let articulo = await articulosInstance.getInfoArticulo(idArticulo);
      const cesta = await cestasInstance.getCestaById(idCesta);
      articulo.nombre = nombre.length > 0 ? nombre : articulo.nombre;

      if (cesta.idCliente) {
        articulo = await articulosInstance.getPrecioConTarifa(
          articulo,
          cesta.idCliente
        );
      }

      // Va a peso. 1 unidad son 1000 gramos. Los precios son por kilogramo.
      if (gramos && gramos > 0)
        return await this.insertarArticulo(
          articulo,
          gramos / 1000,
          idCesta,
          arraySuplementos,
          gramos,
          nombre,
          menu,
          regalar
        );
      // Modo por unidad
      return await this.insertarArticulo(
        articulo,
        unidades,
        idCesta,
        arraySuplementos,
        null,
        nombre,
        menu,
        regalar
      );
    }

    throw Error(
      "Error, la caja está cerrada. cestas.clase > clickTeclaArticulo()"
    );
  }

  /* Eze 4.0 */
  async getDetalleIvaPromocion(
    itemPromocion: ItemLista
  ): Promise<DetalleIvaInterface> {
    let detalleIva: DetalleIvaInterface = {
      base1: 0,
      base2: 0,
      base3: 0,
      base4: 0,
      base5: 0,
      valorIva1: 0,
      valorIva2: 0,
      valorIva3: 0,
      valorIva4: 0,
      valorIva5: 0,
      importe1: 0,
      importe2: 0,
      importe3: 0,
      importe4: 0,
      importe5: 0,
    };

    if (itemPromocion.promocion.tipoPromo === "INDIVIDUAL") {
      const articulo = await articulosInstance.getInfoArticulo(
        itemPromocion.promocion.idArticuloPrincipal
      );

      const importeRealUnitario =
        itemPromocion.promocion.precioRealArticuloPrincipal *
        itemPromocion.unidades;
      const unidadesTotales = itemPromocion.promocion.cantidadArticuloPrincipal
        ? itemPromocion.promocion.cantidadArticuloPrincipal
        : itemPromocion.promocion.cantidadArticuloSecundario *
          itemPromocion.unidades;
      detalleIva = construirObjetoIvas(
        importeRealUnitario,
        articulo.tipoIva,
        unidadesTotales
      );
    } else if (itemPromocion.promocion.tipoPromo === "COMBO") {
      const articuloPrincipal = await articulosInstance.getInfoArticulo(
        itemPromocion.promocion.idArticuloPrincipal
      );
      const articuloSecundario = await articulosInstance.getInfoArticulo(
        itemPromocion.promocion.idArticuloSecundario
      );

      const importeRealUnitarioPrincipal =
        itemPromocion.promocion.precioRealArticuloPrincipal;
      const importeRealUnitarioSecundario =
        itemPromocion.promocion.precioRealArticuloSecundario;
      const unidadesTotalesPrincipal =
        itemPromocion.promocion.cantidadArticuloPrincipal *
        itemPromocion.unidades;
      const unidadesTotalesSecundario =
        itemPromocion.promocion.cantidadArticuloSecundario *
        itemPromocion.unidades;
      const detalleIva1 = construirObjetoIvas(
        importeRealUnitarioPrincipal,
        articuloPrincipal.tipoIva,
        unidadesTotalesPrincipal
      );
      const detalleIva2 = construirObjetoIvas(
        importeRealUnitarioSecundario,
        articuloSecundario.tipoIva,
        unidadesTotalesSecundario
      );
      detalleIva = fusionarObjetosDetalleIva(detalleIva1, detalleIva2);
    } else {
      throw Error(
        "Error cestas.clase > getDetalleIvaPromocion. El tipo de oferta no corresponde con ningún tipo conocido"
      );
    }
    return detalleIva;
  }

  /* Eze 4.0 */
  async recalcularIvas(cesta: CestasInterface, menu: string = "") {
    cesta.detalleIva = {
      base1: 0,
      base2: 0,
      base3: 0,
      base4: 0,
      base5: 0,
      valorIva1: 0,
      valorIva2: 0,
      valorIva3: 0,
      valorIva4: 0,
      valorIva5: 0,
      importe1: 0,
      importe2: 0,
      importe3: 0,
      importe4: 0,
      importe5: 0,
    };
    let descuento: any =
      cesta.modo == "CONSUMO_PERSONAL"
        ? 0
        : Number(
            (await clienteInstance.isClienteDescuento(cesta.idCliente))
              ?.descuento
          );
    for (let i = 0; i < cesta.lista.length; i++) {
      if (cesta.lista[i].regalo) continue;
      if (cesta.lista[i].promocion) {
        // Una promoción no puede llevar suplementos
        cesta.detalleIva = fusionarObjetosDetalleIva(
          cesta.detalleIva,
          await this.getDetalleIvaPromocion(cesta.lista[i])
        );
      } else {
        let articulo = await articulosInstance.getInfoArticulo(
          cesta.lista[i].idArticulo
        );

        articulo = await articulosInstance.getPrecioConTarifa(
          articulo,
          cesta.idCliente
        );
        if (cesta.indexMesa != null) {
          articulo.precioConIva =
            (await tarifasInstance.tarifaMesas(cesta.lista[i].idArticulo)) ==
            null
              ? articulo.precioConIva
              : (await tarifasInstance.tarifaMesas(cesta.lista[i].idArticulo))
                  .precioConIva;
        }
        if (menu.length > 0) {
          let preu = await tarifasInstance.tarifaMenu(
            cesta.lista[i].idArticulo,
            menu
          );
          articulo.precioConIva =
            preu == null ? articulo.precioConIva : preu.precioConIva;
        }
        cesta.lista[i].subtotal =
          articulo.precioConIva * cesta.lista[i].unidades;
        if (descuento)
          articulo.precioConIva = Number(
            (
              articulo.precioConIva -
              articulo.precioConIva * (descuento / 100)
            ).toFixed(2)
          );

        const auxDetalleIva = construirObjetoIvas(
          articulo.precioConIva,
          articulo.tipoIva,
          cesta.lista[i].unidades
        );
        console.log(
          "auxDetalleIva",
          auxDetalleIva,
          "cestaIva:",
          cesta.detalleIva
        );
        cesta.detalleIva = fusionarObjetosDetalleIva(
          auxDetalleIva,
          cesta.detalleIva
        );

        /* Detalle IVA de suplementos */
        if (
          cesta.lista[i].arraySuplementos &&
          cesta.lista[i].arraySuplementos.length > 0
        ) {
          const detalleDeSuplementos = await this.getDetalleIvaSuplementos(
            cesta.lista[i].arraySuplementos,
            cesta.idCliente,
            cesta.lista[i].unidades
          );
          const preuSumplements = Number(
            await this.getPreuSuplementos(
              cesta.lista[i].arraySuplementos,
              cesta.idCliente,
              cesta.lista[i].unidades
            )
          );
          cesta.lista[i].subtotal += preuSumplements;
          cesta.detalleIva = fusionarObjetosDetalleIva(
            cesta.detalleIva,
            detalleDeSuplementos
          );
          /*cesta.lista[i].subtotal +=
            detalleDeSuplementos.importe1 +
            detalleDeSuplementos.importe2 +
            detalleDeSuplementos.importe3 +
            detalleDeSuplementos.importe4 +
            detalleDeSuplementos.importe5;*/
        }
      }
    }
    if (cesta.lista.length > 0) {
      if (
        cesta.lista[cesta.lista.length - 1].arraySuplementos &&
        cesta.lista[cesta.lista.length - 1].arraySuplementos.length > 0
      ) {
        let numProductos = 0;
        let total = 0;
        for (let i = 0; i < cesta.lista.length; i++) {
          numProductos += cesta.lista[i].unidades;
          total += cesta.lista[i].subtotal;
        }
        impresoraInstance.mostrarVisor({
          total: total.toFixed(2),
          precio: cesta.lista[cesta.lista.length - 1].subtotal
            .toFixed(2)
            .toString(),
          texto: cesta.lista[cesta.lista.length - 1].nombre,
          numProductos: numProductos,
        });
      }
    }
  }

  /* Uri */
  async getPreuSuplementos(
    arraySuplementos: ArticulosInterface[],
    idCliente: ClientesInterface["id"],
    unidades: number
  ): Promise<Number> {
    let preu = 0;
    for (let i = 0; i < arraySuplementos.length; i++) {
      let articulo = await articulosInstance.getInfoArticulo(
        arraySuplementos[i]._id
      );
      articulo = await articulosInstance.getPrecioConTarifa(
        articulo,
        idCliente
      );
      preu += articulo.precioConIva * unidades;
    }

    return preu;
  }
  /* Eze 4.0 */
  async getDetalleIvaSuplementos(
    arraySuplementos: ArticulosInterface[],
    idCliente: ClientesInterface["id"],
    unidades: number
  ): Promise<DetalleIvaInterface> {
    let objetoIva: DetalleIvaInterface = {
      base1: 0,
      base2: 0,
      base3: 0,
      base4: 0,
      base5: 0,
      valorIva1: 0,
      valorIva2: 0,
      valorIva3: 0,
      valorIva4: 0,
      valorIva5: 0,
      importe1: 0,
      importe2: 0,
      importe3: 0,
      importe4: 0,
      importe5: 0,
    };
    let descuento: any = Number(
      (await clienteInstance.isClienteDescuento(idCliente))?.descuento
    );
    for (let i = 0; i < arraySuplementos.length; i++) {
      let articulo = await articulosInstance.getInfoArticulo(
        arraySuplementos[i]._id
      );
      articulo = await articulosInstance.getPrecioConTarifa(
        articulo,
        idCliente
      );
      if (descuento) {
        articulo.precioConIva =
          articulo.precioConIva - articulo.precioConIva * (descuento / 100);
      }
      objetoIva = fusionarObjetosDetalleIva(
        construirObjetoIvas(articulo.precioConIva, articulo.tipoIva, unidades),
        objetoIva
      );
    }
    return objetoIva;
  }

  /* Eze 4.0 */
  async borrarArticulosCesta(
    idCesta: CestasInterface["_id"],
    borrarCliente = false,
    borrarModo = false,
    registroSantaAna = true
  ) {
    const cesta = await this.getCestaById(idCesta);

    if (cesta.lista.some((art) => art.pagado)) {
      return null;
    }

    if (registroSantaAna) {
      this.registroLogSantaAna(cesta, cesta.lista);
    }
    if (cesta) {
      cesta.lista = [];
      cesta.detalleIva = {
        base1: 0,
        base2: 0,
        base3: 0,
        base4: 0,
        base5: 0,
        valorIva1: 0,
        valorIva2: 0,
        valorIva3: 0,
        valorIva4: 0,
        valorIva5: 0,
        importe1: 0,
        importe2: 0,
        importe3: 0,
        importe4: 0,
        importe5: 0,
      };
      if (borrarCliente) {
        cesta.idCliente = null;
        cesta.nombreCliente = null;
      }
      if (borrarModo) cesta.modo = "VENTA";

      if (await this.updateCesta(cesta)) {
        await this.actualizarCestas();
        return true;
      }
    }
    throw Error("Error en updateCesta borrarArticulosCesta()");
  }

  // /* Eze 4.0 */
  // async addItemConSuplementos(
  //   idCesta: CestasInterface["_id"],
  //   arraySuplementos: ArticulosInterface[],
  //   idArticuloGeneral: ArticulosInterface["_id"],
  //   unidades: number
  // ) {
  //   const cesta = await this.getCestaById(idCesta);

  //   const objPushSuplementos: ItemLista["arraySuplementos"] = [];
  //   for (let i = 0; i < arraySuplementos.length; i++) {
  //     objPushSuplementos.push({
  //       id: arraySuplementos[i]._id,
  //       nombre: arraySuplementos[i].nombre,
  //       precioConIva: arraySuplementos[i].precioConIva,
  //     });
  //   }

  //   const articuloGeneral: ArticulosInterface =
  //     await articulosInstance.getInfoArticulo(idArticuloGeneral);
  //   if (cesta.idCliente) {
  //     const articuloConTarifa = await articulosInstance.getPrecioConTarifa(
  //       articuloGeneral,
  //       cesta.idCliente
  //     );
  //     articuloGeneral.precioBase = articuloConTarifa.precioBase;
  //     articuloGeneral.precioConIva = articuloConTarifa.precioConIva;
  //   }

  //   if (
  //     await this.clickTeclaArticulo(
  //       idArticuloGeneral,
  //       0,
  //       idCesta,
  //       unidades,
  //       objPushSuplementos
  //     )
  //   ) {
  //     this.actualizarCestas();
  //     return true;
  //   }
  //   throw Error("No se ha podido insertar el artículo con suplemento");
  // }

  /* Eze 4.0 */
  updateCesta = async (cesta: CestasInterface) =>
    await schCestas.updateCesta(cesta);

  /* Eze 4.0 */
  async regalarItem(idCesta: CestasInterface["_id"], index: number) {
    const cesta = await cestasInstance.getCestaById(idCesta);
    if (cesta && cesta.idCliente) {
      const cliente = await clienteInstance.getClienteById(cesta.idCliente);
      if (cliente.albaran) return false;
    } else {
      return false;
    }
    cesta.lista[index].regalo = true;
    cesta.lista[index].subtotal = 0;

    await cestasInstance.recalcularIvas(cesta);
    if (await cestasInstance.updateCesta(cesta)) {
      await this.actualizarCestas();
      return true;
    }
    throw Error("No se ha podido actualizar la cesta");
  }

  async regalarItemPromo(
    idCesta: CestasInterface["_id"],
    index: number,
    idPromoArtSel
  ) {
    const cesta = await cestasInstance.getCestaById(idCesta);
    if (cesta && cesta.idCliente) {
      const cliente = await clienteInstance.getClienteById(cesta.idCliente);
      if (cliente.albaran) return false;
    } else {
      return false;
    }
    let unidadesPaRegalar;
    let unidadesNoRegaladas;
    let idARegalar;
    let idNoRegalar;
    // borramos la promo de la cesta
    await this.borrarItemCesta(idCesta, index);
    // guardamos cual de las dos id de promo se quiere regalar
    if (cesta.lista[index].promocion.idArticuloPrincipal == idPromoArtSel) {
      unidadesPaRegalar =
        cesta.lista[index].unidades *
        cesta.lista[index].promocion.cantidadArticuloPrincipal;
      unidadesNoRegaladas =
        cesta.lista[index].unidades *
        cesta.lista[index].promocion.cantidadArticuloSecundario;
      idARegalar = cesta.lista[index].promocion.idArticuloPrincipal;
      idNoRegalar = cesta.lista[index].promocion.idArticuloSecundario;
    } else {
      unidadesPaRegalar =
        cesta.lista[index].unidades *
        cesta.lista[index].promocion.cantidadArticuloSecundario;
      unidadesNoRegaladas =
        cesta.lista[index].unidades *
        cesta.lista[index].promocion.cantidadArticuloPrincipal;
      idARegalar = cesta.lista[index].promocion.idArticuloSecundario;
      idNoRegalar = cesta.lista[index].promocion.idArticuloPrincipal;
    }
    let mismoRegalo = false;
    for (let i = 0; i < cesta.lista.length; i++) {
      if (cesta.lista[i].regalo && cesta.lista[i].idArticulo == idPromoArtSel) {
        mismoRegalo = true;
      }
    }
    // primero insertamos la id a regalar una por una
    for (let i = 0; i < unidadesPaRegalar; i++) {
      await this.clickTeclaArticulo(
        idARegalar,
        0,
        idCesta,
        1,
        null,
        "",
        "",
        true
      );
      if (i == 0 && !mismoRegalo) {
        const cestaActualizada = await cestasInstance.getCestaById(idCesta);
        let newIndex = null;
        let pos = 0;
        while (newIndex == null) {
          if (
            cestaActualizada.lista[pos].idArticulo == idARegalar &&
            !cestaActualizada.lista[pos].regalo
          ) {
            newIndex = pos;
          }
          pos++;
        }
        await this.regalarItem(cestaActualizada._id, newIndex);
      }
    }

    for (let i = 0; i < unidadesNoRegaladas; i++) {
      await this.clickTeclaArticulo(idNoRegalar, 0, idCesta, 1, null, "", "");
    }

    await cestasInstance.actualizarCestas();
    return { promocion: true, error: false };
  }
  async registroLogSantaAna(
    cesta: CestasInterface,
    productos: CestasInterface["lista"]
  ) {
    try {
      let cliente: number =
        (await clienteInstance.getClienteById(cesta.idCliente))?.descuento ==
        undefined
          ? 0
          : Number(
              (await clienteInstance.getClienteById(cesta.idCliente))?.descuento
            );
      let parametros = await parametrosInstance.getParametros();

      let lista = {
        timestamp: new Date().getTime(),
        botiga: parametros.codigoTienda,
        bbdd: parametros.database,
        accio: "ArticleEsborrat",
        productos: productos,
        dependienta: cesta.trabajador,
        descuento: cliente,
        idCliente: cesta.idCliente,
      };

      await axios.post("lista/setRegistro", {
        lista: lista,
      });
    } catch (error) {
      console.error("Error al enviar el registro a Santa Ana:", error.message);
    }
  }
}

export const cestasInstance = new CestaClase();
