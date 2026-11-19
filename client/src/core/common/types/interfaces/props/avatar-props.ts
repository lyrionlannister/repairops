/**
 * @property src - URL de la imagen del avatar. Si no hay, se pintan las iniciales de `name`.
 * @property name - Nombre completo, para las iniciales cuando no hay `src`.
 */
export interface AvatarProps {
  src?: string | null;
  name?: string;
  alt?: string;
  size?: "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge";
  status?: "online" | "offline" | "busy" | "none";
}
