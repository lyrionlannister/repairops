export const formatMoney = (value: number) =>
  `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
