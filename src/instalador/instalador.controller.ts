import { Controller, Post, Body } from "@nestjs/common";
import axios from "axios";
axios.defaults.timeout = 65000;

import { parametrosInstance } from "../parametros/parametros.clase";
import { movimientosInstance } from "../movimientos/movimientos.clase";
import { trabajadoresInstance } from "../trabajadores/trabajadores.clase";
import { articulosInstance } from "../articulos/articulos.clase";
import { clienteInstance } from "../clientes/clientes.clase";
import { familiasInstance } from "../familias/familias.class";
import { nuevaInstancePromociones } from "../promociones/promociones.clase";
import { menusInstance } from "../menus/menus.clase";
import { tecladoInstance } from "../teclado/teclado.clase";
import { tarifasInstance } from "../tarifas/tarifas.class";
import { logger } from "../logger";
import { networkInterfaces, totalmem } from "os";
const mqtt = require("mqtt");
import { MovimientosInterface } from "src/movimientos/movimientos.interface";
import { cestasInstance } from "src/cestas/cestas.clase";
import { cajaInstance } from "src/caja/caja.clase";
import { ticketsInstance } from "src/tickets/tickets.clase";
import { encargosInstance } from "src/encargos/encargos.clase";
import { exec } from "child_process";
import { deudasInstance } from "src/deudas/deudas.clase";

@Controller("instalador")
export class InstaladorController {
  /* Eze 4.0 */
  @Post("pedirDatos")
  async instalador(
    @Body()
    { password, numLlicencia, tipoDatafono }
  ) {
    try {
      if (password && numLlicencia && tipoDatafono) {
        const resAuth: any = await axios.post("parametros/instaladorLicencia", {
          password,
          numLlicencia,
        });
        if (resAuth.data) {
          const objParams = parametrosInstance.generarObjetoParametros();
          axios.defaults.headers.common["Authorization"] = resAuth.data.token;
          objParams.licencia = numLlicencia;
          objParams.tipoDatafono = tipoDatafono;
          objParams.ultimoTicket = resAuth.data.ultimoTicket;
          objParams.codigoTienda = resAuth.data.codigoTienda;
          objParams.nombreEmpresa = resAuth.data.nombreEmpresa;
          objParams.nombreTienda = resAuth.data.nombreTienda;
          objParams.token = resAuth.data.token;
          objParams.database = resAuth.data.database;
          objParams.header = resAuth.data.header;
          objParams.footer = resAuth.data.footer;

          return await parametrosInstance.setParametros(objParams);
        }
        throw Error("Error: San Pedro no puede autentificar esta petición");
      }
      throw Error("Faltan datos en instalador/pedirDatos controller");
    } catch (err) {
      logger.Error(93, err);
    }
  }

