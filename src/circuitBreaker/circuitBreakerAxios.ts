import { logger } from "../logger";
import axios from "axios";
const CircuitBreakerStates = {
  OPENED: "OPENED", // El circuito está abierto: las peticiones están bloqueadas temporalmente debido a fallos previos.
  CLOSED: "CLOSED", // El circuito está cerrado: todo funciona con normalidad y las peticiones se permiten.
  HALF: "HALF",     // Estado intermedio: se permite una petición de prueba para verificar si el sistema se ha recuperado.
};

const timeout = 300000; // in ms
export class CircuitBreakerAxios {
  request: string = null;
  state = CircuitBreakerStates.CLOSED;
  failureCount: number = 0;
  failureThreshold: number = 5; // número de fallos para determinar cuándo abrir el circuito
  resetAfter: number = Date.now();
  timeout: number = timeout; // declarar tiempo de espera al abrir el circuito

  constructor(request: string, options) {
    this.request = request;
    this.state = CircuitBreakerStates.CLOSED; // permitir solicitudes por defecto
    this.failureCount = 0;
    // permitir solicitudes después de que el circuito haya estado abierto por resetAfter segundos
    // abrir el circuito nuevamente si se observa un fallo, cerrarlo de lo contrario
    this.resetAfter = Date.now();
    if (options) {
      this.failureThreshold = options.failureThreshold;
      this.timeout = options.timeout;
    } else {
      this.failureThreshold = 5; // en ms
      this.timeout = 5000; // en ms
    }
  }

  async fire(...args) {
    if (this.state === CircuitBreakerStates.OPENED) {
      if (this.resetAfter <= Date.now()) {
        this.state = CircuitBreakerStates.HALF;
      } else {
        return;
      }
    }
    try {
      const response = await axios.post(this.request, ...args);
      if (response.status >= 200 && response.status < 300 && !response.data?.error)
        return this.success(response);
      return this.failure(response);
    } catch (err) {
      return this.failure(err);
    }
  }

  success(data) {
    this.failureCount = 0;
    if (this.state === CircuitBreakerStates.HALF) {
      this.state = CircuitBreakerStates.CLOSED;
    }
    return data;
  }

  failure(data) {
    this.failureCount += 1;
    const deadlock = data?.response?.data?.code=="DEADLOCK_DETECTED" || false;
    if (
      this.state === CircuitBreakerStates.HALF ||
      this.failureCount >= this.failureThreshold ||
      deadlock // Considerar errores del servidor como fallos
    ) {
      if (deadlock) {
        logger.Error(129, `Circuito abierto en ${this.request} por deadlock.`);
      } else {
        logger.Error(
          129,
          `Circuito abierto en ${this.request} por ${this.failureCount} fallos consecutivos.`
        );
      }
      this.state = CircuitBreakerStates.OPENED;
      this.resetAfter = Date.now() + this.timeout;
    }
    return data;
  }

  forceOpen() {
    logger.Error(
      129,
      `Circuito forzado a abierto en ${this.request} por fallo crítico.`
    );
    this.state = CircuitBreakerStates.OPENED;
    this.resetAfter = Date.now() + this.timeout;
  }

  forceClose() {
    this.state = CircuitBreakerStates.CLOSED;
    this.failureCount = 0;
    this.resetAfter = Date.now();
  }
}

export default CircuitBreakerAxios;
