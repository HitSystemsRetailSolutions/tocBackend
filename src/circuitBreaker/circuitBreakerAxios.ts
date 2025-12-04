import { logger } from "../logger";
import axios from "axios";
const CircuitBreakerStates = {
  OPENED: "OPENED", // El circuito está abierto: las peticiones están bloqueadas temporalmente debido a fallos previos.
  CLOSED: "CLOSED", // El circuito está cerrado: todo funciona con normalidad y las peticiones se permiten.
  HALF: "HALF", // Estado intermedio: se permite una petición de prueba para verificar si el sistema se ha recuperado.
};

const timeoutOpenCircuit = 300000; // in ms
export class CircuitBreakerAxios {
  request: string = null;
  state = CircuitBreakerStates.CLOSED;
  failureCount: number = 0;
  failureThreshold: number = 5; // número de fallos para determinar cuándo abrir el circuito
  resetAfter: number = Date.now();
  timeoutOpenCircuit: number = timeoutOpenCircuit; // declarar tiempo de espera al abrir el circuito
  timeoutAxios: number = 5000; // tiempo de espera para las solicitudes axios
  constructor(request: string, options) {
    this.request = request;
    this.state = CircuitBreakerStates.CLOSED; // permitir solicitudes por defecto
    this.failureCount = 0;
    // permitir solicitudes después de que el circuito haya estado abierto por resetAfter segundos
    // abrir el circuito nuevamente si se observa un fallo, cerrarlo de lo contrario
    this.resetAfter = Date.now();
    if (options) {
      this.failureThreshold = options.failureThreshold;
      this.timeoutOpenCircuit = options.timeoutOpenCircuit;
      this.timeoutAxios = options.timeoutAxios;
    } else {
      this.failureThreshold = 5; // en ms
      this.timeoutOpenCircuit = 5000; // en ms
    }
  }

  async fire(...args) {
    if (this.state === CircuitBreakerStates.OPENED) {
      if (this.resetAfter <= Date.now()) {
        this.state = CircuitBreakerStates.HALF;
      } else {
        return { circuitOpen: true };
      }
    }
    try {
      const response = await axios.post(this.request, ...args, {
        timeout: this.timeoutAxios,
      });

      if (
        response.status >= 200 &&
        response.status < 300 &&
        response.data &&
        !response.data?.error
      )
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
    const deadlock = data?.response?.data?.code == "DEADLOCK_DETECTED" || false;
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
      this.resetAfter = Date.now() + this.timeoutOpenCircuit;
    }
    return data;
  }

  forceOpen() {
    logger.Error(
      129,
      `Circuito forzado a abierto en ${this.request} por fallo crítico.`
    );
    this.state = CircuitBreakerStates.OPENED;
    this.resetAfter = Date.now() + this.timeoutOpenCircuit;
  }

  forceClose() {
    this.state = CircuitBreakerStates.CLOSED;
    this.failureCount = 0;
    this.resetAfter = Date.now();
  }
}

export default CircuitBreakerAxios;
