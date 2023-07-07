import { ParametrosInterface } from "./parametros.interface";
import * as schParametros from "./parametros.mongodb";

export class ParametrosClase {
  /* Eze 4.0 */
  getParametros = async (): Promise<ParametrosInterface> =>
    await schParametros.getParametros();

  /* Eze 4.0 */
  actParametros = async (params: ParametrosInterface) =>
    await schParametros.setParametros(params);

  /* Eze 4.0 */
  setParametros = async (params: ParametrosInterface): Promise<boolean> =>
    await schParametros.setParametros(params);

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

  /* Eze 4.0 */
  setIpPaytef = async (ip: string): Promise<boolean> =>
    await schParametros.setIpPaytef(ip);

  /* yasai :D */
  set3G = async (): Promise<boolean> => 
    await schParametros.set3G();

  /* Yasai :D */
  generarObjetoParametros(): ParametrosInterface {
    return {
      _id: "PARAMETROS",
      licencia: 0,
      codigoTienda: 0,
      database: "",
      nombreEmpresa: "",
      nombreTienda: "",
      tipoDatafono: "PAYTEF",
      ultimoTicket: -1,
      header: "",
      footer: "",
      token: undefined,
    };
  }
}

const parametrosInstance = new ParametrosClase();

export { parametrosInstance };
