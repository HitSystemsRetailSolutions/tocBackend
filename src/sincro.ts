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
import CircuitBreakerAxios from "./circuitBreaker/circuitBreakerAxios";
import CircuitBreakerSocket from "./circuitBreaker/circuitBreakerSocket";
import { Console } from "console";
import { tiposIvaInstance } from "./tiposIva/tiposIva.clase";
import { cestasInstance } from "./cestas/cestas.clase";
import { limpiezaEncargos } from "./encargos/encargos.mongodb";
import { limpiezaDeudas } from "./deudas/deudas.mongodb";
// inicio de breakers
const failureThreshold = 3; // número de fallos antes de abrir el circuito
const timeoutOpenCircuit = 300000; // tiempo en ms antes de abrir el circuito
const timeoutAxios = 8000; // tiempo en ms de timeout de cada petición axios
const CBSincronizarTicetsOtrosModificado = new CircuitBreakerAxios(
  "tickets/updOtros",
  {
    failureThreshold: failureThreshold, // número de fallos antes de abrir el circuito
    timeoutOpenCircuit: timeoutOpenCircuit, // tiempo en ms antes de abrir el circuito
    timeoutAxios,
  }
);

const CBSincronizarMovimientos = new CircuitBreakerAxios(
  "movimientos/enviarMovimiento",
  {
    failureThreshold: failureThreshold, // número de fallos antes de abrir el circuito
    timeoutOpenCircuit: timeoutOpenCircuit, // tiempo en ms antes de abrir el circuito
    timeoutAxios,
  }
);

const CBSincronizarDeudasCreadas = new CircuitBreakerAxios("deudas/setDeuda", {
  failureThreshold: failureThreshold, // número de fallos antes de abrir el circuito
  timeoutOpenCircuit: timeoutOpenCircuit, // tiempo en ms antes de abrir el circuito
  timeoutAxios,
});
const CBSincronizarEncargosCreados = new CircuitBreakerAxios(
  "encargos/setEncargo",
  {
    failureThreshold: failureThreshold, // número de fallos antes de abrir el circuito
    timeoutOpenCircuit: timeoutOpenCircuit, // tiempo en ms antes de abrir el circuito
    timeoutAxios,
  }
);
const CBSincronizarDeudasFinalizadasSet = new CircuitBreakerAxios(
  "deudas/setCertificadoDeuda",
  {
    failureThreshold: failureThreshold, // número de fallos antes de abrir el circuito
    timeoutOpenCircuit: timeoutOpenCircuit, // tiempo en ms antes de abrir el circuito
    timeoutAxios,
  }
);
const CBSincronizarDeudasFinalizadasAnular = new CircuitBreakerAxios(
  "deudas/anularDeuda",
  {
    failureThreshold: failureThreshold, // número de fallos antes de abrir el circuito
    timeoutOpenCircuit: timeoutOpenCircuit, // tiempo en ms antes de abrir el circuito
    timeoutAxios,
  }
);
const CBSincronizarEncargosFinalizadosUpd = new CircuitBreakerAxios(
  "encargos/updateEncargoGraella",
  {
    failureThreshold: failureThreshold, // número de fallos antes de abrir el circuito
    timeoutOpenCircuit: timeoutOpenCircuit, // tiempo en ms antes de abrir el circuito
    timeoutAxios,
  }
);

const CBSincronizarEncargosFinalizadosDelete = new CircuitBreakerAxios(
  "encargos/deleteEncargoGraella",
  {
    failureThreshold: failureThreshold, // número de fallos antes de abrir el circuito
    timeoutOpenCircuit: timeoutOpenCircuit, // tiempo en ms antes de abrir el circuito
    timeoutAxios,
  }
);

const CBSincronizarPedidosCaducados = new CircuitBreakerAxios(
  "encargos/updateEncargoGraella",
  {
    failureThreshold: failureThreshold, // número de fallos antes de abrir el circuito
    timeoutOpenCircuit: timeoutOpenCircuit, // tiempo en ms antes de abrir el circuito
    timeoutAxios,
  }
);

const CBSincronizarAlbaranesCreados = new CircuitBreakerAxios(
  "albaranes/setAlbaran",
  {
    failureThreshold: failureThreshold, // número de fallos antes de abrir el circuito
    timeoutOpenCircuit: timeoutOpenCircuit, // tiempo en ms antes de abrir el circuito
    timeoutAxios,
  }
);

// circuitBreaker son socket
export const CBSocketSincronizarTickets = new CircuitBreakerSocket(
  "sincroTickets",
  {
    failureThreshold: failureThreshold, // número de fallos antes de abrir el circuito
    timeout: timeoutOpenCircuit, // tiempo en ms antes de abrir el circuito
  }
);

