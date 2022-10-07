import { createServer } from "http";
import { Server } from "socket.io";
import { cajaInstance } from "./caja/caja.clase";
import { cestasInstance } from "./cestas/cestas.clase";
import { logger } from "./logger";
import { parametrosInstance } from "./parametros/parametros.clase";
import { ticketsInstance } from "./tickets/tickets.clase";
import { trabajadoresInstance } from "./trabajadores/trabajadores.clase";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:8080"
  }
});

io.on("connection", (socket) => {
  console.log("CONECTADO");
  /* Eze 4.0 */
  socket.on("cargarTrabajadores", async (data) => {
    try {
      socket.emit("cargarTrabajadores", await trabajadoresInstance.getTrabajadoresFichados());
    } catch (err) {
      logger.Error(err);
      console.log(err);
    }
  });

  /* Eze 4.0 */
  socket.on("cargarCestas", async (data) => {
    try {
      socket.emit("cargarCestas", await cestasInstance.getAllCestas());
    } catch (err) {
      logger.Error(err);
      console.log(err);
    }
  });

  /* Eze 4.0 */
  socket.on("cargarParametros", async (data) => {
    try {
      socket.emit("cargarParametros", await parametrosInstance.getParametros());
    } catch (err) {
      logger.Error(err);
      console.log(err);
    }
  });

  /* Eze 4.0 */
  socket.on("cargarVentas", async (data) => {
    try {
      if (await cajaInstance.cajaAbierta()) {
        const caja = await cajaInstance.getInfoCajaAbierta();
        socket.emit("cargarVentas", await ticketsInstance.getTicketsIntervalo(caja.inicioTime, Date.now()));
      }      
    } catch (err) {
      logger.Error(err);
      console.log(err);
    }
  });
});

httpServer.listen(5051);

export { io };