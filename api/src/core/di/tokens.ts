// Tokens de DI para dependencias que no son clases (singletons exportados,
// clientes de infraestructura) -- el resto se resuelve por tipo concreto o
// por la clase Entity (ver bootstrap de repositorios en index.ts).
export const REDIS_CLIENT = "REDIS_CLIENT";
