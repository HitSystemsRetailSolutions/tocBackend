import { TiposIvaInterface, TiposIvaFormat } from "./tiposIva.interface";
import { parametrosInstance } from "src/parametros/parametros.clase";
import * as schTipusIva from "./tiposIva.mongodb";
import axios from "axios";
import { logger } from "src/logger";
export class TiposIvaClase {
  public arrayIvas: TiposIvaFormat[] = [];
  public arrayDecimal: TiposIvaFormat[] = [];
  private datosCargados = false; // Controla si ya se cargaron los datos correctamente
  private TypesIvaDefault: TiposIvaFormat[] = [
    { tipus: "1", iva: 21 },
    { tipus: "2", iva: 10 },
    { tipus: "3", iva: 4 },
  ];
  private arrayDefault2023JAN: TiposIvaFormat[] = [
    { tipus: "1", iva: 4 },
    { tipus: "2", iva: 10 },
    { tipus: "3", iva: 21 },
    { tipus: "4", iva: 0 },
    { tipus: "5", iva: 5 },
  ];
  private arrayDefault2024OCT: TiposIvaFormat[] = [
    { tipus: "1", iva: 4 },
    { tipus: "2", iva: 10 },
    { tipus: "3", iva: 21 },
    { tipus: "4", iva: 2 },
    { tipus: "5", iva: 7.5 },
  ];
  /* el iva 2025 Jan pendiente de confirmar si tipo 5 es 7.5 o 10 y si tipo 4 es 2 0 4. 
   El cambio de 7.5 a 10 y de 2 a 4 hay dos maneras. Se modifica el valor en tipo 5 (7.5 a 10) 
   o se selecciona el tipo 2 que ya tiene el 10% */
  private arrayDefault2025JAN: TiposIvaFormat[] = [
    { tipus: "1", iva: 4 },
    { tipus: "2", iva: 10 },
    { tipus: "3", iva: 21 },
    { tipus: "4", iva: 4 },
    { tipus: "5", iva: 10 },
  ];
  constructor() {
    this.getArrayIvas();
  }
  public async LoadTypesOfIVA(
    forceUpdate: boolean = false
  ): Promise<TiposIvaFormat[]> {
    if (!forceUpdate && this.datosCargados && this.arrayIvas.length) {
      return this.arrayIvas;
    }
    try {
      // Obtener los datos de Santa Ana y Mongo simultáneamente para evitar tiempo de espera adicional
      const [dataSantaAna, dataMongo] = await Promise.all([
        this.getTypesOfIVASantaAna(),
        schTipusIva.getTypesOfIVA(),
      ]);

      // Si no hay datos en Santa Ana
      if (!dataSantaAna.length) {
        if (!dataMongo.length) {
          throw new Error(
            "No hay datos en MongoDB ni en Santa Ana, usando valores Defaults"
          );
        }

        // Si solo hay datos en Mongo, retornarlos
        this.arrayIvas = this.sortAndReturn(dataMongo);
        return this.arrayIvas;
      }

      // Ordenar solo cuando se necesita y comparar longitudes
      const sortedSantaAna = this.sortAndReturn(dataSantaAna);
      const sortedMongo = this.sortAndReturn(dataMongo);

      if (sortedSantaAna !== sortedMongo) {
        // Sincronizar Mongo con Santa Ana solo si hay diferencias
        await schTipusIva.setTypesOfIVA(sortedSantaAna);
      }

      this.arrayIvas = sortedSantaAna;
      this.datosCargados = true;
    } catch (error) {
      logger.Error(error.message);
      // Si ocurre un error, cargar los valores predeterminados
      this.arrayIvas = this.getDefaultArray();
    } finally {
      this.getArrayDecimal(); // Asegurarse de que siempre se ejecute
    }
    return this.arrayIvas;
  }

  // Método auxiliar para ordenar arrays y simplificar el código
  private sortAndReturn(data: TiposIvaFormat[]): TiposIvaFormat[] {
    return data.sort((a, b) => a.tipus.localeCompare(b.tipus));
  }
  private getDefaultArray(): TiposIvaFormat[] {
    const currentDate = new Date();
    if (currentDate >= new Date("2025-01-01")) {
      logger.Info("Usando ivas 2025 Jan");
      return this.arrayDefault2025JAN;
    } else if (currentDate >= new Date("2024-10-01")) {
      logger.Info("Usando ivas 2024 Oct");
      return this.arrayDefault2024OCT;
    } else {
      logger.Info("Usando Ivas 2023 Jan");
      return this.arrayDefault2023JAN;
    }
  }

  public async getTypesOfIVASantaAna(): Promise<TiposIvaFormat[]> {
    try {
      const parameters = await parametrosInstance.getParametros();
      const params = {
        codigoTienda: parameters.codigoTienda,
        database: parameters.database,
      };
      const res = await axios.get("tiposIva/getTypesOfIVA");
      if (!res.data) {
        return [];
      }
      return res.data;
    } catch (error) {
      return [];
    }
  }

  public async getArrayIvas(): Promise<TiposIvaFormat[]> {
    try {
      if (this.arrayIvas.length === 0) {
        const dataMongo = await schTipusIva.getTypesOfIVA();

        if (dataMongo.length) {
          this.arrayIvas = dataMongo;
        }
        throw new Error(
          "Error al obtener ivas de MongoDB, usando valores Defaults"
        );
      }
      return this.arrayIvas;
    } catch (error) {
      logger.Error(error.message);
      this.arrayIvas = this.getDefaultArray();
    } finally {
      this.getArrayDecimal();
    }
  }
  getArrayDecimal() {
    this.arrayDecimal = this.arrayIvas.map((iva) => {
      return { tipus: iva.tipus, iva: iva.iva / 100 };
    });
  }
}

export const tiposIvaInstance = new TiposIvaClase();
