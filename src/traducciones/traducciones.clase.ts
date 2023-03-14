import axios from "axios";
import { logger } from "src/logger";
import * as schTraducciones from "./traducciones.mongodb";

export class Traducciones {
  getTraducciones = async () => {
    // Primero insertamos las traducciones
    return this.setTraducciones().then((ok: boolean) => {
      // Si no se han insertado las traducciones, devolvemos un array vacío.
      if (!ok) {
        // He puesto el 142 pero no se cual habría que poner, no se cual es el sistema que seguís
        logger.Error(142, "Error al insertar las traducciones");
        return [];
      }
      // Si se han insertado las traducciones, devolvemos el array con las traducciones.
      return schTraducciones.getTraducciones().then((data) => data);
    });
  };

  setTraducciones = async (): Promise<boolean> => {
    // Cogemos las traducciones des del SantaAna
    const { data }: any = await axios.get("traducciones/getTraducciones");
    // Si data no existe (null, undefined, etc...) o la longitud es 0, devolvemos false
    if (!data || !data.length) {
      // He puesto el 143 pero no se cual habría que poner, no se cual es el sistema que seguís
      logger.Error(143, "Error: data viene vacío desde SantaAna");
      return false;
    }
    // Si existe, llamámos a la función de setTraducciones
    // que devuelve un boolean.
    // True -> Se han insertado correctamente las traducciones.
    // False -> Ha habido algún error al insertar las traducciones.
    return schTraducciones.setTraducciones(data).then((ok: boolean) => ok);
  };

  getIdioma = async () => {
    const idioma = await axios
      .get("traducciones/getIdioma")
      .then((data) => data);

    return idioma.data;
  };
  setTraduccionesKeys = async (traduccionesArr) => {
    // Cogemos todas las traducciones que hay en el backend
    // ya que es mas eficiente hacer la criba de las que ya existen
    // sin tener que ir una por una a consultar si existe en la
    // base de datos. De esta manera solo hacemos una consulta, y
    // no hay que ir una por una.
    return schTraducciones.getTraducciones().then((data) => {
      if (!data || !data.length)
        return {
          error: true,
          msg: "Error al obtener las traducciones del backend",
        };
      // Esto hace una limpieza para solo quedarnos
      // con los que estan en el front (nuevos) que no
      // existen en el backend, osea, los que hay que enviar
      // al SantaAna.
      const traducciones = traduccionesArr.filter(
        (t: any) => !data.some((tt) => tt.key === t.key)
      );
      if (!traducciones || !traducciones.length)
        return {
          error: false,
          msg: "No hay ninguna traducción nueva",
        };

      return axios
        .post("traducciones/setTraduccionesKeys", traducciones)
        .then(({ data }) => {
          this.getTraducciones();
          return data;
        })
        .catch((err) => ({ error: true, msg: err }));
    });
  };
}
const traduccionesInstance = new Traducciones();
export { traduccionesInstance };
