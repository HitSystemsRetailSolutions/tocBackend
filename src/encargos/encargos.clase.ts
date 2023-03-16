import axios from "axios";
import { logger } from "src/logger";
import * as schEncargos from "./encargos.mongodb";

export class Encargos {
  setEncargo = async (encargo) => {
    console.log(encargo)
    // Mandamos el encargo al SantaAna
    // const { data }: any = await axios.post("encargos/setEncargo", encargo);
    const data = [1];
    // Si data no existe (null, undefined, etc...) o la longitud es 0, devolvemos false
    if (!data || !data.length) {
      // He puesto el 143 pero no se cual habría que poner, no se cual es el sistema que seguís
      logger.Error(143, "Error: no se ha podido crear el encargo en el SantaAna");
      return false;
    }
    // Si existe, llamámos a la función de setEncargo
    // que devuelve un boolean.
    // True -> Se han insertado correctamente el encargo.
    // False -> Ha habido algún error al insertar el encargo.
    return schEncargos.setEncargo(encargo)
        .then((ok: boolean) => {
            console.log(ok)
            if(!ok) return { error: true, msg: 'Error al crear el encargo' };
            return{ error: false, msg: 'Encargo creado' }
        })
        .catch((err: string) => ({ error: true, msg: err }));
  };
}
const encargosInstance = new Encargos();
export { encargosInstance };
