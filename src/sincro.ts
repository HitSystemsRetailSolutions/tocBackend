import { ticketsInstance } from "./tickets/tickets.clase";
import { emitSocket } from "./sanPedro";
import { parametrosInstance } from "./parametros/parametros.clase";
import { cajaInstance } from "./caja/caja.clase";
import { movimientosInstance } from "./movimientos/movimientos.clase";
import { trabajadoresInstance } from "./trabajadores/trabajadores.clase";
import { devolucionesInstance } from "./devoluciones/devoluciones.clase";
import { tecladoInstance } from "./teclado/teclado.clase";
import { limpiezaTickets } from "./tickets/tickets.mongodb";
import { limpiezaFichajes } from "./trabajadores/trabajadores.mongodb";
import { limpiezaCajas } from "./caja/caja.mongodb";
import { limpiezaMovimientos } from "./movimientos/movimientos.mongodb";
import { tarifasInstance } from "./tarifas/tarifas.class";
import { logger } from "./logger";
import axios from "axios";
import { nuevaInstancePromociones } from "./promociones/promociones.clase";
let enProcesoTickets = false;
let enProcesoMovimientos = false;

async function sincronizarTickets() {
  try {
    if (!enProcesoTickets) {
      enProcesoTickets = true;
      const parametros = await parametrosInstance.getParametros();
      if (parametros != null) {
        const ticket = await ticketsInstance.getTicketMasAntiguo();
        if (ticket) {
          nuevaInstancePromociones.deshacerPromociones(ticket);
          const res: any = await axios
            .post("tickets/enviarTicket", { ticket })
            .catch((e) => {});
          if (res.data) {
            if (await ticketsInstance.setTicketEnviado(ticket._id)) {
              enProcesoTickets = false;
              setTimeout(sincronizarTickets, 100);
            } else {
              enProcesoTickets = false;
            }
          } else {
            enProcesoTickets = false;
          }
        } else {
          enProcesoTickets = false;
        }
      } else {
        logger.Error(4, "No hay parámetros definidos en la BBDD");
      }
    }
  } catch (err) {
    enProcesoTickets = false;
    logger.Error(5, err);
  }
}

async function sincronizarCajas() {
  try {
    const caja = await cajaInstance.getCajaSincroMasAntigua();
    if (caja) {
      const resCaja: any = await axios
        .post("cajas/enviarCaja", { caja })
        .catch((e) => {
          // console.log(e);
        });
      if (resCaja.data) {
        if (await cajaInstance.confirmarCajaEnviada(caja._id)) {
          sincronizarCajas();
        } else {
          throw Error(
            "La caja está guardada en Hit, pero no se ha podido marcar como enviada en el Mongo"
          );
        }
      }
    }
  } catch (err) {
    logger.Error("sincro.ts sincronizarCajas()", err);
  }
}

async function sincronizarMovimientos(continuar: boolean = false) {
  try {
    if (!enProcesoMovimientos || continuar) {
      enProcesoMovimientos = true;
      const parametros = await parametrosInstance.getParametros();
      if (parametros != null) {
        const res = await movimientosInstance.getMovimientoMasAntiguo();
        if (res) {
          const resMovimiento: any = await axios
            .post("movimientos/enviarMovimiento", {
              movimiento: res,
            })
            .catch((e) => {
              //  console.log(e);
            });
          if (resMovimiento.data) {
            if (await movimientosInstance.setMovimientoEnviado(res))
              sincronizarMovimientos(true);
          }
        }
      } else {
        logger.Error(9, "No hay parámetros definidos en la BBDD");
      }
    }
    enProcesoMovimientos = false;
  } catch (err) {
    enProcesoMovimientos = false;
    logger.Error(10, err);
  }
}

export function sincronizarFichajes() {
  parametrosInstance
    .getParametros()
    .then((parametros) => {
      if (parametros != null) {
        trabajadoresInstance
          .getFichajeMasAntiguo()
          .then((res) => {
            if (res != null) {
              emitSocket("sincroFichajes", {
                parametros,
                fichaje: res,
              });
            }
          })
          .catch((err) => {
            logger.Error(11, err);
          });
      } else {
        logger.Error(12, "No hay parámetros definidos en la BBDD");
      }
    })
    .catch((err) => {
      logger.Error(13, err);
    });
}

function sincronizarDevoluciones() {
  parametrosInstance
    .getParametros()
    .then((parametros) => {
      if (parametros !== null) {
        devolucionesInstance
          .getDevolucionMasAntigua()
          .then((res) => {
            if (res !== null) {
              emitSocket("sincroDevoluciones", {
                parametros,
                devolucion: res,
              });
            }
          })
          .catch((err) => {
            logger.Error(14, err);
          });
      } else {
        logger.Error(15, "No hay parámetros definidos en la BBDD");
      }
    })
    .catch((err) => {
      logger.Error(16, err);
    });
}

async function actualizarTarifas() {
  try {
    await tarifasInstance.actualizarTarifas();
  } catch (err) {
    logger.Error(17, err);
  }
}

/* Actualiza precios, teclado y promociones (es decir, todo) */
function actualizarTeclados() {
  tecladoInstance.actualizarTeclado().catch((err) => {
    logger.Error(18, err);
  });
}

// async function actualizarMesas() {
//   try {
//     await mesasInstance.actualizarMesasOnline();
//   } catch (err) {
//     logger.Error(123, err);
//   }
// }

// Borrar datos de más de 15 días y que estén enviados.
function limpiezaProfunda(): void {
  limpiezaTickets();
  limpiezaFichajes();
  limpiezaCajas();
  limpiezaMovimientos();
}

function actualizarTrabajadores() {
  trabajadoresInstance.actualizarTrabajadores().catch((err) => {
    logger.Error(19, err);
  });
}

setInterval(sincronizarTickets, 8000);
setInterval(sincronizarCajas, 40000);
setInterval(sincronizarMovimientos, 50000);
setInterval(sincronizarFichajes, 20000);
setInterval(sincronizarDevoluciones, 10000);
setInterval(actualizarTeclados, 3600000);
setInterval(actualizarTarifas, 3600000);
setInterval(limpiezaProfunda, 60000);
setInterval(actualizarTrabajadores, 3600000);
// setInterval(actualizarMesas, 3600000);

export {
  sincronizarTickets,
  // sincronizarCajas,
  // sincronizarMovimientos,
  // sincronizarFichajes,
  sincronizarDevoluciones,
  actualizarTeclados,
};
