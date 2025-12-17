import { Controller, Post, Body, Get, Query } from "@nestjs/common";
import axios from "axios";
import { parametrosInstance } from "../parametros/parametros.clase";
import { clienteInstance } from "./clientes.clase";
import {
  ClientesInterface,
  arrayClientesFacturacion,
} from "./clientes.interface";
import { logger } from "../logger";
import { conexion } from "src/conexion/mongodb";
import { encargosInstance } from "src/encargos/encargos.clase";
import { deudasInstance } from "src/deudas/deudas.clase";
let firstTimeCalled = true;

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
      if (idTarjeta) {
        var TTarjeta1 = performance.now();
        const result = await clienteInstance.getClienteByNumber(idTarjeta);
        var TTarjeta2 = performance.now();
        var TiempoTarjeta = TTarjeta2 - TTarjeta1;

        if (firstTimeCalled) {
          firstTimeCalled = false;
          setTimeout(() => {
            firstTimeCalled = true;
          }, 50);
          logger.Info("TiempoTarjetaID", TiempoTarjeta.toFixed(4) + " ms");
        }
        return result;
      }
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
      let arrayClientes: any = await axios
        .get("clientes/getClientesFinales")
        .catch((e) => {
          console.log(e);
        });
      arrayClientes = arrayClientes?.data as ClientesInterface[];
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
  @Post("getClienteByServicio")
  async getCLienteByServicio(@Body() { servicio }) {
    try {
      const parametros = await parametrosInstance.getParametros();
      const empresa = parametros.nombreEmpresa;
      const res = await axios.post("clientes/getClienteByServicio", {
        empresa,
        servicio,
      });
      if (!res.data) {
        throw new Error(
          "error, esta empresa no tiene el servicio especificado"
        );
      }
      return res.data;
    } catch (error) {
      logger.Error(67, error);
      return false;
    }
  }

  @Post("getServiciosTienda")
  async getServiciosTienda() {
    try {
      const parametros = await parametrosInstance.getParametros();
      const empresa = parametros.nombreEmpresa;
      const res: any = await axios
        .post("clientes/getServiciosTienda", {
          empresa,
        })
        .catch((e) => {
          console.log(e);
        });
      if (!res.data) {
        throw new Error("");
      }
      return res.data;
    } catch (error) {
      logger.Error(67, error);
      return false;
    }
  }

  /* Yasai :D */
  @Post("actualizarCliente")
  async actualizarCliente(
    @Body()
    {
      idCliente,
      nombre,
      telefono,
      email,
      direccion,
      tarjetaCliente,
      nif,
      descuento,
    }
  ) {
    try {
      if (!idCliente) {
        throw Error("Error, faltan datos en actualizarCliente() controller");
      }
      // Solo actualizar los campos definidos
      const cliente: any = {};
      if (nombre !== undefined && nombre !== null) cliente.nombre = nombre;
      if (telefono !== undefined && telefono !== null)
        cliente.telefono = telefono;
      if (email !== undefined && email !== null) cliente.email = email;
      if (direccion !== undefined && direccion !== null)
        cliente.direccion = direccion;
      if (tarjetaCliente !== undefined && tarjetaCliente !== null)
        cliente.tarjetaCliente = tarjetaCliente;
      if (nif !== undefined && nif !== null) cliente.nif = nif;
      if (descuento !== undefined && descuento !== null)
        cliente.descuento = descuento;

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

      // Solo actualiza los campos definidos
      await clientes.findOneAndUpdate({ id: idCliente }, { $set: cliente });

      // Solo envía los campos definidos en la consulta axios
      try {
        await axios.post("clientes/updateCliente", {
          idCliente,
          cliente: cliente,
          database,
        });
      } catch (e) {
        logger.Error(68, "Error al actualizar cliente en la nube: " + e);
      }
      return true;
    } catch (err) {
      console.log("el error:", err);
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

      if (!nombre || nombre.length < 3) {
        throw new Error(
          "Error, faltan datos en crearNuevoCliente() controller"
        );
      }
      const nuevoCliente = {
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

      let response;
      try {
        response = await axios.post("clientes/crearNuevoCliente", nuevoCliente);
      } catch (axiosError) {
        response = null;
      }

      const clienteMDB: ClientesInterface = {
        id: nuevoCliente.idCliente,
        nombre: nuevoCliente.nombre,
        tarjetaCliente: nuevoCliente.tarjetaCliente,
        descuento: nuevoCliente.descuento,
        nif: nuevoCliente.nif.toString(),
        telefono: nuevoCliente.telefono,
        direccion: nuevoCliente.direccion,
        email: nuevoCliente.email,
        albaran: false,
        noPagaEnTienda: false,
        vip: false,
      };

      try {
        await clienteInstance.insertarCliente(clienteMDB);
        if (!response) {
          return {
            success: true, // Cambiado a false para indicar un error en la creación del cliente en la nube
            message:
              "No se ha podido crear el cliente en la nube, se usará uno temporal.",
            details: "passerror",
            idCliente: nuevoCliente.idCliente,
          };
        }
        return {
          success: true,
          message: "Cliente creado exitosamente",
          idCliente: nuevoCliente.idCliente,
        };
      } catch (dbError) {
        throw {
          type: "DatabaseError",
          message: "Error al insertar el cliente en la base de datos",
          details: dbError.message,
        };
      }
    } catch (err) {
      if (err.type === "AxiosError" || err.type === "DatabaseError") {
        logger.Error(err.message, err.details);
        return {
          success: false,
          message: err.message,
          details: err.details,
        };
      } else {
        logger.Error(68, err);
        return {
          success: false,
          message: "Error general en crearNuevoCliente()",
          details: err.message,
        };
      }
    }
  }

  /* Eze 4.0 */
  @Post("consultarPuntos")
  async consultarPuntos(@Body() { idCliente }) {
    try {
      return (
        await axios.post(
          "clientes/getPuntosCliente",
          {
            idClienteFinal: idCliente,
          },
          { timeout: 2000 }
        )
      ).data;
    } catch (err) {
      logger.Error(134, err);
      return false;
    }
  }

  @Post("eliminarCliente")
  async eliminarCliente(@Body() cliente: any) {
    try {
      if (!cliente) {
        return { error: true, message: "Datos cliente no recibidos" };
      }
      const clienteSantaAna = {
        id: cliente.id,
        nombre: cliente.nombre,
        tarjetaCliente: cliente.tarjetaCliente,
        descuento: cliente.descuento,
        nif: cliente.nif,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        email: cliente.email,
      };
      const res = await axios.post("clientes/eliminarCliente", clienteSantaAna);
      if (res.data) {
        const res2 = await clienteInstance.eliminarCliente(cliente.id);
        if (res2) {
          return { error: false, message: "OK" };
        } else {
          return { error: true, message: "cliente no borrado en TOC" };
        }
      } else {
        return { error: true, message: "Cliente no borrado en base de datos" };
      }
    } catch (error) {
      logger.Error(135, error);
      return false;
    }
  }
  @Get("getIdTrabajadorCliente")
  async getIdTrabajadorCliente(
    @Query() query: { idCliente: ClientesInterface["id"] }
  ) {
    if (!query || !query.idCliente) {
      return false;
    }

    try {
      const params = { idCliente: query.idCliente };
      const res = await axios.get("clientes/getIdTrabajadorCliente", {
        params,
        timeout: 2000,
      });
      if (res.data) {
        return true;
      }
      return false;
    } catch (error) {
      logger.Error(136, "En getIdTrabajadorCliente:", error);
      return false;
    }
  }

  @Get("getEsClient")
  async getEsClient(@Query() query: { idCliente: ClientesInterface["id"] }) {
    if (!query || !query.idCliente) {
      return false;
    }
    try {
      const params = { idCliente: query.idCliente };
      const res = await axios.get("clientes/getEsClient", { params });
      if (res.data) {
        return true;
      }
      return false;
    } catch (error) {
      logger.Error(137, "En getEsClient:", error);
      return false;
    }
  }

  @Get("getEsClienteFacturacion")
  async getEsClienteFacturacion() {
    try {
      return arrayClientesFacturacion;
    } catch (error) {
      logger.Error(138, "En getEsClientFacturacion:", error);
      return false;
    }
  }
  @Get("getClientePedidosTienda")
  async getClientePedidosTienda() {
    try {
      return await clienteInstance.getClientePedidosTienda();
    } catch (error) {
      logger.Error(158, "En getEsClientFacturacion:", error);
      return false;
    }
  }
  @Post("getCantidadEncargosDeudas")
  async getCantidadEncargosDeudas(@Body() { idCliente }) {
    try {
      if (!idCliente)
        throw new Error(
          "Error, faltan datos en getCantidadEncDeuda() controller"
        );
      const enc = await encargosInstance.getEncargosByIdCliente(idCliente);
      const deuda = await deudasInstance.getDeudasByIdCliente(idCliente);
      return {
        cantidadEncargos: enc.length,
        cantidadDeudas: deuda.length,
      };
    } catch (error) {
      logger.Error(159, "En getCantidadEncDeuda:", error);
      return false;
    }
  }
}
