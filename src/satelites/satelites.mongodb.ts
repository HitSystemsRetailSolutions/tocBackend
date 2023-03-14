import { conexion } from "../conexion/mongodb";
import { logger } from "../logger";

export async function verifyToken(token: string): Promise<any> {
  try {
    const database = (await conexion).db("tocgame");
    const satelites = database.collection("satelites");
    const resultado = await satelites.findOne({ token });
    return resultado;
  } catch (err) {
    logger.Error(100, err);
    return false;
  }
}

// export async function addToken(token: string): Promise<any> {
//     try {
//         const database = (await conexion).db("tocgame");
//         const satelites = database.collection("satelites");
//         const resultado = await satelites.insertOne({ token });
//         return resultado;
//     } catch (err) {
//         logger.Error(err);
//         return false;
//     }
// }
