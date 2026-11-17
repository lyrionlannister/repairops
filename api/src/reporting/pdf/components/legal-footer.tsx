import { Text } from "@react-pdf/renderer";
import type { PdfStyles } from "../theme.js";

export const LegalFooter: React.FC<{ styles: PdfStyles; children: string }> = ({ styles, children }) => (
  <Text style={styles.legalNote}>{children}</Text>
);
