import { logger } from "src/logger";
let cachedVersion: string | undefined;
export const versionDescuentosClient="4.25.29";
export function obtenerVersionAnterior(version) {
  let [mayor, menor, parche] = version.split('.').map(Number);

  if (parche > 0) {
    parche--;
  } else if (menor > 0) {
    menor--;
    parche = 99; // asumimos que el parche máximo es 99
  } else if (mayor > 0) {
    mayor--;
    menor = 99;
    parche = 99;
  } else {
    return null; // Ya estás en la versión 0.0.0
  }

  return `${mayor}.${menor}.${parche}`;
}
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