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
import { deudasInstance } from "./deudas/deudas.clase";
import { encargosInstance } from "./encargos/encargos.clase";
import {
  EncargosInterface,
  Estat,
  OpcionRecogida,
  Periodo,
} from "./encargos/encargos.interface";
import * as moment from "moment";
import { AlbaranesInstance } from "./albaranes/albaranes.clase";
import { clienteInstance } from "./clientes/clientes.clase";
import {
  SuperTicketInterface,
  TicketsInterface,
} from "./tickets/tickets.interface";
import { get } from "http";
import { getDataVersion } from "./version/version.clase";
import { CajaSincro, objTempCajaInterface } from "./caja/caja.interface";
let enProcesoTickets = false;
let enProcesoMovimientos = false;
let enProcesoDeudasCreadas = false;
let enProcesoDeudasFinalizadas = false;
let enProcesoEncargosCreados = false;
let enProcesoEncargosFinalizados = false;
let enProcesoEncargosPedidosCaducados = false;
let enProcesoAlbaranesCreados = false;
let enprocesoTicketsOtros = false;
let idsTicketsOtrosReenviar: TicketsInterface["_id"][] = [];
let idsTicketsReenviar: TicketsInterface["_id"][] = [];

// reenviar ticket, pone el ticket en una lista para que sincronizarTickets ponga el ticket en no enviado, y lo envie.
// si se pone ahora sincronizarTickets podria volver a ponerlo en enviado cuando envia una versión antigua del tickets.
// Los tickets pueden modificarse después de insertarse en la base de datos por la forma en que se hace el pago con tarjeta paytef,
// esto tendria que arreglarse.
async function reenviarTicket(idTicket: TicketsInterface["_id"]) {
  // se pone el ticket en no enviado por si se apaga el programa antes de sincronizarTickets
  await ticketsInstance.setTicketEnviado(idTicket, false);
  idsTicketsReenviar.push(idTicket);
}
// se pone el ticket otrosModificado en no enviado por si se apaga el programa antes de sincronizarTicketsOtrosModificado
async function reenviarTicketPago(idTicket: TicketsInterface["_id"]) {
  if (!idsTicketsOtrosReenviar.includes(idTicket)) {
    // Si no está presente en el array, se pone el ticket en no enviado y se agrega al array
    await ticketsInstance.setTicketOtrosModificado(idTicket, false);
    idsTicketsOtrosReenviar.push(idTicket);
  }
}
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sincronizarTickets() {
  if (enProcesoTickets) return; // salir si ya hay un proceso sincronizando
  try {
    enProcesoTickets = true; // try-finally volvera a poner enProcesoTickets=false al salir
    const parametros = await parametrosInstance.getParametros();
    if (parametros != null) {
      let enviarMasTickets = true;
      while (enviarMasTickets) {
        while (idsTicketsReenviar.length) {
          let idTicket = idsTicketsReenviar.shift();
          await ticketsInstance.setTicketEnviado(idTicket, false);
        }
        const ticket: TicketsInterface =
          await ticketsInstance.getTicketMasAntiguo();
        if (ticket) {
          await nuevaInstancePromociones.deshacerPromociones(ticket);
          const superTicket = { ...ticket, tipoPago: null, movimientos: null };
          superTicket.movimientos =
            await movimientosInstance.getMovimientosDelTicket(ticket._id);
          superTicket.tipoPago =
            await movimientosInstance.calcularFormaPago(superTicket);
          const res = await axios.post("tickets/enviarTicket", {
            ticket: superTicket,
          });
          //.catch((e) => {console.log("error",e)});
          if (res.data) {
            if (idsTicketsReenviar.indexOf(ticket._id) == -1) {
              // si el ticket no se va ha reenviar marcarlo como enviado
              await ticketsInstance.setTicketEnviado(ticket._id, true);
            }
          } else enviarMasTickets = false; // si error en server salir y esperar a la siguiente sincronización
        } else {
          // no hay ticket mas antiguo
          if (idsTicketsReenviar.length == 0)
            // no hay mas tickets que reenviar
            enviarMasTickets = false;
        }
        if (enviarMasTickets) await sleep(100);
      }
    } else {
      logger.Error(4, "No hay parámetros definidos en la BBDD");
    }
  } catch (err) {
    logger.Error(5, err);
  } finally {
    enProcesoTickets = false;
  }
}

