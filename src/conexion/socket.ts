import { Socket } from "socket.io";
import { io } from "socket.io-client";
import { parametrosInstance } from "../parametros/parametros.clase";

const SERVER_URL = "https://sanpedroserver.com";

class TocSockets {
  private socket: Socket;

  /* Eze 4.0 */
  async iniciarSockets() {
    const parametros = await parametrosInstance.getParametros();
    this.socket = io.connect(SERVER_URL, {
      query: `token=${parametros.token}`,
    });
  }

  emit(canal: string, data: any = null) {
    data == null ? this.socket.emit(canal) : this.socket.emit(canal, data);
  }
}

export const socket = new TocSockets();
