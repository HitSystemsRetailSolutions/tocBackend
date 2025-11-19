import { ObjectId } from "mongodb";
import { conexion } from "../conexion/mongodb";
import { logger } from "src/logger";
const fs = require("fs");
const path = require("path");

const dbName = "tocgame";
const backupFolder = path.resolve(__dirname, "../..", "backups");
export class BackupRestore {
  // Constructor para eliminar backups antiguos
  constructor() {
    this.deleteOldBackups();
  }

  /**
   * Realiza un backup de una colección de MongoDB en un archivo JSON
   * @param collectionName  Nombre de la colección a respaldar
   */
  async backupCollection(collectionName) {
    try {
      // Ruta de la carpeta y archivo de backup
      const date = new Date().toISOString().replace(/:/g, "-");
      const backupFilePath = path.join(
        backupFolder,
        `${collectionName}_backup_${date}.json`
      );

      // Obtener la conexión a MongoDB desde la conexión centralizada
      const db = (await conexion).db(dbName);
      if (!db) {
        throw new Error(`La base de datos ${dbName} no existe`);
      }
      const collection = db.collection(collectionName);
      if (!collection) {
        throw new Error(
          `La colección ${collectionName} no existe en la base de datos ${dbName}`
        );
      }

      // Obtener todos los documentos de la colección
      const documents = await collection.find({}).toArray();

      // Crear la carpeta de backup si no existe
      if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder, { recursive: true });
      }