export let objTempTicket: any = {
  idTicket: null,
  state: null,
  dateModificated: null,
};
// sincroTickets with socket
async function socketSincronizarTickets() {
  try {
    const fechaAnterior = objTempTicket.dateModificated;
    if (
      fechaAnterior &&
      fechaAnterior &&
      diferenciasEnSegundos(fechaAnterior, new Date()) < 180
    )
      return;
    while (idsTicketsReenviar.length) {
      let idTicket = idsTicketsReenviar.shift();
      await ticketsInstance.setTicketEnviado(idTicket, false);
    }

    const ticket: TicketsInterface =
      await ticketsInstance.getTicketMasAntiguo();
    const params = await parametrosInstance.getParametros();
    if (ticket && params) {
      await nuevaInstancePromociones.deshacerPromociones(ticket);
      const superTicket = { ...ticket, tipoPago: null, movimientos: null };
      superTicket.movimientos =
        await movimientosInstance.getMovimientosDelTicket(ticket._id);
      superTicket.tipoPago =
        await movimientosInstance.calcularFormaPago(superTicket);
      objTempTicket = {
        idTicket: ticket._id,
        state: "ENVIANDO",
        dateModificated: new Date(),
      };
      const parametros = {
        licencia: params.licencia,
        database: params.database,
        codigoInternoTienda: params.codigoTienda,
        nombreTienda: params.nombreTienda,
      };
      emitSocket("sincroTickets", {
        ticket: superTicket,
        parametros,
      });
    }
  } catch (err) {
    logger.Error("sincro.ts socketSincronizarTickets()", err);
  }
}
/**
 * recoge tickets con otrosModificado=false y los envia al servidor
 * @returns nothing
 */
async function sincronizarTicketsOtrosModificado() {
  if (enprocesoTicketsOtros) return; // salir si ya hay un proceso sincronizando
  try {
    enprocesoTicketsOtros = true; // try-finally volvera a poner enprocesoTicketsOtros=false al salir
    const parametros = await parametrosInstance.getParametros();
    if (parametros != null) {
      let enviarMasTicketsOtros = true;
      while (enviarMasTicketsOtros) {
        while (idsTicketsOtrosReenviar.length) {
          let idTicket = idsTicketsOtrosReenviar.shift();
          await ticketsInstance.setTicketOtrosModificado(idTicket, false);
        }
        const ticket: TicketsInterface =
          await ticketsInstance.getTicketOtrosModificadoMasAntiguo();
        if (ticket) {
          await nuevaInstancePromociones.deshacerPromociones(ticket);
          const superTicket = { ...ticket, tipoPago: null, movimientos: null };
          superTicket.movimientos =
            await movimientosInstance.getMovimientosDelTicket(ticket._id);
          superTicket.tipoPago =
            await movimientosInstance.calcularFormaPago(superTicket);
          const res = await axios.post("tickets/updOtros", {
            ticket: superTicket,
          });
          //.catch((e) => {console.log("error",e)});
          if (res.data) {
            if (idsTicketsReenviar.indexOf(ticket._id) == -1) {
              // si el ticket no se va ha reenviar marcarlo como enviado
              await ticketsInstance.setTicketOtrosModificado(ticket._id, true);
            }
          } else enviarMasTicketsOtros = false; // si error en server salir y esperar a la siguiente sincronización
        } else {
          // no hay ticket mas antiguo
          if (idsTicketsReenviar.length == 0)
            // no hay mas tickets que reenviar
            enviarMasTicketsOtros = false;
        }
        if (enviarMasTicketsOtros) await sleep(100);
      }
    } else {
      logger.Error(4, "No hay parámetros definidos en la BBDD");
    }
  } catch (err) {
    logger.Error(5, err);
  } finally {
    enprocesoTicketsOtros = false;
  }
}
async function sincronizarCajas() {
  try {
    const caja = await cajaInstance.getCajaSincroMasAntigua();
    if (caja) {
      const resCaja: any = await axios
        .post("cajas/enviarCaja", { caja })
        .then(async (e) => {
          if (e.data) {
            if (await cajaInstance.confirmarCajaEnviada(caja._id)) {
              sincronizarCajas();
            } else {
              throw Error(
                "La caja está guardada en Hit, pero no se ha podido marcar como enviada en el Mongo"
              );
            }
          }
        })
        .catch((e) => {
          // console.log(e);
        });
    }
  } catch (err) {
    logger.Error("sincro.ts sincronizarCajas()", err);
  }
}
// state: 'enviando', 'en_cola', null
export let objTempCaja: objTempCajaInterface = {
  idCaja: null,
  state: null,
  dateModificated: null,
};