  getCNpromise(): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(
        "cd /etc/openvpn/client/ && find Auto_linux*.crt",
        function async(err, stdout, stderr) {
          if (err) {
            console.log(err.message);
            return "";
          }
          resolve("qrinstaller:" + stdout.split(".")[0]);
        }
      );
    });
  }
  /* Uri */
  @Post("setData")
  async setData(
    @Body()
    { cn, bssnes, cd }
  ) {
    await axios.post("parametros/setData", {
      cn,
      bssnes,
      cd,
    });
  }

  /* Uri */
  @Post("getCN")
  async getCN() {
    return await this.getCNpromise();
  }


  public enviarMQTT(n, options) {
    var client =
      mqtt.connect(process.env.MQTT_URL) ||
      mqtt.connect("mqtt://127.0.0.1:1883", {
        username: "ImpresoraMQTT",
      });
    // cuando se conecta enviamos los datos
    client.on("connect", function () {
      client.publish("hit.hardware/" + n, JSON.stringify(options));
    });
    return true;
  }

  /* Uri */
  @Post("sendTestPrint")
  async sendTestPrint(@Body()
  { type, value, rate, vid , pid }) {
    return await this.enviarMQTT("autoSetupPrinter", { type, value, rate, vid, pid })

  }
  @Post("sendTestVisor")
  async sendTestVisor(@Body()
  { value, rate }) {
    return await this.enviarMQTT("autoSetupVisor", { value, rate })

  }
  @Post("saveData")
  async saveData(@Body()
  { data }) {
    return await this.enviarMQTT("autoSetupSave", data)

  }
  /* Uri */
  @Post("pedirDatosQR")
  async instaladorQR(
    @Body()
    { numLlicencia, tipoDatafono }
  ) {
    try {
      if (numLlicencia && tipoDatafono) {
        const resAuth: any = await axios.post("parametros/instaladorLicencia", {
          password: "2b2c44fef72eafa3c5bd61cc1b9a89ad",
          numLlicencia,
        });
        if (resAuth.data) {
          const objParams = parametrosInstance.generarObjetoParametros();
          axios.defaults.headers.common["Authorization"] = resAuth.data.token;
          objParams.licencia = numLlicencia;
          objParams.tipoDatafono = tipoDatafono;
          objParams.ultimoTicket = resAuth.data.ultimoTicket;
          objParams.codigoTienda = resAuth.data.codigoTienda;
          objParams.nombreEmpresa = resAuth.data.nombreEmpresa;
          objParams.nombreTienda = resAuth.data.nombreTienda;
          objParams.token = resAuth.data.token;
          objParams.database = resAuth.data.database;
          objParams.header = resAuth.data.header;
          objParams.footer = resAuth.data.footer;

          return await parametrosInstance.setParametros(objParams);
        }
        throw Error("Error: San Pedro no puede autentificar esta petición");
      }
      throw Error("Faltan datos en instalador/pedirDatos controller");
    } catch (err) {
      logger.Error(93, err);
    }
  }

  /* Uri */
  @Post("getIP")
  async getIP() {
    try {
      const nets = networkInterfaces();
      const results = Object.create(null);
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
          if (net.family === familyV4Value && !net.internal) {
            if (!results[name]) {
              results[name] = [];
            }
            if (net.address.toString().includes("10.8")) {
              return net.address.toString();
            }
            results[name].push(net.address);
          }
        }
      }
      return "";
    } catch (err) {
      logger.Error(93, err);
    }
  }

  /* Uri */
  @Post("getIPTienda")
  async getIPTienda(@Body() { ip }) {
    try {
      return (
        await axios.post("parametros/getTiendaIP", {
          ip,
        })
      )?.data;
    } catch (err) {
      logger.Error(93, err);
    }
  }

  /* Uri */
  @Post("getQRstatus")
  async getQRstatus(@Body() { cn }) {
    try {
      return (
        await axios.post("parametros/getQRstatus", {
          cn,
        })
      )?.data;
    } catch (err) {
      logger.Error(93, err);
    }
  }

  /* Uri */
  @Post("resetQRstatus")
  async resetQRstatus(@Body() { cn }) {
    try {
      return (
        await axios.post("parametros/resetQRstatus", {
          cn,
        })
      )?.data;
    } catch (err) {
      logger.Error(93, err);
    }
  }

  /* Uri */
  @Post("pedirDatosIP")
  async pedirDatosIP(
    @Body()
    { ip }
  ) {
    try {
      if (ip) {
        const resAuth: any = await axios.post(
          "parametros/instaladorLicenciaIP",
          {
            ip,
          }
        );
        if (resAuth.data) {
          const objParams = parametrosInstance.generarObjetoParametros();
          axios.defaults.headers.common["Authorization"] = resAuth.data.token;
          objParams.licencia = resAuth.data.licencia;
          objParams.tipoDatafono = "3G";
          objParams.ultimoTicket = resAuth.data.ultimoTicket;
          objParams.codigoTienda = resAuth.data.codigoTienda;
          objParams.nombreEmpresa = resAuth.data.nombreEmpresa;
          objParams.nombreTienda = resAuth.data.nombreTienda;
          objParams.token = resAuth.data.token;
          objParams.database = resAuth.data.database;
          objParams.header = resAuth.data.header;
          objParams.footer = resAuth.data.footer;

          return await parametrosInstance.setParametros(objParams);
        }
        throw Error("Error: Santa Ana no puede autentificar esta petición");
      }
      throw Error(
        "No hemos podido detectar la IP, porfavor rellene los campos."
      );
    } catch (err) {
      logger.Error(93, err);
    }
  }

  /* Eze 4.0 */
  @Post("descargarTodo")
  async descargarTodo() {
    try {
      const parametros = await parametrosInstance.getParametros();
      const res: any = await axios.post("datos/cargarTodo", {
        database: parametros.database,
        codigoTienda: parametros.codigoTienda,
        licencia: parametros.licencia,
      });
      if (res.data) {
        const trabajadores = await trabajadoresInstance.insertarTrabajadores(
          res.data.dependientas
        );
        const articulos = await articulosInstance.insertarArticulos(
          res.data.articulos
        );
        const clientes = await clienteInstance.insertarClientes(
          res.data.clientes
        );
        const familias = await familiasInstance.insertarFamilias(
          res.data.familias
        );
        const promociones = await nuevaInstancePromociones.insertarPromociones(
          res.data.promociones
        );
        const teclas = await tecladoInstance.insertarTeclas(res.data.teclas);
        const tarifas = await tarifasInstance.guardarTarifasEspeciales(
          res.data.tarifasEspeciales
        );
        const encargos = await encargosInstance.insertarEncargos(
          res.data.encargos
        );

        const deudas = await deudasInstance.insertarDeudas(res.data.deudas);
        if (
          // Solo los datos obligatorios
          trabajadores &&
          articulos &&
          teclas
        ) {
          return await this.descargarUltimo();
        }
      }
      throw Error("Error de autenticación en SanPedro");
    } catch (err) {
      console.log(err);
      logger.Error(95, err);
      return false;
    }
  }

  async descargarUltimo() {
    try {
      const parametros = await parametrosInstance.getParametros();
      const res: any = await axios.post("datos/cargarUltimo", {
        database: parametros.database,
        codigoTienda: parametros.codigoTienda,
        licencia: parametros.licencia,
      });

      if (res.data) {
        if (res.data.fichajes.length > 0) {
          const idCesta = await cestasInstance.crearCesta();
          if (
            await trabajadoresInstance.setIdCesta(
              Number.parseInt(res.data.fichajes[0].usuari),
              idCesta
            )
          )
            trabajadoresInstance.ficharTrabajador(
              Number.parseInt(res.data.fichajes[0].usuari)
            );
        }
        if (res.data.movimientos.length > 0) {
          let movData = res.data.movimientos[0];
          const movimientos = await movimientosInstance.insertMovimientos(
            movData.Import,
            movData.Motiu,
            "SALIDA",
            null,
            movData.Dependenta
          );
        }
        let monedas = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let idMonedas = ['0.01', '0.02', '0.05', '0.1', '0.2', '0.5', '1', '2', '5', '10', '20', '50', '100', '200', '500'];
        let monedasCaja = [];
        let totalMonedas = 0;
        let cambioEmergencia = 0;
        if (res.data.UltimoCierre.length > 0) {
          if (res.data.ultimoCambEmCierre.length > 0) {
            cambioEmergencia = res.data.ultimoCambEmCierre[0].Import
          }
          monedas = [];
          const aperturaUltimoCierre = res.data.UltimoCierre || [];
          idMonedas.forEach((id) => {
            let moneda = aperturaUltimoCierre.find((m) => m.Motiu.startsWith(`En : ${id}`));
            if (moneda) {
              monedas.push(moneda.Import / Number(id));
              monedasCaja.push({
                _id: id,
                valor: moneda.Import,
                unidades: moneda.Import / Number(id),
              });
            } else {
              monedas.push(0);
              monedasCaja.push({
                _id: id,
                valor: 0,
                unidades: 0,
              });
            }
          });

          const UltimoCierre = await cajaInstance.guardarMonedas(
            monedas,
            cambioEmergencia,
            "CLAUSURA"
          );
          totalMonedas += monedas[0] * 0.01;
          totalMonedas += monedas[1] * 0.02;
          totalMonedas += monedas[2] * 0.05;
          totalMonedas += monedas[3] * 0.1;
          totalMonedas += monedas[4] * 0.2;
          totalMonedas += monedas[5] * 0.5;
          totalMonedas += monedas[6] * 1;
          totalMonedas += monedas[7] * 2;
          totalMonedas += monedas[8] * 5;
          totalMonedas += monedas[9] * 10;
          totalMonedas += monedas[10] * 20;
          totalMonedas += monedas[11] * 50;
          totalMonedas += monedas[12] * 100;
          totalMonedas += monedas[13] * 200;
          totalMonedas += monedas[14] * 500;
        }

        if (res.data.tickets.length > 0) {
          let ticketProcessed = [];
          for (let i = 0; i < res.data.tickets.length; i++) {
            let e = res.data.tickets[i];
            if (ticketProcessed.includes(e.Num_tick)) {
              const Tickets = await ticketsInstance.editarTotalTicket(
                e.Num_tick,
                e.Import
              );
            } else {
              ticketProcessed.push(e.Num_tick);
              // verificar si ticket es consumo_personal
              const consumo_personal = e.Tipus_venta === "Desc_100";
              const Tickets = await ticketsInstance.InsertatTicketBackUp(
                e.Num_tick,
                e.Data,
                e.Import,
                e.Dependenta,
                consumo_personal,
              );
            }
          }
          let Dependenta = res.data.tickets[0].Dependenta;
          if (res.data.fichajes.length > 0) res.data.fichajes[0].usuari;
          let date = new Date(
            res.data.tickets[res.data.tickets.length - 1].Data
          );
          date.setHours(date.getHours() - 2);
          await cajaInstance.abrirCaja({
            detalleApertura: monedasCaja,
            idDependientaApertura: Number.parseInt(Dependenta),
            cambioEmergenciaApertura: Number(cambioEmergencia),
            cambioEmergenciaActual: 0,
            inicioTime: Date.parse(date.toString()),
            totalApertura: totalMonedas,
            fichajes: [Number.parseInt(Dependenta)],
            propina: 0,
          });
        }
        return [1, monedas];
      }
      console.error("Error de autenticación en SanPedro");
      return [0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
    } catch (err) {
      logger.Error(95, err);
      return false;
    }
  }
}
