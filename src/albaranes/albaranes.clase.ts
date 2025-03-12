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
import { CestasInterface } from "src/cestas/cestas.interface";
import { logger } from "src/logger";
export class AlbaranesClase {
  // crea el albaran y devuelve la id
  async setAlbaran(
    total,
    cesta: CestasInterface,
    idTrabajador,
    estado: AlbaranesInterface["estado"]
  ) {
    // creando json albaran
    const id = await this.getProximoId();
    if (!id) {
      throw Error(
        "Error, no se ha podido generar el idAlbaran en setAlbaran, albaranes.clase"
      );
    }
    const timestamp = Date.now();
    const nuevoAlbaran: AlbaranesInterface = {
      _id: id,
      timestamp: timestamp,
      total: Number(total.toFixed(2)),
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
        const cliente = await clienteInstance.getClienteById(cesta.idCliente);
        if (
          cliente &&
          (cliente.noPagaEnTienda === undefined ||
            cliente.noPagaEnTienda === false)
        )
          await movimientosInstance.nuevoMovimiento(
            total,
            "Albara",
            "ENTRADA_DINERO",
            id,
            idTrabajador,
            cliente.nombre
          );

        switch (estado) {
          // si albaran es deuda se genera una deuda y un movimiento de salida de dinero
          case "DEUDA":
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
              idTrabajador,
              cliente.nombre
            );
            break;
          default:
            break;
        }
        await cestasInstance.borrarArticulosCesta(cesta._id,true,true,false);
        await cestasInstance.setClients(0, cesta._id);
        return nuevoAlbaran._id;
      }

      throw Error("Error, no se ha podido crear el albaran en el mongo");
    } catch (error) {
      logger.Error(201, error);
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

      if (idAlbaranSantaAna?.data != null) {
        const contadorSantaAna =
          Number(idAlbaranSantaAna.data.toString().slice(3)) + 1;
        const ultimoIdMongo = await this.getUltimoIdAlbaran();
        const contadorMongo = ultimoIdMongo
          ? Number(ultimoIdMongo.toString().slice(3)) + 1
          : 1;
        const contador =
          contadorSantaAna >= contadorMongo ? contadorSantaAna : contadorMongo;

        return Number(codigoTienda + contador.toString().padStart(4, "0"));
      }
      throw Error("Error al obtener el último ID de albarán");
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