async function socketSinconizarCajas() {
  try {
    const fechaAnterior = objTempCaja.dateModificated;
    if (
      fechaAnterior &&
      fechaAnterior &&
      diferenciasEnSegundos(fechaAnterior, new Date()) < 120
    )
      return;

    const caja = await cajaInstance.getCajaSincroMasAntigua();
    const params = await parametrosInstance.getParametros();
    if (caja && params) {
      objTempCaja = {
        idCaja: caja._id,
        state: "ENVIANDO",
        dateModificated: new Date(),
      };
      const parametros = {
        licencia: params.licencia,
        database: params.database,
        codigoInternoTienda: params.codigoTienda,
      };
      emitSocket("sincroCajas", {
        caja,
        parametros,
      });
    }
  } catch (err) {
    logger.Error("sincro.ts sincronizarCajas()", err);
  }
}

function diferenciasEnSegundos(fechaAnterior: Date, fechaActual: Date) {
  const diferenciaEnMilisegundos =
    fechaActual.getTime() - fechaAnterior.getTime();
  return Math.floor(diferenciaEnMilisegundos / 1000);
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
              // inserta dataVersion en los registros del mongoDB anteriores a este cambio
              if (!res?.dataVersion) res.dataVersion = getDataVersion();

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

async function sincronizarDeudasCreadas() {
  try {
    if (!enProcesoDeudasCreadas) {
      enProcesoDeudasCreadas = true;
      const parametros = await parametrosInstance.getParametros();
      if (parametros != null) {
        const deuda = await deudasInstance.getDeudaCreadaMasAntiguo();
        if (deuda) {
          const parametros = await parametrosInstance.getParametros();
          const dataDeuda = await deudasInstance.getDate(deuda.timestamp);
          const deuda_santAna = {
            id: deuda.idSql,
            timestamp: deuda.timestamp,
            dependenta: deuda.idTrabajador,
            cliente: deuda.idCliente,
            data: dataDeuda,
            estat: 0,
            tipus: 1,
            import: deuda.total,
            dejaCuenta: deuda.dejaCuenta ? deuda.dejaCuenta : 0,
            botiga: parametros.licencia,
            idTicket: deuda.idTicket,
            bbdd: parametros.database,
          };
          const res: any = await axios
            .post("deudas/setDeuda", deuda_santAna)
            .catch((e) => {
              console.log(e);
            });
          if (res.data && !res.data.error) {
            if (await deudasInstance.setEnviado(deuda._id)) {
              enProcesoDeudasCreadas = false;
              setTimeout(sincronizarDeudasCreadas, 100);
            } else {
              enProcesoDeudasCreadas = false;
            }
          } else {
            logger.Error(
              154,
              "Error: no se ha podido crear la deuda en el SantaAna"
            );
            enProcesoDeudasCreadas = false;
          }
        } else {
          enProcesoDeudasCreadas = false;
        }
      } else {
        enProcesoDeudasCreadas = false;
        logger.Error(4, "No hay parámetros definidos en la BBDD");
      }
    }
  } catch (err) {
    enProcesoDeudasCreadas = false;
    logger.Error(5, err);
  }
}

async function sincronizarEncargosCreados() {
  try {
    if (!enProcesoEncargosCreados) {
      enProcesoEncargosCreados = true;
      const parametros = await parametrosInstance.getParametros();
      if (parametros != null) {
        const encargo = await encargosInstance.getEncargoCreadoMasAntiguo();
        if (encargo) {
          const parametros = await parametrosInstance.getParametros();
          let fecha = await encargosInstance.getDate(
            encargo.opcionRecogida,
            encargo.fecha,
            encargo.hora,
            "YYYY-MM-DD HH:mm:ss.S",
            encargo.amPm,
            encargo.timestamp
          );
          const encargo_santAna = {
            id: await encargosInstance.generateId(
              await encargosInstance.getDate(
                encargo.opcionRecogida,
                encargo.fecha,
                encargo.hora,
                "YYYYMMDDHHmmss",
                encargo.amPm,
                encargo.timestamp
              ),
              encargo.idTrabajador.toString(),
              parametros
            ),
            cliente: encargo.idCliente,
            data: fecha,
            estat: Estat.NO_BUSCADO,
            tipus: 2,
            anticip: encargo.dejaCuenta,
            botiga: parametros.licencia,
            periode:
              encargo.opcionRecogida === OpcionRecogida.REPETICION
                ? Periodo.PERIODO
                : Periodo.NO_PERIODO,
            dias:
              encargo.opcionRecogida === OpcionRecogida.REPETICION
                ? await encargosInstance.formatPeriode(encargo.dias)
                : 0,
            bbdd: parametros.database,
            licencia: parametros.licencia,
            productos: encargo.productos,
            idTrabajador: encargo.idTrabajador,
            recogido: false,
            timestamp: encargo.timestamp,
            opcionEncargo: encargo.opcionRecogida,
            codigoBarras: encargo.codigoBarras,
          };
          const res: any = await axios
            .post("encargos/setEncargo", encargo_santAna)
            .catch((e) => {
              console.log(e);
            });
          if (res.data) {
            if (!res.data.error) {
              if (await encargosInstance.setEnviado(encargo._id)) {
                enProcesoEncargosCreados = false;
                setTimeout(sincronizarEncargosCreados, 100);
              }
            } else {
              console.log(res.data.msg);
              logger.Error(
                153,
                "Error: no se ha podido crear el encargo en el SantaAna"
              );
              enProcesoEncargosCreados = false;
            }
          } else {
            logger.Error(153.1, "Error: no ha habido respuesta en SantaAna");
            enProcesoEncargosCreados = false;
          }
        } else {
          enProcesoEncargosCreados = false;
        }
      } else {
        enProcesoEncargosCreados = false;
        logger.Error(4, "No hay parámetros definidos en la BBDD");
      }
    }
  } catch (err) {
    enProcesoEncargosCreados = false;
    logger.Error(5, err);
  }
}

async function sincronizarDeudasFinalizadas() {
  try {
    if (!enProcesoDeudasFinalizadas) {
      enProcesoDeudasFinalizadas = true;
      const parametros = await parametrosInstance.getParametros();
      if (parametros != null) {
        const deuda = await deudasInstance.getDeudaFinalizadaMasAntiguo();
        if (deuda) {
          let url = "deudas/setCertificadoDeuda";
          if (deuda.estado == "ANULADO") {
            url = "deudas/anularDeuda";
          }
          const parametros = await parametrosInstance.getParametros();
          const timestamp = new Date().getTime();
          const dataDeuda = await deudasInstance.getDate(timestamp);
          const certificadoDeuda = {
            id: deuda.idSql,
            timestamp: timestamp,
            dependenta: deuda.idTrabajador,
            cliente: deuda.idCliente,
            data: dataDeuda,
            estat: 0,
            tipus: 1,
            import: deuda.total,
            dejaCuenta: deuda.dejaCuenta ? deuda.dejaCuenta : 0,
            botiga: parametros.licencia,
            idTicket: deuda.idTicket,
            bbdd: parametros.database,
          };
          const res: any = await axios
            .post(url, certificadoDeuda)
            .catch((e) => {
              console.log(e);
            });
          if (res.data && !res.data.error) {
            if (await deudasInstance.setFinalizado(deuda._id)) {
              enProcesoDeudasFinalizadas = false;
              setTimeout(sincronizarDeudasFinalizadas, 100);
            } else {
              enProcesoDeudasFinalizadas = false;
            }
          } else {
            logger.Error(
              155,
              "Error: no se ha podido crear la deuda en el SantaAna"
            );
            enProcesoDeudasFinalizadas = false;
          }
        } else {
          enProcesoDeudasFinalizadas = false;
        }
      } else {
        enProcesoDeudasFinalizadas = false;
        logger.Error(4, "No hay parámetros definidos en la BBDD");
      }
    }
  } catch (err) {
    enProcesoDeudasFinalizadas = false;
    logger.Error(5, err);
  }
}

async function sincronizarEncargosFinalizados() {
  try {
    if (!enProcesoEncargosFinalizados) {
      enProcesoEncargosFinalizados = true;
      const parametros = await parametrosInstance.getParametros();
      if (parametros != null) {
        const encargo = await encargosInstance.getEncargoFinalizadoMasAntiguo();
        if (encargo) {
          let url = "encargos/updateEncargoGraella";
          if (encargo.estado == "ANULADO") {
            url = "encargos/deleteEncargoGraella";
          }
          let encargoGraella = {
            tmStmp: encargo.timestamp,
            bbdd: parametros.database,
            licencia: parametros.licencia,
            data: encargo.fecha,
            productos: encargo.productos,
            id: await encargosInstance.generateId(
              moment(encargo.timestamp).format("YYYYMMDDHHmmss"),
              encargo.idTrabajador.toString(),
              parametros
            ),
          };
          const res: any = await axios.post(url, encargoGraella).catch((e) => {
            console.log(e);
          });
          if (res.data && !res.data.error) {
            if (await encargosInstance.setFinalizado(encargo._id)) {
              enProcesoEncargosFinalizados = false;
              setTimeout(sincronizarEncargosFinalizados, 100);
            } else {
              enProcesoEncargosFinalizados = false;
            }
          } else {
            logger.Error(
              156,
              "Error: no se ha podido crear el encargo en el SantaAna"
            );
            enProcesoEncargosFinalizados = false;
          }
        } else {
          enProcesoEncargosFinalizados = false;
        }
      } else {
        enProcesoEncargosFinalizados = false;
        logger.Error(4, "No hay parámetros definidos en la BBDD");
      }
    }
  } catch (err) {
    enProcesoEncargosFinalizados = false;
    logger.Error(5, err);
  }
}

// buscara pedido caducado y enviara una consulta para que lo marque como recogido
async function sincronizarPedidosCaducados() {
  try {
    if (!enProcesoEncargosPedidosCaducados) {
      enProcesoEncargosPedidosCaducados = true;
      const parametros = await parametrosInstance.getParametros();
      if (parametros != null) {
        const encargo =
          await encargosInstance.getEncargoPedidoCaducadoMasAntiguo();
        if (encargo) {
          let url = "encargos/updateEncargoGraella";
          let encargoGraella = {
            tmStmp: encargo.timestamp,
            bbdd: parametros.database,
            licencia: parametros.licencia,
            productos: encargo.productos,
            data: encargo.fecha,
            id: await encargosInstance.generateId(
              moment(encargo.timestamp).format("YYYYMMDDHHmmss"),
              encargo.idTrabajador.toString(),
              parametros
            ),
          };
          const res: any = await axios.post(url, encargoGraella).catch((e) => {
            console.log(e);
          });
          if (res.data && !res.data.error) {
            if (await encargosInstance.setFinalizado(encargo._id)) {
              enProcesoEncargosPedidosCaducados = false;
              setTimeout(sincronizarPedidosCaducados, 100);
            } else {
              enProcesoEncargosPedidosCaducados = false;
            }
          } else {
            logger.Error(
              156,
              "Error: no se ha podido crear el encargo en el SantaAna"
            );
            enProcesoEncargosPedidosCaducados = false;
          }
        } else {
          enProcesoEncargosPedidosCaducados = false;
        }
      } else {
        enProcesoEncargosPedidosCaducados = false;
        logger.Error(4, "No hay parámetros definidos en la BBDD");
      }
    }
  } catch (err) {
    enProcesoEncargosPedidosCaducados = false;
    logger.Error(5, err);
  }
}

async function sincronizarAlbaranesCreados() {
  try {
    if (!enProcesoAlbaranesCreados) {
      enProcesoAlbaranesCreados = true;
      const parametros = await parametrosInstance.getParametros();
      if (parametros != null) {
        const albaran = await AlbaranesInstance.getAlbaranCreadoMasAntiguo();
        if (albaran) {
          albaran.cesta.lista =
            await nuevaInstancePromociones.deshacerPromociones(albaran);
          const res: any = await axios
            .post("albaranes/setAlbaran", { albaran })
            .catch((e) => {
              console.log(e);
            });
          if (res.data && !res.data.error) {
            if (await AlbaranesInstance.setEnviado(albaran._id)) {
              setTimeout(function () {
                enProcesoAlbaranesCreados = false;
                sincronizarAlbaranesCreados();
              }, 100);
            } else {
              enProcesoAlbaranesCreados = false;
            }
          } else {
            logger.Error(
              153,
              "Error: no se ha podido crear el albaran en el SantaAna"
            );
            enProcesoAlbaranesCreados = false;
          }
        } else {
          enProcesoAlbaranesCreados = false;
        }
      } else {
        enProcesoAlbaranesCreados = false;
        logger.Error(4, "No hay parámetros definidos en la BBDD");
      }
    }
  } catch (err) {
    enProcesoAlbaranesCreados = false;
    logger.Error(5, err);
  }
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

// setInterval(sincronizarTickets, 8000);
// setInterval(sincronizarCajas, 40000);
// setInterval(sincronizarMovimientos, 50000);
// setInterval(sincronizarFichajes, 20000);
// setInterval(sincronizarDevoluciones, 10000);
// setInterval(sincronizarDeudasCreadas, 9000);
// setInterval(sincronizarDeudasFinalizadas, 10000);
// setInterval(sincronizarEncargosCreados, 9000);
// setInterval(sincronizarEncargosFinalizados, 10000);
// setInterval(sincronizarAlbaranesCreados, 11000);
// // setInterval(actualizarTeclados, 3600000);
// // setInterval(actualizarTarifas, 3600000);
setInterval(limpiezaProfunda, 60000);
// setInterval(sincronizarTicketsOtrosModificado, 16000);
// // setInterval(actualizarTrabajadores, 3600000);
// // setInterval(actualizarMesas, 3600000);
// setInterval(sincronizarPedidosCaducados, 60000);

function ejecutarConIntervaloAleatorio(funcion, minTiempo, maxTiempo) {
  function ejecutar() {
    funcion(); // Ejecuta la función
    const tiempoAleatorio = Math.floor(
      Math.random() * (maxTiempo - minTiempo) + minTiempo
    );
    setTimeout(ejecutar, tiempoAleatorio);
  }
  ejecutar(); // Inicia la primera ejecución
}

// Configurar todas las funciones con sus respectivos rangos aleatorios
const minTiempo = 60000;
const maxTiempo = 300000;
const maxTiempo2 = 180000;
ejecutarConIntervaloAleatorio(socketSincronizarTickets, minTiempo, maxTiempo2);
ejecutarConIntervaloAleatorio(socketSinconizarCajas, minTiempo, maxTiempo);
ejecutarConIntervaloAleatorio(sincronizarMovimientos, minTiempo, maxTiempo);
ejecutarConIntervaloAleatorio(sincronizarFichajes, minTiempo, maxTiempo);
ejecutarConIntervaloAleatorio(sincronizarDevoluciones, minTiempo, maxTiempo);
ejecutarConIntervaloAleatorio(sincronizarDeudasCreadas, minTiempo, maxTiempo);
ejecutarConIntervaloAleatorio(
  sincronizarDeudasFinalizadas,
  minTiempo,
  maxTiempo
);
ejecutarConIntervaloAleatorio(sincronizarEncargosCreados, minTiempo, maxTiempo);
ejecutarConIntervaloAleatorio(
  sincronizarEncargosFinalizados,
  minTiempo,
  maxTiempo
);
ejecutarConIntervaloAleatorio(
  sincronizarAlbaranesCreados,
  minTiempo,
  maxTiempo
);
ejecutarConIntervaloAleatorio(
  sincronizarTicketsOtrosModificado,
  minTiempo,
  maxTiempo
);
ejecutarConIntervaloAleatorio(
  sincronizarPedidosCaducados,
  minTiempo,
  maxTiempo
);

export {
  reenviarTicket,
  reenviarTicketPago,
  // sincronizarTickets,
  // sincronizarCajas,
  // sincronizarMovimientos,
  // sincronizarFichajes,
  sincronizarDevoluciones,
  actualizarTeclados,
  socketSincronizarTickets,
};
