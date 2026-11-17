import { View, Text } from "@react-pdf/renderer";
import type { NoteStyles } from "../theme.js";

// Tarjeta con fondo de marca (CLIENTE/EQUIPO) -- título corto + línea secundaria opcional.
export const TintCard: React.FC<{ styles: NoteStyles; label: string; title: string; sub?: string | null }> = ({
  styles,
  label,
  title,
  sub,
}) => (
  <View style={styles.tintCard}>
    <Text style={styles.cardLabelTint}>{label}</Text>
    <Text style={styles.cardTitle}>{title}</Text>
    {sub && <Text style={styles.cardSub}>{sub}</Text>}
  </View>
);

// Tarjeta sin fondo (FALLA REPORTADA, HALLAZGOS, etc.) -- un bloque de texto por hijo.
export const PlainCard: React.FC<{ styles: NoteStyles; blocks: Array<{ label: string; text: string }> }> = ({
  styles,
  blocks,
}) => (
  <View style={styles.plainCard} wrap={false}>
    {blocks.map((block, index) => (
      <View key={block.label} style={index > 0 ? { marginTop: 8 } : undefined}>
        <Text style={styles.cardLabel}>{block.label}</Text>
        <Text style={styles.cardText}>{block.text}</Text>
      </View>
    ))}
  </View>
);
