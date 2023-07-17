import { archivosInterface } from "./archivos.interface";
import * as schArchivos from "./archivos.mongodb";

export class Archivos {
  async getLogo(): Promise<archivosInterface> {
    return schArchivos.getLogo();
  }

  async insertarArchivo(
    tipo: string,
    extension: string,
    archivo: string
  ): Promise<boolean> {
    return schArchivos.insertarArchivo(tipo, extension, archivo);
  }
}

export const archivosInstance = new Archivos();
