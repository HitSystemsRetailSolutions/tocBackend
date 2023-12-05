export interface ClientesInterface {
  id: string;
  nombre: string;
  tarjetaCliente: string;
  albaran: boolean;
  noPagaEnTienda: boolean;
  descuento: number;
  telefono: string;
}

// array de descuentosEspeciales dependiendo del cliente
// guarda la idCLiente, a que precio se activa y el precio final
const descuentoEspecial = [
  {
    idCliente: "CliBoti_000_{7A6EA7B0-3229-4A94-81EA-232F4666A7BE}",
    activacion: 12,
    precio: 3.99,
  },
];

export default descuentoEspecial;
