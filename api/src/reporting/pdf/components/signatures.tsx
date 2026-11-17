import { View, Text } from "@react-pdf/renderer";
import type { NoteStyles } from "../theme.js";

export const Signatures: React.FC<{ styles: NoteStyles; labels: string[] }> = ({ styles, labels }) => (
  <View style={styles.signatures} wrap={false}>
    {labels.map((label) => (
      <Text key={label} style={styles.signatureBox}>
        {label}
      </Text>
    ))}
  </View>
);
