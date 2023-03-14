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
      params.tipoImpresora.length > 0 &&
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
  setVidAndPid = async (vid: string, pid: string): Promise<boolean> =>
    await schParametros.setVidAndPid(vid, pid);

  /* Eze 4.0 */
  setTipoImpresora = async (
    tipo: ParametrosInterface["tipoImpresora"]
  ): Promise<boolean> => await schParametros.setTipoImpresora(tipo);

  /* Eze 4.0 */
  setPropiedad = async (claveValor: any) =>
    await schParametros.actualizarPropiedad(claveValor);

  setTipoVisor = async (tipo: ParametrosInterface["visor"]): Promise<boolean> =>
    await schParametros.setVisor(tipo);

  /* Eze 4.0 */
  setIpPaytef = async (ip: string): Promise<boolean> =>
    await schParametros.setIpPaytef(ip);

  /* Eze 4.0 */
  generarObjetoParametros(): ParametrosInterface {
    return {
      _id: "PARAMETROS",
      licencia: 0,
      codigoTienda: 0,
      database: "",
      nombreEmpresa: "",
      nombreTienda: "",
      tipoImpresora: "USB",
      tipoDatafono: "PAYTEF",
      impresoraCafeteria: "NO",
      clearOneCliente: 0,
      clearOneTienda: 0,
      clearOneTpv: 0,
      botonesConPrecios: "No",
      prohibirBuscarArticulos: "No",
      ultimoTicket: -1,
      header: "",
      footer: "",
      impresoraUsbInfo: { vid: "", pid: "" },
      token: undefined,
    };
  }
}

const parametrosInstance = new ParametrosClase();

export { parametrosInstance };
