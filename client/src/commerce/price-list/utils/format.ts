export const formatPrice = (value: number) =>
  `$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 0 })}`;
