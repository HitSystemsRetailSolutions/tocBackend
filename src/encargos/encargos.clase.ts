import axios from "axios";
import * as moment from "moment";
import { logger } from "../logger";
import { parametrosInstance } from "../parametros/parametros.clase";
import { ParametrosInterface } from "../parametros/parametros.interface";
import {
  EncargosInterface,
  Estat,
  OpcionRecogida,
  Periodo,
} from "./encargos.interface";
import * as schEncargos from "./encargos.mongodb";
import { impresoraInstance } from "../impresora/impresora.class";
import { movimientosInstance } from "src/movimientos/movimientos.clase";
import { time } from "console";
import { clienteInstance } from "src/clientes/clientes.clase";
import { trabajadoresInstance } from "src/trabajadores/trabajadores.clase";
import { CestaClase, cestasInstance } from "src/cestas/cestas.clase";
import { CestasInterface } from "src/cestas/cestas.interface";
import { CestasController } from "src/cestas/cestas.controller";
import { getSuplementos } from "src/articulos/articulos.mongodb";
import { articulosInstance } from "src/articulos/articulos.clase";
import {
  NuevaPromocion,
  nuevaInstancePromociones,
} from "src/promociones/promociones.clase";
import {
  InfoPromocionCombo,
  PromocionesInterface,
} from "src/promociones/promociones.interface";
import { cajaInstance } from "src/caja/caja.clase";

export class Encargos {
  async pruebaImportar() {
    try {
      const parametros = await parametrosInstance.getParametros();
      const res: any = await axios.post("encargos/getEncargos", {
        database: parametros.database,
        codigoTienda: parametros.codigoTienda,
      });
      return res.data;
    } catch (error) {
      console.log("error", error);
    }
  }
  async getEncargos() {
    return await schEncargos.getEncargos();
  }
  setEntregado = async (id) => {
    return schEncargos
      .setEntregado(id)
      .then((ok: boolean) => {
        if (!ok) return false;
        return true;
      })
      .catch((err: string) => ({ error: true, msg: err }));
  };

  ordenarImpresion = async (orden, encargos) => {
    if (orden == "Cliente") {
      this.imprimirClientesPorProducto(encargos);
    } else {
      this.imprimirProductosPorClienteCantidad(encargos);
    }
    return true;
  };
  public imprimirClientesPorProducto(encargos) {
    let string = "";
    const clientesProductos = {};

    // Recorrer los encargos y agrupar los productos por cliente
    encargos.forEach((encargo) => {
      const cliente = encargo.nombreCliente;
      if (!clientesProductos[cliente]) {
        clientesProductos[cliente] = {};
      }

      encargo.productos.forEach((producto) => {
        const nombreProducto = producto.nombre.substring(0, 33);
        const suplementos = producto.arraySuplementos || [];
        const productoConSuplementos = `${nombreProducto} ${suplementos
          .map((suplemento) => `\n  ${suplemento.nombre}`)
          .join(", ")}`;
        const unidades = producto.unidades;

        if (!clientesProductos[cliente][productoConSuplementos]) {
          clientesProductos[cliente][productoConSuplementos] = unidades;
        } else {
          clientesProductos[cliente][productoConSuplementos] += unidades;
        }
      });
    });

    // Imprimir los clientes y los productos que han pedido
    Object.keys(clientesProductos).forEach((cliente) => {
      string += `\n${cliente}\n`;
      const productos = clientesProductos[cliente];
      Object.keys(productos).forEach((producto) => {
        const unidades = productos[producto];
        string += ` - ${producto}: ${unidades}\n`;
      });
    });
    impresoraInstance.imprimirListaEncargos(string);
  }

