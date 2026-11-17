// Zonas horarias IANA que ofrece "Mi Local". El API valida el nombre; esta lista solo
// evita escribirlo a mano.
export const TIME_ZONES: Array<{ value: string; label: string }> = [
  { value: "America/Mexico_City", label: "Centro de México (CDMX, Monterrey)" },
  { value: "America/Tijuana", label: "Pacífico (Tijuana)" },
  { value: "America/Hermosillo", label: "Sonora (sin horario de verano)" },
  { value: "America/Mazatlan", label: "Montaña (Mazatlán, Chihuahua)" },
  { value: "America/Cancun", label: "Sureste (Cancún)" },
  { value: "America/Bogota", label: "Colombia" },
  { value: "America/Lima", label: "Perú" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina" },
  { value: "America/Santiago", label: "Chile" },
  { value: "America/New_York", label: "Este de EE. UU." },
  { value: "America/Chicago", label: "Centro de EE. UU." },
  { value: "America/Los_Angeles", label: "Pacífico de EE. UU." },
  { value: "Europe/Madrid", label: "España" },
];
