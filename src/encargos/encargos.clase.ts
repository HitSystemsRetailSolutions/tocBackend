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

export class Encargos {
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
        producto.total = this.redondearPrecio(
          producto.total - (producto.total * descuento) / 100
        ); // Modificamos el total para añadir el descuento especial del cliente
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
    encargo.codigoBarras =
      await movimientosInstance.generarCodigoBarrasSalida();
    encargo.codigoBarras = await calculoEAN13(encargo.codigoBarras);
    const encargoCopia = JSON.parse(JSON.stringify(encargo));
    await impresoraInstance.imprimirEncargo(encargoCopia);

    // insertamos las ids insertadas en la tabla utilizada a los productos
    let j = 0;

    for (let i = 0; i < encargo.productos.length; i++) {
      encargo.productos[i].idGraella = data.ids[data.ids.length - (j + 1)].id;
      j++;
      if (encargo.productos[i]?.promocion?.idArticuloSecundario != null) {
        encargo.productos[i].idGraellaPromoArtSecundario =
          data.ids[data.ids.length - (j + 1)].id;
        j++;
      }
    }
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

    // recorremos los productos del encargo para añadir las idsGraellas a un array
    const idGraellas = encargo.productos
      .map((producto) => {
        const ids = [];

        if (producto.idGraella) {
          ids.push(producto.idGraella);
        }

        if (producto?.idGraellaPromoArtSecundario) {
          ids.push(producto.idGraellaPromoArtSecundario);
        }

        return ids;
      })
      .flat();

    let encargoGraella = {
      ids: idGraellas,
      bbdd: parametros.database,
      fecha: encargo.fecha,
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
      // recorremos los productos del encargo para añadir las idsGraellas a un array

      const idGraellas = encargo.productos
        .map((producto) => {
          const ids = [];

          if (producto.idGraella) {
            ids.push(producto.idGraella);
          }

          if (producto?.idGraellaPromoArtSecundario) {
            ids.push(producto.idGraellaPromoArtSecundario);
          }

          return ids;
        })
        .flat();

      let encargoGraella = {
        ids: idGraellas,
        bbdd: parametros.database,
        fecha: encargo.fecha,
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
