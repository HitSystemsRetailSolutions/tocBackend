import { ObjectId } from "mongodb";
import { conexion } from "../conexion/mongodb";
import { EncargosInterface } from "./encargos.interface";

export async function getEncargos(): Promise<EncargosInterface[]> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");

  return await encargos.find({ estado: "SIN_RECOGER" }).toArray();
}


export async function setPedidoRepartidor(
  idEncargo: EncargosInterface["_id"],
  idRepartidor: EncargosInterface["idRepartidor"]
)
 {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");
  return (
    await encargos.updateOne(
      { _id: new ObjectId(idEncargo) },
      {
        $set: {
          idRepartidor: idRepartidor,
        }
      }
    )
  )
 }


export async function getPedidos(): Promise<EncargosInterface[]> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");

  return await encargos.find({ estado: "PEDIDOS" }).toArray();
}

export async function getEncargosByIdCliente(
  idCliente: EncargosInterface["idCliente"]
): Promise<EncargosInterface[]> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");

  return await encargos
    .find({ idCliente: idCliente, estado: "SIN_RECOGER" })
    .toArray();
}

export async function setCestaPedidos(idEncargo: any, cesta: any,total:number,productos:any): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");
  return (
    await encargos.updateOne(
      { _id: new ObjectId(idEncargo)  },
      {
        $set: {
          total: total,
          cesta: cesta,
          productos: productos,
          enviado: false,
        },
      }
    )
  ).acknowledged;
}


export async function setEncargo(encargo): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");
  // Insertamos todas las traducciones en la tabla traducciones.
  return encargos
    .insertOne(encargo)
    .then(() => true)
    .catch((err: any) => {
      return false;
    });
}
export async function getEncargoById(
  idEncargo: EncargosInterface["_id"]
): Promise<EncargosInterface> {
  const database = (await conexion).db("tocgame");
  const cesta = database.collection<EncargosInterface>("encargos");
  return await cesta.findOne({ _id: new ObjectId(idEncargo) });
}
// actualizamos el valor entregado a true;
export async function setEntregado(
  id: EncargosInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");
  return (
    await encargos.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          estado: "RECOGIDO",
          finalizado: false,
        },
      }
    )
  ).acknowledged;
}
export async function setAnulado(
  id: EncargosInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");
  return (
    await encargos.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          estado: "ANULADO",
          finalizado: false,
        },
      }
    )
  ).acknowledged;
}
// actualizamos el valor checked a true
export async function setChecked(
  id: EncargosInterface["_id"],
  nDia: EncargosInterface["dias"]
) {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");

  return (
    await encargos.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          dias: nDia,
        },
      }
    )
  ).acknowledged;
}

export async function getEncargoByNumber(
  codigoBarras
): Promise<EncargosInterface> {
  const database = (await conexion).db("tocgame");
  const clientes = database.collection<EncargosInterface>("encargos");
  return await clientes.findOne({ codigoBarras: codigoBarras });
}

export async function borrarEncargos(): Promise<void> {
  const database = (await conexion).db("tocgame");
  const collectionlist = await database.listCollections().toArray();

  for (let i = 0; i < collectionlist.length; i++) {
    if (collectionlist[i].name === "encargos") {
      await database.collection("encargos").drop();
      break;
    }
  }
}

export async function setEnviado(
  idEncargo: EncargosInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");
  return (
    await encargos.updateOne(
      { _id: new ObjectId(idEncargo) },
      {
        $set: {
          enviado: true,
        },
      }
    )
  ).acknowledged;
}

export async function getEncargoCreadoMasAntiguo(): Promise<EncargosInterface> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");
  return (await encargos.findOne(
    { enviado: false },
    { sort: { _id: 1 } }
  )) as EncargosInterface;
}

export async function getEncargoFinalizadoMasAntiguo(): Promise<EncargosInterface> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");
  return (await encargos.findOne(
    { finalizado: false, enviado: true },
    { sort: { _id: 1 } }
  )) as EncargosInterface;
}

export async function getEncargoPedidoCaducadoMasAntiguo(): Promise<EncargosInterface> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");
  const fechaHoraActual = new Date();
  const fechaActual = fechaHoraActual.toISOString().split("T")[0]; // "YYYY-MM-DD"
  const horaActual = fechaHoraActual
    .toTimeString()
    .split(" ")[0]
    .substring(0, 5); // "HH:MM"
  // busca un pedido con la fecha y hora caducada y este enviado en el santaAna
  return (await encargos.findOne(
    {
      pedido: true,
      enviado: true,
      finalizado: { $exists: false, $ne: true },
      $or: [
        { fecha: { $lt: fechaActual } },
        { fecha: fechaActual, hora: { $lt: horaActual } },
      ],
    },
    { sort: { _id: 1 } }
  )) as EncargosInterface;
}

export async function setFinalizado(
  idDeuda: EncargosInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");
  return (
    await encargos.updateOne(
      { _id: new ObjectId(idDeuda) },
      {
        $set: {
          finalizado: true,
        },
      }
    )
  ).acknowledged;
}
export async function setFinalizadoFalse(
  idDeuda: EncargosInterface["_id"]
): Promise<boolean> {
  const database = (await conexion).db("tocgame");
  const encargos = database.collection<EncargosInterface>("encargos");
  return (
    await encargos.updateOne(
      { _id: new ObjectId(idDeuda) },
      {
        $set: {
          finalizado: false,
        },
      }
    )
  ).acknowledged;
}
export async function getUpdateEncargos(): Promise<boolean> {
  try {
    const database = (await conexion).db("tocgame");
    const encargos = database.collection<EncargosInterface>("encargos");

    const documento = await encargos.findOne({ recogido: { $exists: true } });

    if (documento) {
      return false; // Existe al menos una deuda, devuelve false.
    } else {
      return true; // No existen encargos, devuelve true.
    }
  } catch (error) {
    console.error("Error al buscar documentos: ", error);
    throw error; // Lanza el error si ocurre un problema durante la búsqueda.
  }
}
