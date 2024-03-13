import { parametrosInstance } from "src/parametros/parametros.clase";
import { DeudasInterface } from "./deudas.interface";
import { logger } from "src/logger";
import axios from "axios";
import * as schDeudas from "./deudas.mongodb";
import { movimientosInstance } from "src/movimientos/movimientos.clase";
import { cajaInstance } from "src/caja/caja.clase";
import { cestasInstance } from "src/cestas/cestas.clase";
import { CestasInterface } from "src/cestas/cestas.interface";
import { clienteInstance } from "src/clientes/clientes.clase";
import { articulosInstance } from "src/articulos/articulos.clase";
import { trabajadoresInstance } from "src/trabajadores/trabajadores.clase";
import { CajaCerradaInterface, CajaSincro } from "src/caja/caja.interface";
import { AlbaranesInstance } from "src/albaranes/albaranes.clase";
import { impresoraInstance } from "src/impresora/impresora.class";
import { Timestamp } from "mongodb";
import { info, log } from "console";
import { Ean13Utils } from "ean13-lib";
import { MovimientosInterface } from "src/movimientos/movimientos.interface";
export class Deudas {
  async getDate(timestamp: any) {
    var date = new Date(timestamp);

    // componentes de fecha
    var ano = date.getFullYear();
    var mes = ("0" + (date.getMonth() + 1)).slice(-2);
    var dia = ("0" + date.getDate()).slice(-2);
    var horas = ("0" + date.getHours()).slice(-2);
    var minutos = ("0" + date.getMinutes()).slice(-2);
    var segundos = ("0" + date.getSeconds()).slice(-2);
    var milisegundos = ("00" + date.getMilliseconds()).slice(-3);

    //fecha como "YYYY-MM-DD HH:MM:SS.000"
    var data =
      ano +
      "-" +
      mes +
      "-" +
      dia +
      " " +
      horas +
      ":" +
      minutos +
      ":" +
      segundos +
      "." +
      milisegundos;

    return data;
  }
  async getId(codigoTienda: number, idTrabajador: any, dataDeuda: any) {
    let id =
      "Deute_Boti_" +
      codigoTienda +
      "_dep_" +
      idTrabajador +
      "_" +
      dataDeuda.replace(/\D/g, "");
    return id;
  }

