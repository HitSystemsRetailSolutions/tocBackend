import { Controller, Post, Body, Query, Param } from "@nestjs/common";
import { io } from "../sockets.gateway";
import { parametrosController } from "src/parametros/parametros.controller";
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://63.33.116.171:1883");

client.on("connect", async () => {
  const parametros = await parametrosController.getParametros();
  client.subscribe(`hit.software/imagen/${parametros.licencia}/trabajador`);
  client.subscribe(`hit.software/imagen/${parametros.licencia}/cliente`);
});

client.on("message", (topic, message) => {
  if (topic.includes("hit.software/imagen")) {
    const mensaje = Buffer.from(message, "binary").toString("utf-8");
    const objetivo = topic.split("/")[3];
    io.emit(`ponerImagen_${objetivo}`, JSON.parse(mensaje));
  }
});

@Controller("/cargarImagen/:licencia")
export class CargarImagenController {
  @Post()
  async cargarImagen(@Param("licencia") license, @Body() datos) {
    const parametros = await parametrosController.getParametros();
    if (license != parametros.licencia) return false;

    io.emit("ponerImagen_trabajador", datos);
    return true;
  }
}
