import { TicketsInterface } from "src/tickets/tickets.interface";

export interface AlbaranesInterface extends TicketsInterface {
  estado: "NO_PAGA_EN_TIENDA" | "PAGADO";
}
