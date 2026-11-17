import { View, Text } from "@react-pdf/renderer";
import type { NoteStyles } from "../theme.js";

interface TotalsCardProps {
  styles: NoteStyles;
  rows: Array<{ label: string; value: string }>;
  balanceLabel: string;
  balanceValue: string;
}

// Tarjeta de totales compartida: filas simples arriba, fila de balance
// resaltada al fondo (SALDO A LIQUIDAR en la nota, TOTAL en la cotización).
export const TotalsCard: React.FC<TotalsCardProps> = ({ styles, rows, balanceLabel, balanceValue }) => (
  <View style={styles.totalsCard}>
    {rows.map((row) => (
      <View key={row.label} style={styles.totalsRow}>
        <Text style={styles.totalsKey}>{row.label}</Text>
        <Text style={styles.totalsVal}>{row.value}</Text>
      </View>
    ))}
    <View style={styles.balanceRow}>
      <Text style={styles.balanceLabel}>{balanceLabel}</Text>
      <Text style={styles.balanceValue}>{balanceValue}</Text>
    </View>
  </View>
);