export const CBSocketSinconizarCajas = new CircuitBreakerSocket("sincroCajas", {
  failureThreshold: failureThreshold, // número de fallos antes de abrir el circuito
  timeout: timeoutOpenCircuit, // tiempo en ms antes de abrir el circuito
});

export const CBSocketSincronizarFichajes = new CircuitBreakerSocket(
  "sincroFichajes",
  {
    failureThreshold: failureThreshold, // número de fallos antes de abrir el circuito
    timeout: timeoutOpenCircuit, // tiempo en ms antes de abrir el circuito
  }
);

export const CBSocketSincronizarDevoluciones = new CircuitBreakerSocket(
  "sincroDevoluciones",
  {
    failureThreshold: failureThreshold, // número de fallos antes de abrir el circuito
    timeout: timeoutOpenCircuit, // tiempo en ms antes de abrir el circuito
  }
);
// fin de breakers

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
    while (idsTicketsReenviar.length) {
      let idTicket = idsTicketsReenviar.shift();
      await ticketsInstance.setTicketEnviado(idTicket, false);
    }

    const ticket: TicketsInterface =
      await ticketsInstance.getTicketMasAntiguo();
    const params = await parametrosInstance.getParametros();
    if (ticket && params) {
      await nuevaInstancePromociones.deshacerPromociones(ticket);
      await cestasInstance.deshacerArticulosMenu(ticket);
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
        iva: await tiposIvaInstance.getArrayIvas(),
        token: "Bearer " + params.token,
      };
      CBSocketSincronizarTickets.fire({
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
    enprocesoTicketsOtros = true; // try-finally volvera a poner false al salir

    const parametros = await parametrosInstance.getParametros();

    if (!parametros) {
      logger.Error(4, "No hay parámetros definidos en la BBDD");
      return;
    }

    // 1️⃣ Si hay tickets pendientes de reenviar, procesa SOLO uno por ciclo
    if (idsTicketsOtrosReenviar.length > 0) {
      const id = idsTicketsOtrosReenviar.shift();
      await ticketsInstance.setTicketOtrosModificado(id, false);
    }

    // 2️⃣ Obtener el ticket más antiguo
    const ticket = await ticketsInstance.getTicketOtrosModificadoMasAntiguo();
    if (!ticket) return;

    // 3️⃣ Preparar ticket
    await nuevaInstancePromociones.deshacerPromociones(ticket);
    await cestasInstance.deshacerArticulosMenu(ticket);

    const superTicket = {
      ...ticket,
      tipoPago: null,
      movimientos: await movimientosInstance.getMovimientosDelTicket(
        ticket._id
      ),
    };

    superTicket.tipoPago =
      await movimientosInstance.calcularFormaPago(superTicket);

    // 4️⃣ Enviar al servidor
    const res = await CBSincronizarTicetsOtrosModificado.fire({
      ticket: superTicket,
    });

    // 5️⃣ Manejo de respuesta
    if (res?.data) {
      await ticketsInstance.setTicketOtrosModificado(ticket._id, true);

      // 🟢 Todo OK → llamar otra vez inmediatamente
      setTimeout(() => {
        sincronizarTicketsOtrosModificado();
      }, 0);
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
        token: "Bearer " + params.token,
      };

      CBSocketSinconizarCajas.fire({
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

async function sincronizarMovimientos() {
  if (enProcesoMovimientos) return;
  enProcesoMovimientos = true;

  try {
    const movimiento = await movimientosInstance.getMovimientoMasAntiguo();
    if (!movimiento) return; // no hay nada más que procesar
    const res: any = await CBSincronizarMovimientos.fire({ movimiento });

    if (res?.data) {
      const marcado =
        await movimientosInstance.setMovimientoEnviado(movimiento);
      if (!marcado) {
        logger.Error(10, "No se pudo marcar movimiento como enviado");
        return; // no continuar en caso de fallo interno
      }

      // 🟢 Todo OK → llamar otra vez inmediatamente
      // para procesar el siguiente movimiento sin esperar al interval
      setTimeout(() => sincronizarMovimientos(), 0);
    } else if (!res?.circuitOpen) {
      logger.Error(10, res || "Error al enviar el movimiento");
      // 🛑 no llamar de nuevo → dejar que el CB controle los fallos
    }
  } catch (err) {
    logger.Error(10, err);
    // 🛑 no reintentar ahora mismo → el circuit breaker actuará
  } finally {
    enProcesoMovimientos = false;
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

              CBSocketSincronizarFichajes.fire({
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
              CBSocketSincronizarDevoluciones.fire({
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
  if (enProcesoDeudasCreadas) return;
  enProcesoDeudasCreadas = true;

  try {
    const parametros = await parametrosInstance.getParametros();
    if (!parametros) {
      logger.Error(4, "No hay parámetros definidos en la BBDD");
      return;
    }

    const deuda = await deudasInstance.getDeudaCreadaMasAntiguo();
    if (!deuda) return;

    const dataDeuda = await deudasInstance.getDate(deuda.timestamp);

    const datos = {
      id: deuda.idSql,
      timestamp: deuda.timestamp,
      dependenta: deuda.idTrabajador,
      cliente: deuda.idCliente,
      data: dataDeuda,
      estat: 0,
      tipus: 1,
      import: deuda.total,
      dejaCuenta: deuda.dejaCuenta ?? 0,
      botiga: parametros.licencia,
      idTicket: deuda.idTicket,
      bbdd: parametros.database,
      dataVersion: deuda.dataVersion || null,
    };

    const res: any = await CBSincronizarDeudasCreadas.fire(datos);

    if (res?.data && !res.data.error) {
      const ok = await deudasInstance.setEnviado(deuda._id);
      if (!ok) {
        logger.Error(154, "No se pudo marcar deuda como enviada");
        return;
      }

      // 🟢 éxito → llamar otra vez SIN bloquear
      setTimeout(() => sincronizarDeudasCreadas(), 50);
    } else if (!res?.circuitOpen) {
      logger.Error(154, res || "Error al crear la deuda en SantaAna");
    }
  } catch (err) {
    logger.Error(5, err);
  } finally {
    // SIEMPRE se ejecuta, sin importar dónde falló
    enProcesoDeudasCreadas = false;
  }
}

async function sincronizarEncargosCreados() {
  if (enProcesoEncargosCreados) return;
  enProcesoEncargosCreados = true;

  try {
    const parametros = await parametrosInstance.getParametros();
    if (!parametros) {
      logger.Error(4, "No hay parámetros definidos en la BBDD");
      return;
    }

    const encargo = await encargosInstance.getEncargoCreadoMasAntiguo();
    if (!encargo) return;

    // Fecha y productos
    const fecha = await encargosInstance.getDate(
      encargo.opcionRecogida,
      encargo.fecha,
      encargo.hora,
      "YYYY-MM-DD HH:mm:ss.S",
      encargo.amPm,
      encargo.timestamp
    );

    encargo.productos = await encargosInstance.deshacerArticulosMenu(
      encargo.productos
    );

    const productos = nuevaInstancePromociones.deshacerPromocionesEncargo(
      encargo.productos
    );

    // Generación ID
    let idEncSantaAna = "";
    if (!encargo?.dataVersion || encargo.dataVersion < "4.25.50") {
      idEncSantaAna = await encargosInstance.generateIdv1(
        moment(encargo.timestamp).format("YYYYMMDDHHmmss"),
        encargo.idTrabajador.toString(),
        parametros
      );
    } else {
      idEncSantaAna = await encargosInstance.generateIdv2(
        moment(encargo.timestamp).format("YYYYMMDDHHmmss"),
        encargo.idTrabajador.toString(),
        parametros,
        encargo.opcionRecogida,
        encargo.dias
      );
    }
    // Datos para API
    const datos = {
      id: idEncSantaAna,
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
      productos,
      idTrabajador: encargo.idTrabajador,
      recogido: false,
      timestamp: encargo.timestamp,
      opcionEncargo: encargo.opcionRecogida,
      codigoBarras: encargo.codigoBarras,
      dataVersion: encargo.dataVersion || null,
    };

    // Caso especial (PEDIDOS sin productos)
    if (encargo.estado === "PEDIDOS" && encargo.productos.length <= 0) {
      const marcado = await encargosInstance.setEnviado(encargo._id);
      if (marcado) setTimeout(() => sincronizarEncargosCreados(), 50);
      return;
    }

    // Envío al servidor
    const res: any = await CBSincronizarEncargosCreados.fire(datos);

    // Validación de respuesta
    if (res?.data && !res.data.errorv) {
      const ok = await encargosInstance.setEnviado(encargo._id);
      if (ok) setTimeout(() => sincronizarEncargosCreados(), 50);
    } else if (!res?.circuitOpen) {
      logger.Error(
        153,
        res || "Error: no se ha podido crear el encargo en el SantaAna"
      );
    }
  } catch (err) {
    logger.Error(5, err);
  } finally {
    // SIEMPRE se ejecuta correctamente
    enProcesoEncargosCreados = false;
  }
}

async function sincronizarDeudasFinalizadas() {
  if (enProcesoDeudasFinalizadas) return;
  enProcesoDeudasFinalizadas = true;

  try {
    const parametros = await parametrosInstance.getParametros();
    if (!parametros) {
      logger.Error(4, "No hay parámetros definidos en la BBDD");
      return;
    }

    const deuda = await deudasInstance.getDeudaFinalizadaMasAntiguo();
    if (!deuda) return;

    // Elegir CB según tipo de acción
    let CBDeuda =
      deuda.estado === "ANULADO"
        ? CBSincronizarDeudasFinalizadasAnular
        : CBSincronizarDeudasFinalizadasSet;

    // Preparar datos de envío
    const timestamp = Date.now();
    const dataDeuda = await deudasInstance.getDate(timestamp);

    const certificado = {
      id: deuda.idSql,
      timestamp,
      dependenta: deuda.idTrabajador,
      cliente: deuda.idCliente,
      data: dataDeuda,
      estat: 0,
      tipus: 1,
      import: deuda.total,
      dejaCuenta: deuda.dejaCuenta ?? 0,
      botiga: parametros.licencia,
      idTicket: deuda.idTicket,
      bbdd: parametros.database,
    };

    const res: any = await CBDeuda.fire(certificado);

    if (res?.data && !res.data.error) {
      const ok = await deudasInstance.setFinalizado(deuda._id);
      if (!ok) {
        logger.Error(155, "No se pudo marcar la deuda como finalizada");
        return;
      }

      // 🟢 Éxito → lanzar siguiente iteración
      setTimeout(() => sincronizarDeudasFinalizadas(), 50);
    } else if (!res?.circuitOpen) {
      logger.Error(
        155,
        res || "Error: no se ha podido crear la deuda en el SantaAna"
      );
    }
  } catch (err) {
    logger.Error(5, err);
  } finally {
    // SIEMPRE se ejecuta, sin importar errores del try
    enProcesoDeudasFinalizadas = false;
  }
}

async function sincronizarEncargosFinalizados() {
  if (enProcesoEncargosFinalizados) return;
  enProcesoEncargosFinalizados = true;

  try {
    const parametros = await parametrosInstance.getParametros();
    if (!parametros) {
      logger.Error(4, "No hay parámetros definidos en la BBDD");
      return;
    }

    const encargo = await encargosInstance.getEncargoFinalizadoMasAntiguo();
    if (!encargo) return;

    let CBEnc = CBSincronizarEncargosFinalizadosUpd;
    if (encargo.estado === "ANULADO") {
      CBEnc = CBSincronizarEncargosFinalizadosDelete;
    }

    let idEncSantaAna = "";
    if (!encargo?.dataVersion || encargo.dataVersion < "4.25.50") {
      idEncSantaAna = await encargosInstance.generateIdv1(
        moment(encargo.timestamp).format("YYYYMMDDHHmmss"),
        encargo.idTrabajador.toString(),
        parametros
      );
    } else {
      idEncSantaAna = await encargosInstance.generateIdv2(
        moment(encargo.timestamp).format("YYYYMMDDHHmmss"),
        encargo.idTrabajador.toString(),
        parametros,
        encargo.opcionRecogida,
        encargo.dias
      );
    }

    const encargoGraella = {
      tmStmp: encargo.timestamp,
      bbdd: parametros.database,
      licencia: parametros.licencia,
      data: moment(encargo.timestamp).format("YYYY-MM-DD HH:mm:ss.S"), // formato consistente
      productos: encargo.productos,
      id: idEncSantaAna,
    };

    const res: any = await CBEnc.fire(encargoGraella);

    if (res?.data && !res.data.error) {
      const ok = await encargosInstance.setFinalizado(encargo._id);
      if (ok) {
        // auto-invocación segura
        setTimeout(() => sincronizarEncargosFinalizados(), 50);
      }
    } else if (!res?.circuitOpen) {
      logger.Error(
        156,
        res || "Error: no se ha podido crear el encargo en el SantaAna"
      );
    }
  } catch (err) {
    logger.Error(5, err);
  } finally {
    // siempre liberamos el flag
    enProcesoEncargosFinalizados = false;
  }
}

// buscara pedido caducado y enviara una consulta para que lo marque como recogido
async function sincronizarPedidosCaducados() {
  if (enProcesoEncargosPedidosCaducados) return;
  enProcesoEncargosPedidosCaducados = true;

  try {
    const parametros = await parametrosInstance.getParametros();
    if (!parametros) {
      logger.Error(4, "No hay parámetros definidos en la BBDD");
      return;
    }

    const encargo = await encargosInstance.getEncargoPedidoCaducadoMasAntiguo();
    if (!encargo) return;

    let idEncSantaAna = "";
    if (!encargo?.dataVersion || encargo.dataVersion < "4.25.50") {
      idEncSantaAna = await encargosInstance.generateIdv1(
        moment(encargo.timestamp).format("YYYYMMDDHHmmss"),
        encargo.idTrabajador.toString(),
        parametros
      );
    } else {
      idEncSantaAna = await encargosInstance.generateIdv2(
        moment(encargo.timestamp).format("YYYYMMDDHHmmss"),
        encargo.idTrabajador.toString(),
        parametros,
        encargo.opcionRecogida,
        encargo.dias
      );
    }

    const encargoGraella = {
      tmStmp: encargo.timestamp,
      bbdd: parametros.database,
      licencia: parametros.licencia,
      productos: encargo.productos,
      data: moment(encargo.timestamp).format("YYYY-MM-DD HH:mm:ss.S"), // formato consistente
      id: idEncSantaAna,
    };

    const res: any = await CBSincronizarPedidosCaducados.fire(encargoGraella);

    if (res?.data && !res.data.error) {
      const ok = await encargosInstance.setFinalizado(encargo._id);
      if (ok) {
        // Autoinvocación controlada sin bloquear el flujo
        setTimeout(() => sincronizarPedidosCaducados(), 50);
      }
    } else if (!res?.circuitOpen) {
      logger.Error(
        156,
        res || "Error: no se ha podido crear el encargo en el SantaAna"
      );
    }
  } catch (err) {
    logger.Error(5, err);
  } finally {
    // Siempre liberamos el flag
    enProcesoEncargosPedidosCaducados = false;
  }
}

async function sincronizarAlbaranesCreados() {
  if (enProcesoAlbaranesCreados) return;
  enProcesoAlbaranesCreados = true;

  try {
    const parametros = await parametrosInstance.getParametros();
    if (!parametros) {
      logger.Error(4, "No hay parámetros definidos en la BBDD");
      return;
    }

    const albaran = await AlbaranesInstance.getAlbaranCreadoMasAntiguo();
    if (!albaran) return;

    // Procesar lista correctamente
    albaran.cesta.lista =
      await nuevaInstancePromociones.deshacerPromociones(albaran);
    albaran.cesta.lista = await cestasInstance.deshacerArticulosMenu(albaran);

    const res: any = await CBSincronizarAlbaranesCreados.fire(albaran);

    if (res?.data && !res.data.error) {
      const ok = await AlbaranesInstance.setEnviado(albaran._id);
      if (ok) {
        // Auto-invocación segura
        setTimeout(() => sincronizarAlbaranesCreados(), 50);
      }
    } else if (!res?.circuitOpen) {
      logger.Error(
        153,
        res || "Error: no se ha podido crear el albaran en el SantaAna"
      );
    }
  } catch (err) {
    logger.Error(5, err);
  } finally {
    // Siempre liberar flag
    enProcesoAlbaranesCreados = false;
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
  limpiezaDeudas();
  limpiezaEncargos();
}

function actualizarTrabajadores() {
  trabajadoresInstance.actualizarTrabajadores().catch((err) => {
    logger.Error(19, err);
  });
}

setInterval(socketSincronizarTickets, 8000);
setInterval(socketSinconizarCajas, 40000);
setInterval(sincronizarMovimientos, 50000);
setInterval(sincronizarFichajes, 20000);
setInterval(sincronizarDevoluciones, 10000);
setInterval(sincronizarDeudasCreadas, 9000);
setInterval(sincronizarDeudasFinalizadas, 10000);
setInterval(sincronizarEncargosCreados, 9000);
setInterval(sincronizarEncargosFinalizados, 10000);
setInterval(sincronizarAlbaranesCreados, 11000);
// setInterval(actualizarTeclados, 3600000);
// setInterval(actualizarTarifas, 3600000);
setInterval(limpiezaProfunda, 60000);
setInterval(sincronizarTicketsOtrosModificado, 16000);
// setInterval(actualizarTrabajadores, 3600000);
// setInterval(actualizarMesas, 3600000);
setInterval(sincronizarPedidosCaducados, 60000);
// cada hora borrar encargos recurrentes expirados y generar el proximo encargo recurrente
setInterval(encargosInstance.anularEncargosRecurrentesExpirados, 3600000);
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
