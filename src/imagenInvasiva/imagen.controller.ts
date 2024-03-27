import { Controller, Post, Body, Query, Param } from "@nestjs/common";
import { io } from "../sockets.gateway";
import { parametrosController } from "src/parametros/parametros.controller";
import { mesasInstance } from "src/mesas/mesas.class";
import { cajaInstance } from "src/caja/caja.clase";
const mqtt = require("mqtt");

const mqttOptions = {
  host: process.env.MQTT_HOST,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
};
const client = mqtt.connect(mqttOptions);

client.on("connect", async () => {
  try {
    console.log("Conectado a MQTT");
    const parametros = await parametrosController.getParametros();
    client.subscribe(`hit.software/imagen/${parametros.licencia}/trabajador`);
    client.subscribe(`hit.software/imagen/${parametros.licencia}/cliente`);
    client.subscribe(`hit.orders/${parametros.licencia}`);
  } catch (error) {
    console.log(
      "error en imagen.controller parametros o direccion no encontrados: ",
      error.message
    );
  }
});
client.on('error', (err) => {
  console.error('Error en el client MQTT:', err);
});

client.on("message", (topic, message) => {
  if (topic.includes("hit.software/imagen")) {
    const mensaje = Buffer.from(message, "binary").toString("utf-8");
    const objetivo = topic.split("/")[3];
    io.emit(`ponerImagen_${objetivo}`, JSON.parse(mensaje));
  }

  if (topic.includes("hit.orders")) {
    const mensaje = Buffer.from(message, "binary").toString("utf-8");
    const msg = JSON.parse(mensaje);
    // console.log(msg);

    if (msg.payed) {
      // TODO: manejar la orden pagada
      // avisamos al frontend del pedido
      io.emit("pedidoPagado", msg);
      if (msg.tip) {
        cajaInstance.aumentarPropina(msg.tip);
      }
    } else {
      // TODO: manejar la orden no pagada
      io.emit("pedidoNoPagado", msg);
      // TODO: manejar la insercion en la mesa o lo que sea que haya que hacer
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
