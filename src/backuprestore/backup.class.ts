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
}
const backupRestoreInstance = new BackupRestore();
export { backupRestoreInstance };
