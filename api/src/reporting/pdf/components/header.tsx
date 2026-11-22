import { View, Text, Image } from "@react-pdf/renderer";
import type { NoteStyles } from "../theme.js";
import type { PdfLocal } from "../documents/pdf-local.js";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

interface DocumentHeaderProps {
  styles: NoteStyles;
  local: PdfLocal;
  folioLabel: string;
  folioValue: string;
  folioDate: string;
}

// Franja oscura compartida por todo documento de carta (nota, cotización):
// logo o iniciales del taller, nombre y contacto, y la tarjeta de folio.
export const DocumentHeader: React.FC<DocumentHeaderProps> = ({ styles, local, folioLabel, folioValue, folioDate }) => {
  const name = local.name ?? "Reparación de Celulares y Tablets";
  const contact = [local.address, local.phone && `Tel. ${local.phone}`].filter(Boolean).join(" · ");

  return (
    <View style={styles.header}>
      <View style={styles.logoBox}>
        {local.logo ? <Image style={styles.logo} src={local.logo} /> : <Text style={styles.logoInitials}>{initialsOf(name)}</Text>}
      </View>
      <View style={styles.company}>
        <Text style={styles.companyName}>{name}</Text>
        {contact && <Text style={styles.companyLine}>{contact}</Text>}
      </View>
      <View style={styles.folioCard}>
        <Text style={styles.folioLabel}>{folioLabel}</Text>
        <Text style={styles.folio}>{folioValue}</Text>
        <Text style={styles.folioDate}>{folioDate}</Text>
      </View>
    </View>
  );
};
