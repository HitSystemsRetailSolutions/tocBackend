import { Controller, Post, Body, Get } from "@nestjs/common";
import axios from "axios";
import { parametrosInstance } from "../parametros/parametros.clase";
import { clienteInstance } from "./clientes.clase";
import { ClientesInterface } from "./clientes.interface";
import { logger } from "../logger";
import { conexion } from "src/conexion/mongodb";

@Controller("clientes")
export class ClientesController {
  /* Eze 4.0 */
  @Post("buscar")
  async buscarCliente(@Body() { busqueda }) {
    try {
      if (busqueda) return await clienteInstance.buscar(busqueda);
      throw Error("Error, faltan datos en buscarCliente() controller");
    } catch (err) {
      logger.Error(65, err);
      return null;
    }
  }
  /* Uri */
  @Post("getClienteByNumber")
  async getClienteByNumber(@Body() { idTarjeta }) {
    try {
      if (idTarjeta) return await clienteInstance.getClienteByNumber(idTarjeta);
      throw Error("Error, faltan datos en getClienteByNumber");
    } catch (err) {
      logger.Error(66, err);
      return null;
    }
  }

  /* Eze 4.0 */
  @Post("getClienteById")
  async getClienteById(@Body() { idCliente }) {
    try {
      if (idCliente) return await clienteInstance.getClienteById(idCliente);
      throw Error("Error, faltan datos en getClienteById");
    } catch (err) {
      logger.Error(66, err);
      return null;
    }
  }

  /* Uri */
  /* y yasai :D */
  @Post("isClienteDescuento")
  async isClienteDescuento(@Body() { idCliente }) {
    try {
      if (!idCliente) return 0;
      let cli = await clienteInstance.isClienteDescuento(idCliente);
      return Number(cli.descuento);
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  /* Eze 4.0 */
  @Post("descargarClientesFinales")
  async descargarClientesFinales() {
    try {
      const arrayClientes = (await axios.get("clientes/getClientesFinales"))
        .data as ClientesInterface[];
      if (arrayClientes)
        return await clienteInstance.insertarClientes(arrayClientes);
      throw Error(
        "Error, los clientes descargados de San Pedro son null o undefined"
      );
    } catch (err) {
      logger.Error(67, err);
      return false;
    }
  }

  /* Yasai :D */
  @Post("actualizarCliente")
  async actualizarCliente(
    @Body()
    {
      idCliente = "",
      nombre,
      telefono = "",
      email = "",
      direccion = "",
      tarjetaCliente = "",
      nif = "",
      descuento = 0,
    }
  ) {
    try {
      if (!nombre) {
        throw Error("Error, faltan datos en actualizarCliente() controller");
      }
      const cliente = {
        nombre,
        telefono,
        email,
        direccion,
        tarjetaCliente,
        nif,
        descuento,
      };
      const db = (await conexion).db("tocgame");
      const params = db.collection("parametros");
      const clientes = db.collection("clientes");
      let database = "";
      await params
        .findOne({ _id: "PARAMETROS" })
        .then((res) => {
          if (res) {
            database = res.database;
          }
        })
        .catch((err) => {
          logger.Error(68, err);
          return false;
        });

      await clientes.findOneAndUpdate({ id: idCliente }, { $set: cliente });

      await axios.post("clientes/updateCliente", {
        idCliente,
        cliente,
        database,
      });
    } catch (err) {
      logger.Error(68, err);
      return false;
    }
  }

  @Post("crearNuevoCliente")
  async crearNuevoCliente(
    @Body()
    { nombre, telefono, email, direccion, tarjetaCliente, nif, descuento }
  ) {
    try {
      const parametros = await parametrosInstance.getParametros();

      if (nombre && tarjetaCliente) {
        if (tarjetaCliente.toString().length > 5 && nombre.length >= 3) {
          const hola = {
            nombre,
            telefono,
            email,
            direccion,
            tarjetaCliente,
            nif,
            descuento,
            idCliente: `CliBoti_${parametros.codigoTienda}_${Date.now()}`,
            idTarjetaCliente: tarjetaCliente,
          };
          await axios
            .post("clientes/crearNuevoCliente", hola)
            .then((res) => {
              return !!res.data;
            })
            .finally(async () => {
              await this.descargarClientesFinales();
            })
            .catch((err) => {
              return false;
            });
        }
      }
      throw Error("Error, faltan datos en crearNuevoCliente() controller");
    } catch (err) {
      logger.Error(68, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Post("consultarPuntos")
  async consultarPuntos(@Body() { idCliente }) {
    try {
      return (
        await axios.post("clientes/getPuntosCliente", {
          idClienteFinal: idCliente,
        })
      ).data;
    } catch (err) {
      logger.Error(134, err);
      return false;
    }
  }
}
