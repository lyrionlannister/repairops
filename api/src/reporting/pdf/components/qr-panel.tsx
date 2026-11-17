import { View, Text, Svg, Path } from "@react-pdf/renderer";
import { QR_INK, type NoteStyles } from "../theme.js";
import { buildQrPath } from "../qr-matrix.js";

const QR_SIZE_PT = 104;
const STEPS = [
  "Abre la cámara de tu teléfono y apunta al QR",
  "Envía el mensaje que ya viene escrito",
  "Recibe el estado de tu nota al instante",
];

// Solo lo usa la nota de reparación (consulta por WhatsApp); sin URL no se
// dibuja, nunca un QR roto.
export const QrPanel: React.FC<{ styles: NoteStyles; url: string | null; publicRef: string }> = ({
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
        <Text style={styles.qrRef}>REF · {publicRef}</Text>
      </View>
      <View style={styles.qrText}>
        <Text style={styles.qrTitle}>¿Cómo va tu equipo?</Text>
        <Text style={styles.qrHint}>
          Escanea el código y consulta el estado de tu nota por WhatsApp, sin llamar ni venir al taller.
        </Text>
        {STEPS.map((step, index) => (
          <View key={step} style={styles.step}>
            <Text style={styles.stepDot}>{index + 1}</Text>
            <Text>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
