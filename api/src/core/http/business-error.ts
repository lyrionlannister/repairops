// Error de negocio con mensaje pensado para el usuario: es el ÚNICO tipo de
// error cuyo `message` llega al cliente (ver sendError). Cualquier otro
// `Error` plano se convierte en un mensaje genérico y su detalle queda solo
// en el log del servidor -- así nunca se filtran detalles internos de
// Stripe, TypeORM o del propio código. `status` opcional: el controlador
// usa 403 para casos como el registro cerrado.
export class BusinessError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}
