import { conexion } from "../conexion/mongodb";
import { FamiliasInterface } from "./familias.interface";

/* Eze 4.0 */
export async function insertarFamilias(arrayFamilias: FamiliasInterface[]) {
  await borrarFamilias();
  const database = (await conexion).db("tocgame");
  const familias = database.collection<FamiliasInterface>("familias");
  return (await familias.insertMany(arrayFamilias)).acknowledged;
}

/* Eze 4.0 */
export async function borrarFamilias(): Promise<void> {
  const database = (await conexion).db("tocgame");
  const collectionList = await database.listCollections().toArray();
  for (let i = 0; i < collectionList.length; i++) {
    if (collectionList[i].name === "familias") {
      await database.collection("familias").drop();
      break;
    }
  }
}
