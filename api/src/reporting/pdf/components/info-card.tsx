import { View, Text } from "@react-pdf/renderer";
import type { PdfStyles } from "../theme.js";

export const Field: React.FC<{ styles: PdfStyles; label: string; value: string; flex?: boolean }> = ({
  styles,
  label,
  value,
  flex,
}) => (
  <View style={flex ? styles.fieldFlex : styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </View>
);

export const SectionLabel: React.FC<{ styles: PdfStyles; children: string }> = ({ styles, children }) => (
  <View style={styles.sectionLabel}>
    <View style={styles.sectionLabelBar} />
    <Text style={styles.sectionLabelText}>{children}</Text>
  </View>
);

export const Check: React.FC<{ styles: PdfStyles; checked: boolean; label: string }> = ({ styles, checked, label }) => (
  <View style={styles.checkItem}>
    <View style={checked ? styles.checkBoxOn : styles.checkBoxOff} />
    <Text style={checked ? styles.checkLabelOn : styles.checkLabelOff}>{label}</Text>
  </View>
);