  redondearPrecio = (precio: number) => Math.round(precio * 100) / 100;
  borrarDeudas = async () => {
    await schDeudas.borrarDeudas();
  };
  setDeuda = async (deuda) => {
    const parametros = await parametrosInstance.getParametros();
    const dataDeuda = await this.getDate(deuda.timestamp);
    const idSql = await this.getId(
      parametros.codigoTienda,
      deuda.idTrabajador,
      dataDeuda
    );

    deuda.idSql = idSql;
    deuda.enviado = false;
    deuda.estado = "SIN_PAGAR";
    return schDeudas
      .setDeuda(deuda)
      .then((ok: boolean) => {
        if (!ok) return { error: true, msg: "Error al crear la deuda" };
        return { error: false, msg: "Deuda creada" };
      })
      .catch((err: string) => ({ error: true, msg: err }));
  };
  async getDeudas() {
    return await schDeudas.getDeudas();
  }
  async getAllDeudas() {
    return await schDeudas.getAllDeudas();
  }
  async getTotalMoneyStandBy() {
    const arrayDeudas = await this.getAllDeudas();
    let money = 0;
    for (let i = 0; i < arrayDeudas.length; i++) {
      if (arrayDeudas[i].estado && arrayDeudas[i].estado == "SIN_PAGAR") {
        money -= Number(arrayDeudas[i].total.toFixed(2));
      }
    }
    return Number(money.toFixed(2));
  }
  async ticketPagado(idDeuda, albaran) {
    const deuda = await schDeudas.getDeudaById(idDeuda);

    if (deuda) {
      let id = deuda.idTicket;
      // comprobaciones para proceder con el comportamiento correspondiente dependiendo de la fecha de creacion de la deuda albaran
      // al haber hecho cambios en el procedimiento de los albaranes. El cambio actual se realizo el 27 de febrero de 2024
      //Estas comprobaciones se podrán borrar en un futuro al no haber deudas pendientes de albaranes antiguos

      // comprobamos si la deuda es de un albaran version antigua
      const firstVersionDeudaAlbaran = await this.comprobarVersDeudaAlbaran(
        deuda,
        albaran
      );
      if (firstVersionDeudaAlbaran) {
        // creamos un albaran e insertamos al nuevoMovimiento la idAlbaran
        const idAlbarnan = await AlbaranesInstance.setAlbaran(
          Number(deuda.total.toFixed(2)),
          deuda.cesta,
          deuda.idTrabajador,
          "V_ALB_ANTIGUO"
        );
        id = idAlbarnan.toString();
      }
      // comprobamos si la deuda es de un albaran version 2o antigua
      const secondVersionDeudaAlbaran = await this.comprobar2ndVersDeudaAlbaran(
        deuda,
        albaran
      );
      const concepto =
        secondVersionDeudaAlbaran && albaran ? "DEUDA ALBARAN" : "DEUDA";
      const movimiento = {
        cantidad: deuda.total,
        concepto: concepto,
        idTicket: id,
        idTrabajador: deuda.idTrabajador,
        tipo: "ENTRADA_DINERO",
      };
      const pagado = await movimientosInstance.nuevoMovimiento(
        movimiento.cantidad,
        movimiento.concepto,
        "ENTRADA_DINERO",
        Number(movimiento.idTicket),
        Number(movimiento.idTrabajador),
        deuda.nombreCliente
      );
      // sera false cuando se encuentre un movimiento existente de idTicket
      if (pagado) {
        await schDeudas
          .setPagado(deuda._id)
          .then(async (ok: boolean) => {
            if (!ok)
              return { error: true, msg: "Error al guardar deuda pagada" };
            return {
              error: false,
              msg: "OK!",
            };
          })
          .catch((err: string) => ({ error: true, msg: err }));
      }
    } else {
      return {
        error: true,
        msg: "Deuda no encontrada",
      };
    }
  }
  async pagarDeuda(arrayDeudas, infoCobro, visa = false) {
    try {
      let deuda = null;
      let albaran = null;
      let id = null;
      let concepto = null;
      let cantidadTkrs = infoCobro.tkrsData?.cantidadTkrs || 0;
      for (const iterator of arrayDeudas) {
        deuda = iterator;
        albaran = deuda.albaran;
        id = deuda.idTicket;
        // creacion de mov si se ha utilizado tkrs
        if (
          (infoCobro.tipo === "TKRS" && infoCobro.tkrsData) ||
          (cantidadTkrs > 0 &&
            (infoCobro.tipo === "EFECTIVO" || infoCobro.tipo === "DATAFONO_3G"))
        ) {
          // Realizar acciones específicas según la cantidad de TKRS
          if (cantidadTkrs > deuda.total) {
            // Acciones si hay exceso de TKRS
            // llamada a nuevoMovimientoForDeudas para crear movs sin imprimirlos y pasando por param la _id
            await movimientosInstance.nuevoMovimientoForDeudas(
              Date.now(),
              deuda.total,
              "",
              "TKRS_SIN_EXCESO",
              id,
              infoCobro.idTrabajador,
              deuda.nombreCliente
            );
            await movimientosInstance.nuevoMovimientoForDeudas(
              Date.now(),
              this.redondearPrecio(cantidadTkrs - deuda.total),
              "",
              "TKRS_CON_EXCESO",
              id,
              infoCobro.idTrabajador,
              deuda.nombreCliente
            );
          } else if (cantidadTkrs < deuda.total) {
            // Acciones si la cantidad de TKRS no cubre la deuda completa
            if (infoCobro.tipo === "DATAFONO_3G") {
              let total3G =
                Math.round((deuda.total - cantidadTkrs) * 100) / 100;
              await movimientosInstance.nuevoMovimientoForDeudas(
                Date.now(),
                total3G,
                "",
                "DATAFONO_3G",
                id,
                infoCobro.idTrabajador,
                deuda.nombreCliente
              );
            }
            await movimientosInstance.nuevoMovimientoForDeudas(
              Date.now(),
              cantidadTkrs,
              "",
              "TKRS_SIN_EXCESO",
              id,
              infoCobro.idTrabajador,
              deuda.nombreCliente
            );
          } else {
            // Acciones si la cantidad de TKRS cubre exactamente la deuda
            await movimientosInstance.nuevoMovimientoForDeudas(
              Date.now(),
              cantidadTkrs,
              "",
              "TKRS_SIN_EXCESO",
              id,
              infoCobro.idTrabajador,
              deuda.nombreCliente
            );
          }
        }else if(infoCobro.tipo === "DATAFONO_3G"){
          await movimientosInstance.nuevoMovimientoForDeudas(
            Date.now(),
            deuda.total,
            "",
            "DATAFONO_3G",
            id,
            infoCobro.idTrabajador,
            deuda.nombreCliente
          );
        }
        // comprobaciones para proceder con el comportamiento correspondiente dependiendo de la fecha de creacion de la deuda albaran
        // al haber hecho cambios en el procedimiento de los albaranes. El cambio actual se realizo el 27 de febrero de 2024
        //Estas comprobaciones se podrán borrar en un futuro al no haber deudas pendientes de albaranes antiguos
        // comprobamos si la deuda es de un albaran version 2o antigua
        const secondVersionDeudaAlbaran =
          await this.comprobar2ndVersDeudaAlbaran(deuda, albaran);
        concepto =
          secondVersionDeudaAlbaran && albaran ? "DEUDA ALBARAN" : "DEUDA";
        const movimiento = {
          valor: deuda.total,
          concepto: concepto,
          idTicket: id,
          idTrabajador: infoCobro.idTrabajador,
          tipo: "ENTRADA_DINERO",
        };
        const pagado = await movimientosInstance.nuevoMovimientoForDeudas(
          Date.now(),
          movimiento.valor,
          movimiento.concepto,
          "ENTRADA_DINERO",
          Number(movimiento.idTicket),
          Number(movimiento.idTrabajador),
          deuda.nombreCliente
        );
        // sera false cuando se encuentre un movimiento existente de idTicket
        if (pagado) {
          // si la deuda se paga con visa, generamos mov de tarjeta
          if (visa) {
            const movimientoTarjeta = {
              valor: deuda.total,
              concepto: concepto,
              idTicket: id,
              idTrabajador: infoCobro.idTrabajador,
              tipo: "TARJETA",
            };
            console.log("movimientoTarjeta");
            await movimientosInstance.nuevoMovimientoForDeudas(
              Date.now(),
              movimientoTarjeta.valor,
              movimientoTarjeta.concepto,
              "TARJETA",
              Number(movimientoTarjeta.idTicket),
              Number(movimientoTarjeta.idTrabajador),
              deuda.nombreCliente
            );
          }
          console.log("pagado", movimiento.idTicket, deuda._id);
          const mongodb = await schDeudas
            .setPagado(deuda._id)
            .then(async (ok: boolean) => {
              if (!ok)
                return { error: true, msg: "Error al guardar deuda pagada" };
              return {
                error: false,
                msg: "OK!",
              };
            })
            .catch((err: string) => ({ error: true, msg: err }));
          if (mongodb.error) {
            throw Error(mongodb.msg);
          }
        }
        // Restar la cantidad de TKRS para la siguiente deuda
        cantidadTkrs -= deuda.total;
      }
      let codigoBarras = await movimientosInstance.generarCodigoBarrasSalida();
      codigoBarras = String(Ean13Utils.generate(codigoBarras));
      const movimientoGeneral: MovimientosInterface = {
        _id: Date.now(),
        valor: infoCobro.total,
        concepto: concepto,
        idTicket: null,
        idTrabajador: infoCobro.idTrabajador,
        tipo: "ENTRADA_DINERO",
        codigoBarras: codigoBarras,
        enviado: false,
        ExtraData: [],
      };
      const cliente = await clienteInstance.getClienteById(
        arrayDeudas[0].idCliente
      );
      impresoraInstance.imprimirDeuda(movimientoGeneral, cliente.nombre);
      return true;
    } catch (error) {
      logger.Error(501, error);
    }
  }
  async comprobar2ndVersDeudaAlbaran(deuda: DeudasInterface, albaran: any) {
    if (!albaran) {
      return false;
    }
    const fechaVerion2 = new Date("2024-02-027T11:00:00");
    if (deuda.timestamp < fechaVerion2.getTime()) {
      return true;
    }
    return false;
  }
  async comprobarVersDeudaAlbaran(deuda: DeudasInterface, albaran: any) {
    if (!albaran) {
      return false;
    }
    // fecha de las modificaciones de los albaranes en deudas
    const fechaVersion = new Date("2024-01-03T12:00:00");
    const timestamp = fechaVersion.getTime();
    // detectamos que deuda albaran es anterior a la nueva version de los albaranes
    if (deuda.timestamp < timestamp) {
      return true;
    }
    return false;
  }
  eliminarDeuda = async (idDeuda, albaran) => {
    try {
      const deuda = await schDeudas.getDeudaById(idDeuda);
      if (deuda) {
        const res = await schDeudas.setAnulado(idDeuda);
        if (!res) {
          return { error: true, msg: "Error al borrar la deuda" };
        } else {
          // se hace mov si la deuda albaran es de una vers antigua
          if (albaran && this.comprobar2ndVersDeudaAlbaran(deuda, albaran)) {
            await movimientosInstance.nuevoMovimiento(
              deuda.total,
              "DEUDA ALBARAN ANULADO",
              "SALIDA",
              Number(deuda.idTicket),
              Number(deuda.idTrabajador),
              deuda.nombreCliente
            );
          }
          return { error: false, msg: "Deuda borrada" };
        }
      }
      return {
        error: true,
        msg: "Deuda no encontrada",
      };
    } catch (error) {
      return null;
    }
  };

