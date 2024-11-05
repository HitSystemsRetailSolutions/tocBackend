import { ObjectId } from "mongodb";
import { articulosInstance } from "src/articulos/articulos.clase";
import { cestasInstance } from "src/cestas/cestas.clase";

export class receiveItemsMQTTClass {

    async getIdCesta(table: number): Promise<ObjectId> {

        return (cestasInstance.getCestaByMesa(table));
    }

    async addItemToTable(idItem, grams, table, units, suplements) {
        let idcesta = await this.getIdCesta(table);
        let arraySuplementos = suplements.map((suplement) => { return articulosInstance.getSuplementos(suplement) });
        const resultado = await cestasInstance.clickTeclaArticulo(
            idItem,
            grams,
            idcesta,
            units,
            arraySuplementos,
            "",
            ""
        );
        console.log(resultado)
        await cestasInstance.actualizarCestas();

    }
}

export const receiveItemsMQTTInstance = new receiveItemsMQTTClass();
