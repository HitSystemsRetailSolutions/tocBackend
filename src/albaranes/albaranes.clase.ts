import { ticketsInstance } from "src/tickets/tickets.clase";
import { AlbaranesInterface } from "./albaranes.interface";
import * as schAlbaranes from "./albaranes.mongodb";
import { parametrosInstance } from "src/parametros/parametros.clase";
import axios from "axios";
import { cestasInstance } from "src/cestas/cestas.clase";
import { deudasInstance } from "src/deudas/deudas.clase";
import { DeudasInterface } from "src/deudas/deudas.interface";
import { clienteInstance } from "src/clientes/clientes.clase";
import { movimientosInstance } from "src/movimientos/movimientos.clase";
export class AlbaranesClase {
  // crea el albaran y devuelve la id
  async setAlbaran(
    total,
    cesta,
    idTrabajador,
    estado: AlbaranesInterface["estado"]
  ) {
    // creando json albaran
    const id = await this.getProximoId();
    const timestamp = Date.now();
    const nuevoAlbaran: AlbaranesInterface = {
      _id: id,
      datafono3G: false,
      timestamp: timestamp,
      total: Number(total.toFixed(2)),
      paytef: false,
      idCliente: cesta.idCliente,
      idTrabajador,
      cesta,
      consumoPersonal: false,
      enviado: false,
      estado: estado,
    };

    try {
      // devolver id cuando se haya guradado el albaran en mongodb
      if (await schAlbaranes.setAlbaran(nuevoAlbaran)) {
        // Siempre se genera una entrada de dinero en caja al ser albaran
        await movimientosInstance.nuevoMovimiento(
          total,
          "Albara",
          "ENTRADA_DINERO",
          id,
          idTrabajador
        );
        switch (estado) {
          // si albaran es deuda se genera una deuda y un movimiento de salida de dinero
          case "DEUDA":
            const cliente = await clienteInstance.getClienteById(
              cesta.idCliente
            );

            const deuda = {
              idTicket: id,
              cesta: cesta,
              idTrabajador: idTrabajador,
              idCliente: cesta.idCliente,
              nombreCliente: cliente.nombre,
              total: total,
              timestamp: timestamp,
            };
            await deudasInstance.setDeuda(deuda);
            await movimientosInstance.nuevoMovimiento(
              total,
              "DEUDA ALBARAN",
              "SALIDA",
              id,
              idTrabajador
            );
            break;
          default:
            break;
        }
        return nuevoAlbaran._id;
      }

      throw Error(
        "Error, no se ha podido crear el ticket en crearTicket() controller 2"
      );
    } catch (error) {
      console.log("error setAlbaran:", error);
    }
  }
  async getAlbaranes() {
    return await schAlbaranes.getAlbaranes();
  }
  async getProximoId(): Promise<number | PromiseLike<number>> {
    const parametros = await parametrosInstance.getParametros();
    const codigoTienda = parametros.codigoTienda;

    try {
      const params = {
        codigoTienda: parametros.codigoTienda,
        database: parametros.database,
      };
      const idAlbaranSantaAna = await axios.post("albaranes/getLastId", {
        params,
      });

      if (idAlbaranSantaAna?.data) {
        const contador = Number(idAlbaranSantaAna.data.toString().slice(3)) + 1;
        return Number(codigoTienda + contador.toString().padStart(4, "0"));
      }
    } catch (error) {
      // Si hay algún error, manejarlo, pero no interrumpe la ejecución para intentar otra estrategia
      try {
        const ultimoIdMongo = await this.getUltimoIdAlbaran();
        const contador = ultimoIdMongo
          ? Number(ultimoIdMongo.toString().slice(3)) + 1
          : 1;

        return Number(codigoTienda + contador.toString().padStart(4, "0"));
      } catch (error) {
        console.error("Error al obtener el último ID de albarán:", error);
      }
    }

    // Si no se obtuvo el ID de la primera manera, intentar con la segunda
  }

  async getUltimoIdAlbaran() {
    const ultimoIdMongo = (await schAlbaranes.getUltimoAlbaran())?._id;
    if (ultimoIdMongo) {
      return ultimoIdMongo;
    }
  }
  getAlbaranById = async (idAlbaran: AlbaranesInterface["_id"]) =>
    await schAlbaranes.getAlbaranById(idAlbaran);
  getAlbaranCreadoMasAntiguo = async () =>
    await schAlbaranes.getAlbaranCreadoMasAntiguo();

  setEnviado = (idAlbaran: AlbaranesInterface["_id"]) =>
    schAlbaranes.setAlbaranEnviado(idAlbaran);

  pagarAlbaran = (idAlbaran: AlbaranesInterface["_id"]) =>
    schAlbaranes.pagarAlbaran(idAlbaran);
}

export const AlbaranesInstance = new AlbaranesClase();
