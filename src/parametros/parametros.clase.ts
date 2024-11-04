import axios from "axios";
import { ParametrosInterface } from "./parametros.interface";
import * as schParametros from "./parametros.mongodb";

export class ParametrosClase {

  /* Eze 4.0 */
  getParametros = async (): Promise<ParametrosInterface> => {
    return await schParametros.getParametros();
  };

  /* Eze 4.0 */
  actParametros = async (params: ParametrosInterface) =>
    await schParametros.setParametros(params);

  /* Eze 4.0 */
  setParametros = async (params: ParametrosInterface): Promise<boolean> => {
    return await schParametros.setParametros(params);
  };

  getContrasenaAdministrador = async (idTrabajador): Promise<string> => {
    const parametros = await this.getParametros();
    return (await axios.post("configurador/getAdminPassword", {
      database: parametros.database,
      licencia: parametros.licencia,
      idTrabajador: idTrabajador,
    })).data;

  }
  /* Eze 4.0 */
  async todoInstalado(): Promise<boolean> {
    const params = await this.getParametros();
    if (params) {
      return this.checkParametrosOK(params);
    }
    return false;
  }

  /* Eze 4.0 */
  checkParametrosOK(params: ParametrosInterface): boolean {
    if (
      params._id === "PARAMETROS" &&
      params.licencia > 0 &&
      params.codigoTienda > 0 &&
      params.database.length > 0 &&
      params.nombreEmpresa.length > 0 &&
      params.nombreTienda.length > 0 &&
      params.tipoDatafono.length > 0
    ) {
      return true;
    }
    return false;
  }

  // /* Eze v23 */
  // actualizarParametros() {
  //   logger.Error("Lee el comentario");
  //   /*
  //     Esto antes actualizaba los parámetros del this.parametros de esta clase, pero
  //     a partir de ahora, actualizarParametros se refiere a descargar datos del San Pedro
  //     o Gestión de la Tienda y hará un set en mongodb del tpv.
  //    */
  // }

  /* Eze 4.0 */
  setUltimoTicket = async (idTicket: number): Promise<boolean> =>
    await schParametros.setUltimoTicket(idTicket);

  /* Eze 4.0 */
  setPropiedad = async (claveValor: any) =>
    await schParametros.actualizarPropiedad(claveValor);

  /* Uri*/
  totalPaytef = async (): Promise<number> => await schParametros.totalPaytef();

  /* Uri */
  totalPaytefHour = async (): Promise<string> => {
    return await schParametros.totalPaytefHour();
  };

  /* Uri*/
  setIpPaytef = async (ip: string): Promise<boolean> =>
    await schParametros.setIpPaytef(ip);

  /* Uri*/
  setTcod = async (ip: string): Promise<boolean> =>
    await schParametros.setTcodPaytef(ip);

  /* Uri*/
  setContadoDatafono = async (tipo: number, suma: number): Promise<boolean> => {
    return await schParametros.setContadoDatafono(tipo, suma);
  };

  /* yasai :D */
  set3G = async (): Promise<boolean> => await schParametros.set3G();

  /* Yasai :D */
  generarObjetoParametros(): ParametrosInterface {
    return {
      _id: "PARAMETROS",
      licencia: 0,
      codigoTienda: 0,
      database: "",
      nombreEmpresa: "",
      tarifaMesa: "",
      nombreTienda: "",
      tipoDatafono: "PAYTEF",
      ultimoTicket: -1,
      header: "",
      footer: "",
      contadorPaytef: 0,
      token: undefined,
      payteftcod: "",
    };
  }
  updLastTicket(idTicket: number) {
    schParametros.setUltimoTicket(idTicket);
  }
}

const parametrosInstance = new ParametrosClase();

export { parametrosInstance };
