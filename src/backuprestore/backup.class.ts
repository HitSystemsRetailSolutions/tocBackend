import { ObjectId } from "mongodb";
import { conexion } from "../conexion/mongodb";
import { logger } from "src/logger";
const fs = require("fs");
const path = require("path");

const dbName = "tocgame";
const backupFolder = path.resolve(__dirname, "../..", "backups");
export class BackupRestore {
  /**
   * Realiza un backup de una colección de MongoDB en un archivo JSON
   * @param collectionName  Nombre de la colección a respaldar
   */
  async backupCollection(collectionName) {
    try {
      this.deleteOldBackups();
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
        // Usamos for...of aquí
        // usar deleteMany si esta en otra iteracion

        const backupFilePath = path.join(backupFolder, backupFile);

        const backupData = await fs.promises.readFile(backupFilePath, "utf8");
        const documents = JSON.parse(backupData);

        try {
          const result = await db
            .collection(collectionName)
            .insertMany(documents);

          if (result.acknowledged) {
            console.log(`Restauración exitosa desde ${backupFile}`);
            logger.Info(`Restauración exitosa desde ${backupFile}`);
            return true;
          }
          throw Error(`Error al insertar la restauración desde ${backupFile}`);
        } catch (error) {
          await db.collection(collectionName).deleteMany({});

          console.log(
            `Error al restaurar backup ${backupFile}: ${error.message}`
          );
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
//  esta raro el delete, depende de la agrupacion, me borra bien las mas antiguas
  deleteOldBackups = () => {
    const files = fs.readdirSync(backupFolder); // Leer todos los archivos en la carpeta
    const backupsByCollection = {}; // Objeto para agrupar los archivos por colección

    if (!files || files.length <= 2) return;

    files.forEach((file) => {
      const filePath = path.join(backupFolder, file);
      const collectionName = file.split("_backup_")[0]; // Asumimos que el nombre de la colección está antes de '_backup_'

      if (!backupsByCollection[collectionName]) {
        backupsByCollection[collectionName] = [];
      }

      backupsByCollection[collectionName].push(filePath);
    });

    // 2. Para cada colección, ordenamos los archivos por fecha (usando la parte de la fecha en el nombre)
    Object.keys(backupsByCollection).forEach((collectionName) => {
      const filesInCollection = backupsByCollection[collectionName];

      filesInCollection.sort((a, b) => {
        const dateA = a.split("_backup_")[1]; // Extraemos la fecha del nombre del archivo
        const dateB = b.split("_backup_")[1]; // Hacemos lo mismo con el segundo archivo

        return dateB.localeCompare(dateA); // Comparar las fechas (de más reciente a más antiguo)
      });
      console.log(filesInCollection);
      // 3. Mantener solo los 2 archivos más recientes de cada colección
      const filesToDelete = filesInCollection.slice(-filesInCollection.length+2); // Obtener todos los archivos excepto los dos más recientes

      // 4. Eliminar los archivos más antiguos
      filesToDelete.forEach((file) => {
        fs.unlinkSync(file); // Eliminar el archivo
        console.log(`Eliminado archivo antiguo: ${file}`);
      });
    });
  };
}
const backupRestoreInstance = new BackupRestore();
export { backupRestoreInstance };
