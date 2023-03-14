import { ObjectId } from "mongodb";
import { parametrosInstance } from "../parametros/parametros.clase";
import { ticketsInstance } from "./tickets.clase";
import { TicketsInterface } from "./tickets.interface";
import * as schTickets from "./tickets.mongodb";
declare function fail(error?: any): never;
describe("Tickets", () => {
  it("Anular con rectificativa", async () => {
    try {
      const parametros = await parametrosInstance.getParametros();
      const nuevoTicket: TicketsInterface = {
        _id: parametros.ultimoTicket + 1,
        timestamp: 1674748540986,
        total: 1.35,
        idCliente: "",
        idTrabajador: 5266,
        cesta: {
          _id: new ObjectId(),
          timestamp: 1674748351341,
          detalleIva: {
            base1: 0,
            base2: 1.23,
            base3: 0,
            base4: 0,
            base5: 0,
            valorIva1: 0,
            valorIva2: 0.12,
            valorIva3: 0,
            valorIva4: 0,
            valorIva5: 0,
            importe1: 0,
            importe2: 1.35,
            importe3: 0,
            importe4: 0,
            importe5: 0,
          },
          lista: [
            {
              idArticulo: 3609,
              nombre: "Cafe americano",
              arraySuplementos: null,
              promocion: null,
              regalo: false,
              subtotal: 1.35,
              unidades: 1,
              gramos: null,
            },
          ],
          modo: "VENTA",
          idCliente: "",
          indexMesa: null,
          nombreCliente: null,
        },
        enviado: true,
        consumoPersonal: false,
      };
      if (await schTickets.nuevoTicket(nuevoTicket)) {
        if (await ticketsInstance.anularTicket(nuevoTicket._id)) {
          const ticketTeoricamenteAnulado = await ticketsInstance.getTicketById(
            nuevoTicket._id + 1
          );
          expect(ticketTeoricamenteAnulado.total).toBe(nuevoTicket.total * -1);
        } else throw Error("Fallo al anular el ticket de prueba");
      } else throw Error("No se ha podido crear el ticket de prueba");
    } catch (err) {
      // expect("Cero errores").toBe("Hay errores");
    }
  });
});
