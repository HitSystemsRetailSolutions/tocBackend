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

/* Eze 4.0 */
export async function getClienteById(
  idCliente: ClientesInterface["id"]
): Promise<ClientesInterface> {
  const database = (await conexion).db("tocgame");
  const clientes = database.collection<ClientesInterface>("clientes");
  return await clientes.findOne({ id: idCliente });
}

export async function isClienteDescuento(
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

export async function eliminarCliente(
  idCliente: ClientesInterface["id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const clientes = database.collection<ClientesInterface>("clientes");
  const resultado = await clientes.deleteOne({ id: idCliente });
  return resultado.acknowledged && resultado.deletedCount === 1;
}

export async function getClientePedidosTienda(codigoTienda: number) {
  const database = (await conexion).db("tocgame");
  const clientes = database.collection<ClientesInterface>("clientes");
  const resultado = await clientes.findOne({ id: `CliBoti_${codigoTienda}_pedidosTienda` });
  return resultado;
}

export async function insertarCliente(clienteMDB: ClientesInterface) {
  const database = (await conexion).db("tocgame");
  const clientes = database.collection("clientes");
  return clientes.insertOne(clienteMDB);
}
