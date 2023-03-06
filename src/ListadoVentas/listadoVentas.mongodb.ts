
import { conexion } from "../conexion/mongodb";


/* Uri */
export async function getTickets() {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection("tickets");
  return (articulos.find().toArray());
}


