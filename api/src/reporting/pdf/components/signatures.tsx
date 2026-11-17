import { View, Text } from "@react-pdf/renderer";
import type { PdfStyles } from "../theme.js";

export const Signatures: React.FC<{ styles: PdfStyles; labels: string[] }> = ({ styles, labels }) => (
  <View style={styles.signatures} wrap={false}>
    {labels.map((label) => (
      <View key={label} style={styles.signatureBox}>
        <Text style={styles.signatureLine}>{label}</Text>
      </View>
    ))}
  </View>
);