  setEnviado = (idDeuda: DeudasInterface["_id"]) =>
    schDeudas.setEnviado(idDeuda);

  setFinalizado = (idDeuda: DeudasInterface["_id"]) =>
    schDeudas.setFinalizado(idDeuda);

  public async insertarDeudas(deudas: any) {
    if (deudas.length == 0) return;
    let cajaAbierta = await cajaInstance.cajaAbierta();
    // abrimos caja temporalmente para poder utilizar la cesta
    if (!cajaAbierta) {
      await cajaInstance.abrirCaja({
        detalleApertura: [{ _id: "0", valor: 0, unidades: 0 }],
        cambioEmergenciaApertura: 0,
        cambioEmergenciaActual: 0,
        idDependientaApertura: Number.parseInt(deudas[0].Dependenta),
        inicioTime: Number(new Date().getDate()),
        totalApertura: 0,
        fichajes: [Number.parseInt(deudas[0].Dependenta)],
      });
    }

    const grupos = {};
    let newCesta = await cestasInstance.crearCesta();
    const cesta = await cestasInstance.getCestaById(newCesta);
    // Itera a través de los datos
    deudas.forEach((item) => {
      const key = `${item.Data}-${item.Num_tick}`;
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(item);
    });

    // Convierte el objeto de grupos en un array de arrays
    const deudasAgrupadas = Object.values(grupos).map((subarray) => subarray);

    try {
      for (const item of deudasAgrupadas) {
        await this.insertarDeuda(item, cesta);
        // Borramos valores de cesta para insertar productos del proximo encargo
        await cestasInstance.borrarArticulosCesta(
          cesta._id,
          true,
          false,
          false
        );
      }
      await cestasInstance.deleteCestaMesa(cesta._id);
      // al acabar de insertar, borramos la cesta y la caja
      if (!cajaAbierta) {
        await cajaInstance.borrarCaja();
      }
      return deudasAgrupadas;
    } catch (error) {
      console.log("Error insertEncargos:", error);
    }
  }

