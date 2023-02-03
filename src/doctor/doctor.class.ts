import { trabajadoresInstance } from "../trabajadores/trabajadores.clase";
import { TrabajadoresInterface } from "../trabajadores/trabajadores.interface";
import { logger } from "../logger";

export class DoctorClass {
    /* Eze 4.0 */
    async checkTrabajadores() {
        const trabajadores: TrabajadoresInterface[] = await trabajadoresInstance.getTrabajadoresFichados();
        for (let i = 0; i < trabajadores.length; i++) {
            if (trabajadores[i].idCesta === undefined) {
                return false;
            }
        }
        return true;
    }

    async checkCestas() {
        try {
            return true;
        } catch (err) {
            logger.Error(71, err);
            return false;
        }
    }
}
export const doctorInstance = new DoctorClass();