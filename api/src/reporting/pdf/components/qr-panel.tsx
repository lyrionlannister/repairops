import { View, Text, Svg, Path } from "@react-pdf/renderer";
import { QR_INK, type PdfStyles } from "../theme.js";
import { buildQrPath } from "../qr-matrix.js";

const QR_SIZE_PT = 96;

// El QR y su panel solo se dibujan con una URL real: sin numero de WhatsApp
// configurado el documento sale sin panel, nunca con un QR roto. El QR va
// siempre en negro puro (no lleva color de marca) para escanear bien.
export const QrPanel: React.FC<{ styles: PdfStyles; url: string | null; publicRef: string }> = ({
  styles,
  url,
  publicRef,
}) => {
  if (!url) return null;
  const { path, size } = buildQrPath(url);
  return (
    <View style={styles.qrPanel} wrap={false}>
      <View style={styles.qrFrame}>
        <Svg width={QR_SIZE_PT} height={QR_SIZE_PT} viewBox={`0 0 ${size} ${size}`}>
          <Path d={path} fill={QR_INK} />
        </Svg>
      </View>
      <View style={styles.qrText}>
        <Text style={styles.qrTitle}>Consulta tu nota por WhatsApp</Text>
        <Text style={styles.qrHint}>
          Escanea el código con la cámara de tu teléfono y envía el mensaje que aparece. Te responderemos con el
          estado de tu equipo.
        </Text>
        <Text style={styles.qrRef}>Ref. {publicRef}</Text>
      </View>
    </View>
  );
};
