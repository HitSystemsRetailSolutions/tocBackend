import { Controller, Post, Body, Get, Param, Query } from "@nestjs/common";
import { AlbaranesInterface } from "./albaranes.interface";
import { AlbaranesInstance } from "./albaranes.clase";
import { logger } from "src/logger";
import { cestasInstance } from "src/cestas/cestas.clase";
import { clienteInstance } from "src/clientes/clientes.clase";
import {descuentoEspecial} from "src/clientes/clientes.interface";
@Controller("albaranes")
export class AlbaranesController {
  @Post("crearAlbaran")
  async crearAlbaran(
    @Body()
    {
      total,
      idCesta,
      idTrabajador,
      estado,
    }: {
      total: number;
      idCesta: AlbaranesInterface["cesta"]["_id"];
      idTrabajador: AlbaranesInterface["idTrabajador"];
      estado: AlbaranesInterface["estado"];
    }
  ) {
    try {
      if (!total || !idCesta || !idTrabajador || !estado) {
        throw Error("Error, faltan datos en crearAlbaran() controller");
      }
      const cesta = await cestasInstance.getCestaById(idCesta);
      let descuento: any = Number(
        (await clienteInstance.isClienteDescuento(cesta.idCliente))?.descuento
      );
      const clienteDescEsp = descuentoEspecial.find(
        (cliente) => cliente.idCliente === cesta.idCliente
      );
      if ((!clienteDescEsp || clienteDescEsp.precio!=total) &&  descuento && descuento > 0) {
        cesta.lista.forEach((producto) => {
          if (producto.arraySuplementos != null) {
            producto.subtotal = this.redondearPrecio(
              producto.subtotal - (producto.subtotal * descuento) / 100
            );
          } else if (producto.promocion == null)
            producto.subtotal = this.redondearPrecio(
              producto.subtotal - (producto.subtotal * descuento) / 100
            ); // Modificamos el total para añadir el descuento especial del cliente
        });
      };
      return await AlbaranesInstance.setAlbaran(
        total,
        cesta,
        idTrabajador,
        estado
      );
    } catch (error) {
      logger.Error(201, error);
      return null;
    }
  }
  @Post("pagarAlbaran")
  async pagarAlbaran(
    @Body() { idAlbaran }: { idAlbaran: AlbaranesInterface["_id"] }
  ) {
    try {
      if (!idAlbaran) {
        throw Error("Error, faltan datos en pagarAlbaran controller");
      }
      return await AlbaranesInstance.pagarAlbaran(idAlbaran);
    } catch (error) {
      logger.Error(202, error);
      return false;
    }
  }

  @Post("getAlbaranById")
  async getAlbaranById(
    @Body() { idAlbaran }: { idAlbaran: AlbaranesInterface["_id"] }
  ) {
    try {
      if (!idAlbaran) {
        throw Error("Error, faltan datos en getAlbaranById controller");
      }
      return await AlbaranesInstance.getAlbaranById(idAlbaran);
    } catch (error) {
      logger.Error(202, error);
      return false;
    }
  }
  @Post("getAlbaranes")
  async getAlbaranes() {
    try {
      return await AlbaranesInstance.getAlbaranes();
    } catch (err) {
      logger.Error(50, err);
      return null;
    }
  }
  redondearPrecio = (precio: number) => Math.round(precio * 100) / 100;
}