  public imprimirProductosPorClienteCantidad(encargos) {
    let string = "";
    const productosClientes = {};

    // Recorrer los encargos y agrupar los clientes por producto
    encargos.forEach((encargo) => {
      const cliente = encargo.nombreCliente;
      encargo.productos.forEach((producto) => {
        const nombreProducto = producto.nombre.substring(0, 33);
        const suplementos = producto.arraySuplementos || [];
        const productoConSuplementos = `${nombreProducto} ${suplementos
          .map((suplemento) => `\n  ${suplemento.nombre}`)
          .join(", ")}`;
        const unidades = producto.unidades;

        if (!productosClientes[productoConSuplementos]) {
          productosClientes[productoConSuplementos] = {};
        }

        if (!productosClientes[productoConSuplementos][cliente]) {
          productosClientes[productoConSuplementos][cliente] = 0;
        }

        productosClientes[productoConSuplementos][cliente] += unidades;
      });
    });

    const productosOrdenados = Object.keys(productosClientes).sort();

    // Imprimir los productos y los clientes con las unidades pedidas
    productosOrdenados.forEach((producto) => {
      let totalUnidadesProducto = 0; // Inicializar el total de unidades para este producto
      const clientes = productosClientes[producto];
      Object.keys(clientes).forEach((cliente) => {
        const unidades = clientes[cliente];
        totalUnidadesProducto += unidades; // Sumar las unidades para este cliente al total del producto
      });
      string += `\n${producto}: ${totalUnidadesProducto}\n`;

      Object.keys(clientes).forEach((cliente) => {
        const unidades = clientes[cliente];
        string += ` - ${cliente}: ${unidades}\n`;
      });
    });

    impresoraInstance.imprimirListaEncargos(string);
  }

  getEncargoById = async (idEncargo: EncargosInterface["_id"]) =>
    await schEncargos.getEncargoById(idEncargo);
  borrarEncargos = async () => {
    await schEncargos.borrarEncargos();
  };
  redondearPrecio = (precio: number) => Math.round(precio * 100) / 100;
  setEncargo = async (encargo) => {
    let descuento: any = Number(
      (await clienteInstance.isClienteDescuento(encargo.idCliente))?.descuento
    );
    if (descuento && descuento > 0) {
      for (let i = 0; i < encargo.productos.length; i++) {
        const producto = encargo.productos[i];
        if (producto.id !== -1) {
          producto.total = this.redondearPrecio(
            producto.total - (producto.total * descuento) / 100
          );

          // Asigna el valor de producto.total al subtotal en cesta.lista
          encargo.cesta.lista[i].subtotal = producto.total;
        }
      }
    }
    encargo.producto;

    let timestamp = new Date().getTime();
    let codigoBarras = await movimientosInstance.generarCodigoBarrasSalida();
    codigoBarras = await calculoEAN13(codigoBarras);

    encargo.timestamp = timestamp;
    encargo.enviado = false;
    encargo.estado = "SIN_RECOGER";
    encargo.codigoBarras = codigoBarras;
    const encargoCopia = JSON.parse(JSON.stringify(encargo));
    await impresoraInstance.imprimirEncargo(encargoCopia);

    // creamos un encargo en mongodb
    return schEncargos
      .setEncargo(encargo)
      .then((ok: boolean) => {
        if (!ok) return { error: true, msg: "Error al crear el encargo" };
        return { error: false, msg: "Encargo creado" };
      })
      .catch((err: string) => ({ error: true, msg: err }));
  };

  getEncargoByNumber = async (idTarjeta: string): Promise<EncargosInterface> =>
    await schEncargos.getEncargoByNumber(idTarjeta);
  // actualiza el registro del encargo al recoger
  updateEncargoGraella = async (idEncargo) => {
    const encargo = await this.getEncargoById(idEncargo);
    const parametros = await parametrosInstance.getParametros();

    if (!encargo) return false;

    if (encargo.opcionRecogida != 3) {
      return true;
    } else if (encargo.opcionRecogida == 3) {
      // se creara automaticamente un encargo si el que se ha recogido es la opcionRecogida 3
      let diaEnc = new Date(encargo.fecha);
      diaEnc.setDate(diaEnc.getDate() + 7);

      // Creamos una nueva fecha sumando una semana mas a la que tiene el encargo

      const anio = diaEnc.getFullYear();
      const mes = diaEnc.getMonth() + 1; // Se suma 1 porque los meses empiezan en 0
      const dia = diaEnc.getDate();

      let nuevaFecha = `${anio}-${mes.toString().padStart(2, "0")}-${dia
        .toString()
        .padStart(2, "0")}`;
      encargo.fecha = nuevaFecha;
      encargo.timestamp = new Date().getTime();
      // reseteamos el dejaCuenta y la _id antes de crear el nuevo encargo
      encargo.dejaCuenta = 0;
      encargo._id = undefined;
      encargo.enviado = false;
      delete encargo.finalizado;
      await this.setEncargo(encargo);
      return true;
    }

    return false;
  };
  // anula el ticket

  setEnviado = (idEncargo: EncargosInterface["_id"]) =>
    schEncargos.setEnviado(idEncargo);
  setAnulado = (idEncargo: EncargosInterface["_id"]) =>
    schEncargos.setAnulado(idEncargo);

