// import { ticketsInstance } from "./tickets/tickets.clase";
import {
  // sincronizarTickets,
  // sincronizarCajas,
  // sincronizarMovimientos,
  sincronizarFichajes,
  sincronizarDevoluciones,
  objTempCaja,
  objTempTicket,
  socketSincronizarTickets,
  CBSocketSinconizarCajas,
  CBSocketSincronizarFichajes,
  CBSocketSincronizarDevoluciones,
  CBSocketSincronizarTickets,
} from "./sincro";
// import { cajaInstance } from "./caja/caja.clase";
// import { movimientosInstance } from "./movimientos/movimientos.clase";
import { trabajadoresInstance } from "./trabajadores/trabajadores.clase";
import { devolucionesInstance } from "./devoluciones/devoluciones.clase";
import { logger } from "./logger";
import e from "express";
import { stat } from "fs";
import { cajaInstance } from "./caja/caja.clase";
import { ObjectId } from "mongodb";
import { ticketsInstance } from "./tickets/tickets.clase";

let URL_SANPEDRO = "";
if (process.env.npm_lifecycle_event === "start:dev")
  URL_SANPEDRO = "http://localhost:3001";
else URL_SANPEDRO = "https://santaana2-elb.nubehit.com:3001";
const io = require("socket.io-client");
const socket = io(URL_SANPEDRO);

// const socket = io('http://localhost:3001'); // DEV SANPEDRO EN LOCAL

function emitSocket(canal: string, datos: any = null) {
  if (socket.connected) {
    socket.emit(canal, datos);
  }
}

// socket.on("resSincroTickets", async (data) => {
//   if (data.error == false) {
//     if (data.ticket) {
//       if (await ticketsInstance.actualizarEstadoTicket(data.ticket)) {
//         sincronizarTickets(true);
//       } else {
//         logger.Error(19, "Error al actualizar el ticket");
//       }
//     }
//   } else {
//     if (typeof data.ticket.comentario == "string") {
//       if (data.mensaje == "SanPedro: Error, parámetros incorrectos") {
//         data.ticket.comentario = "SanPedro: Error, parámetros incorrectos";
//       }
//     }
//   }
// });

// socket.on("resCajas", (data) => {
//   if (data.error == false) {
//     if (data.repetir == false) {
//       cajaInstance
//         .confirmarCajaEnviada(data.infoCaja)
//         .then((res) => {
//           if (res) {
//             sincronizarCajas();
//           } else {
//             logger.Error(20, "Error al actualizar el estado de la caja");
//           }
//         })
//         .catch((err) => {
//           logger.Error(21, err);
//         });
//     } else {
//       cajaInstance
//         .confirmarCajaEnviada(data.infoCaja)
//         .then((res) => {
//           if (res) {
//             sincronizarCajas();
//           } else {
//             logger.Error(22, "Error al actualizar el estado de la caja 2");
//           }
//         })
//         .catch((err) => {
//           logger.Error(23, err);
//         });
//       // cambiar estado infoCaja en mongo (enviado + comentario)
//     }
//   } else {
//     logger.Error(24, data.mensaje);
//   }
// });

// socket.on("resMovimientos", (data) => {
//   if (data.error == false) {
//     movimientosInstance
//       .actualizarEstadoMovimiento(data.movimiento)
//       .then((res) => {
//         if (res) {
//           sincronizarMovimientos(true);
//         } else {
//           logger.Error(25, "Error al actualizar el estado del movimiento");
//         }
//       })
//       .catch((err) => {
//         logger.Error(26, err);
//       });
//   } else {
//     logger.Error(27, data.mensaje);
//   }
// });

socket.on("resFichajes", (data) => {
  if (data.error == false) {
    CBSocketSincronizarFichajes.success();
    trabajadoresInstance
      .actualizarEstadoFichaje(data.fichaje)
      .then((res) => {
        if (res) {
          sincronizarFichajes();
        } else {
          logger.Error(28, "Error al actualizar el estado del fichaje");
        }
      })
      .catch((err) => {
        logger.Error(29, err);
      });
  } else {
    logger.Error(30, data.mensaje);
    if (data?.deadlock) {
      CBSocketSincronizarFichajes.forceOpen();
      return;
    }
    CBSocketSincronizarFichajes.failure();
  }
});

