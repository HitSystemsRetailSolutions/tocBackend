import { Controller, Post, Body, Get, Query } from "@nestjs/common";
import axios from "axios";
import { parametrosInstance } from "../parametros/parametros.clase";
import { clienteInstance } from "./clientes.clase";
import { ClientesInterface, arrayClientesFacturacion } from "./clientes.interface";
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

      if (nombre) {
        if (nombre.length >= 3) {
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
  async getIdTrabajadorCliente(@Query() query: { idCliente: ClientesInterface["id"] }){

    if (!query || !query.idCliente) {
      return false;
    }

    try {
      const params={idCliente:query.idCliente}
      const res = await axios.get("clientes/getIdTrabajadorCliente",{params})
      if (res.data) {
        return true
      }
      return false;
    } catch (error) {
      logger.Error(136, 'En getIdTrabajadorCliente:',error);
      return false;
    }

  }

  @Get("getEsClient")
  async getEsClient(@Query() query: { idCliente: ClientesInterface["id"] }){

    if (!query || !query.idCliente) {
      return false;
    }
    try {
      const params={idCliente:query.idCliente}
      const res = await axios.get("clientes/getEsClient",{params})
      if (res.data) {
        return true
      }
      return false;
    } catch (error) {
      logger.Error(137, 'En getEsClient:',error);
      return false;
    }
  }

  @Get("getEsClienteFacturacion")
  async getEsClienteFacturacion(){
    try {
      
      return arrayClientesFacturacion;

    } catch (error) {
      logger.Error(138, 'En getEsClientFacturacion:',error);
      return false;
    }
  }
}
