export interface ClientesInterface {
  id: string;
  nombre: string;
  tarjetaCliente: string;
  albaran: boolean;
  noPagaEnTienda: boolean;
  descuento: number;
  telefono: string;
  nif?: string;
  direccion?: string;
  email?: string;
  dto?: Dto[];
  vip?: boolean;
}
export interface Dto {
  variable: string;
  valor: string;
  descuento: number;
}
//array de clientes de facturación, ej:GLOBO
export const arrayClientesFacturacion: ClientesInterface["id"][]=["CliBoti_000_{A83B364B-252F-464B-B0C3-AA89DA258F64}","CliBoti_000_{7A6EA7B0-3229-4A94-81EA-232F4666A7BE}","CliBoti_000_{2713C1E3-06C0-4099-851D-33018FD4851C}"]

// array de descuentosEspeciales dependiendo del cliente
// guarda la idCLiente, a que precio se activa y el precio final
export const descuentoEspecial = [
  {
    idCliente: "CliBoti_000_{7A6EA7B0-3229-4A94-81EA-232F4666A7BE}",
    activacion: 12,
    precio: 3.99,
  },
];

