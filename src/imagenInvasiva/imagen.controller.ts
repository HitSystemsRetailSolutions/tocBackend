import { Controller, Post, Body, Query, Param } from "@nestjs/common";
import { io } from "../sockets.gateway";
import { parametrosController } from "src/parametros/parametros.controller";
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", async () => {
  const parametros = await parametrosController.getParametros();
  client.subscribe(`hit.software/imagen/${parametros.licencia}`);
});

client.on("message", (topic, message) => {
  if (topic.includes("hit.software/imagen")) {
    const mensaje = Buffer.from(message, "binary").toString("utf-8");
    io.emit("ponerImagen", JSON.parse(mensaje));
  }
});

@Controller("/cargarImagen/:licencia")
export class CargarImagenController {
  @Post()
  async cargarImagen(@Param("licencia") license, @Body() datos) {
    const parametros = await parametrosController.getParametros();
    if (license != parametros.licencia) return false;

    io.emit("ponerImagen", datos);
    return true;
  }
}
