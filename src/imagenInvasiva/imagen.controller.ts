import { Controller, Post, Body, Query, Param } from "@nestjs/common";
import { io } from "../sockets.gateway";
import { parametrosController } from "src/parametros/parametros.controller";
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://63.33.116.171:1883");

client.on("connect", async () => {
  try {
    const parametros = await parametrosController.getParametros();
    client.subscribe(`hit.software/imagen/${parametros.licencia}/trabajador`);
    client.subscribe(`hit.software/imagen/${parametros.licencia}/cliente`);
    // TODO: cambiar tienda1 por el nombre de la tienda
    client.subscribe(`hit.orders/tienda1`);
  } catch (error) {
    console.log(
      "error en imagen.controller parametros o direccion no encontrados: ",
      error.message
    );
  }
});

client.on("message", (topic, message) => {
  if (topic.includes("hit.software/imagen")) {
    const mensaje = Buffer.from(message, "binary").toString("utf-8");
    const objetivo = topic.split("/")[3];
    io.emit(`ponerImagen_${objetivo}`, JSON.parse(mensaje));
  }

  if(topic.includes("hit.orders")){
    const mensaje = Buffer.from(message, "binary").toString("utf-8");
    const msg = JSON.parse(mensaje);

    if(msg.payed){
      // TODO: manejar la orden pagada
      // avisamos al frontend del pedido
      io.emit("pedidoPagado", msg);
    } else {
      // TODO: manejar la orden no pagada
      // posiblemente en el backend no tengamos que hacer nada, hasta que el frontend no conteste,
      // asi que solo lo enviamos de momento
      io.emit("pedidoNoPagado", msg);
    }
  }
});

@Controller("/cargarImagen/:licencia")
export class CargarImagenController {
  @Post()
  async cargarImagen(@Param("licencia") license, @Body() datos) {
    const parametros = await parametrosController.getParametros();
    if (!parametros) {
      if (license == "instalador") {
        io.emit("ponerImagen_trabajador", datos);
        return true;
      }
      return false;
    }
    if (license != parametros.licencia) return false;

    io.emit("ponerImagen_trabajador", datos);
    return true;
  }
}
