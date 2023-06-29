import axios from "axios";
import * as moment from "moment";
import { logger } from "src/logger";
import { parametrosInstance } from "src/parametros/parametros.clase";
import { ParametrosInterface } from "src/parametros/parametros.interface";
import {
  EncargosInterface,
  Estat,
  OpcionRecogida,
  Periodo,
} from "./encargos.interface";
import * as schEncargos from "./encargos.mongodb";
import { impresoraInstance } from "src/impresora/impresora.class";

export class Encargos {
  async getEncargos() {
    return await schEncargos.getEncargos();
  }
  setEntregado = async (id) => {
    const encargo = await this.getEncargoById(id);
    if (encargo.opcionRecogida == 3) {
      for (let i = 0; i < encargo.dias.length; i++) {
        if (encargo.dias[i].checked && encargo.dias.length - 1 == i) {
          encargo.dias[i].checked = false;
          return schEncargos
            .setChecked(id, encargo.dias)
            .then((ok: boolean) => {
              if (!ok)
                return schEncargos.setEntregado(id).then((ok: boolean) => {
                  if (!ok) return false;
                  return true;
                });
            });
        } else if (encargo.dias[i].checked) {
          encargo.dias[i].checked = false;
          return schEncargos
            .setChecked(id, encargo.dias)
            .then((ok: boolean) => {
              if (!ok) return false;
              return true;
            });
        }
      }
    }
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

  setEncargo = async (encargo) => {
    const parametros = await parametrosInstance.getParametros();
    let fecha = this.getDate(
      encargo.opcionRecogida,
      encargo.fecha,
      encargo.hora,
      "YYYY-MM-DD HH:mm:ss.S",
      encargo.amPm
    );
    let timestamp = new Date(fecha).getTime();
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
    };
    // Mandamos el encargo al SantaAna
    const { data }: any = await axios.post(
      "encargos/setEncargo",
      encargo_santAna
    );
    console.log(data);
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
    for (let i = 0; i < encargo.productos.length ; i++) {
      encargo.productos[i].idGraella = 'data.ids[i]';
    }
    return schEncargos
      .setEncargo(encargo)
      .then((ok: boolean) => {
        if (!ok) return { error: true, msg: "Error al crear el encargo" };
        return { error: false, msg: "Encargo creado" };
      })
      .catch((err: string) => ({ error: true, msg: err }));
  };
  updateEncargoGraella = async (idEncargo) => {
    const encargo = await this.getEncargoById(idEncargo);
    const parametros = await parametrosInstance.getParametros();

    if (!encargo) return false;
    const idGraellas = encargo.productos.map((producto) => producto.idGraella);
    let encargoGraella = {
      ids: idGraellas,
      bbdd: parametros.database,
    };

    const { data }: any = await axios.post(
      "encargos/updateEncargoGraella",
      encargoGraella
    );

    return true;
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
      return "1899-12-30 00:00:000";

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
