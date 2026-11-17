import { View, Text } from "@react-pdf/renderer";
import type { NoteStyles } from "../theme.js";

export const FooterBand: React.FC<{ styles: NoteStyles; left: string; right: string }> = ({ styles, left, right }) => (
  <View style={styles.footer}>
    <Text style={styles.footerLeft}>{left}</Text>
    <Text style={styles.footerRight}>{right}</Text>
  </View>
);
