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

export class Encargos {
  async pruebaImportar() {
    try {
      const parametros = await parametrosInstance.getParametros();
      const res: any = await axios.post("encargos/getEncargos", {
        database: parametros.database,
        codigoTienda: parametros.codigoTienda,
      });
      console.log("lista");
      console.log(res.data);
      console.log("lista:", res);
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
      string += `\n${producto}\n`;
      const clientes = productosClientes[producto];
      Object.keys(clientes).forEach((cliente) => {
        const unidades = clientes[cliente];
        string += ` - ${cliente}: ${unidades}\n`;
      });
    });

    impresoraInstance.imprimirListaEncargos(string);
  }

  getEncargoById = async (idEncargo: EncargosInterface["_id"]) =>
    await schEncargos.getEncargoById(idEncargo);
  redondearPrecio = (precio: number) => Math.round(precio * 100) / 100;
  setEncargo = async (encargo) => {
    let descuento: any = Number(
      (await clienteInstance.isClienteDescuento(encargo.idCliente))?.descuento
    );
    if (descuento && descuento > 0) {
      encargo.productos.forEach((producto) => {
        if (producto.id != -1) {
          producto.total = this.redondearPrecio(
            producto.total - (producto.total * descuento) / 100
          );
        }
        // Modificamos el total para añadir el descuento especial del cliente
      });
    }
    encargo.producto;
    const parametros = await parametrosInstance.getParametros();
    let fecha = this.getDate(
      encargo.opcionRecogida,
      encargo.fecha,
      encargo.hora,
      "YYYY-MM-DD HH:mm:ss.S",
      encargo.amPm
    );
    let timestamp = new Date().getTime();
    let codigoBarras = await movimientosInstance.generarCodigoBarrasSalida();
    codigoBarras = await calculoEAN13(codigoBarras);
    const encargo_santAna = {
      id: await this.generateId(
        this.getDate(
          encargo.opcionRecogida,
          encargo.fecha,
          encargo.hora,
          "YYYYMMDDHHmmss",
          encargo.amPm
        ),
        encargo.idTrabajador,
        parametros
      ),
      cliente: encargo.idCliente,
      data: fecha,
      estat: Estat.NO_BUSCADO,
      tipus: 2,
      anticip: encargo.dejaCuenta,
      botiga: parametros.licencia,
      periode:
        encargo.opcionRecogida === OpcionRecogida.REPETICION
          ? Periodo.PERIODO
          : Periodo.NO_PERIODO,
      dias:
        encargo.opcionRecogida === OpcionRecogida.REPETICION
          ? this.formatPeriode(encargo.dias)
          : 0,
      bbdd: parametros.database,
      productos: encargo.productos,
      idTrabajador: encargo.idTrabajador,
      recogido: false,
      timestamp: timestamp,
      opcionEncargo: encargo.opcionRecogida,
      codigoBarras: codigoBarras,
    };
    // Mandamos el encargo al SantaAna
    const { data }: any = await axios
      .post("encargos/setEncargo", encargo_santAna)
      .catch((e) => {
        console.log(e);
      });
    // Si data no existe (null, undefined, etc...) o error = true devolvemos false
    if (!data || data.error) {
      // He puesto el 143 pero no se cual habría que poner, no se cual es el sistema que seguís
      logger.Error(
        143,
        "Error: no se ha podido crear el encargo en el SantaAna"
      );
      return {
        error: true,
        msg: data.msg,
      };
    }
    // Si existe, llamámos a la función de setEncargo
    // que devuelve un boolean.
    // True -> Se han insertado correctamente el encargo.
    // False -> Ha habido algún error al insertar el encargo.
    encargo.timestamp = timestamp;
    encargo.recogido = false;
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

    let encargoGraella = {
      tmStmp: encargo.timestamp,
      bbdd: parametros.database,
      data: encargo.fecha,
      id: await this.generateId(
        moment(encargo.timestamp).format("YYYYMMDDHHmmss"),
        encargo.idTrabajador.toString(),
        parametros
      ),
    };
    //  se envia el encargo a bbdd para actualizar el registro
    const { data }: any = await axios
      .post("encargos/updateEncargoGraella", encargoGraella)
      .catch((e) => {
        console.log(e);
      });
    if (!data.error && encargo.opcionRecogida != 3) {
      return true;
    } else if (!data.error && encargo.opcionRecogida == 3) {
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
      // reseteamos el dejaAcuenta y la _id antes de crear el nuevo encargo
      encargo.dejaACuenta = 0;
      encargo._id = undefined;
      await this.setEncargo(encargo);
      return true;
    }

    return false;
  };
  // anula el ticket
  anularTicket = async (idEncargo) => {
    const encargo = await this.getEncargoById(idEncargo);
    const parametros = await parametrosInstance.getParametros();

    if (encargo) {
      let encargoGraella = {
        tmStmp: encargo.timestamp,
        bbdd: parametros.database,
        data: encargo.fecha,
        id: await this.generateId(
          moment(encargo.timestamp).format("YYYYMMDDHHmmss"),
          encargo.idTrabajador.toString(),
          parametros
        ),
      };
      // borrara el registro del encargo en la bbdd
      const { data }: any = await axios
        .post("encargos/deleteEncargoGraella", encargoGraella)
        .catch((e) => {
          console.log(e);
        });
      if (!data.error) return true;
    }
    return false;
  };

  private async generateId(
    formatDate: string,
    idTrabajador: string,
    parametros: ParametrosInterface
  ): Promise<string> {
    return `Id_Enc_${formatDate}_${parametros.licencia}_${parametros.codigoTienda}_${idTrabajador}`;
  }
  private getDate(
    tipo: OpcionRecogida,
    fecha: string | null,
    hora: string | null,
    format: string,
    amPm: string | null
  ) {
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
  private formatPeriode(dias) {
    return dias.reduce((arr, { nDia }) => {
      arr[nDia] = 1;
      return arr;
    }, new Array(7).fill(0));
  }

  public async insertarEncargos(encargos: any) {
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
    for (let i = 0; i < groupedArray.length; i++) {
      await this.insertarEncargo(groupedArray[i], cesta);
    }
    return groupedArray;
  }
  async insertarEncargo(encargo: any, cesta: CestasInterface) {
    // ejemplo para practicar la funcion
    encargo = [
      {
        Id: "Id_Enc_20230913102155_842_842_3944",
        Dependenta: 3944,
        Client: "[Id:CliBoti_819_20200107103051]",
        Data: "2023-09-14T13:21:00.000Z",
        Anticip: 1,
        Detall:
          "[DataCreat:2023-09-13 10:21:55.993][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:1][OpcionRec:2][codigoBarras:9884232561659][Dia:14-09-2023][Hora:13:21]",
        Article: 8910,
        Quantitat: 3,
        Import: 0.42,
        Descompte: "0",
        Comentari: ";0",
      },
      {
        Id: "Id_Enc_20230913102155_842_842_3944",
        Dependenta: 3944,
        Client: "[Id:CliBoti_819_20200107103051]",
        Data: "2023-09-14T13:21:00.000Z",
        Anticip: 1,
        Detall:
          "[DataCreat:2023-09-13 10:21:55.993][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:1][OpcionRec:2][codigoBarras:9884232561659][PromoArtPrinc:8910][Dia:14-09-2023][Hora:13:21]",
        Article: 4203,
        Quantitat: 2,
        Import: 0.41,
        Descompte: "0",
        Comentari: "promoComboArtSec;0",
      },
      {
        Id: "Id_Enc_20230913102155_842_842_3944",
        Dependenta: 3944,
        Client: "[Id:CliBoti_819_20200107103051]",
        Data: "2023-09-14T13:21:00.000Z",
        Anticip: 1,
        Detall:
          "[DataCreat:2023-09-13 10:21:55.993][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:1][OpcionRec:2][codigoBarras:9884232561659][PromoArtSec:4203][Dia:14-09-2023][Hora:13:21]",
        Article: 8910,
        Quantitat: 4,
        Import: 0.63,
        Descompte: "0",
        Comentari: ";0",
      },
      {
        Id: "Id_Enc_20230913102155_842_842_3944",
        Dependenta: 3944,
        Client: "[Id:CliBoti_819_20200107103051]",
        Data: "2023-09-14T13:21:00.000Z",
        Anticip: 1,
        Detall:
          "[DataCreat:2023-09-13 10:21:55.993][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:1][OpcionRec:2][codigoBarras:9884232561659][suplementos:4020,4180][Dia:14-09-2023][Hora:13:21]",
        Article: 4178,
        Quantitat: 1,
        Import: 1.68,
        Descompte: "0",
        Comentari: "4020,4180;0",
      },
      {
        Id: "Id_Enc_20230913102155_842_842_3944",
        Dependenta: 3944,
        Client: "[Id:CliBoti_819_20200107103051]",
        Data: "2023-09-14T13:21:00.000Z",
        Anticip: 1,
        Detall:
          "[DataCreat:2023-09-13 10:21:55.993][Accio:Fa][Id:CliBoti_819_20200107103051][ACompte:1][OpcionRec:2][codigoBarras:9884232561659][Dia:14-09-2023][Hora:13:21]",
        Article: 1022,
        Quantitat: 1,
        Import: 1.48,
        Descompte: "0",
        Comentari: ";0",
      },
    ];
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
      cesta.idCliente = idCliente;
      await cestasInstance.updateCesta(cesta);
      // creamos cesta para insertarlo en el parametro cesta del encargo mongo
      // let cestaEnc = await getCestaEnc(encargo, detallesArray, cesta);
      // console.log(cestaEnc);
      let cestaEnc = await getCestaEnc(encargo, detallesArray, cesta).then((cestaActualizada) => {
        
        return cestaActualizada;
      });
      console.log("Cesta actualizada:", cestaEnc.lista,cestaEnc.detalleIva);
      let productos = getProductosEnc(encargo, detallesArray);
      let dependenta = await trabajadoresInstance.getTrabajadorById(
        idDependenta
      );
// creamos una data mogodb de encargo
      const mongodbEncargo = {
        _id: {
          $oid: "64d220034b02ea6ee475a5dd",
        },
        idCliente: idCliente,
        nombreCliente: client.nombre,
        opcionRecogida: opcionRecogida,
        amPm: "pm",
        fecha: fecha,
        hora: hora,
        dias: [],
        dejaCuenta: anticipo,
        total: 2,
        productos: productos,
        cesta: {},
        idTrabajador: idDependenta,
        nombreDependienta: dependenta.nombre,
        timestamp: timestamp,
        recogido: false,
        codigoBarras: codigoBarras,
      };

      return mongodbEncargo;
    } catch (error) {
      console.log("error insertEnc en Mongodb", error);
    }
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
function getProductosEnc(encargo: any, detall: any) {
  const productos = [];

  encargo.forEach((producto) => {
    const idArticle = producto.Article;
    const unidades = producto.Quantitat;
    const importe = parseFloat(producto.Import);
    const comentario = producto.Comentari;

    const newProducto = {
      id: idArticle,
      nombre: "hola", // Puedes reemplazar "hola" con el nombre adecuado
      total: importe,
      unidades: unidades,
      comentario: comentario,
      arraySuplementos: null,
      promocion: null,
    };

    productos.push(newProducto);
  });
  return productos;
}
async function getCestaEnc(
  encargo: any,
  detallesArray: any[],
  cesta: CestasInterface
) {
  // :Promise<{ cestaEnc: CestasInterface }>
  const productosPromo = [];
  const procesados = new Set();

  // buscamos que productos entre si son promoCombo
  function buscarCoincidencia(item, index, otroItem, otroIndex) {
    return (
      Number(detallesArray[index]?.PromoArtSec) === otroItem.Article &&
      Number(detallesArray[otroIndex]?.PromoArtPrinc) === item.Article
    );
  }

  // recorrer encargo para encontrar promoscombo
  encargo.forEach((item, index) => {
    if (item.Detall.includes("PromoArtSec") && !procesados.has(index)) {
      const coincidencia = encargo.find((otroItem, otroIndex) => {
        console.log(buscarCoincidencia(item, index, otroItem, otroIndex));
        return (
          index !== otroIndex &&
          !procesados.has(otroIndex) &&
          buscarCoincidencia(item, index, otroItem, otroIndex)
        );
      });

      if (coincidencia) {
        let otroIndex=encargo.indexOf(coincidencia);
        // modificar push en principio se inserta promosCombo creadas por coincidencia
        productosPromo.push({
          idArticuloPrincipal: detallesArray[index]?.PromoArtSec ? detallesArray[otroIndex]?.PromoArtPrinc : detallesArray[index]?.PromoArtPrinc,
          idArticuloSecundario: detallesArray[index]?.PromoArtPrinc ? detallesArray[otroIndex]?.PromoArtSec : detallesArray[index]?.PromoArtSec,
          unidadArtPrinc: item.Quantitat,
          unidadArtSec: encargo[otroIndex].Quantitat,
          unidades: item.Quantitat,
        });

        procesados.add(index);
        procesados.add(encargo.indexOf(coincidencia));
      }
    }
  });
  console.log("productosPromo",productosPromo);
  // insetar articulos en cesta para calcularIva
  try {
    // insertar primero articulos que son promo
    // es posible que falle ya que hay promos temporales, habra que modificarlo
    for (const [index] of procesados.entries()) {
      let number: number = index as number;
      console.log(
        "index",
        index,
        "id",
        encargo[number].Article,
        "unidades",
        encargo[number].Quantitat
      );

      for (let i = 0; i < encargo[number].Quantitat; i++) {
        cesta = await cestasInstance.clickTeclaArticulo(
          encargo[number].Article,
          0,
          cesta._id,
          1,
          null,
          "",
          ""
        );
      }
    }
    // insertar productos restantes
    for(const [index,item] of encargo.entries()){
      if (!procesados.has(index)) {
        const arraySuplementos = detallesArray[index]?.suplementos
          ? await articulosInstance.getSuplementos(
              detallesArray[index]?.suplementos.split(",").map(Number)
            )
          : null;
        console.log(
          "index",
          index,
          "id:",
          item.Article,
          "unidades",
          item.Quantitat,
          "suple:",
          arraySuplementos
        );
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
      }
    }

  } catch (error) {
    console.log("error crear cesta de encargo", error);
  }

  // devolver cesta pero hay que hacer promise. devuelve resultado antes de terminar los bucles
  console.log("cesta", cesta.lista);
  return cesta;
}
