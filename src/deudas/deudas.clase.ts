import { parametrosInstance } from "src/parametros/parametros.clase";
import { DeudasInterface } from "./deudas.interface";
import { logger } from "src/logger";
import axios from "axios";
import * as schDeudas from "./deudas.mongodb";
import { movimientosInstance } from "src/movimientos/movimientos.clase";
import { cajaInstance } from "src/caja/caja.clase";
import { cestasInstance } from "src/cestas/cestas.clase";
import { ArticulosMenu, CestasInterface } from "src/cestas/cestas.interface";
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
import {
  construirObjetoIvas,
  fusionarObjetosDetalleIva,
} from "src/funciones/funciones";
import { TicketsController } from "src/tickets/tickets.controller";
import {
  getDataVersion,
  obtenerVersionAnterior,
  versionDescuentosClient,
} from "src/version/version.clase";
import { version } from "os";

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
    deuda.dataVersion = getDataVersion();
    return schDeudas
      .setDeuda(deuda)
      .then(async (ok: boolean) => {
        if (!ok) return { error: true, msg: "Error al crear la deuda" };
        await cestasInstance.borrarArticulosCesta(
          deuda.cesta._id,
          true,
          true,
          false
        );
        return { error: false, msg: "Deuda creada" };
      })
      .catch((err: string) => ({ error: true, msg: err }));
  };
  async getDeudas() {
    return await schDeudas.getDeudas();
  }
  async getDeudasByIdCliente(idCliente: DeudasInterface["idCliente"]) {
    return await schDeudas.getDeudasByIdCliente(idCliente);
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
  /**
   *
   * @param arrayDeudas contiene las deudas a pagar
   * @param infoCobro datos de la cesta
   * @param pagoParcial cantidad de dinero que se ha pagado inferior al total
   * @param visa booleano que indica si se ha pagado con visa/paytef
   * @returns
   */
  async pagarDeuda(arrayDeudas, infoCobro, pagoParcial = 0, visa = false) {
    try {
      const importeDeudas = this.redondearPrecio(
        arrayDeudas.reduce(
          (acc, deuda) => acc + deuda.total - deuda.dejaCuenta,
          0
        )
      );
      const saldoPendiente = pagoParcial ? importeDeudas - pagoParcial : 0;
      const hayParcial = saldoPendiente > 0;
      const deudaMaxima = Math.max(
        ...arrayDeudas.map((deuda) => deuda.total - deuda.dejaCuenta)
      );
      const indexDeudaMaxima = arrayDeudas
        .map((deuda) => deuda.total - deuda.dejaCuenta)
        .indexOf(deudaMaxima);

      let albaran = null;
      let id = null;
      let concepto = null;
      let cantidadTkrs = infoCobro.tkrsData?.cantidadTkrs || 0;
      let dejaCuenta = 0;
      let deudaPendiente = null;
      // recorre las deudas para pagarlas
      for (const deuda of arrayDeudas) {
        let total = deuda.total;
        if (deuda.dejaCuenta > 0) {
          dejaCuenta += deuda.dejaCuenta;
          total = Math.round((deuda.total - deuda.dejaCuenta) * 100) / 100;
        }
        albaran = deuda.albaran;
        id = deuda.idTicket;
        // aplicar el parcial a la deuda mas grande
        if (indexDeudaMaxima === arrayDeudas.indexOf(deuda) && hayParcial) {
          total = this.redondearPrecio(total - saldoPendiente);
          deudaPendiente = deuda;
        }
        // creacion de mov si se ha utilizado tkrs
        if (
          (infoCobro.tipo === "TKRS" && infoCobro.tkrsData) ||
          (cantidadTkrs > 0 &&
            (infoCobro.tipo === "EFECTIVO" || infoCobro.tipo === "DATAFONO_3G"))
        ) {
          // Realizar acciones específicas según la cantidad de TKRS
          if (cantidadTkrs > total) {
            // Acciones si hay exceso de TKRS
            // llamada a nuevoMovimientoForDeudas para crear movs sin imprimirlos y pasando por param la _id
            await movimientosInstance.nuevoMovimientoForDeudas(
              Date.now(),
              total,
              "",
              "TKRS_SIN_EXCESO",
              id,
              infoCobro.idTrabajador,
              deuda.nombreCliente
            );
            await movimientosInstance.nuevoMovimientoForDeudas(
              Date.now(),
              this.redondearPrecio(cantidadTkrs - total),
              "",
              "TKRS_CON_EXCESO",
              id,
              infoCobro.idTrabajador,
              deuda.nombreCliente
            );
          } else if (cantidadTkrs < total) {
            // Acciones si la cantidad de TKRS no cubre la deuda completa
            if (infoCobro.tipo === "DATAFONO_3G") {
              let total3G = Math.round((total - cantidadTkrs) * 100) / 100;
              await movimientosInstance.nuevoMovimientoForDeudas(
                Date.now(),
                total3G,
                "DEUDA PAGADA",
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
        } else if (infoCobro.tipo === "DATAFONO_3G") {
          await movimientosInstance.nuevoMovimientoForDeudas(
            Date.now(),
            total,
            "DEUDA PAGADA",
            "DATAFONO_3G",
            id,
            infoCobro.idTrabajador,
            deuda.nombreCliente
          );
        }
        // comprobaciones para proceder con el comportamiento correspondiente dependiendo de la fecha de creacion de la deuda albaran
        // al haber hecho cambios en el procedimiento de los albaranes. El cambio actual se realizo el 27 de febrero de 2024
        //Estas comprobaciones se podrán borrar en un futuro al no haber deudas pendientes de albaranes antiguos
        // comprobamos si la deuda es de un albaran 2o version antigua
        const secondVersionDeudaAlbaran =
          await this.comprobar2ndVersDeudaAlbaran(deuda, albaran);
        concepto =
          secondVersionDeudaAlbaran && albaran ? "DEUDA ALBARAN" : "DEUDA";
        const movimiento = {
          valor: total,
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
              valor: total,
              concepto: concepto,
              idTicket: id,
              idTrabajador: infoCobro.idTrabajador,
              tipo: "TARJETA",
            };
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
        cantidadTkrs -= total;
      }
      // Se genera un movimiento general de deuda/s para mostrar el cobro en un solo ticket al imprimir
      let codigoBarras = await movimientosInstance.generarCodigoBarrasSalida();
      codigoBarras = String(Ean13Utils.generate(codigoBarras));
      const movimientoGeneral: MovimientosInterface = {
        _id: Date.now(),
        valor: Math.round((infoCobro.total - saldoPendiente) * 100) / 100,
        concepto: concepto,
        idTicket: null,
        idTrabajador: infoCobro.idTrabajador,
        tipo: "ENTRADA_DINERO",
        codigoBarras: codigoBarras,
        enviado: false,
        ExtraData: [],
      };
      if (deudaPendiente) {
        await this.crearDeudaSaldoPendiente(deudaPendiente, saldoPendiente);
      }
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
  async crearDeudaSaldoPendiente(
    deuda: DeudasInterface,
    saldoPendiente: number
  ) {
    const deudaPendiente = {
      idTicket: deuda.idTicket,
      cesta: deuda.cesta,
      idTrabajador: deuda.idTrabajador,
      idCliente: deuda.idCliente,
      nombreCliente: deuda.nombreCliente,
      total: deuda.total,
      timestamp: new Date().getTime(),
      dejaCuenta: this.redondearPrecio(deuda.total - saldoPendiente),
    };
    await this.setDeuda(deudaPendiente);
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

  parseDetall(detall: string) {
    const regex = /\[([^:]+):([^\]]+)\]/g; // Matches [key:value] pairs
    let match;
    const resultObject = {
      DejaACuenta: 0,
      NumTicket: null,
      DataVersion: null,
    };

    while ((match = regex.exec(detall)) !== null) {
      const key = match[1];
      const value = match[2];

      resultObject[key] = isNaN(Number(value)) ? value : Number(value);
    }

    return resultObject;
  }

  async insertarDeuda(deuda: any, cesta: CestasInterface) {
    try {
      const idTicket = deuda[0].Num_tick;
      const idSql = deuda[0].DeutesAnticipsId;
      const idDependenta = deuda[0].Dependenta;
      const idCliente = deuda[0].Otros.match(/\[Id:(.*?)\]/)?.[1] || "";
      const cliente = await clienteInstance.getClienteById(idCliente);
      const nombreCliente = cliente?.nombre;
      const detall = deuda[0].Detall;
      const jsonDetall = this.parseDetall(detall);
      let inicio = detall.indexOf("DejaACuenta:");
      let dejaCuenta = 0;

      if (inicio !== -1) {
        let dataversionDeuda =
          jsonDetall.DataVersion ||
          obtenerVersionAnterior(versionDescuentosClient);
        cesta.dataVersion = dataversionDeuda;

        // Extraer y convertir el valor numérico
        let valorDejaACuenta = Number(jsonDetall.DejaACuenta);
        dejaCuenta = valorDejaACuenta;
      }
      let total = 0;
      const fechaOriginal = new Date(deuda[0].Data); // Fecha y hora original en tu zona horaria local
      const fechaGMT = new Date(
        fechaOriginal.getTime() + fechaOriginal.getTimezoneOffset() * 60 * 1000
      );

      const timestamp = fechaGMT.getTime();
      cesta.idCliente = idCliente;
      cesta.nombreCliente = nombreCliente;
      cesta.trabajador = idDependenta;
      // insertamos el tmstp de la deuda en la cesta para usar el iva correcto al insertar los productos
      cesta.timestamp = timestamp;
      await cestasInstance.updateCesta(cesta);
      let cestaDeuda = JSON.parse(JSON.stringify(cesta));
      // descuento del cliente no se lee del mongo para evitar aplicar de nuevo el descuento en deudas ya aplicadas
      let descuento: any = 0;
      if (idTicket == 0) {
        cestaDeuda.detalleIva = {
          base1: 0,
          base2: deuda[0].Import,
          base3: 0,
          base4: 0,
          base5: 0,
          valorIva1: 0,
          valorIva2: 0,
          valorIva3: 0,
          valorIva4: 0,
          valorIva5: 0,
          importe1: 0,
          importe2: deuda[0].Import,
          importe3: 0,
          importe4: 0,
          importe5: 0,
        };
        //total = deuda[0].Import; se inserta aqui dependiendo de si le meto iva o no
      } else {
        if (
          cestaDeuda.dataVersion &&
          cestaDeuda.dataVersion >= versionDescuentosClient
        )
          cestaDeuda = await this.postCestaDeudaV2(deuda, cestaDeuda);
        else
          cestaDeuda = await this.postCestaDeuda(deuda, cestaDeuda, descuento);
      }
      // el descuento se aplica dependiendo de si se ha usado insertarArticulo en cesta
      // Si no se ha usado insertarArticulo, el descuento tambien se aplica en detallesIva

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
      const cestaCopia = JSON.parse(JSON.stringify(cestaDeuda));

      const mongodbDeuda = {
        idTicket: idTicket,
        idSql: idSql,
        cesta: cestaCopia,
        idTrabajador: idDependenta,
        idCliente: idCliente,
        nombreCliente: nombreCliente,
        total: total,
        dejaCuenta: dejaCuenta,
        timestamp: timestamp,
        enviado: true,
        estado: "SIN_PAGAR",
      };

      // se vacia la lista para no duplicar posibles productos en la siguiente creacion de un encargo

      cesta.lista = [];
      cesta.detalleIva = {
        base1: 0,
        base2: 0,
        base3: 0,
        base4: 0,
        base5: 0,
        valorIva1: 0,
        valorIva2: 0,
        valorIva3: 0,
        valorIva4: 0,
        valorIva5: 0,
        importe1: 0,
        importe2: 0,
        importe3: 0,
        importe4: 0,
        importe5: 0,
      };

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
  async postCestaDeuda(deuda: any, cesta: CestasInterface, dto: number) {
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
        if (arraySuplementos) {
          for (let i = 0; i < item.Quantitat; i++) {
            cesta = await cestasInstance.clickTeclaArticulo(
              item.Plu,
              0,
              cesta._id,
              1,
              arraySuplementos,
              null,
              "",
              "descargas"
            );
          }
        } else {
          const infoArt = await articulosInstance.getInfoArticulo(item.Plu);
          cesta.lista.push({
            idArticulo: item.Plu,
            nombre: infoArt.nombre,
            arraySuplementos: arraySuplementos,
            promocion: null,
            varis: false,
            regalo: false,
            puntos: infoArt.puntos,
            impresora: infoArt.impresora,
            subtotal: item.Import,
            unidades: item.Quantitat,
            gramos: null,
            pagado: false,
          });
          const objectIva = construirObjetoIvas(
            item.Import,
            infoArt.tipoIva,
            1,
            false,
            dto,
            cesta.timestamp
          );

          cesta.detalleIva = fusionarObjetosDetalleIva(
            objectIva,
            cesta.detalleIva
          );
        }
        await cestasInstance.updateCesta(cesta);
      }
    } catch (error) {
      console.log("error crear cesta de deuda", error);
    }

    return cesta;
  }

  /**
   * Post cesta deuda v2: no usa el dto de descuento del cliente
   * añadira los posibles descuentos de tienda
   * @param deuda
   * @param cesta
   * @returns
   */
  async postCestaDeudaV2(deuda: any, cesta: CestasInterface) {
    try {
      // Map para agrupar los artículos por menú y su precio
      const menusMap: Map<
        string,
        { articulos: ArticulosMenu[]; precios: number[] }
      > = new Map();

      // Recorrer los items de la deuda
      for (const [index, item] of deuda.entries()) {
        // Buscar si Otros contiene Menu
        const otros = item.Otros || "";
        const menuMatch = otros.match(/Menu:([^\]]+)/);
        let menuId = null;
        if (menuMatch) {
          menuId = menuMatch[1].trim();
        }

        // Obtener suplementos si existen
        const arraySuplementos =
          item?.FormaMarcar &&
          item?.FormaMarcar != "," &&
          item?.FormaMarcar != "0"
            ? await articulosInstance.getSuplementos(
                item?.FormaMarcar.split(",").map(Number)
              )
            : null;

        // Si el item pertenece a un menú, lo agrupamos
        if (menuId) {
          const infoArt = await articulosInstance.getInfoArticulo(item.Plu);
          const artMenu: ArticulosMenu = {
            idArticulo: item.Plu,
            gramos: item.Gramos || null,
            unidades: item.Quantitat,
            arraySuplementos: arraySuplementos,
            nombre: infoArt.nombre,
          };
          // Guardar el precio individual del artículo para el menú
          const precioArt = item.Import || 0;
          if (!menusMap.has(menuId))
            menusMap.set(menuId, { articulos: [], precios: [] });
          menusMap.get(menuId).articulos.push(artMenu);
          menusMap.get(menuId).precios.push(precioArt);
          continue; // No insertar en la cesta aún
        }

        // Si no es menú, insertar como siempre
        if (arraySuplementos) {
          for (let i = 0; i < item.Quantitat; i++) {
            cesta = await cestasInstance.clickTeclaArticulo(
              item.Plu,
              0,
              cesta._id,
              1,
              arraySuplementos,
              null,
              "",
              "descargas"
            );
          }
        } else {
          const infoArt = await articulosInstance.getInfoArticulo(item.Plu);
          cesta.lista.push({
            idArticulo: item.Plu,
            nombre: infoArt.nombre,
            arraySuplementos: arraySuplementos,
            promocion: null,
            varis: false,
            regalo: false,
            puntos: infoArt.puntos,
            impresora: infoArt.impresora,
            subtotal: item.Import,
            unidades: item.Quantitat,
            gramos: item.Gramos || null,
            pagado: false,
          });
          const objectIva = construirObjetoIvas(
            item.Import,
            infoArt.tipoIva,
            1,
            false,
            0,
            cesta.timestamp
          );
          cesta.detalleIva = fusionarObjetosDetalleIva(
            objectIva,
            cesta.detalleIva
          );
        }
        await cestasInstance.updateCesta(cesta);
      }

      // Insertar los menús agrupados en la cesta
      for (const [
        menuId,
        { articulos: articulosMenu, precios },
      ] of menusMap.entries()) {
        let idArticuloMenu = menuId;
        let repMenu = null;
        // quitar _X del idMenu
        const repMatch = menuId.match(/(.+)_([0-9]+)$/);

        if (repMatch) {
          idArticuloMenu = repMatch[1];
          repMenu = repMatch[2];
        }

        const infoMenu = await articulosInstance.getInfoArticulo(
          Number(idArticuloMenu)
        );
        // Calcular subtotal del menú sumando los precios individuales
        const subtotalMenu = precios.reduce((sum, precio) => sum + precio, 0);

        cesta.lista.push({
          idArticulo: Number(idArticuloMenu),
          nombre: infoMenu.nombre,
          arraySuplementos: null,
          promocion: null,
          varis: false,
          regalo: false,
          puntos: infoMenu.puntos,
          impresora: infoMenu.impresora,
          subtotal: subtotalMenu,
          unidades: 1,
          gramos: null,
          pagado: false,
          articulosMenu: articulosMenu,
        });

        const objectIvaMenu = construirObjetoIvas(
          subtotalMenu,
          infoMenu.tipoIva,
          1,
          false,
          0,
          cesta.timestamp
        );
        cesta.detalleIva = fusionarObjetosDetalleIva(
          objectIvaMenu,
          cesta.detalleIva
        );
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
