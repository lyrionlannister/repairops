/**
 * Props para el componente Avatar.
 * @property src - URL de la imagen del avatar. Si no hay, se pintan las iniciales de `name`.
 * @property name - Nombre completo, para las iniciales cuando no hay `src`.
 * @property alt - Texto alternativo para la imagen.
 * @property size - Tamaño del avatar (xsmall, small, medium, large, xlarge, xxlarge).
 * @property status - Indicador de estado (online, offline, busy, none).
 */
export interface AvatarProps {
  src?: string | null;
  name?: string;
  alt?: string;
  size?: "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge";
  status?: "online" | "offline" | "busy" | "none";
}