      // Escribir los documentos en un archivo JSON
      fs.writeFileSync(
        backupFilePath,
        JSON.stringify(documents, null, 2),
        "utf8"
      );
    } catch (error) {
      logger.Error(`Error durante el backup de ${collectionName}:`, error);
    }
  }

  /**
   *  Restaura una colección de MongoDB a partir de un archivo de backup
   * @param collectionName  Nombre de la colección a restaurar
   * @returns  true si la restauración fue exitosa, de lo contrario lanza un error
   */
  async restoreCollection(collectionName) {
    try {
      const files = await fs.promises.readdir(backupFolder);

      const collectionBackups = files.filter(
        (file) => file.startsWith(collectionName) && file.endsWith(".json")
      );

      if (collectionBackups.length === 0) {
        throw new Error(`No se encontraron backups para ${collectionName}`);
      }

      // Ordenar los backups por fecha (nombre del archivo contiene timestamp)
      collectionBackups.sort();

      const db = (await conexion).db(dbName);
      if (!db) {
        throw new Error(`La base de datos ${dbName} no existe`);
      }
      const collections = await db.listCollections().toArray(); // Obtener todas las colecciones existentes

      // Verificar si la colección existe para eliminar los documentos actuales
      const collectionExists = collections.some(
        (collection) => collection.name === collectionName
      );

      if (collectionExists) {
        const collection = db.collection(collectionName);
        await collection.deleteMany({});
      }

      for (const backupFile of collectionBackups.reverse()) {
        const backupFilePath = path.join(backupFolder, backupFile);

        const backupData = await fs.promises.readFile(backupFilePath, "utf8");
        const documents = JSON.parse(backupData);

        try {
          const result = await db
            .collection(collectionName)
            .insertMany(documents);

          if (result.acknowledged) {
            logger.Info(`Restauración exitosa desde ${backupFile}`);
            return true;
          }
          throw Error(`Error al insertar la restauración desde ${backupFile}`);
        } catch (error) {
          await db.collection(collectionName).deleteMany({});

          logger.Error(
            `Error al restaurar backup ${backupFile}: ${error.message}`
          );
        }
      }
      throw new Error(`Error al insertar la restauracion en ${collectionName}`);
    } catch (error) {
      console.log("Error al restaurar el backup:", error);
      return false;
    }
  }

  getGroupedBackups() {
    const groupedBackups = {};

    fs.readdirSync(backupFolder).forEach((file) => {
      if (file.includes("_backup_") && file.endsWith(".json")) {
        const collectionName = file.split("_backup_")[0];

        // Agrupar por colección
        if (!groupedBackups[collectionName]) {
          groupedBackups[collectionName] = [];
        }
        groupedBackups[collectionName].push(file);
      }
    });

    return groupedBackups;
  }

  // Función para eliminar backups antiguos si hay más de 3 en cada colección
  deleteOldBackups() {
    const groupedBackups = this.getGroupedBackups();
    Object.keys(groupedBackups).forEach((collection) => {
      let backups = groupedBackups[collection];

      backups.sort();

      while (backups.length > 3) {
        const fileToDelete = backups.shift();
        const filePath = path.join(backupFolder, fileToDelete);

        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          logger.Error(`Error al borrar ${fileToDelete}: ` + err);
        }
      }
    });
  }

  // CONFIGURACION PARA BACKUP ATÓMICO DEL ÚLTIMO TICKET

  // Ruta del archivo de backup permanente
  BACKUP_FILE_TICKET = path.join(
    __dirname,
    "../../backups/latest_ticket_backup.jsonl"
  );
  // Archivo temporal para la escritura atómica
  TEMP_FILE_TICKET = path.join(
    __dirname,
    "../../backups/latest_ticket_backup.jsonl.tmp"
  );

  /**
   * Sobrescribe el archivo de backup con el JSON del último ticket de forma atómica.
   * @param {object} ticket El objeto completo del ticket a respaldar.
   */
  public backupSingleTicket(ticket) {
    try {
      fs.mkdirSync(path.join(__dirname, "../../backups"), { recursive: true });

      // 1. Convertir el objeto completo del ticket a una línea JSON.
      // Se añade un salto de línea para adherirse al estándar JSONL (aunque solo sea 1 línea).
      const ticketJsonLine = JSON.stringify(ticket) + "\n";

      // 2. Escribir el contenido completo en un archivo temporal.
      // Se usa 'writeFileSync' porque estamos escribiendo solo un registro.
      fs.writeFileSync(this.TEMP_FILE_TICKET, ticketJsonLine, "utf8");
      fs.writeFileSync(this.TEMP_FILE_TICKET, ticketJsonLine, "utf8");

      // 3. Forzar la escritura física a disco.
      // Esto es crucial para la atomicidad. Garantiza que el SO ha terminado de escribir.
      const tempFd = fs.openSync(this.TEMP_FILE_TICKET, "r+");
      fs.fsyncSync(tempFd);
      fs.closeSync(tempFd);

      // 4. Renombrar (Operación Atómica).
      // Se reemplaza el archivo original por el temporal de forma instantánea.
      fs.renameSync(this.TEMP_FILE_TICKET, this.BACKUP_FILE_TICKET);
    } catch (err) {
      // Si hay un error, el archivo original (BACKUP_FILE) no ha sido tocado.
      console.error("Error al realizar el backup atómico del ticket:", err);
    }
  }

  /**
   * Lee el archivo de backup atómico y recupera el JSON del último ticket.
   * @returns {object | null} El objeto JSON del ticket, o null si el archivo no existe o está vacío/corrupto.
   */
  public recoverSingleTicket() {
    try {
      // 1. Leer el contenido completo del archivo de backup.
      // Dado que solo contiene un registro, esta operación es rápida.
      const content = fs.readFileSync(this.BACKUP_FILE_TICKET, "utf8");

      // Si el archivo existe pero está vacío, retornamos null.
      if (!content.trim()) {
        console.log("Archivo de backup encontrado, pero está vacío.");
        return null;
      }

      // 2. Intentar parsear el contenido.
      // Usamos trim() para eliminar cualquier espacio en blanco o salto de línea al final.
      const jsonLine = content.trim();
      const recoveredTicket = JSON.parse(jsonLine);

      return recoveredTicket;
    } catch (err) {
      // Manejo de errores común:

      // Error más común: el archivo no existe (ej: primera ejecución o no hay nada que recuperar).
      if (err.code === "ENOENT") {
        console.log(
          "No se encontró el archivo de backup. No hay tickets para recuperar."
        );
        return null;
      }

      // Error si el JSON dentro del archivo es inválido (aunque la escritura atómica minimiza esto).
      if (err instanceof SyntaxError) {
        console.error(
          "Error de sintaxis JSON en el archivo de backup. El registro puede estar corrupto."
        );
        return null;
      }

      // Cualquier otro error de lectura.
      console.error("Error inesperado al leer el archivo de backup:", err);
      return null;
    }
  }
}
const backupRestoreInstance = new BackupRestore();
export { backupRestoreInstance };
