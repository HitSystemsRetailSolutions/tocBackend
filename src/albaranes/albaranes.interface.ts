import { TicketsInterface } from "src/tickets/tickets.interface";

export interface AlbaranesInterface extends TicketsInterface{
    finalizado?: boolean;
    estado: "DEUDA" | "NO_PAGA_EN_TIENDA" | "PAGADO";
}