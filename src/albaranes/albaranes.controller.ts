import { Controller, Post, Body, Get } from "@nestjs/common";
import { AlbaranesInterface } from "./albaranes.interface";
import { AlbaranesInstance } from "./albaranes.clase";
import { logger } from "src/logger";
import { cestasInstance } from "src/cestas/cestas.clase";
import { clienteInstance } from "src/clientes/clientes.clase";
@Controller("albaranes")
export class AlbaranesController {
  @Post("crearAlbaran")
  async crearAlbaran(
    @Body()
    {
      total,
      idCesta,
      idTrabajador,
    }: {
      total: number;
      idCesta: AlbaranesInterface["cesta"]["_id"];
      idTrabajador: AlbaranesInterface["idTrabajador"];
    }
  ) {
    try {
      if (!total || !idCesta || !idTrabajador) {
        throw Error("Error, faltan datos en crearAlbaran() controller");
      }
      const cesta = await cestasInstance.getCestaById(idCesta);
      let descuento: any = Number(
        (await clienteInstance.isClienteDescuento(cesta.idCliente))?.descuento
      );
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
      return await AlbaranesInstance.setAlbaran(total, cesta, idTrabajador)
    } catch (error) {
      logger.Error(201, error);
      return null;
    }
  }
  redondearPrecio = (precio: number) => Math.round(precio * 100) / 100;
}
