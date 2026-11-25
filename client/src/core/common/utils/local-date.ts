// Fecha de hoy (YYYY-MM-DD) en el reloj del dispositivo. toISOString() da la
// fecha UTC: en México, después de las 18:00 ya marcaba el día siguiente.
export const localToday = (): string => new Date().toLocaleDateString("en-CA");