  async insertarDeuda(deuda: any, cesta: CestasInterface) {
    try {
      const idTicket = deuda[0].Num_tick;
      const idSql = deuda[0].DeutesAnticipsId;
      const idDependenta = deuda[0].Dependenta;
      const idCliente = deuda[0].Otros.match(/\[Id:(.*?)\]/)?.[1] || "";
      const cliente = await clienteInstance.getClienteById(idCliente);
      const nombreCliente = cliente.nombre;
      let total = 0;
      const fechaOriginal = new Date(deuda[0].Data); // Fecha y hora original en tu zona horaria local
      const fechaGMT = new Date(
        fechaOriginal.getTime() + fechaOriginal.getTimezoneOffset() * 60 * 1000
      );

      const timestamp = fechaGMT.getTime();
      cesta.idCliente = idCliente;
      cesta.nombreCliente = cliente.nombre;
      cesta.trabajador = idDependenta;

      await cestasInstance.updateCesta(cesta);
      const cestaDeuda = await this.postCestaDeuda(deuda, cesta);

      let descuento: any =
        cliente && !cliente?.albaran && !cliente?.vip
          ? Number(cliente.descuento)
          : 0;

      // modificamos precios con el descuentro del cliente
      if (descuento && descuento > 0) {
        for (let i = 0; i < cestaDeuda.lista.length; i++) {
          if (cestaDeuda.lista[i].idArticulo !== -1) {
            cestaDeuda.lista[i].subtotal = this.redondearPrecio(
              cestaDeuda.lista[i].subtotal -
                (cestaDeuda.lista[i].subtotal * descuento) / 100
            );
          }
        }
      }

      for (const key in cestaDeuda.detalleIva) {
        if (key.startsWith("importe")) {
          total += Math.round(cestaDeuda.detalleIva[key] * 100) / 100;
        }
      }
      total = Number((Math.round(total * 100) / 100).toFixed(2));
      const mongodbDeuda = {
        idTicket: idTicket,
        idSql: idSql,
        cesta: cestaDeuda,
        idTrabajador: idDependenta,
        idCliente: idCliente,
        nombreCliente: nombreCliente,
        total: total,
        timestamp: timestamp,
        enviado: true,
        estado: "SIN_PAGAR",
      };

      // se vacia la lista para no duplicar posibles productos en la siguiente creacion de un encargo

      cesta.lista = [];
      return schDeudas
        .setDeuda(mongodbDeuda)
        .then((ok: boolean) => {
          if (!ok) return { error: true, msg: "Error al crear el encargo" };
          return { error: false, msg: "Encargo creado" };
        })
        .catch((err: string) => ({ error: true, msg: err }));
    } catch (error) {
      console.log("error insertDeuda:", error);
    }
    throw new Error("Method not implemented.");
  }
  async postCestaDeuda(deuda: any, cesta: CestasInterface) {
    try {
      // insertar productos restantes
      for (const [index, item] of deuda.entries()) {
        const arraySuplementos =
          deuda[index]?.FormaMarcar &&
          deuda[index]?.FormaMarcar != "," &&
          deuda[index]?.FormaMarcar != "0"
            ? await articulosInstance.getSuplementos(
                deuda[index]?.FormaMarcar.split(",").map(Number)
              )
            : null;

        for (let i = 0; i < item.Quantitat; i++) {
          cesta = await cestasInstance.clickTeclaArticulo(
            item.Plu,
            0,
            cesta._id,
            1,
            arraySuplementos,
            "",
            "descargas"
          );
        }
      }
    } catch (error) {
      console.log("error crear cesta de deuda", error);
    }

    return cesta;
  }
  async getDeudasCajaAsync() {
    const ultimaCaja: CajaSincro = await cajaInstance.getUltimoCierre();
    return await schDeudas.getDeudasCajaAsync(
      ultimaCaja.inicioTime,
      ultimaCaja.finalTime
    );
  }
  async getUpdateDeudas() {
    return await schDeudas.getUpdateDeudas();
  }
  getDeudaCreadaMasAntiguo = async () =>
    await schDeudas.getDeudaCreadaMasAntiguo();

  getDeudaFinalizadaMasAntiguo = async () =>
    await schDeudas.getDeudaFinalizadaMasAntiguo();
  getDeudaByIdTicket = async (
    idTicket: DeudasInterface["idTicket"],
    timestamp: DeudasInterface["timestamp"]
  ) => await schDeudas.getDeudaByIdTicket(idTicket, timestamp);
}
const deudasInstance = new Deudas();
export { deudasInstance };
