import { ObjectId } from "mongodb";
import { articulosInstance } from "src/articulos/articulos.clase";
import { cestasInstance } from "src/cestas/cestas.clase";

export class receiveItemsMQTTClass {

    async getIdCesta(table: number): Promise<ObjectId> {

        return (cestasInstance.getCestaByMesa(table));
    }

    async addItemToTable(idItem, grams, table, units, suplements) {
        let idcesta = await this.getIdCesta(table);
        let arraySuplementos = await articulosInstance.getSuplementos(suplements);

        const resultado = await cestasInstance.clickTeclaArticulo(
            idItem,
            grams,
            idcesta,
            units,
            arraySuplementos,
            "",
            ""
        );
        await cestasInstance.actualizarCestas();

    }
}

export const receiveItemsMQTTInstance = new receiveItemsMQTTClass();
