import { Controller, Post, Body } from "@nestjs/common";
import axios from "axios";
import { parametrosInstance } from "../parametros/parametros.clase";
import { trabajadoresInstance } from "../trabajadores/trabajadores.clase";
import { articulosInstance } from "../articulos/articulos.clase";
import { clienteInstance } from "../clientes/clientes.clase";
import { familiasInstance } from "../familias/familias.class";
import { nuevaInstancePromociones } from "../promociones/promociones.clase";
import { menusInstance } from "../menus/menus.clase";
import { tecladoInstance } from "../teclado/teclado.clase";
import { tarifasInstance } from "../tarifas/tarifas.class";
import { logger } from "../logger";

@Controller("instalador")
export class InstaladorController {
  /* Eze 4.0 */
  @Post("pedirDatos")
  async instalador(
    @Body()
    { password, numLlicencia, tipoImpresora, tipoDatafono, impresoraCafeteria }
  ) {
    try {
      if (
        password &&
        numLlicencia &&
        tipoImpresora &&
        tipoDatafono &&
        impresoraCafeteria
      ) {
        const resAuth: any = await axios.post("parametros/instaladorLicencia", {
          password,
          numLlicencia,
        });

        if (resAuth.data) {
          const objParams = parametrosInstance.generarObjetoParametros();
          axios.defaults.headers.common["Authorization"] = resAuth.data.token;
          objParams.licencia = numLlicencia;
          objParams.tipoImpresora = tipoImpresora;
          objParams.tipoDatafono = tipoDatafono;
          objParams.impresoraCafeteria = impresoraCafeteria;
          objParams.ultimoTicket = resAuth.data.ultimoTicket;
          objParams.codigoTienda = resAuth.data.codigoTienda;
          objParams.nombreEmpresa = resAuth.data.nombreEmpresa;
          objParams.nombreTienda = resAuth.data.nombreTienda;
          objParams.token = resAuth.data.token;
          objParams.database = resAuth.data.database;
          objParams.visor = "";
          objParams.header = resAuth.data.header;
          objParams.footer = resAuth.data.footer;
          objParams.impresoraUsbInfo = {
            pid: "",
            vid: "",
          };

          return await parametrosInstance.setParametros(objParams);
        }
        throw Error("Error: San Pedro no puede autentificar esta petición");
      }
      throw Error("Faltan datos en instalador/pedirDatos controller");
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
        const menus = await menusInstance.insertarMenus(res.data.menus);

        if ( // Solo los datos obligatorios
          trabajadores &&
          articulos &&
          teclas
        ) {
          return true;
        }
        throw Error(
          `Backend: res1: ${trabajadores}, res2: ${articulos}, res3: ${clientes}, res4: ${familias}, res5: ${promociones}, res7: ${teclas}, res8: ${tarifas}, res9: ${menus}`
        );
      }
      throw Error("Error de autenticación en SanPedro");
    } catch (err) {
      logger.Error(95, err);
      return false;
    }
  }
}