  getEncargoCreadoMasAntiguo = async () =>
    await schEncargos.getEncargoCreadoMasAntiguo();
  getEncargoFinalizadoMasAntiguo = async () =>
    await schEncargos.getEncargoFinalizadoMasAntiguo();

  setFinalizado = (idDeuda: EncargosInterface["_id"]) =>
    schEncargos.setFinalizado(idDeuda);

  public async generateId(
    formatDate: string,
    idTrabajador: string,
    parametros: ParametrosInterface
  ): Promise<string> {
    return `Id_Enc_${formatDate}_${parametros.licencia}_${parametros.codigoTienda}_${idTrabajador}`;
  }
  public async getDate(
    tipo: OpcionRecogida,
    fecha: string | null,
    hora: string | null,
    format: string,
    amPm: string | null
  ): Promise<string> {
    if (tipo === OpcionRecogida.HOY && format !== "YYYYMMDDHHmmss") {
      fecha = moment(Date.now()).format("YYYY-MM-DD");
      hora = moment(Date.now())
        .set({ hour: amPm === "am" ? 12 : 17, minute: 0 })
        .format("HH:mm");
      return moment(new Date(`${fecha}:${hora}`).getTime()).format(format);
    }

    if (tipo === OpcionRecogida.OTRO_DIA && format !== "YYYYMMDDHHmmss")
      return moment(new Date(`${fecha}:${hora}`).getTime()).format(format);

    if (tipo === OpcionRecogida.REPETICION && format !== "YYYYMMDDHHmmss")
      return fecha;

    return moment(Date.now()).format(format);
  }
  public async formatPeriode(dias) {
    return dias.reduce((arr, { nDia }) => {
      arr[nDia] = 1;
      return arr;
    }, new Array(7).fill(0));
  }

