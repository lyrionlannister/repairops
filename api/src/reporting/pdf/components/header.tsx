import { View, Text, Image } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { PdfStyles } from "../theme.js";
import type { PdfLocal } from "../documents/pdf-local.js";

interface HeaderProps {
  styles: PdfStyles;
  local: PdfLocal;
  subtitle?: string;
  side: ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ styles, local, subtitle, side }) => (
  <>
    <View style={styles.accentBar} />
    <View style={styles.header}>
      <View style={styles.logoBox}>
        {local.logo ? (
          <Image style={styles.logo} src={local.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoPlaceholderText}>SIN LOGO</Text>
          </View>
        )}
      </View>
      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>{local.name ?? "Reparación de Celulares y Tablets"}</Text>
        {subtitle && <Text style={styles.companySubtitle}>{subtitle}</Text>}
        {local.phone && <Text style={styles.companyPhone}>Tel. {local.phone}</Text>}
        {local.address && <Text style={styles.companyAddress}>{local.address}</Text>}
      </View>
      <View style={styles.headerSide}>{side}</View>
    </View>
  </>
);
