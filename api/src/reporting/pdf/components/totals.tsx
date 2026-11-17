import { View, Text } from "@react-pdf/renderer";
import type { PdfStyles } from "../theme.js";

export const TotalsGrid: React.FC<{ styles: PdfStyles; cells: Array<{ label: string; value: string }> }> = ({
  styles,
  cells,
}) => (
  <View style={styles.totalsGrid} wrap={false}>
    {cells.map(({ label, value }) => (
      <View key={label} style={styles.totalsCell}>
        <Text style={styles.totalsLabel}>{label}</Text>
        <Text style={styles.totalsValue}>{value}</Text>
      </View>
    ))}
  </View>
);

export const TotalBar: React.FC<{ styles: PdfStyles; label: string; value: string }> = ({ styles, label, value }) => (
  <View style={styles.totalBar} wrap={false}>
    <Text style={styles.totalBarLabel}>{label}</Text>
    <Text style={styles.totalBarValue}>{value}</Text>
  </View>
);
