import { logger } from "src/logger";
let cachedVersion: string | undefined;

export function getDataVersion(): string | undefined {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    const version = process.env.npm_package_version;

    if (!version) {
      logger.Error('La variable de entorno npm_package_version no está definida.');
      return undefined;
    }

    cachedVersion = version;
    return cachedVersion;
  } catch (error) {
    logger.Error('Error al acceder a la variable de entorno npm_package_version:', error);
    return undefined;
  }
}