socket.on("resSincroDevoluciones", (data) => {
  if (!data.error) {
    devolucionesInstance
      .actualizarEstadoDevolucion(data.devolucion)
      .then((res) => {
        if (res) {
          sincronizarDevoluciones();
        } else {
          logger.Error(31, "Error al actualizar el estadio de la devolución.");
        }
      })
      .catch((err) => {
        logger.Error(32, err);
      });
    CBSocketSincronizarDevoluciones.success();
  } else {
    logger.Error(33, data.mensaje);
    if (data?.deadlock) {
      CBSocketSincronizarDevoluciones.forceOpen();
      return;
    }
    CBSocketSincronizarDevoluciones.failure();
  }
});

socket.on("resSincroCajas", (data) => {
  if (data.error && data.deadlock) {
    logger.Error(34, "Error del santaAna: " + data.mensaje);
    CBSocketSinconizarCajas.forceOpen();
    return;
  } else if (data.error) {
    const jsonObjTempCaja = JSON.stringify(objTempCaja);
    logger.Error(
      34,
      "error del santaAna: " + data.mensaje,
      "caja backend esperado: " + jsonObjTempCaja
    );
    objTempCaja.idCaja = null;
    objTempCaja.state = null;
    objTempCaja.dateModificated = null;
    CBSocketSinconizarCajas.failure();
  }
  if (data.mensaje == "EN_COLA") {
    logger.Info("Caja en cola, id:" + data.caja);
    objTempCaja.state = "EN_COLA";
    objTempCaja.dateModificated = new Date();
  }
  if (data.mensaje == "ENVIADO") {
    logger.Info("Caja enviada a SanPedro, id:" + data.caja);
    const idCaja = new ObjectId(data.caja);
    cajaInstance
      .confirmarCajaEnviada(idCaja)
      .then((res) => {
        if (!res) {
          logger.Error(34.1, "Error al actualizar el estado de la caja 2");
        }
      })
      .catch((err) => {
        logger.Error(34.2, err);
      });

    objTempCaja.state = null;
    objTempCaja.dateModificated = null;
    objTempCaja.idCaja = null;
    CBSocketSinconizarCajas.success();
  }
});

socket.on("resSincroTickets", (data) => {
  const resetTempTicket = () => {
    objTempTicket.idTicket = null;
    objTempTicket.state = null;
    objTempTicket.dateModificated = null;
  };

  if (data.error && data.deadlock) {

    logger.Error(35, "Error del santaAna: " + data.mensaje);
    resetTempTicket();
    CBSocketSincronizarTickets.forceOpen();
    return;
  } else if (data.error) {
    const jsonObjTempTicket = JSON.stringify(objTempTicket);

    logger.Error(
      35,
      "error del santaAna: " + data.mensaje,
      "ticket backend esperado: " + jsonObjTempTicket
    );

    resetTempTicket();
    CBSocketSincronizarTickets.failure();
    return;
  }

  switch (data.mensaje) {
    case "EN_COLA":
      logger.Info("Ticket en cola, id: " + data.ticket);
      objTempTicket.state = "EN_COLA";
      objTempTicket.dateModificated = new Date();
      break;

    case "ENVIADO":
      logger.Info("Ticket enviado a SanPedro, id: " + data.ticket);
      resetTempTicket();
      const idTicket = data.ticket;

      ticketsInstance
        .setTicketEnviado(idTicket)
        .then((res) => {
          if (!res) {
            logger.Error(35.1, "Error al actualizar el estado del ticket 2");
          }
          socketSincronizarTickets();
        })
        .catch((err) => {
          logger.Error(35.2, err);
        });
      break;

    default:
      logger.Warn("Mensaje desconocido recibido: " + data.mensaje);
      break;
  }
  CBSocketSincronizarTickets.success();
});
export { socket, emitSocket };
