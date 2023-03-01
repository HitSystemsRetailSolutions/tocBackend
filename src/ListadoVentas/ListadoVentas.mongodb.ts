
import { conexion } from "../conexion/mongodb";


/* Uri */
export async function GetTickets() {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection("tickets");
  return (articulos.find().toArray());
}

/* Uri */
export async function GetParams() {
  const database = (await conexion).db("tocgame");
  const articulos = database.collection("parametros");
  return (articulos.find().toArray());
}
