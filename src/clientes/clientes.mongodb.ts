import { conexion } from "../conexion/mongodb";
import { ClientesInterface } from "./clientes.interface";

/* Eze 4.0 */
export async function buscar(busqueda: string): Promise<ClientesInterface[]> {
  const database = (await conexion).db("tocgame");
  const clientes = database.collection<ClientesInterface>("clientes");
  return await clientes
    .find(
      {
        $or: [
          { nombre: { $regex: new RegExp(busqueda, "i") } },
          { tarjetaCliente: busqueda },
        ],
      },
      { limit: 20 }
    )
    .toArray();
}

/* Eze 4.0 */getClienteByNumber
export async function getClienteById(
  idCliente: ClientesInterface["id"]
): Promise<ClientesInterface> {
  const database = (await conexion).db("tocgame");
  const clientes = database.collection<ClientesInterface>("clientes");
  return await clientes.findOne({ id: idCliente });
}

/* Uri */
export async function getClienteByNumber(
  idTarjeta
): Promise<ClientesInterface> {
  const database = (await conexion).db("tocgame");
  const clientes = database.collection<ClientesInterface>("clientes");
  return await clientes.findOne({ tarjetaCliente: idTarjeta });
}

/* Eze 4.0 */
export async function borrarClientes(): Promise<void> {
  const database = (await conexion).db("tocgame");
  const collectionList = await database.listCollections().toArray();

  for (let i = 0; i < collectionList.length; i++) {
    if (collectionList[i].name === "clientes") {
      await database.collection("clientes").drop();
      break;
    }
  }
}

/* Eze 4.0 */
export async function insertarClientes(
  arrayClientes: ClientesInterface[]
): Promise<boolean> {
  await borrarClientes();
  const database = (await conexion).db("tocgame");
  const clientes = database.collection("clientes");
  return (await clientes.insertMany(arrayClientes)).acknowledged;
}
