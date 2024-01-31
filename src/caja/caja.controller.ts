import { Controller, Post, Get, Body } from "@nestjs/common";
import { UtilesModule } from "../utiles/utiles.module";
import { cajaInstance } from "./caja.clase";
import { logger } from "../logger";
import { impresoraInstance } from "../impresora/impresora.class";
import { trabajadoresInstance } from "src/trabajadores/trabajadores.clase";
import { ticketsInstance } from "src/tickets/tickets.clase";
import { CajaAbiertaInterface } from "./caja.interface";

@Controller("caja")
export class CajaController {
  /* Eze 4.0 */
  @Post("cerrarCaja")
  async cerrarCaja(
    @Body()
    {
      total,
      detalleMonedas,
      infoDinero,
      cantidad3G,
      cantidadPaytef,
      idDependienta,
      cambioEmergencia,
      cantidad3GAutomatizado,
    }
  ) {
    try {
      if (
        UtilesModule.checkVariable(
          total,
          detalleMonedas,
          infoDinero,
          cantidad3G,
          cantidadPaytef,
          idDependienta
        ) &&
        typeof cantidad3G === "number" &&
        typeof cantidadPaytef === "number"
      ) {
        // Enviar un log si se ha modificado el valor de datafono_3G manulamente
        if (
          cantidad3GAutomatizado != undefined &&
          typeof cantidad3GAutomatizado === "number" &&
          cantidad3GAutomatizado != cantidad3G
        ) {
          let diferencia = Math.abs(cantidad3G - cantidad3GAutomatizado);
          diferencia = Math.round(diferencia * 100) / 100;
          logger.Info(
            52.1,
            "Dependienta " +
              idDependienta +
              " ha modificado el valor datafono_3G. Valor sin modificar:" +
              cantidad3GAutomatizado +
              "; valor modificado:" +
              cantidad3G +
              "; diferencia:" +
              diferencia.toFixed(2)
          );
        }
        let totalLocalPaytef = await ticketsInstance.getTotalLocalPaytef();
        let cantidadLocal3G = cantidad3G;
        return await cajaInstance.cerrarCaja(
          total,
          detalleMonedas,
          infoDinero,
          cantidad3G,
          cantidadLocal3G,
          cantidadPaytef,
          totalLocalPaytef,
          idDependienta,
          false,
          await ticketsInstance.getTotalHonei(),
          cambioEmergencia
        );
      }
      throw Error("Error cerrarCaja > Faltan datos");
    } catch (err) {
      logger.Error(52, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Post("abrirCaja")
  async abrirCaja(@Body() { total, detalle, cambioEmergencia, idDependienta }) {
    try {
      if (total != undefined && detalle != undefined) {
        const fichados = await trabajadoresInstance.getTrabajadoresFichados();
        const idTrabajadores = fichados.map(
          (resultado) => resultado.idTrabajador
        );
        return await cajaInstance.abrirCaja({
          detalleApertura: detalle,
          idDependientaApertura: idDependienta,
          cambioEmergenciaApertura: cambioEmergencia,
          cambioEmergenciaActual: 0,
          inicioTime: await cajaInstance.getComprovarFechaCierreTurno(),
          totalApertura: total,
          fichajes: idTrabajadores,
          propina: 0,
          detalleActual: null,
        });
      }
      throw Error("Error abrirCaja > Faltan datos o son incorrectos");
    } catch (err) {
      logger.Error(53, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Get("estadoCaja")
  async estadoCaja() {
    try {
      if (!(await cajaInstance.cajaAbierta())) return 3;
      return await cajaInstance.getFechaApertura().then(async (res) => {
        if (res == true) {
          return 1;
        }
        return 0;
      });
    } catch (err) {
      logger.Error(54, err);
      console.log(err);
      return 0;
    }
  }

  /* Eze 4.0 */
  @Get("getMonedasUltimoCierre")
  async getMonedasUltimoCierre() {
    try {
      return cajaInstance.getMonedas("CLAUSURA");
    } catch (err) {
      logger.Error(55, err);
      return null;
    }
  }

  /* Eze 4.0 */
  @Get("getUltimoCierre")
  async getUltimoCierre() {
    try {
      return await cajaInstance.getUltimoCierre();
    } catch (err) {
      logger.Error(140, err);
      return false;
    }
  }

  /* Eze 4.0 */
  @Post("imprimirUltimoCierre")
  async imprimirUltimoCierre() {
    try {
      const ultimoCierre = await cajaInstance.getUltimoCierre();
      if (ultimoCierre) impresoraInstance.imprimirCajaAsync(ultimoCierre);

      throw Error("No se ha podido obtener el último cierre");
    } catch (err) {
      logger.Error(144, err);
      return false;
    }
  }
  @Post("cambioTurno")
  cambioTurno() {
    // No probado! Se le pasa solo el array de monedas
    // if (params.estado==true) {
    //   return {msg:'cambioTurno recibido',estado:false};
    // } else {
    //   return {msg:'cambioTurno recibido',estado:true};
    // }
    return cajaInstance
      .getCambioDeTurno()
      .then((res) => {
        return { info: res };
      })
      .catch((err) => {
        logger.Error(147, err);
        return {
          error: true,
          mensaje: "Backend: Error en caja/getCambioTurno > CATCH",
        };
      });
  }

  @Post("anularTurno")
  anularTurno() {
    // No probado! Se le pasa solo el array de monedas
    // if (params.estado==true) {
    //   return {msg:'cambioTurno recibido',estado:false};
    // } else {
    //   return {msg:'cambioTurno recibido',estado:true};
    // }
    return cajaInstance
      .getAnularTurno()
      .then((res) => {
        return { info: res };
      })
      .catch((err) => {
        logger.Error(148, err);
        return {
          error: true,
          mensaje: "Backend: Error en caja/getAnularTurno > CATCH",
        };
      });
  }

  @Post("comprovarTurno")
  comprovarTurno() {
    // No probado! Se le pasa solo el array de monedas
    // if (params.estado==true) {
    //   return {msg:'cambioTurno recibido',estado:false};
    // } else {
    //   return {msg:'cambioTurno recibido',estado:true};
    // }
    return cajaInstance
      .getComprovarTurno()
      .then((res) => {
        return { info: res };
      })
      .catch((err) => {
        logger.Error(149, err);
        return {
          error: true,
          mensaje: "Backend: Error en caja/getAnularTurno > CATCH",
        };
      });
  }
  // guarda el cambio que introduce la dep hasta que se cierre caja
  @Post("setCambioEmActual")
  async setCambioEmActual(@Body() { valor }) {
    try {
      if (valor || valor === 0) {
        return await cajaInstance.setCambioEmActual(valor);
      }
    } catch (error) {
      logger.Error(141, error);
    }
  }
  // recoge cambioEmActual de la caja abierta
  @Get("getCambioEmActual")
  async getCambioEmActual() {
    try {
      return await cajaInstance.getCambioEmActual();
    } catch (error) {
      logger.Error(142, error);
    }
  }

  @Post("setDetalleActual")
  async setDetalleActual(
    @Body()
    {
      detalleActual,
    }: {
      detalleActual: CajaAbiertaInterface["detalleApertura"];
    }
  ) {
    try {
      if (detalleActual) {
        return await cajaInstance.setDetalleActual(detalleActual);
      }
    } catch (error) {
      logger.Error(143, error);
    }
  }

  @Get("getDetalleActual")
  async getDetalleActual() {
    try {
      return await cajaInstance.getDetalleActual();
    } catch (error) {
      logger.Error(144, error);
    }
  }
}
