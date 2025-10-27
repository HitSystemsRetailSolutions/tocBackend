import { Module } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

@Module({})
export class UtilesModule {
  static checkVariable(...args: any[]) {
    // let args = arguments;
    for (let i = 0; i < args.length; i++) {
      if (args[i] == undefined || args[i] == null) {
        return false;
      }
    }
    return true;
  }

  static generateUuid(): string {
    return uuidv4();
  }
  static readonly DiasPredefinidos = 60;
  /* Calcula 60 días antes de la fecha dada */
  static restarDiasTimestamp(
    fechaMilisegundos: number,
    diasAntes: number = UtilesModule.DiasPredefinidos
  ): number {
    return fechaMilisegundos - diasAntes * 24 * 60 * 60 * 1000;
  }
}