  public async insertarEncargos(encargos: any) {
    if (encargos.length === 0) return;
    let cajaAbierta = await cajaInstance.cajaAbierta();
    // abrimos caja temporalmente para poder utilizar la cesta
    if (!cajaAbierta) {
      await cajaInstance.abrirCaja({
        detalleApertura: [{ _id: "0", valor: 0, unidades: 0 }],
        idDependientaApertura: Number.parseInt(encargos[0].Dependenta),
        cambioEmergenciaApertura: 0,
        inicioTime: Number(new Date().getDate()),
        totalApertura: 0,
        fichajes: [Number.parseInt(encargos[0].Dependenta)],
      });
    }
    const idsAgrupados = {};
    let newCesta = await cestasInstance.crearCesta();
    const cesta = await cestasInstance.getCestaById(newCesta);
    // Iteramos sobre cada objeto en el array y agrupamos por id
    for (const item of encargos) {
      const id = item.Id;
      // Si el id no está en el objeto idsAgrupados, lo inicializamos como un array vacío
      if (!idsAgrupados[id]) {
        idsAgrupados[id] = [];
      }

      // Agregamos el objeto actual al grupo correspondiente según su id
      idsAgrupados[id].push(item);
    }

    // Obtenemos los valores (los arrays de objetos agrupados) del objeto idsAgrupados
    const groupedArray = Object.values(idsAgrupados);
    try {
      for (const item of groupedArray) {
        await this.insertarEncargo(item, cesta);
        // Borramos valores de cesta para insertar productos del proximo encargo
        await cestasInstance.borrarArticulosCesta(
          cesta._id,
          true,
          false,
          false
        );
      }
      await cestasInstance.deleteCestaMesa(cesta._id);
      // al acabar de insertar, borramos la cesta y la caja
      if (!cajaAbierta) {
        await cajaInstance.borrarCaja();
      }
      return groupedArray;
    } catch (error) {
      console.log("Error insertEncargos:", error);
    }
  }
  async insertarEncargo(encargo: any, cesta: CestasInterface) {
    // convertimos en  array el string de detall
    const detallesArray = [];
    try {
      // Iterar sobre los objetos y extraer los valores de "Detall" como objetos
      for (const enc of encargo) {
        const detallParts = enc.Detall.match(/\[(.*?)\]/g);
        if (detallParts) {
          const detallObject = {};
          for (const part of detallParts) {
            const [key, value] = part.replace(/[\[\]]/g, "").split(":");
            detallObject[key] = value;
          }
          detallesArray.push(detallObject);
        }
      }
      // variables que guardan los parametros del encargo de mongo
      const data = new Date(encargo[0].Data);
      let fecha = data.toISOString().split("T")[0]; // Formato YYYY-MM-DD
      let hora = data.toISOString().split("T")[1].split(".")[0].slice(0, 5); // Formato hh:mm
      let timestamp = detallesArray[0]?.timestamp
        ? detallesArray[0].timestamp
        : extraerTimestamp(encargo[0].Id);
      let opcionRecogida = detallesArray[0]?.OpcionRec
        ? detallesArray[0]?.OpcionRec
        : 2;
      let idCliente = detallesArray[0].Id;
      let anticipo = encargo[0].Anticip;
      let idDependenta = encargo[0].Dependenta;
      let codigoBarras = detallesArray[0].codigoBarras;
      let client = await clienteInstance.getClienteById(idCliente);
      let total = 0;
      cesta.idCliente = idCliente;
      cesta.nombreCliente = client.nombre;
      cesta.trabajador = idDependenta;
      await cestasInstance.updateCesta(cesta);
      // conseguimos la cesta con los articulos y un array de sus comentarios con el mismo orden de la lista cesta
      let res = await this.postCestaEnc(encargo, detallesArray, cesta);
      let cestaEncargo = res.cesta;

      let productos = [];
      const subcadena = ";0";
      for (const [index, item] of res.comentarios.entries()) {
        const textoModificado = await this.eliminarSubstringYAnterior(
          item,
          subcadena
        );

        productos.push({
          id: cestaEncargo.lista[index].idArticulo,
          nombre: cestaEncargo.lista[index].nombre,
          total: cestaEncargo.lista[index].subtotal,
          unidades: cestaEncargo.lista[index].unidades,
          comentario: textoModificado,
          arraySuplementos: cestaEncargo.lista[index].arraySuplementos,
          promocion: cestaEncargo.lista[index].promocion,
        });
      }
      let descuento: any = Number(
        (await clienteInstance.isClienteDescuento(idCliente))?.descuento
      );

      // modificamos precios con el descuentro del cliente
      if (descuento && descuento > 0) {
        for (let i = 0; i < productos.length; i++) {
          if (productos[i].id !== -1) {
            productos[i].total = this.redondearPrecio(
              productos[i].total - (productos[i].total * descuento) / 100
            );

            // Asigna el valor de producto.total al subtotal en cesta.lista
            cestaEncargo.lista[i].subtotal = productos[i].total;
          }
        }
      }
      let dependenta = await trabajadoresInstance.getTrabajadorById(
        idDependenta
      );

      for (const key in cestaEncargo.detalleIva) {
        if (key.startsWith("importe")) {
          total += cestaEncargo.detalleIva[key];
        }
      }

      // creamos una data mogodb de encargo
      const mongodbEncargo = {
        idCliente: idCliente,
        nombreCliente: client.nombre,
        opcionRecogida: opcionRecogida,
        amPm: "pm",
        fecha: fecha,
        hora: hora,
        dias: [],
        dejaCuenta: anticipo,
        total: total,
        productos: productos,
        cesta: cestaEncargo,
        idTrabajador: idDependenta,
        nombreDependienta: dependenta.nombre,
        timestamp: timestamp,
        enviado: true,
        estado: "SIN_RECOGER",
        codigoBarras: codigoBarras,
      };
      // se vacia la lista para no duplicar posibles productos en la siguiente creacion de un encargo

      cesta.lista = [];
      return schEncargos
        .setEncargo(mongodbEncargo)
        .then((ok: boolean) => {
          if (!ok) return { error: true, msg: "Error al crear el encargo" };
          return { error: false, msg: "Encargo creado" };
        })
        .catch((err: string) => ({ error: true, msg: err }));
    } catch (error) {
      console.log("error insertEnc en Mongodb", error);
    }
  }

  eliminarSubstringYAnterior(texto: string, subcadena: string) {
    const indice = texto.indexOf(subcadena);
    const indice2 = texto.indexOf(";");

    if (indice !== -1) {
      // Si se encuentra la subcadena, elimina todo antes de ella
      return texto.substring(indice + subcadena.length);
    } else if (indice2) {
      return texto.substring(indice2 + 1);
    }

    // Si la subcadena no se encuentra, devuelve el texto original
    return texto;
  }

