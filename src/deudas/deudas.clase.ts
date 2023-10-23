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
export class Deudas {
  getDate(timestamp: any) {
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
  getId(codigoTienda: number, idTrabajador: any, dataDeuda: any) {
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
  borrarDeudas = async () =>{await schDeudas.borrarDeudas()};
  setDeuda = async (deuda) => {

    const parametros = await parametrosInstance.getParametros();
    const dataDeuda = this.getDate(deuda.timestamp);
    const idSql= this.getId(parametros.codigoTienda, deuda.idTrabajador, dataDeuda)
    const deuda_santAna = {
      id: idSql,
      timestamp: deuda.timestamp,
      dependenta: deuda.idTrabajador,
      cliente: deuda.idCliente,
      data: dataDeuda,
      estat: 0,
      tipus: 1,
      import: deuda.total,
      botiga: parametros.licencia,
      idTicket: deuda.idTicket,
      bbdd: parametros.database,
    };
    // Mandamos la deuda al SantaAna
    const { data }: any = await axios
      .post("deudas/setDeuda", deuda_santAna)
      .catch((e) => {
        console.log(e);
      });

    // Si data no existe (null, undefined, etc...) o error = true devolvemos false
    if (!data || data.error) {
      // He puesto el 153 pero no se cual habría que poner, no se cual es el sistema que seguís
      logger.Error(153, "Error: no se ha podido crear la deuda en el SantaAna");
      return {
        error: true,
        msg: data.msg,
      };
    }
    // Si existe, llamámos a la función de setDeuda
    // que devuelve un boolean.
    deuda.idSql= idSql;
    deuda.enviado = false;
    deuda.estado = 'SIN_PAGAR';
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
  async getTotalMoneyStandBy(){
    const arrayDeudas= await this.getAllDeudas();
    let money = 0;
    for (let i = 0; i < arrayDeudas.length; i++) {
      if (arrayDeudas[i].estado && arrayDeudas[i].estado =="SIN_PAGAR") {
        money-=Number(arrayDeudas[i].total.toFixed(2));
      }
      
    }
    return money;
  }
  async ticketPagado(data) {
    const deuda = await schDeudas.getDeudaById(data.idDeuda);

    if (deuda) {
      const movimiento = {
        cantidad: deuda.total,
        concepto: "DEUDA",
        idTicket: deuda.idTicket,
        idTrabajador: deuda.idTrabajador,
        tipo: "ENTRADA_DINERO",
      };
      const pagado = await movimientosInstance.nuevoMovimiento(
        movimiento.cantidad,
        movimiento.concepto,
        "ENTRADA_DINERO",
        Number(movimiento.idTicket),
        Number(movimiento.idTrabajador)
      );
      // sera false cuando se encuentre un movimiento existente de idTicket
      if (pagado) {
        await schDeudas
          .setPagado(deuda._id)
          .then(async (ok: boolean) => {
            if (!ok)
              return { error: true, msg: "Error al guardar deuda pagada" };
            const parametros = await parametrosInstance.getParametros();
            const dataDeuda = this.getDate(deuda.timestamp);
            const certificadoDeuda = {
              id: deuda.idSql,
              timestamp: deuda.timestamp,
              dependenta: deuda.idTrabajador,
              cliente: deuda.idCliente,
              data: dataDeuda,
              estat: 0,
              tipus: 1,
              import: deuda.total,
              botiga: parametros.licencia,
              idTicket: deuda.idTicket,
              bbdd: parametros.database,
            };
            // Mandamos la deuda al SantaAna
            const { data }: any = await axios
              .post("deudas/setCertificadoDeuda", certificadoDeuda)
              .catch((e) => {
                console.log(e);
              });
            return data;
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
  eliminarDeuda = async (idDeuda) => {
    const deuda = await schDeudas.getDeudaById(idDeuda);
    if (deuda) {
      const parametros = await parametrosInstance.getParametros();
      const dataDeuda = this.getDate(deuda.timestamp);
      const certificadoDeuda = {
        id: deuda.idSql,
        timestamp: deuda.timestamp,
        dependenta: deuda.idTrabajador,
        cliente: deuda.idCliente,
        data: dataDeuda,
        estat: 0,
        tipus: 1,
        import: deuda.total,
        botiga: parametros.licencia,
        idTicket: deuda.idTicket,
        bbdd: parametros.database,
      };
      return await axios
        .post("deudas/anularDeuda", certificadoDeuda)
        .then((res: any) => {
          if (!res.data.error) {
            return schDeudas
              .setAnulado(idDeuda)
              .then((ok: boolean) => {
                if (!ok)
                  return { error: true, msg: "Error al borrar la deuda" };
                return { error: false, msg: "Deuda borrada" };
              })
              .catch((err: string) => ({ error: true, msg: err }));
          }
          return { error: true, msg: "Error al borrar la deuda en servidor" };
        })
        .catch((e) => {
          console.log(e);
        });
    } else {
      return {
        error: true,
        msg: "Deuda no encontrada",
      };
    }
  };
  public async insertarDeudas(deudas: any) {
    if (deudas.length == 0) return;
    let cajaAbierta = await cajaInstance.cajaAbierta();
    // abrimos caja temporalmente para poder utilizar la cesta
    if (!cajaAbierta) {
      await cajaInstance.abrirCaja({
        detalleApertura: [{ _id: "0", valor: 0, unidades: 0 }],
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

      let descuento: any = Number(
        (await clienteInstance.isClienteDescuento(idCliente))?.descuento
      );

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
          total += cestaDeuda.detalleIva[key];
        }
      }

      const mongodbDeuda = {
        idTicket: idTicket,
        idSql: idSql,
        cesta: cestaDeuda,
        idTrabajador: idDependenta,
        idCliente: idCliente,
        nombreCliente: nombreCliente,
        total: total,
        timestamp: timestamp,
        enviado: false,
        estado:"SIN_PAGAR"
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
            ""
          );
        }
      }
    } catch (error) {
      console.log("error crear cesta de encargo", error);
    }

    return cesta;
  }
  async getDeudasCajaAsync(){
    const ultimaCaja: CajaSincro= await cajaInstance.getUltimoCierre()
    return await schDeudas.getDeudasCajaAsync(ultimaCaja.inicioTime,ultimaCaja.finalTime)
  }
  async getUpdateDeudas(){
    return await schDeudas.getUpdateDeudas()
  }
}
const deudasInstance = new Deudas();
export { deudasInstance };
