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
import {
  CestasInterface,
  ItemLista,
  GrupoPromoEnCesta,
  ArticuloPromoEnCesta,
} from "src/cestas/cestas.interface";
import { CestasController } from "src/cestas/cestas.controller";
import { getSuplementos } from "src/articulos/articulos.mongodb";
import { articulosInstance } from "src/articulos/articulos.clase";
import {
  NuevaPromocion,
  nuevaInstancePromociones,
  ArticuloInfoPromoYNormal,
} from "../promociones/promociones.clase";
import { PromocionesInterface } from "../promociones/promociones.interface";
import { cajaInstance } from "src/caja/caja.clase";
import { TrabajadoresInterface } from "src/trabajadores/trabajadores.interface";
import {
  getDataVersion,
  obtenerVersionAnterior,
  versionDescuentosClient,
} from "src/version/version.clase";
import Decimal from "decimal.js";

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

  async getPedidos() {
    return await schEncargos.getPedidos();
  }

  async setPedidoRepartidor(
    idEncargo: EncargosInterface["_id"],
    idRepartidor: TrabajadoresInterface["_id"]
  ) {
    return await schEncargos.setPedidoRepartidor(idEncargo, idRepartidor);
  }

  async setCestaPedidos(idEncargo: any, cesta: any) {

    function calcularTotal(cesta: CestasInterface) {
      let total = 0;
      cesta.lista.forEach((item) => {
        total += item.subtotal;
      });
      return total;
    }
    let productos = [];
    cesta.lista.forEach(element => {
      productos.push({
        id: element.idArticulo,
        nombre: element.nombre,
        total: element.subtotal,
        unidades: element.unidades,
        comentario: '',
        arraySuplementos: element.arraySuplementos,
        promocion: element.promocion,
      });
    });

    return await schEncargos.setCestaPedidos(idEncargo, cesta, calcularTotal(cesta), productos);
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
  async getEncargosByIdCliente(idCliente: string) {
    return await schEncargos.getEncargosByIdCliente(idCliente);
  }
  ordenarImpresion = async (orden, encargos) => {
    if (orden == "Cliente") {
      this.imprimirClientesPorProducto(encargos);
    } else if (orden == "producto") {
      this.imprimirProductosPorClienteCantidad(encargos);
    } else {
      this.imprimirProductosResumido(encargos);
    }
    return true;
  };
  public imprimirClientesPorProducto(encargos) {
    let string = "";

    let fechaMasAntigua = null;
    let fechaMasReciente = null;

    const clientesProductos = {};

    // Recorrer los encargos y agrupar los productos por cliente
    encargos.forEach((encargo) => {
      const cliente = encargo.nombreCliente;
      const fechaEncargo = new Date(encargo.fecha);

      if (!fechaMasAntigua || fechaEncargo < fechaMasAntigua) {
        fechaMasAntigua = fechaEncargo;
      }
      if (!fechaMasReciente || fechaEncargo > fechaMasReciente) {
        fechaMasReciente = fechaEncargo;
      }

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

    const formatoFecha = (fecha) =>
      fecha.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

    const rangoFechas = `Encàrrecs des de ${formatoFecha(
      fechaMasAntigua
    )} fins al ${formatoFecha(fechaMasReciente)}\n`;

    string += rangoFechas;

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

    // Variables para las fechas más antigua y más reciente
    let fechaMasAntigua = null;
    let fechaMasReciente = null;

    // Recorrer los encargos y agrupar los clientes por producto
    encargos.forEach((encargo) => {
      const cliente = encargo.nombreCliente;
      const fechaEncargo = new Date(encargo.fecha);

      if (!fechaMasAntigua || fechaEncargo < fechaMasAntigua) {
        fechaMasAntigua = fechaEncargo;
      }
      if (!fechaMasReciente || fechaEncargo > fechaMasReciente) {
        fechaMasReciente = fechaEncargo;
      }

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

    const formatoFecha = (fecha) =>
      fecha.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

    const rangoFechas = `Encàrrecs des del ${formatoFecha(
      fechaMasAntigua
    )} fins al ${formatoFecha(fechaMasReciente)}\n`;

    string += rangoFechas;

    const productosOrdenados = Object.keys(productosClientes).sort();

    // Imprimir los productos y los clientes con las unidades pedidas
    productosOrdenados.forEach((producto) => {
      let totalUnidadesProducto = 0;
      const clientes = productosClientes[producto];
      Object.keys(clientes).forEach((cliente) => {
        const unidades = clientes[cliente];
        totalUnidadesProducto += unidades;
      });
      string += `\n${producto}: ${totalUnidadesProducto}\n`;

      Object.keys(clientes).forEach((cliente) => {
        const unidades = clientes[cliente];
        string += ` - ${cliente}: ${unidades}\n`;
      });
    });

    impresoraInstance.imprimirListaEncargos(string);
  }

  public imprimirProductosResumido(encargos) {
    let string = "";
    const productos = {};

    let fechaMasAntigua = null;
    let fechaMasReciente = null;

    // Recorrer los encargos y agrupar los productos
    encargos.forEach((encargo) => {
      const fechaEncargo = new Date(encargo.fecha);

      if (!fechaMasAntigua || fechaEncargo < fechaMasAntigua) {
        fechaMasAntigua = fechaEncargo;
      }
      if (!fechaMasReciente || fechaEncargo > fechaMasReciente) {
        fechaMasReciente = fechaEncargo;
      }

      encargo.productos.forEach((producto) => {
        const nombreProducto = producto.nombre.substring(0, 33);
        const suplementos = producto.arraySuplementos || [];
        const productoConSuplementos = `${nombreProducto} ${suplementos
          .map((suplemento) => `\n  ${suplemento.nombre}`)
          .join(", ")}`;
        const unidades = producto.unidades;

        if (!productos[productoConSuplementos]) {
          productos[productoConSuplementos] = 0;
        }

        productos[productoConSuplementos] += unidades;
      });
    });

    const formatoFecha = (fecha) =>
      fecha.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

    const rangoFechas = `Encàrrecs des del ${formatoFecha(
      fechaMasAntigua
    )} fins al ${formatoFecha(fechaMasReciente)}\n`;

    string += rangoFechas;

    const productosOrdenados = Object.keys(productos).sort();

    // Imprimir los productos y las unidades pedidas
    productosOrdenados.forEach((producto) => {
      const unidades = productos[producto];
      string += `\n${producto}: ${unidades}\n`;
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
    var TEncargo1 = performance.now();

    const cliente = await clienteInstance.getClienteById(encargo.idCliente);
    const alboVip = cliente && cliente?.albaran && cliente?.vip;

    // aplica posible descuento a la cesta a los clientes que no son de facturación (albaranes y vips)
    await cestasInstance.aplicarDescuento(
      encargo.cesta,
      encargo.total,
      cliente
    );

    if (encargo.cesta.modo == "CONSUMO_PERSONAL" || (cliente && !alboVip))
      await cestasInstance.applyDiscountShop(encargo.cesta, encargo.total);

    for (let i = 0; i < encargo.productos.length; i++) {
      encargo.productos[i].total = encargo.cesta.lista[i].subtotal;
    }

    let timestamp = new Date().getTime();
    let codigoBarras = await movimientosInstance.generarCodigoBarrasSalida();
    codigoBarras = await calculoEAN13(codigoBarras);

    encargo.timestamp = timestamp;
    encargo.enviado = false;

    encargo.estado = encargo?.pedido ? "RECOGIDO" : "SIN_RECOGER";
    encargo.codigoBarras = codigoBarras;
    encargo.dataVersion = getDataVersion();
    const encargoCopia = JSON.parse(JSON.stringify(encargo));
    if (encargo?.pedido) {
      await impresoraInstance.imprimirPedido(encargoCopia);
    } else {
      await impresoraInstance.imprimirEncargo(encargoCopia);
    }
    var TEncargo2 = performance.now();
    var TiempoEncargo = TEncargo2 - TEncargo1;
    logger.Info("TiempoEncargo", TiempoEncargo.toFixed(4) + " ms");
    // creamos un encargo en mongodb
    return schEncargos
      .setEncargo(encargo)
      .then(async (ok: boolean) => {
        if (!ok) return { error: true, msg: "Error al crear el encargo" };
        await cestasInstance.borrarArticulosCesta(
          encargo.cesta._id,
          true,
          true,
          false
        );
        return { error: false, msg: "Encargo creado" };
      })
      .catch((err: string) => ({ error: true, msg: err }));
  };





  setPedido = async (encargo) => {
    await cestasInstance.aplicarDescuento(encargo.cesta, encargo.total, encargo.idCliente);


    let timestamp = new Date().getTime();
    let codigoBarras = await movimientosInstance.generarCodigoBarrasSalida();
    codigoBarras = await calculoEAN13(codigoBarras);

    encargo.timestamp = timestamp;
    encargo.enviado = false;

    encargo.estado = "PEDIDOS";
    encargo.codigoBarras = codigoBarras;
    encargo.dataVersion = getDataVersion();

    // creamos un encargo en mongodb
    return schEncargos
      .setEncargo(encargo)
      .then(async (ok: boolean) => {
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
  getEncargoPedidoCaducadoMasAntiguo = async () =>
    await schEncargos.getEncargoPedidoCaducadoMasAntiguo();
  setFinalizado = (idDeuda: EncargosInterface["_id"]) =>
    schEncargos.setFinalizado(idDeuda);

  setFinalizadoFalse = (idDeuda: EncargosInterface["_id"]) =>
    schEncargos.setFinalizadoFalse(idDeuda);

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
    amPm: string | null,
    timestamp: number
  ): Promise<string> {
    // genera la fecha de un formato especifico si opcion es hoy
    if (tipo === OpcionRecogida.HOY && format !== "YYYYMMDDHHmmss") {
      fecha = moment(fecha).format("YYYY-MM-DD");
      hora = moment(Date.now())
        .set({ hour: amPm === "am" ? 12 : 17, minute: 0 })
        .format("HH:mm");
      return moment(new Date(`${fecha}:${hora}`).getTime()).format(format);
    }
    // genera la fecha de un formato especifico si opcion es otroDia
    if (tipo === OpcionRecogida.OTRO_DIA && format !== "YYYYMMDDHHmmss")
      return moment(new Date(`${fecha}:${hora}`).getTime()).format(format);
    // genera la fecha de un formato especifico si opcion es repeticion
    if (tipo === OpcionRecogida.REPETICION && format !== "YYYYMMDDHHmmss")
      return fecha;
    // genera la fecha de un formato predeterminado para después construir el id del encargo
    return moment(timestamp).format(format);
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
        cambioEmergenciaActual: 0,
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
  private parametros: ParametrosInterface = null;
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
      let dataVersion = detallesArray[0]?.DataVersion
        ? detallesArray[0].DataVersion
        : obtenerVersionAnterior(versionDescuentosClient);

      if (cesta.dataVersion && !dataVersion) {
        delete cesta.dataVersion;
      } else if (dataVersion) {
        cesta.dataVersion = dataVersion;
      }

      cesta.idCliente = idCliente;
      cesta.nombreCliente = client?.nombre;
      cesta.trabajador = idDependenta;
      await cestasInstance.updateCesta(cesta);
      // conseguimos la cesta con los articulos y un array de sus comentarios con el mismo orden de la lista cesta
      let res = await this.postCestaEnc(encargo, detallesArray, cesta);
      let cestaEncargo = res.cesta;

      let productos = [];
      const subcadena = ";0";

      // recorremos array comentarios para añadirlas en su producto correspondiente
      for (const [index, item] of res.comentarios.entries()) {
        const textoModificado = await this.eliminarSubstringYAnterior(
          item,
          subcadena
        );
        // Si no entra a la condicion, es porque en la cestaEncargo se ha creado
        //  una promoCombo entre dos articulos no promocionables inicialmente
        // y al recorrer el bucle con res.comentarios, hay mas comments que productos en cestaEncargo
        if (cestaEncargo.lista[index]?.idArticulo) {
          productos.push({
            id: cestaEncargo.lista[index].idArticulo,
            nombre: cestaEncargo.lista[index].nombre,
            total: cestaEncargo.lista[index].subtotal,
            unidades: cestaEncargo.lista[index].unidades,
            comentario: textoModificado,
            arraySuplementos: cestaEncargo.lista[index].arraySuplementos,
            promocion: cestaEncargo.lista[index].promocion,
            dataVersion: dataVersion,
          });
        }
      }
      const cliente = await clienteInstance.getClienteById(detallesArray[0].Id);

      let descuento: any =
        cliente && !cliente?.albaran && !cliente?.vip
          ? Number(cliente.descuento)
          : 0;

      // se aplica el descuento a los productos para visualizarlos en pantalla
      if (
        descuento &&
        descuento > 0 &&
        (!dataVersion || (dataVersion && dataVersion < versionDescuentosClient))
      ) {
        for (let i = 0; i < productos.length; i++) {
          if (productos[i].id !== -1) {
            productos[i].total = this.redondearPrecio(
              productos[i].total - (productos[i].total * descuento) / 100
            );

            // Asigna el valor de producto.total al subtotal en cesta.lista
            cestaEncargo.lista[i].subtotal = productos[i].total;
          }
        }
      } else if (dataVersion && dataVersion >= versionDescuentosClient) {
        let descuentoTienda = new Decimal(0);

        for (let i = 0; i < productos.length; i++) {
          descuentoTienda = new Decimal(
            cestaEncargo.lista[i]?.descuentoTienda || 0
          );

          if (productos[i].id !== -1) {
            const total = new Decimal(productos[i].total);
            const descuentoAplicado = total.mul(descuentoTienda).div(100);
            const totalConDescuento = total.minus(descuentoAplicado);

            productos[i].total = this.redondearPrecio(
              Number(totalConDescuento)
            );

            // Asigna el valor de producto.total al subtotal en cesta.lista
            cestaEncargo.lista[i].subtotal = productos[i].total;
          }
        }
      }

      let dependenta: TrabajadoresInterface =
        await trabajadoresInstance.getTrabajadorById(idDependenta);

      for (const key in cestaEncargo.detalleIva) {
        if (key.startsWith("importe")) {
          total += Math.round(cestaEncargo.detalleIva[key] * 100) / 100;
        }
      }
      total = Number((Math.round(total * 100) / 100).toFixed(2));
      // creamos una data mogodb de encargo
      const parametros =
        this.parametros || (await parametrosInstance.getParametros());
      if (this.parametros == null) {
        this.parametros = parametros;
      }

      let dias: EncargosInterface["dias"] = [];
      if (opcionRecogida == OpcionRecogida.REPETICION) {
        // generar formato Dias del encargo
        const diaSemanaNumber: number = new Date(fecha).getDay();
        const diaSemanaString: string = new Date(fecha).toLocaleDateString(
          "es-ES",
          {
            weekday: "long",
          }
        );
        const diaString =
          diaSemanaString.charAt(0).toUpperCase() + diaSemanaString.slice(1);
        dias = [
          {
            nDia: diaSemanaNumber - 1,
            dia: diaString,
            checked: true,
          },
        ];
      }

      //
      const mongodbEncargo: EncargosInterface = {
        idCliente: idCliente,
        nombreCliente: client.nombre,
        opcionRecogida: opcionRecogida,
        amPm: "pm",
        fecha: fecha,
        hora: hora,
        dias: dias,
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
      if (
        parametros &&
        parametros.codigoTienda &&
        idCliente == "CliBoti_" + parametros.codigoTienda + "_pedidosTienda"
      ) {
        mongodbEncargo.pedido = true;
        mongodbEncargo.estado = "RECOGIDO";
      }
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
    let PromoEnGrupos = false;
    for (let det of detallesArray) {
      if (det.GrupoPromo) {
        PromoEnGrupos = true;
        break;
      }
    }
    if (PromoEnGrupos) {
      // formato de promo nuevos (en grupos)
      let MapItemsOfPromo: Map<
        number,
        {
          idPromo: string;
          grupos: {
            idxGrupo: number;
            idxInGrupo: number;
            Article: number;
            Quantitat: number;
          }[];
        }
      > = new Map();
      let Comentari = "";
      encargo.forEach((item, index) => {
        let da = detallesArray[index];
        let GrupoPromoStr: string = da.GrupoPromo;
        if (GrupoPromoStr) {
          // GrupoPromo: idxItemLista,idxGrupo,idxInGrupo
          let GP = GrupoPromoStr.split(",").map((v) => parseInt(v));
          let p = {
            idxGrupo: GP[1],
            idxInGrupo: GP[2],
            Article: item.Article as number,
            Quantitat: item.Quantitat as number,
          };
          if (item.Comentari && item.Comentari != "0")
            Comentari = item.Comentari;
          let promo = MapItemsOfPromo.get(GP[0]); //idxItemLista
          if (promo == undefined) {
            MapItemsOfPromo.set(GP[0], {
              idPromo: (da.IdPromoCombo ||
                da.IdPromoIndividual ||
                da.IdPromo) as string,
              grupos: [p],
            });
          } else {
            promo.grupos.push(p);
          }
          procesados.add(index);
        }
      });
      for (let [idxItemLista, id_y_grupos] of MapItemsOfPromo) {
        const promoById = nuevaInstancePromociones.getPromoById(
          id_y_grupos.idPromo
        );
        if (!promoById) continue;
        id_y_grupos.grupos.sort((a, b) => {
          let c = a.idxGrupo - b.idxGrupo;
          if (c != 0) return c;
          c = a.idxInGrupo - b.idxInGrupo;
          return c;
        });
        let grupos: GrupoPromoEnCesta[] = [];
        let unidadesPorGrupo: number[] = [];
        let idxGrupoActual = -1;
        let puntos = 0;
        for (let gr of id_y_grupos.grupos) {
          const artInfo = await articulosInstance.getInfoArticulo(gr.Article);
          if (artInfo.puntos != null) puntos += gr.Quantitat * artInfo.puntos;
          let ArtGrupo: ArticuloInfoPromoYNormal = {
            idArticulo: gr.Article,
            unidades: gr.Quantitat, // falta dividir por número de promos
            nombre: artInfo.nombre,
            precioPromoPorUnidad: null,
            precioPorUnidad: artInfo.precioConIva,
            puntosPorUnidad: artInfo.puntos,
            impresora: artInfo.impresora,

          };
          if (gr.idxGrupo != idxGrupoActual) {
            grupos.push([ArtGrupo]);
            unidadesPorGrupo.push(gr.Quantitat);
            idxGrupoActual = gr.idxGrupo;
          } else {
            grupos[grupos.length - 1].push(ArtGrupo);
            unidadesPorGrupo[unidadesPorGrupo.length - 1] =
              unidadesPorGrupo[unidadesPorGrupo.length - 1] + gr.Quantitat;
          }
        }
        let num_promos = unidadesPorGrupo[0] / promoById.grupos[0].cantidad;
        for (let artGrupo of grupos.flat()) {
          artGrupo.unidades /= num_promos;
        }

        let productoCesta = await nuevaInstancePromociones.crearItemListaPromo(
          promoById,
          grupos
        );
        productoCesta.unidades = num_promos;
        nuevaInstancePromociones.calculoFinalPromo(productoCesta);
        cesta.lista.push(productoCesta);
        comentarios.push(Comentari);
      }
    } else {
      // formato de promo antiguo
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
        const promoEncontrado = nuevaInstancePromociones.getPromoById(
          item.idPromo
        );

        if (promoEncontrado) {
          let unidadArtPrinc;
          let idPrinc;
          let idSec;

          if (item.tipo == "INDIVIDUAL") {
            unidadArtPrinc = encargo[item.indexArtEnc[0]].Quantitat;
            idPrinc = encargo[item.indexArtEnc[0]].Article;
            idSec = null;

            const unidades =
              unidadArtPrinc / promoEncontrado.grupos[0].cantidad; // cantidadPrincipal;
            const articuloPrincipal =
              await articulosInstance.getInfoArticulo(idPrinc);
            const nombre = "Promo. " + articuloPrincipal.nombre;
            const ArtPromo: ArticuloPromoEnCesta = {
              idArticulo: idPrinc,
              nombre: articuloPrincipal.nombre,
              unidades: promoEncontrado.grupos[0].cantidad,
              precioPromoPorUnidad: this.redondearPrecio(
                promoEncontrado.precioFinal / promoEncontrado.grupos[0].cantidad
              ),
              impresora: articuloPrincipal.impresora,
            };
            const productoCesta: ItemLista = {
              arraySuplementos: null,
              gramos: 0,
              idArticulo: -1,
              unidades: unidades,
              nombre: nombre,
              regalo: false,
              subtotal: this.redondearPrecio(
                unidades *
                // cantidadPrincipal *
                promoEncontrado.precioFinal // el precio final en el nuevo formato promo individual ya es el total por promo
              ),
              puntos:
                articuloPrincipal.puntos == null
                  ? null
                  : unidades * articuloPrincipal.puntos,
              impresora: articuloPrincipal.impresora,
              promocion: {
                idPromocion: promoEncontrado._id,
                grupos: [[ArtPromo]],
                precioFinalPorPromo: promoEncontrado.precioFinal,
                unidadesOferta: unidades,
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

            const unidades =
              unidadArtPrinc / promoEncontrado.grupos[0].cantidad;

            const articuloPrincipal =
              await articulosInstance.getInfoArticulo(idPrinc);
            const articuloSecundario =
              await articulosInstance.getInfoArticulo(idSec);

            const nombre =
              "Promo. " +
              articuloPrincipal.nombre +
              " + " +
              articuloSecundario.nombre;

            let totalSinDescuento =
              articuloPrincipal.precioConIva *
              promoEncontrado.grupos[0].cantidad +
              articuloSecundario.precioConIva *
              promoEncontrado.grupos[1].cantidad;

            let perc = promoEncontrado.precioFinal / totalSinDescuento;

            const ArtPromoPrincipal: ArticuloPromoEnCesta = {
              idArticulo: idPrinc,
              nombre: articuloPrincipal.nombre,
              unidades: promoEncontrado.grupos[0].cantidad,
              precioPromoPorUnidad: this.redondearPrecio(
                articuloPrincipal.precioConIva * perc
              ),
              impresora: articuloPrincipal.impresora,
            };
            const ArtPromoSecundario: ArticuloPromoEnCesta = {
              idArticulo: idSec,
              nombre: articuloSecundario.nombre,
              unidades: promoEncontrado.grupos[1].cantidad,
              precioPromoPorUnidad: this.redondearPrecio(
                articuloSecundario.precioConIva * perc
              ),
              impresora: articuloSecundario.impresora,
            };
            let impresora = articuloPrincipal.impresora
              ? articuloPrincipal.impresora
              : articuloSecundario.impresora;
            let puntos = null;
            if (
              articuloPrincipal.puntos != null ||
              articuloSecundario.puntos != null
            )
              puntos =
                unidades *
                (articuloPrincipal.puntos ??
                  0 + articuloSecundario.puntos ??
                  0);
            const productoCesta: ItemLista = {
              arraySuplementos: null,
              gramos: 0,
              idArticulo: -1,
              unidades: unidades,
              nombre: nombre,
              regalo: false,
              subtotal: this.redondearPrecio(
                unidades * promoEncontrado.precioFinal
              ),
              puntos: puntos,
              impresora: impresora,
              promocion: {
                idPromocion: promoEncontrado._id,
                grupos: [[ArtPromoPrincipal], [ArtPromoSecundario]],
                precioFinalPorPromo: promoEncontrado.precioFinal,
                unidadesOferta: unidades,
              },
            };
            cesta.lista.push(productoCesta);

            comentarios.push(encargo[item.indexArtEnc[0]].Comentari);
          }
        }
      }
    }
    const cliente = cesta.idCliente
      ? await clienteInstance.getClienteById(cesta.idCliente)
      : null;
    // actualizar la cesta con los productos promo, por si no se hace clickTeclaArticulo con los no promo
    if (cesta.dataVersion && cesta.dataVersion >= versionDescuentosClient)
      await cestasInstance.recalcularIvasv2(cesta, "descargas", cliente);
    else await cestasInstance.recalcularIvas(cesta, "descargas", cliente);

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

          cesta = await cestasInstance.clickTeclaArticulo(
            item.Article,
            0,
            cesta._id,
            item.Quantitat,
            arraySuplementos,
            "",
            "descargas"
          );
          if (
            detallesArray[index]?.Descuento &&
            detallesArray[index]?.Descuento > 0
          ) {
            // si hay descuento, se recalcula iva de cesta
            cesta.lista[cesta.lista.length - 1].descuentoTienda =
              Number(detallesArray[index]?.Descuento) || 0;
            // actualizamos la cesta del mongo para no perder el descuento al pasar a la siguiente iteración
            await cestasInstance.updateCesta(cesta);
          }

          comentarios.push(encargo[index].Comentari);
        }
      }
      // recalcular iva de cesta si contiene descuentos
      if (cesta.dataVersion && cesta.dataVersion >= versionDescuentosClient)
        await cestasInstance.recalcularIvasv2(cesta, "descargas", cliente);
      else await cestasInstance.recalcularIvas(cesta, "descargas", cliente);
    } catch (error) {
      console.log("error crear cesta de encargo", error);
    }

    // devolver cesta y comentarios
    return { cesta: cesta, comentarios: comentarios };
  }
  async getUpdateEncargos() {
    return await schEncargos.getUpdateEncargos();
  }
  async imprimirEncargoSelected(encargo) {
    if (!encargo) return;
    if (!encargo.codigoBarras) {
      encargo.codigoBarras = "";
    }
    impresoraInstance.imprimirEncargoSelected(encargo);
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