  async postCestaEnc(
    encargo: any,
    detallesArray: any[],
    cesta: CestasInterface
  ) {
    // :Promise<{ cestaEnc: CestasInterface }>
    const productosPromo = [];
    const procesados = new Set();
    const comentarios = []; //array para inseratr los comentarios en productos con el mismo orden de la cesta

    // buscamos que productos entre si son promoCombo
    function buscarCoincidencia(item, index, otroItem, otroIndex) {
      // devolvera true si los dos productos tienen la id del otro en su registro
      return (
        Number(detallesArray[index]?.PromoArtSec) === otroItem.Article &&
        Number(detallesArray[otroIndex]?.PromoArtPrinc) === item.Article
      );
    }

    // recorrer encargo para encontrar promos
    encargo.forEach((item, index) => {
      if (item.Detall.includes("IdPromoCombo") && !procesados.has(index)) {
        const coincidencia = encargo.find((otroItem, otroIndex) => {
          return (
            index !== otroIndex &&
            !procesados.has(otroIndex) &&
            buscarCoincidencia(item, index, otroItem, otroIndex)
          );
        });

        if (coincidencia) {
          let otroIndex = encargo.indexOf(coincidencia);
          // push  para crear promos en cesta
          productosPromo.push({
            idPromo: detallesArray[index].IdPromoCombo,
            tipo: "COMBO",
            indexArtEnc: [index, otroIndex],
            comentario: item.Comentari,
          });
          // guardamos los indices encontrados en el array para no volverlos a comrpobar
          procesados.add(index);
          procesados.add(otroIndex);
        }
      } else if (
        item.Detall.includes("IdPromoIndividual") &&
        !procesados.has(index)
      ) {
        productosPromo.push({
          idPromo: detallesArray[index].IdPromoIndividual,
          tipo: "INDIVIDUAL",
          indexArtEnc: [index],
          comentario: item.Comentari,
        });
        procesados.add(index);
      }
    });
    // creamos las promos encontradas y las insertamos en cesta
    for (const item of productosPromo) {
      const promoEncontrado: PromocionesInterface =
        await nuevaInstancePromociones.getPromoById(item.idPromo);

      if (promoEncontrado) {
        let unidadArtPrinc;
        let idPrinc;
        let idSec;

        if (item.tipo == "INDIVIDUAL") {
          unidadArtPrinc = encargo[item.indexArtEnc[0]].Quantitat;
          idPrinc = encargo[item.indexArtEnc[0]].Article;
          idSec = null;

          const unidades = unidadArtPrinc / promoEncontrado.cantidadPrincipal;
          const articuloPrincipal = await articulosInstance.getInfoArticulo(
            idPrinc
          );
          const nombre = "Promo. " + articuloPrincipal.nombre;
          const productoCesta = {
            arraySuplementos: null,
            gramos: 0,
            idArticulo: -1,
            unidades: unidades,
            nombre: nombre,
            regalo: false,
            subtotal: this.redondearPrecio(
              unidades *
                promoEncontrado.cantidadPrincipal *
                promoEncontrado.precioFinal
            ),
            puntos: articuloPrincipal.puntos,
            impresora: null,
            promocion: {
              idPromocion: promoEncontrado._id,
              tipoPromo: promoEncontrado.tipo,
              unidadesOferta: 1,
              idArticuloPrincipal: idPrinc,
              cantidadArticuloPrincipal: promoEncontrado.cantidadPrincipal,
              cantidadArticuloSecundario: null,
              idArticuloSecundario: idSec,
              precioRealArticuloPrincipal: promoEncontrado.precioFinal,
              precioRealArticuloSecundario: null,
            },
          };
          cesta.lista.push(productoCesta);

          comentarios.push(encargo[item.indexArtEnc[0]].Comentari);
        } else {
          if (detallesArray[item.indexArtEnc[0]]?.PromoArtSec) {
            unidadArtPrinc = encargo[item.indexArtEnc[0]].Quantitat;
            idPrinc = encargo[item.indexArtEnc[0]].Article;
            idSec = encargo[item.indexArtEnc[1]].Article;
          } else {
            unidadArtPrinc = encargo[item.indexArtEnc[1]].Quantitat;
            idPrinc = encargo[item.indexArtEnc[1]].Article;
            idSec = encargo[item.indexArtEnc[0]].Article;
          }

          const unidades = unidadArtPrinc / promoEncontrado.cantidadPrincipal;

          const articuloPrincipal = await articulosInstance.getInfoArticulo(
            idPrinc
          );
          const articuloSecundario = await articulosInstance.getInfoArticulo(
            idSec
          );
          const infoFinal: InfoPromocionCombo = {
            seAplican: unidades,
            sobranPrincipal: 0,
            sobranSecundario: 0,
            indexListaOriginalPrincipal: null,
            indexListaOriginalSecundario: null,
            idArticuloPrincipal: idPrinc,
            idArticuloSecundario: idSec,
            precioPromoUnitario: promoEncontrado.precioFinal,
            idPromocion: promoEncontrado._id,
            cantidadNecesariaPrincipal: promoEncontrado.cantidadPrincipal,
            cantidadNecesariaSecundario: promoEncontrado.cantidadSecundario,
            nombrePrincipal: articuloPrincipal.nombre,
            nombreSecundario: articuloSecundario?.nombre,
          };
          const preciosReales =
            await nuevaInstancePromociones.calcularPrecioRealCombo(
              infoFinal,
              articuloPrincipal,
              articuloSecundario
            );

          const nombre =
            "Promo. " +
            (await articulosInstance.getInfoArticulo(idPrinc)).nombre +
            " + " +
            (await articulosInstance.getInfoArticulo(idSec)).nombre;

          const productoCesta = {
            arraySuplementos: null,
            gramos: 0,
            idArticulo: -1,
            unidades: unidades,
            nombre: nombre,
            regalo: false,
            subtotal: this.redondearPrecio(
              unidades *
                promoEncontrado.cantidadPrincipal *
                preciosReales.precioRealPrincipal +
                unidades *
                  promoEncontrado.cantidadSecundario *
                  preciosReales.precioRealSecundario
            ),
            puntos: articuloPrincipal.puntos + articuloSecundario?.puntos,
            impresora: null,
            promocion: {
              idPromocion: promoEncontrado._id,
              tipoPromo: promoEncontrado.tipo,
              unidadesOferta: 1,
              idArticuloPrincipal: idPrinc,
              cantidadArticuloPrincipal: promoEncontrado.cantidadPrincipal,
              cantidadArticuloSecundario: promoEncontrado.cantidadSecundario,
              idArticuloSecundario: idSec,
              precioRealArticuloPrincipal: preciosReales.precioRealPrincipal,
              precioRealArticuloSecundario: preciosReales.precioRealSecundario,
            },
          };
          cesta.lista.push(productoCesta);

          comentarios.push(encargo[item.indexArtEnc[0]].Comentari);
        }
      }
    }

    await cestasInstance.updateCesta(cesta);

    // insetar articulos en cesta para calcularIva
    try {
      // insertar productos restantes
      for (const [index, item] of encargo.entries()) {
        if (!procesados.has(index)) {
          const arraySuplementos = detallesArray[index]?.suplementos
            ? await articulosInstance.getSuplementos(
                detallesArray[index]?.suplementos.split(",").map(Number)
              )
            : null;

          for (let i = 0; i < item.Quantitat; i++) {
            cesta = await cestasInstance.clickTeclaArticulo(
              item.Article,
              0,
              cesta._id,
              1,
              arraySuplementos,
              "",
              ""
            );
          }

          comentarios.push(encargo[index].Comentari);
        }
      }
    } catch (error) {
      console.log("error crear cesta de encargo", error);
    }

    // devolver cesta y comentarios
    return { cesta: cesta, comentarios: comentarios };
  }
  async getUpdateEncargos() {
    return await schEncargos.getUpdateEncargos();
  }
}

const encargosInstance = new Encargos();
export { encargosInstance };
function calculoEAN13(codigo: any): any {
  var codigoBarras = codigo;
  var digitos = codigoBarras.split("").map(Number); // Convertir cadena en un arreglo de números

  // Calcular el dígito de control
  var suma = 0;
  for (var i = 0; i < digitos.length; i++) {
    suma += digitos[i] * (i % 2 === 0 ? 1 : 3);
  }
  var digitoControl = (10 - (suma % 10)) % 10;

  // Agregar el dígito de control al código de barras
  var codigoBarrasEAN13 = codigoBarras + digitoControl;
  // Devolvemos el resultado
  return codigoBarrasEAN13;
}
function extraerTimestamp(Id: any) {
  const timestampMatch = Id.match(/\d{14}/);

  const timestampStr = timestampMatch[0];
  const year = timestampStr.substr(0, 4);
  const month = timestampStr.substr(4, 2);
  const day = timestampStr.substr(6, 2);
  const hour = timestampStr.substr(8, 2);
  const minute = timestampStr.substr(10, 2);
  const second = timestampStr.substr(12, 2);

  const timestamp = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  return new Date(timestamp).getTime(); // Devuelve el timestamp en milisegundos
}
