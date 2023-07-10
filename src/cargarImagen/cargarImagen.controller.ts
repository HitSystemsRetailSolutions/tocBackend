import { Controller, Post, Body } from "@nestjs/common";
import { io } from "../sockets.gateway";

@Controller("/cargarImagen")
export class CargarImagenController {
  @Post()
  async cargarImagen(@Body() { imagen }) {
    io.emit("ponerImagen", imagen);
    return true;
  }
}
