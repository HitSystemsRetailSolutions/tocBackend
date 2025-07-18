import * as schCestas from "./cestas.mongodb";
import {
  CestasCombinadaInterface,
  CestasInterface,
  DetalleIvaInterface,
  ItemLista,
  ModoCesta,
  itemHonei,
} from "./cestas.interface";
import {
  ajustarAuxDetalleIva,
  construirObjetoIvas,
  convertirDineroEnPuntos,
  countDecimal,
  fusionarObjetosDetalleIva,
  redondearPrecio,
} from "../funciones/funciones";
import { Articulos, articulosInstance } from "../articulos/articulos.clase";
import { cajaInstance } from "../caja/caja.clase";
import { ArticulosInterface } from "../articulos/articulos.interface";
import {
  descuentoEspecial,
  ClientesInterface,
} from "../clientes/clientes.interface";
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
import { tiposIvaInstance } from "../tiposIva/tiposIva.clase";
import Decimal from "decimal.js";

export class CestaClase {
  async recalcularIvasDescuentoEspecial(cesta: CestasInterface) {
    let totalDeseado = 3.99;
    // Busca el objeto con el idCliente específico
    const clienteEspecial = descuentoEspecial.find(
      (cliente) => cliente.idCliente === cesta.idCliente
    );

    // Añade el precio al totalDeseado si se encuentra el cliente especial
    if (clienteEspecial) {
      totalDeseado = clienteEspecial.precio;
    }
    // Calcular la suma actual de los importes
    const sumaActualImportes =
      cesta.detalleIva.importe1 +
      cesta.detalleIva.importe2 +
      cesta.detalleIva.importe3 +
      cesta.detalleIva.importe4 +
      cesta.detalleIva.importe5;

    // Calcular el factor de escala para ajustar la suma actual a la deseada
    const factorEscala = totalDeseado / sumaActualImportes;

    // Aplicar el factor de escala a las bases y valores de IVA
    this.ajustarImportes(cesta, factorEscala);

    let sumaFinalImportes =
      cesta.detalleIva.importe1 +
      cesta.detalleIva.importe2 +
      cesta.detalleIva.importe3 +
      cesta.detalleIva.importe4 +
      cesta.detalleIva.importe5;

    // Calcular la diferencia
    let diferencia = redondearPrecio(totalDeseado - sumaFinalImportes);
    // Ajustar importes positivos para corregir la diferencia
    if (Math.abs(diferencia) > 0) {
      this.ajustarDiferencia(cesta, diferencia);
    }

    if (await this.updateCesta(cesta)) {
      this.actualizarCestas();

      if (cesta.lista.length > 0) {
        if (
          cesta.lista[cesta.lista.length - 1].arraySuplementos &&
          cesta.lista[cesta.lista.length - 1].arraySuplementos.length > 0
        ) {
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
            total: totalDeseado,
            precio: totalDeseado,
            texto: cesta.lista[cesta.lista.length - 1].nombre,
            numProductos: numProductos,
          });
        }
      }
    }
  }

  ajustarImportes(cesta, factorEscala) {
    cesta.detalleIva.base1 = redondearPrecio(
      cesta.detalleIva.base1 * factorEscala
    );
    cesta.detalleIva.base2 = redondearPrecio(
      cesta.detalleIva.base2 * factorEscala
    );
    cesta.detalleIva.base3 = redondearPrecio(
      cesta.detalleIva.base3 * factorEscala
    );
    cesta.detalleIva.base4 = redondearPrecio(
      cesta.detalleIva.base4 * factorEscala
    );
    cesta.detalleIva.base5 = redondearPrecio(
      cesta.detalleIva.base5 * factorEscala
    );

    cesta.detalleIva.valorIva1 = redondearPrecio(
      cesta.detalleIva.valorIva1 * factorEscala
    );
    cesta.detalleIva.valorIva2 = redondearPrecio(
      cesta.detalleIva.valorIva2 * factorEscala
    );
    cesta.detalleIva.valorIva3 = redondearPrecio(
      cesta.detalleIva.valorIva3 * factorEscala
    );
    cesta.detalleIva.valorIva4 = redondearPrecio(
      cesta.detalleIva.valorIva4 * factorEscala
    );
    cesta.detalleIva.valorIva5 = redondearPrecio(
      cesta.detalleIva.valorIva5 * factorEscala
    );

    // Recalcular los importes según las nuevas bases y valores de IVA
    cesta.detalleIva.importe1 = redondearPrecio(
      cesta.detalleIva.base1 + cesta.detalleIva.valorIva1
    );
    cesta.detalleIva.importe2 = redondearPrecio(
      cesta.detalleIva.base2 + cesta.detalleIva.valorIva2
    );
    cesta.detalleIva.importe3 = redondearPrecio(
      cesta.detalleIva.base3 + cesta.detalleIva.valorIva3
    );
    cesta.detalleIva.importe4 = redondearPrecio(
      cesta.detalleIva.base4 + cesta.detalleIva.valorIva4
    );
    cesta.detalleIva.importe5 = redondearPrecio(
      cesta.detalleIva.base5 + cesta.detalleIva.valorIva5
    );
  }
  ajustarDiferencia(cesta, diferencia) {
    // Obtener todos los importes positivos
    const importes = [
      { key: "importe1", baseKey: "base1", valorIvaKey: "valorIva1" },
      { key: "importe2", baseKey: "base2", valorIvaKey: "valorIva2" },
      { key: "importe3", baseKey: "base3", valorIvaKey: "valorIva3" },
      { key: "importe4", baseKey: "base4", valorIvaKey: "valorIva4" },
      { key: "importe5", baseKey: "base5", valorIvaKey: "valorIva5" },
    ];

    // Aplicar la diferencia proporcionalmente a los importes positivos
    // Encontrar el primer importe positivo
    for (const item of importes) {
      if (cesta.detalleIva[item.key] > 0) {
        let nuevoImporte = redondearPrecio(
          cesta.detalleIva[item.key] + diferencia
        );

        // Asegurarse de que el nuevo importe sea mayor a 0
        if (nuevoImporte <= 0) {
          diferencia = -cesta.detalleIva[item.key] + 0.01; // Ajuste mínimo positivo
          nuevoImporte = 0.01; // Valor mínimo positivo
        }

        // Aplicar el ajuste al primer importe positivo encontrado
        cesta.detalleIva[item.key] = redondearPrecio(nuevoImporte);
        cesta.detalleIva[item.valorIvaKey] = redondearPrecio(
          cesta.detalleIva[item.key] - cesta.detalleIva[item.baseKey]
        );

        // Terminar el ajuste después de modificar el primer importe positivo
        return;
      }
    }
  }

  /* Eze 4.0 */ /* Actualizado por Aga */
  async actualizarCestas() {
    const arrayCestas = await cestasInstance.getAllCestas();
    io.emit("cargarCestas", arrayCestas);
  }

  async aplicarDescuento(cesta: CestasInterface, total: number) {
    const cliente = await clienteInstance.getClienteById(cesta.idCliente);
    let descuento: any =
      cliente && !cliente?.albaran && !cliente?.vip
        ? Number(cliente.descuento)
        : 0;
    let importe =
      cesta.detalleIva.importe1 +
      cesta.detalleIva.importe2 +
      cesta.detalleIva.importe3 +
      cesta.detalleIva.importe4 +
      cesta.detalleIva.importe5;
    importe = redondearPrecio(importe);
    //en ocasiones cuando un idcliente es trabajador y quiera consumo peronal,
    // el modo de cesta debe cambiar a consumo_personal.
    const clienteDescEsp = descuentoEspecial.find(
      (cliente) => cliente.idCliente === cesta.idCliente
    );
    if (
      cesta.modo !== "CONSUMO_PERSONAL" &&
      descuento &&
      descuento > 0 &&
      !clienteDescEsp
    ) {
      for (const producto of cesta.lista) {
        if (producto?.regalo) continue;
        if (producto.arraySuplementos != null || producto.promocion == null) {
          const infoArticulo = await articulosInstance.getInfoArticulo(
            producto.idArticulo
          );

          let precioArt = producto.precioOrig
            ? producto.precioOrig
            : producto.subtotal;
          let unidades = 1;
          if (producto.tarifaEsp) {
            const artTarifa = await articulosInstance.getPrecioConTarifa(
              infoArticulo,
              cesta.idCliente
            );
            precioArt = artTarifa.precioConIva;
            unidades = producto.unidades;
          }
          const objIva = construirObjetoIvas(
            precioArt,
            infoArticulo.tipoIva,
            unidades,
            false,
            descuento
          );
          producto.subtotal =
            Object.entries(objIva)
              .filter(
                ([key, value]) =>
                  key.includes("importe") &&
                  typeof value === "number" &&
                  value > 0
              )
              .map(([key, value]) => value)[0] || 0;
        } // Modificamos el total para añadir el descuento especial del cliente
        producto.subtotal = redondearPrecio(producto.subtotal);
      }
    } else if (clienteDescEsp && importe == clienteDescEsp.precio) {
      this.recalcularSubtotales(cesta, clienteDescEsp.precio);
    }
  }

  async applyDiscountShop(cesta: CestasInterface, precio: number) {
    for (const producto of cesta.lista) {
      if (producto.arraySuplementos != null || producto.promocion == null) {
        const infoArticulo = await articulosInstance.getInfoArticulo(
          producto.idArticulo
        );
        const objIva = construirObjetoIvas(
          infoArticulo.precioConIva,
          infoArticulo.tipoIva,
          producto.unidades,
          false,
          producto.descuentoTienda
        );

        producto.subtotal =
          Object.entries(objIva)
            .filter(
              ([key, value]) =>
                key.includes("importe") &&
                typeof value === "number" &&
                value > 0
            )
            .map(([key, value]) => value)[0] || 0;

        if (producto.arraySuplementos != null) {
          const detallesSuplementos = await this.getDetalleIvaSuplementos(
            producto.arraySuplementos,
            cesta.idCliente,
            producto.unidades,
            producto.descuentoTienda,
            true
          );

          const objIvaSuplementos = fusionarObjetosDetalleIva(
            objIva,
            detallesSuplementos
          );

          producto.subtotal =
            Object.entries(objIvaSuplementos)
              .filter(
                ([key, value]) =>
                  key.includes("importe") &&
                  typeof value === "number" &&
                  value > 0
              )
              .map(([key, value]) => value)[0] || 0;
        }
      } // Modificamos el total para añadir el descuento especial del cliente
      producto.subtotal = redondearPrecio(producto.subtotal);
    }
  }
  recalcularSubtotales(cesta: CestasInterface, precio: number) {
    const totalDeseado = precio;
    let sumaSubtotales = 0;
    cesta.lista.forEach((item) => {
      item.subtotal = Number(item.subtotal.toFixed(2));
      sumaSubtotales += item.subtotal;
    });

    const factorEscala = totalDeseado / sumaSubtotales;

    sumaSubtotales = 0;
    // Asignar subtotales ajustados y redondear a 2 decimales
    cesta.lista.forEach((item) => {
      item.subtotal *= factorEscala;
      item.subtotal = Number(item.subtotal.toFixed(2));
      sumaSubtotales += item.subtotal;
    });

    // Redondear la suma total al deseo y ajustar el último subtotal si es necesario
    sumaSubtotales = Number(sumaSubtotales.toFixed(2));
    if (sumaSubtotales !== totalDeseado) {
      const ajuste = totalDeseado - sumaSubtotales;
      cesta.lista[cesta.lista.length - 1].subtotal += ajuste;
      cesta.lista[cesta.lista.length - 1].subtotal = Number(
        cesta.lista[cesta.lista.length - 1].subtotal.toFixed(2)
      );
    }
  }
  /* Eze 4.0 */
  getCestaById = async (idCesta: CestasInterface["_id"]) =>
    await schCestas.getCestaById(idCesta);

  getCestaByMesa = async (
    mesa: CestasInterface["indexMesa"]
  ): Promise<CestasInterface["_id"]> => {
    return (await schCestas.getCestaByMesa(mesa))._id;
  };

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
      ArticulosFaltaUnoParaPromocion: [],
    };
  }

  detalleIva: DetalleIvaInterface = {
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
  private generarObjetoCestaCombinada(
    nuevoId: CestasInterface["_id"],
    modoV: ModoCesta = "VENTA",
    trabajador: CestasInterface["trabajador"] = null
  ): CestasCombinadaInterface {
    return {
      _id: nuevoId,
      timestamp: Date.now(),
      detalleIva: this.detalleIva,
      detalleIvaTickets: this.detalleIva,
      detalleIvaDeudas: this.detalleIva,
      lista: [],
      listaDeudas: [],
      modo: modoV,
      idCliente: null,
      indexMesa: null,
      trabajador: trabajador,
      trabajadores: [],
      comensales: 1,
      ArticulosFaltaUnoParaPromocion: [],
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

  async findCestaDevolucion(trabajador: TrabajadoresInterface["_id"]) {
    return await schCestas.findCestaDevolucion(trabajador);
  }
  async CestaPagoDeuda(cestas) {
    const nuevaCesta = this.generarObjetoCesta(new ObjectId(), "PAGO DEUDA");
    nuevaCesta.indexMesa = null;
    let id = undefined;
    if (await schCestas.createCesta(nuevaCesta)) id = nuevaCesta._id;
    if (id != undefined) {
      nuevaCesta.idCliente = cestas[0].idCliente;
      for (const cesta of cestas) {
        nuevaCesta.lista = nuevaCesta.lista.concat(cesta.lista);
        nuevaCesta.detalleIva = await fusionarObjetosDetalleIva(
          cesta.detalleIva,
          nuevaCesta.detalleIva
        );
      }
      if (await this.updateCesta(nuevaCesta)) {
        await this.actualizarCestas();
      }
      return id;
    }
  }

  async CestaPagoCombinado(cestas: CestasInterface[]) {
    // la ultima cesta pertenece al ticket, las demas son deudas
    const nuevaCesta: CestasCombinadaInterface =
      this.generarObjetoCestaCombinada(new ObjectId(), "PAGO COMBINADO");
    nuevaCesta.indexMesa = null;
    let id = undefined;
    if (await schCestas.createCesta(nuevaCesta)) id = nuevaCesta._id;
    if (id != undefined) {
      nuevaCesta.idCliente = cestas[0].idCliente;
      const ultimaIndex = cestas.length - 1;
      let listaDeudas: ItemLista[] = [];
      for (let i = 0; i < cestas.length; i++) {
        const cesta = cestas[i];
        // Fusionar IVA global
        nuevaCesta.detalleIva = await fusionarObjetosDetalleIva(
          cesta.detalleIva,
          nuevaCesta.detalleIva
        );

        if (i === ultimaIndex) {
          // Última cesta: va a .lista y .detalleIvaTicket
          nuevaCesta.lista = nuevaCesta.lista.concat(cesta.lista);
          nuevaCesta.detalleIvaTickets = await fusionarObjetosDetalleIva(
            cesta.detalleIva,
            nuevaCesta.detalleIvaTickets
          );
        } else {
          // Las demás van a .listaDeudas y .detalleIvaDeudas
          listaDeudas = listaDeudas.concat(cesta.lista);
          nuevaCesta.listaDeudas = listaDeudas;
          nuevaCesta.detalleIvaDeudas = await fusionarObjetosDetalleIva(
            cesta.detalleIva,
            nuevaCesta.detalleIvaDeudas
          );
        }
      }
      if (await this.updateCestaCombinada(nuevaCesta)) {
        await this.actualizarCestas();
      }
      return id;
    }
  }

  // generar cesta modo recoger encargo
  async CestaRecogerEncargo(cestaEncargo: any) {
    const nuevaCesta = this.generarObjetoCesta(
      new ObjectId(),
      "RECOGER ENCARGO"
    );
    nuevaCesta.indexMesa = null;
    let id = undefined;
    if (await schCestas.createCesta(nuevaCesta)) id = nuevaCesta._id;
    if (id != undefined) {
      const cliente: ClientesInterface = await clienteInstance.getClienteById(
        cestaEncargo.idCliente
      );
      // Aplicamos los articulos a la cesta sin el descuento del cliente
      if (cliente && cliente.descuento != 0) {
        for (const articulo of cestaEncargo.lista) {
          articulo.subtotal =
            Math.round(
              (articulo.subtotal +
                (articulo.subtotal * cliente.descuento) / 100) *
                100
            ) / 100;
        }
      }
      nuevaCesta.idCliente = cestaEncargo.idCliente;
      nuevaCesta.nombreCliente = cestaEncargo.nombreCliente;
      nuevaCesta.lista = cestaEncargo.lista;
      nuevaInstancePromociones.convertirAFormatoNuevoSiEsNecesario(nuevaCesta);
      nuevaCesta.detalleIva = cestaEncargo.detalleIva;
      if (await this.updateCesta(nuevaCesta)) {
        await this.actualizarCestas();
      }
      return id;
    }
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
      if (cesta.lista[index]?.pagado) return null;
      let productos = [];
      productos.push(cesta.lista[index]);
      this.registroLogSantaAna(cesta, productos);

      cesta.lista.splice(index, 1);
      // Enviar por socket
      await this.recalcularIvas(cesta);
      if (await this.updateCesta(cesta)) {
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
        let precio =
          cesta.lista[cesta.lista.length - 1]?.subtotal == undefined
            ? 0
            : cesta.lista[cesta.lista.length - 1]?.subtotal;
        let nombre =
          cesta.lista[cesta.lista.length - 1]?.nombre == undefined
            ? ""
            : cesta.lista[cesta.lista.length - 1]?.nombre;
        impresoraInstance.mostrarVisor({
          total: redondearPrecio(total),
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

  semaforo_zona_critica_insertarArticulo = false;
  cola_zona_critica_insertarArticulo: (() => void)[] = [];
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
    try {
      // sección critica, si se pulsan dos articulos muy seguidos el segundo tendra que esperar a que acabe
      // el primero ya que se modifican los items de la cesta.
      if (this.semaforo_zona_critica_insertarArticulo) {
        let resolver: () => void;
        let p = new Promise<void>((res) => {
          resolver = res;
        });
        this.cola_zona_critica_insertarArticulo.push(resolver);
        await Promise.race([
          p,
          new Promise((res) => {
            setTimeout(res, 2000);
          }),
        ]);
      } else this.semaforo_zona_critica_insertarArticulo = true;

      // recojemos la cesta
      let cesta = await this.getCestaById(idCesta);
      let articuloNuevo = true;
      // cogemos el precio del articulo dependiendo de si es un cliente albaran o no
      const cliente = cesta.idCliente
        ? await clienteInstance.getClienteById(cesta.idCliente)
        : null;
      const precioArt =
        cliente && (cliente.albaran || cliente?.vip)
          ? articulo.precioBase
          : articulo.precioConIva;

      let ItemActualizado: ItemLista;
      articulo["menu"] = menu;
      // recojemos los datos del articulo
      // let infoArticulo = await articulosInstance.getInfoArticulo(articulo._id);
      // recorremos la cesta
      const cllienteFacturacion = cliente && (cliente.albaran || cliente.vip);
      for (let i = 0; i < cesta.lista.length; i++) {
        const item = cesta.lista[i];

        if (
          item.idArticulo === articulo._id &&
          item.gramos == null &&
          item.regalo == regalar &&
          item.promocion == null &&
          (item.nombre == nombre || nombre.length == 0) &&
          !(menu === "pagados" && !item.pagado) &&
          !(menu !== "pagados" && item.pagado)
        ) {
          if (
            arraySuplementos &&
            item.arraySuplementos?.length === arraySuplementos.length
          ) {
            let subCesta = [...item.arraySuplementos].sort(
              (a, b) => a._id - b._id
            );
            let arraySupOrdenado = [...arraySuplementos].sort(
              (a, b) => a._id - b._id
            );

            let igual = 0;
            let precioSuplementos = 0;

            for (let j = 0; j < arraySuplementos.length; j++) {
              if (arraySupOrdenado[j]._id === subCesta[j]._id) {
                precioSuplementos += cllienteFacturacion
                  ? arraySupOrdenado[j].precioBase
                  : arraySupOrdenado[j].precioConIva;
                igual++;
              }
            }

            if (igual === item.arraySuplementos.length) {
              item.unidades += unidades;

              if (!articulo.puntos) {
                await this.setPuntosPromoDscompteFixe(articulo); // Posible optimización: fuera del bucle
              }

              if (item.puntos != null) {
                item.puntos += articulo.puntos * unidades;
              }

              item.subtotal = nuevaInstancePromociones.redondearDecimales(
                item.subtotal + unidades * precioArt,
                2
              );

              articuloNuevo = false;
              ItemActualizado = item;
              break;
            }
          } else if (!item.arraySuplementos && item.regalo === regalar) {
            item.unidades += unidades;

            if (!articulo.puntos) {
              await this.setPuntosPromoDscompteFixe(articulo);
            }

            if (item.puntos != null) {
              item.puntos += articulo.puntos * unidades;
            }

            if (!regalar) {
              item.subtotal =
                Math.round((item.subtotal + unidades * precioArt) * 100) / 100;
            }

            articuloNuevo = false;
            ItemActualizado = item;
            break;
          }
        }
      }
      const pagado = menu === "pagados";
      if (articuloNuevo) {
        if (articulo.puntos == null || articulo.puntos == 0) {
          await this.setPuntosPromoDscompteFixe(articulo);
        }
        ItemActualizado = {
          idArticulo: articulo._id,
          nombre: articulo.nombre,
          arraySuplementos: arraySuplementos,
          promocion: null,
          varis: articulo.varis || false,
          regalo: false,
          puntos: articulo.puntos == null ? null : articulo.puntos * unidades,
          impresora: articulo.impresora,
          subtotal: unidades * precioArt,
          unidades: unidades,
          gramos: gramos,
          pagado,
        };
        cesta.lista.push(ItemActualizado);
      }
      // aplicar las promociones despues de insertar el articulo en la cesta
      await nuevaInstancePromociones.aplicarPromociones(cesta, cliente);
      let isitemPromocionable =
        nuevaInstancePromociones.isItemPromocionable(ItemActualizado);
      let numProductos = 0;
      let precioMostrarVisor =
        ItemActualizado.gramos == null ? precioArt : ItemActualizado.subtotal;
      let nombreMostrarVisor = ItemActualizado.nombre;
      let total = 0;
      for (let item of cesta.lista) {
        if (item.gramos == null) {
          numProductos += item.unidades;
        } else {
          numProductos++;
        }
        total += item.subtotal;
        if (isitemPromocionable && item.promocion != null) {
          for (let artGrupo of item.promocion.grupos.flat()) {
            // buscar en las promos que tengan el articulo que se ha insertado y cojer la última para el visor
            if (artGrupo.idArticulo == ItemActualizado.idArticulo) {
              precioMostrarVisor = item.subtotal / item.unidades;
              nombreMostrarVisor = item.nombre;
            }
          }
        }
      }
      // menus con estos valores no se muestran en el visor
      if (menu != "honei" && menu != "pagados" && menu != "descargas") {
        impresoraInstance.mostrarVisor({
          total: redondearPrecio(total),
          precio: redondearPrecio(precioMostrarVisor),
          texto: nombreMostrarVisor,
          numProductos: numProductos,
        });
      }
      await this.recalcularIvas(cesta, menu, cliente);
      if (await schCestas.updateCesta(cesta)) return cesta;
    } finally {
      if (this.cola_zona_critica_insertarArticulo.length == 0)
        this.semaforo_zona_critica_insertarArticulo = false;
      else {
        let resolver = this.cola_zona_critica_insertarArticulo.shift();
        resolver();
      }
    }

    throw Error("Error updateCesta() - cesta.clase.ts");
  }
  async setPuntosPromoDscompteFixe(articulo: ArticulosInterface) {
    const promocioDescompteFixe =
      (await parametrosInstance.getParametros()).promocioDescompteFixe || 0;
    if (promocioDescompteFixe > 0) {
      let dineroToPuntos = convertirDineroEnPuntos(
        articulo.precioConIva,
        promocioDescompteFixe
      );
      if (dineroToPuntos > 0) articulo.puntos = dineroToPuntos;
    }
    return articulo;
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
      if (!nombre && !articulo) {
        throw Error(
          "Error, el artículo " + idArticulo + " no existe en la base de datos"
        );
      }
      const cesta = await cestasInstance.getCestaById(idCesta);
      // Si el nombre no está vacío, es un artículo 'varis' y se le asigna el nombre

      if (
        nombre &&
        nombre.length > 0 &&
        (articulo.nombre.toLowerCase().includes("varis") ||
          articulo.nombre.toLowerCase().includes("varios"))
      ) {
        articulo.nombre = nombre;
        articulo.varis = true;
      }
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
    let detalleIvaAcumulado: DetalleIvaInterface = null;

    for (let artGrupo of itemPromocion.promocion.grupos.flat()) {
      const infoArt = await articulosInstance.getInfoArticulo(
        artGrupo.idArticulo
      );
      let detalleIva = construirObjetoIvas(
        artGrupo.precioPromoPorUnidad,
        infoArt.tipoIva,
        artGrupo.unidades * itemPromocion.unidades
      );
      if (detalleIvaAcumulado) {
        detalleIvaAcumulado = fusionarObjetosDetalleIva(
          detalleIvaAcumulado,
          detalleIva
        );
      } else detalleIvaAcumulado = detalleIva;
    }
    if (!detalleIvaAcumulado)
      detalleIvaAcumulado = {
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
    return detalleIvaAcumulado;
  }
  async removePromos(cesta: CestasInterface) {
    const cloneCesta: CestasInterface = JSON.parse(JSON.stringify(cesta));

    const updateOrAddArticle = async (
      idArticulo,
      cantidad,
      unidadesOferta,
      cloneCesta
    ) => {
      const infoArticulo = await articulosInstance.getInfoArticulo(idArticulo);
      let articuloExistente = cloneCesta.lista.find(
        (item) => item.idArticulo === idArticulo
      );

      if (articuloExistente) {
        // Si existe, actualizar cantidades y subtotal
        articuloExistente.unidades += cantidad * unidadesOferta;
        articuloExistente.subtotal +=
          cantidad * unidadesOferta * infoArticulo.precioConIva;
        articuloExistente.puntos +=
          infoArticulo.puntos * unidadesOferta * cantidad;
      } else {
        // Si no existe, añadir el nuevo artículo
        cloneCesta.lista.push({
          idArticulo: idArticulo,
          nombre: infoArticulo.nombre,
          arraySuplementos: null,
          promocion: null,
          varis: false,
          regalo: false,
          puntos: infoArticulo.puntos * unidadesOferta * cantidad,
          impresora: null,
          subtotal: cantidad * unidadesOferta * infoArticulo.precioConIva,
          unidades: cantidad * unidadesOferta,
          gramos: null,
        });
      }
    };

    for (const product of cesta.lista) {
      if (product.promocion) {
        const unidadesOferta = product.unidades;
        for (let artGrupo of product.promocion.grupos.flat()) {
          await updateOrAddArticle(
            artGrupo.idArticulo,
            artGrupo.unidades,
            unidadesOferta,
            cloneCesta
          );
        }

        cloneCesta.lista = cloneCesta.lista.filter(
          (item) =>
            item.nombre !== product.nombre || item.subtotal !== product.subtotal
        );
      }
    }

    cesta.lista = cloneCesta.lista;
    return cesta;
  }
  async comprobarRegalos(cesta: CestasInterface) {
    // Si no hay cliente, no puede haber regalos
    if (cesta.idCliente) return;
    // Si no hay regalos, no hace falta comprobar nada
    if (!cesta.lista.find((item) => item.regalo)) return;
    if (!cesta.idCliente) {
      // Verifica si no hay Cliente
      for (const item of cesta.lista) {
        item.regalo = false; // Cambiar el valor de regalo a false para todos los artículos en la cesta (al no haber cliente no deberia de haber regalo)
      }
    }
    for (let i = 0; i < cesta.lista.length; i++) {
      const currentItem = cesta.lista[i];
      if (currentItem.gramos != null) {
        continue;
      }
      let arraySuplCurrentItem = null;
      if (currentItem.arraySuplementos) {
        arraySuplCurrentItem = currentItem.arraySuplementos.slice().sort();
      }
      for (let j = i + 1; j < cesta.lista.length; j++) {
        const nextItem = cesta.lista[j];
        let arraySuplNextItem = null;
        if (nextItem.arraySuplementos) {
          arraySuplNextItem = nextItem.arraySuplementos.slice().sort();
        }
        if (
          currentItem.idArticulo == nextItem.idArticulo &&
          currentItem.regalo == nextItem.regalo &&
          currentItem.idArticulo != -1 &&
          arraySuplCurrentItem == null &&
          arraySuplNextItem == null
        ) {
          currentItem.unidades += nextItem.unidades;
          currentItem.puntos += nextItem.puntos;
          cesta.lista.splice(j, 1);
          j -= 1;
        } else if (
          currentItem.idArticulo == nextItem.idArticulo &&
          currentItem.regalo == nextItem.regalo &&
          currentItem.idArticulo != -1 &&
          arraySuplCurrentItem == arraySuplNextItem
        ) {
          currentItem.unidades += nextItem.unidades;
          currentItem.puntos += nextItem.puntos;
          cesta.lista.splice(j, 1);
          j -= 1;
        }
      }
    }
  }
  /* Eze 4.0 */
  async recalcularIvas(
    cesta: CestasInterface,
    menu: string = "",
    clienteCesta: ClientesInterface = null
  ): Promise<CestasInterface> {
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
    const arrayIvas = tiposIvaInstance.arrayIvas;
    const cliente = clienteCesta
      ? clienteCesta
      : cesta.idCliente
      ? await clienteInstance.getClienteById(cesta.idCliente)
      : null;
    await this.comprobarRegalos(cesta);
    let descuento: any =
      cesta.modo !== "CONSUMO_PERSONAL" &&
      cliente &&
      !cliente?.albaran &&
      !cliente?.vip
        ? Number(cliente.descuento)
        : 0;
    let vipOalbaran = cliente?.albaran || cliente?.vip;
    if (vipOalbaran) {
      await this.removePromos(cesta);
    }
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
        let tarifaEsp = false;
        // encuentra el posible descuento del cliente albaran
        let dto = 0;
        if (cliente && cliente?.dto && (cliente?.albaran || cliente?.vip))
          dto = await clienteInstance.getDtoAlbaran(cliente, articulo);
        const clienteFacturacion =
          cliente && (cliente.albaran || cliente?.vip) ? true : false;

        let precioArt =
          cliente && (cliente.albaran || cliente?.vip)
            ? articulo.precioBase
            : articulo.precioConIva;
        const artPrecioIvaSinTarifa = articulo.precioConIva;
        const artPrecioSinTarifa = articulo.precioBase;
        articulo = await articulosInstance.getPrecioConTarifa(
          articulo,
          cesta.idCliente
        );
        if (
          cesta.modo === "CONSUMO_PERSONAL" &&
          (!cesta.lista[i].descuentoTienda || !cesta.lista[i].tipoIva)
        ) {
          // productos con tipoiVA 4 no se cobra
          cesta.lista[i].descuentoTienda = 0;
          cesta.lista[i].tipoIva = articulo.tipoIva;
          if (articulo.tipoIva == 4) {
            cesta.lista[i].descuentoTienda = 100;
          }
          cesta.lista[i].precioOrig = redondearPrecio(
            precioArt * cesta.lista[i].unidades
          );
        } else if (
          cesta.modo !== "CONSUMO_PERSONAL" &&
          (cesta.lista[i].descuentoTienda || cesta.lista[i].tipoIva)
        ) {
          delete cesta.lista[i].descuentoTienda;
          delete cesta.lista[i].tipoIva;
        }

        if (
          artPrecioIvaSinTarifa != articulo.precioConIva &&
          !clienteFacturacion
        ) {
          precioArt = articulo.precioConIva;
          tarifaEsp = true;
        } else if (
          artPrecioSinTarifa != articulo.precioBase &&
          clienteFacturacion
        ) {
          precioArt = articulo.precioBase;
          tarifaEsp = true;
        }

        if (cesta.indexMesa != null) {
          precioArt =
            (await tarifasInstance.tarifaMesas(cesta.lista[i].idArticulo)) ==
            null
              ? precioArt
              : (await tarifasInstance.tarifaMesas(cesta.lista[i].idArticulo))
                  .precioConIva;
        }
        if (menu.length > 0) {
          let preu = await tarifasInstance.tarifaMenu(
            cesta.lista[i].idArticulo,
            menu
          );
          precioArt = preu == null ? precioArt : preu.precioConIva;
        }

        const precioArtDecimal = new Decimal(precioArt);
        const unidadesDecimal = new Decimal(cesta.lista[i].unidades);
        // obtiene el precio preciso y evita errores de redondeo
        let p = precioArtDecimal
          .times(unidadesDecimal)
          .toDecimalPlaces(5)
          .toNumber();

        cesta.lista[i].subtotal = p;

        if (descuento)
          precioArt = precioArtDecimal
            .minus(
              precioArtDecimal.times(descuento).div(100).toDecimalPlaces(5)
            )
            .toNumber();
        // precioArt = Number(precioArt - precioArt * (descuento / 100));

        if (dto && !cesta.lista[i]?.dto) {
          // aplicar el dto en el precioArt para calcular detallesIVA y guardar % de dto en el objeto cesta
          // para mostrarlo en el frontend y ticket.
          if (!tarifaEsp || (tarifaEsp && cliente?.descTE))
            cesta.lista[i].dto = dto;
        } else if (
          (!dto && cesta.lista[i]?.dto) ||
          (tarifaEsp && !cliente?.descTE && cesta.lista[i]?.dto)
        ) {
          delete cesta.lista[i].dto;
        }

        if (tarifaEsp && !cesta.lista[i]?.tarifaEsp) {
          cesta.lista[i].tarifaEsp = true;
        } else if (!tarifaEsp && cesta.lista[i]?.tarifaEsp) {
          delete cesta.lista[i].tarifaEsp;
        }

        // Si el cliente es albaran y no paga en tienda, se guarda el IVA correspondiente
        // para mostrarlo en el ticket y en el frontend.
        if ((cliente?.albaran || cliente?.vip) && !cesta.lista[i]?.iva) {
          const tipoIvaStr = articulo.tipoIva.toString();
          const ivaObject = arrayIvas.find((item) => item.tipus === tipoIvaStr);
          cesta.lista[i].iva = ivaObject.iva;
        } else if (
          (cliente === null || // Cliente es null
            (!cliente?.albaran && !cliente?.vip && !cliente?.noPagaEnTienda)) &&
          cesta.lista[i]?.iva
        ) {
          delete cesta.lista[i].iva;
        }

        // si contiene dto o iva, añadir precio original para mostrarlo en el ticket
        if (cesta.lista[i]?.iva || cesta.lista[i]?.dto) {
          cesta.lista[i].precioOrig = precioArtDecimal
            .times(unidadesDecimal)
            .toDecimalPlaces(5)
            .toNumber();
        } else if (
          cesta.lista[i]?.precioOrig &&
          cesta.modo !== "CONSUMO_PERSONAL"
        ) {
          delete cesta.lista[i].precioOrig;
        }
        if (cesta.lista[i].dto) {
          cesta.lista[i].subtotal = new Decimal(cesta.lista[i].subtotal)
            .times(1 - new Decimal(cesta.lista[i].dto).div(100).toNumber())
            .toNumber();
        }

        if (cesta.lista[i].iva || (clienteFacturacion && cesta.lista[i].iva)) {
          cesta.lista[i].subtotal = new Decimal(cesta.lista[i].subtotal)
            .times(1 + new Decimal(cesta.lista[i].iva).div(100).toNumber())
            .toNumber();
        }
        let subtotalFinal =
          Math.round(cesta.lista[i].subtotal * 100000) / 100000;
        subtotalFinal = new Decimal(subtotalFinal)
          .toDecimalPlaces(2)
          .toNumber();
        cesta.lista[i].subtotal = subtotalFinal;

        // Guardamos el precio original para mostrarlo sin alterar y
        // aplicarle descuentos al generar el ticket.
        cesta.lista[i].precioOrig = p;

        // si la cesta proviene de descargas, se añade el timestamp de la cesta para calcular la trama de iva correcta a su fecha de creacion
        const cestaOfDownloads = menu == "descargas" ? true : false;
        const auxDetalleIva = construirObjetoIvas(
          precioArt,
          articulo.tipoIva,
          cesta.lista[i].unidades,
          cliente?.albaran || cliente?.vip,
          cesta.modo == "CONSUMO_PERSONAL"
            ? cesta.lista[i].descuentoTienda
            : cesta.lista[i]?.dto || 0,
          cestaOfDownloads ? cesta.timestamp : null
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
            cesta.lista[i].unidades,
            cesta.modo == "CONSUMO_PERSONAL"
              ? cesta.lista[i].descuentoTienda
              : cesta.lista[i]?.dto || 0,
            cesta?.modo == "CONSUMO_PERSONAL"
          );
          const preuSumplements = Number(
            (
              await this.getPreuSuplementos(
                cesta.lista[i].arraySuplementos,
                cesta.idCliente,
                cesta.lista[i].unidades
              )
            ).toFixed(2)
          );
          cesta.lista[i].subtotal += preuSumplements;
          if (cesta.lista[i].precioOrig) {
            cesta.lista[i].precioOrig =
              cesta.modo == "CONSUMO_PERSONAL"
                ? Math.round(cesta.lista[i].subtotal * 100) / 100
                : Math.round(
                    (cesta.lista[i].precioOrig + preuSumplements) * 100
                  ) / 100;
          }
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
    let total = 0;
    let clienteDescEsp = descuentoEspecial.find(
      (desc) => desc.idCliente == cesta.idCliente
    );
    for (let i = 0; i < cesta.lista.length; i++) {
      total += cesta.lista[i].subtotal;
    }
    if (clienteDescEsp && total >= clienteDescEsp.activacion) {
      logger.Info("Descuento especial activado en recalcularIvas");
      await this.recalcularIvasDescuentoEspecial(cesta);
    }
    if (cesta.lista.length > 0) {
      if (
        cesta.lista[cesta.lista.length - 1].arraySuplementos &&
        cesta.lista[cesta.lista.length - 1].arraySuplementos.length > 0
      ) {
        let numProductos = 0;
        let total = 0;
        for (let i = 0; i < cesta.lista.length; i++) {
          if (cesta.lista[i].gramos == null) {
            numProductos += cesta.lista[i].unidades;
          } else {
            numProductos++;
          }
          let valor: any = Number(cesta.lista[i].subtotal.toFixed(2));
          total += valor;
        }
        if (menu != "descargas") {
          impresoraInstance.mostrarVisor({
            total: redondearPrecio(total),
            precio: redondearPrecio(
              cesta.lista[cesta.lista.length - 1].subtotal
            ),
            texto: cesta.lista[cesta.lista.length - 1].nombre,
            numProductos: numProductos,
          });
        }
      }
    }
    return cesta;
  }

  /* Uri */
  async getPreuSuplementos(
    arraySuplementos: ArticulosInterface[],
    idCliente: ClientesInterface["id"],
    unidades: number
  ): Promise<Number> {
    let preu = 0;
    const cliente = await clienteInstance.getClienteById(idCliente);
    for (let i = 0; i < arraySuplementos.length; i++) {
      let articulo = await articulosInstance.getInfoArticulo(
        arraySuplementos[i]._id
      );
      articulo = await articulosInstance.getPrecioConTarifa(
        articulo,
        idCliente
      );
      if (cliente && (cliente.albaran || cliente?.vip)) {
        preu += articulo.precioBase * unidades;
      } else {
        preu += articulo.precioConIva * unidades;
      }
    }

    return preu;
  }
  /* Eze 4.0 */
  async getDetalleIvaSuplementos(
    arraySuplementos: ArticulosInterface[],
    idCliente: ClientesInterface["id"],
    unidades: number,
    dto: number = 0,
    consumoPersonal = false
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
    let cliente = await clienteInstance.getClienteById(idCliente);
    let descuento: any =
      cliente && !cliente?.albaran && !cliente.vip
        ? Number(cliente.descuento)
        : 0;

    for (let i = 0; i < arraySuplementos.length; i++) {
      let articulo = await articulosInstance.getInfoArticulo(
        arraySuplementos[i]._id
      );
      articulo = await articulosInstance.getPrecioConTarifa(
        articulo,
        idCliente
      );
      let precioArt =
        cliente && (cliente.albaran || cliente?.vip)
          ? articulo.precioBase
          : articulo.precioConIva;
      if (descuento && !consumoPersonal) {
        precioArt = precioArt - precioArt * (descuento / 100);
      }
      objetoIva = fusionarObjetosDetalleIva(
        construirObjetoIvas(
          precioArt,
          articulo.tipoIva,
          unidades,
          cliente?.albaran || cliente?.vip,
          dto
        ),
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

  updateCestaCombinada = async (cestaCombinada: CestasCombinadaInterface) =>
    await schCestas.updateCestaCombinada(cestaCombinada);
  /* uri House */
  setArticuloImprimido = async (
    idCesta: CestasInterface["_id"],
    articulosIDs: number[],
    printed: boolean
  ) => {
    const cesta = await this.getCestaById(idCesta);
    for (let x = 0; x < cesta.lista.length; x++) {
      if (articulosIDs.includes(cesta.lista[x].idArticulo)) {
        cesta.lista[x].printed = printed;
      }
    }
    if (await this.updateCesta(cesta)) {
      this.actualizarCestas();
    }
    return true;
  };

  /* Eze 4.0 */
  async regalarItem(idCesta: CestasInterface["_id"], index: number) {
    const cesta = await cestasInstance.getCestaById(idCesta);
    if (cesta && cesta.idCliente) {
      const cliente = await clienteInstance.getClienteById(cesta.idCliente);
      if (cliente.albaran) return false;
    } else {
      return false;
    }
    const item = cesta.lista[index];
    if (!item) {
      throw new Error(`Elemento en la posición ${index} no encontrado`);
    }

    item.regalo = true;
    item.subtotal = 0;
    item.precioOrig = 0;
    cesta.lista = [...cesta.lista];
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
    idPromoArtSel = parseInt(idPromoArtSel);
    const cesta = await cestasInstance.getCestaById(idCesta);
    if (cesta && cesta.idCliente) {
      const cliente = await clienteInstance.getClienteById(cesta.idCliente);
      if (cliente.albaran) return false;
    } else {
      return false;
    }
    // borramos la promo de la cesta
    await this.borrarItemCesta(idCesta, index);
    // guardamos cual de las id de promo se quiere regalar
    let item = cesta.lista[index];
    let unidadesARegalar = 0;
    for (let artGrupo of item.promocion.grupos.flat()) {
      if (artGrupo.idArticulo == idPromoArtSel) {
        unidadesARegalar = artGrupo.unidades * item.unidades;
        break;
      }
    }
    let mismoRegalo = false;
    for (let i = 0; i < cesta.lista.length; i++) {
      if (cesta.lista[i].regalo && cesta.lista[i].idArticulo == idPromoArtSel) {
        mismoRegalo = true;
      }
    }
    // primero insertamos la id a regalar una por una
    for (let i = 0; i < unidadesARegalar; i++) {
      await this.clickTeclaArticulo(
        idPromoArtSel,
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
            cestaActualizada.lista[pos].idArticulo == idPromoArtSel &&
            !cestaActualizada.lista[pos].regalo
          ) {
            newIndex = pos;
          }
          pos++;
        }
        await this.regalarItem(cestaActualizada._id, newIndex);
      }
    }

    for (let artGrupo of item.promocion.grupos.flat()) {
      if (artGrupo.idArticulo != idPromoArtSel) {
        for (let i = 0; i < artGrupo.unidades * item.unidades; i++) {
          await this.clickTeclaArticulo(
            artGrupo.idArticulo,
            0,
            idCesta,
            1,
            null,
            "",
            ""
          );
        }
      }
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
      // si la cesta pertenece a una mesa, cogemos la dependienta en el array
      let dependienta = cesta.trabajador || cesta.trabajadores[0];
      let lista = {
        timestamp: new Date().getTime(),
        botiga: parametros.codigoTienda,
        bbdd: parametros.database,
        accio: "ArticleEsborrat",
        productos: productos,
        dependienta: dependienta,
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
  async borrarCestas() {
    await schCestas.borrarCestas();
  }
  async setDiscountShop(
    cesta: CestasInterface,
    discount: number,
    index: number
  ) {
    if (cesta.lista[index]) {
      cesta.lista[index].descuentoTienda = discount;
    }
    await this.recalcularIvas(cesta);
  }
}

export const cestasInstance = new CestaClase();
