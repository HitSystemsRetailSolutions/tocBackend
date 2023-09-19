import { Controller, Post, Get, Body } from "@nestjs/common";
import { UtilesModule } from "../utiles/utiles.module";
import { cajaInstance } from "./caja.clase";
import { logger } from "../logger";
import { impresoraInstance } from "../impresora/impresora.class";

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
        return await cajaInstance.cerrarCaja(
          total,
          detalleMonedas,
          infoDinero,
          cantidad3G,
          cantidadPaytef,
          idDependienta
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
  async abrirCaja(@Body() { total, detalle, idDependienta }) {
    try {
      if (total != undefined && detalle != undefined)
        return await cajaInstance.abrirCaja({
          detalleApertura: detalle,
          idDependientaApertura: idDependienta,
          inicioTime: await cajaInstance.getComprovarFechaCierreTurno(),
          totalApertura: total,
        });
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
}
