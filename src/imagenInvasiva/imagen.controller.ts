import { Controller, Post, Body } from "@nestjs/common";
import { io } from "../sockets.gateway";
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:6969");

client.on("connect", () => {
  client.subscribe("hit.software/imagen");
});

client.on("message", (topic, message) => {
  if (topic == "hit.software/imagen") {
    io.emit("ponerImagen", message.toString());
  }
});

@Controller("/cargarImagen")
export class CargarImagenController {
  @Post()
  async cargarImagen(@Body() { imagen }) {
    io.emit("ponerImagen", imagen);
    return true;
  }
}
