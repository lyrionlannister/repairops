import { Resend } from "resend";
import { requiredEnv } from "../../../core/config/env.js";

// Mismo criterio que stripe.client.ts: único lugar que instancia el SDK,
// funciones planas sin estado propio, consumidas solo por AuthService.
let client: Resend | null = null;

function resend(): Resend {
  if (!client) client = new Resend(requiredEnv("RESEND_API_KEY"));
  return client;
}

export interface SendVerificationEmailInput {
  to: string;
  firstName: string;
  code: string;
  verifyUrl: string;
}

const BRAND_500 = "#465FFF";
const BRAND_600 = "#3641F5";
const GRAY_900 = "#101828";
const GRAY_500 = "#667085";
const GRAY_200 = "#E4E7EC";

// Tablas + estilos inline a propósito: es lo único que Outlook/Gmail
// renderizan igual en todos lados (nada de flexbox/grid ni <style> externo).
function verificationEmailHtml(input: SendVerificationEmailInput): string {
  return `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:0; background-color:#F2F4F7; font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F4F7; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#FFFFFF; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="background-color:${GRAY_900}; padding:24px 32px;">
                <span style="color:#FFFFFF; font-size:18px; font-weight:700;">RepairOps</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px; color:${GRAY_900}; font-size:16px;">Hola ${input.firstName},</p>
                <p style="margin:0 0 24px; color:${GRAY_500}; font-size:14px; line-height:20px;">
                  Tu código para verificar tu correo en RepairOps es:
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                  <tr>
                    <td style="background-color:#F2F4F7; border:1px solid ${GRAY_200}; border-radius:12px; padding:16px 24px;">
                      <span style="font-size:32px; font-weight:700; letter-spacing:8px; color:${GRAY_900};">${input.code}</span>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 24px; color:${GRAY_500}; font-size:14px; line-height:20px; text-align:center;">
                  O confirma con un clic:
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                  <tr>
                    <td style="background-color:${BRAND_500}; border-radius:8px;">
                      <a href="${input.verifyUrl}" style="display:inline-block; padding:12px 28px; font-size:14px; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:8px; background-color:${BRAND_600};">
                        Confirmar correo
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0; color:${GRAY_500}; font-size:12px; line-height:18px; text-align:center;">
                  Este código vence en 24 horas. Si no creaste una cuenta en RepairOps, ignora este correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function verificationEmailText(input: SendVerificationEmailInput): string {
  return [
    `Hola ${input.firstName},`,
    "",
    `Tu código para verificar tu correo en RepairOps es: ${input.code}`,
    "",
    `O confirma con un clic: ${input.verifyUrl}`,
    "",
    "Este código vence en 24 horas. Si no creaste una cuenta en RepairOps, ignora este correo.",
  ].join("\n");
}

// El código es lo que de verdad confirma (visible aunque el cliente de
// correo bloquee imágenes/links); el botón es un atajo que precarga el
// código en la página -- igual hay que darle click ahí, nunca se confirma
// solo con abrir el correo (ver verify-email-page.tsx: evita que un
// escaneo automático de seguridad del correo queme el código antes de
// que la persona lo abra).
export async function sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
  const { error } = await resend().emails.send({
    from: requiredEnv("RESEND_FROM_EMAIL"),
    to: input.to,
    subject: `Tu código de verificación: ${input.code}`,
    html: verificationEmailHtml(input),
    text: verificationEmailText(input),
  });
  // Error de Resend (dominio no verificado, cuota, etc.): no lanza -- el
  // registro ya terminó y el owner puede pedir el correo de nuevo con
  // POST /auth/resend-verification. Solo queda en el log del servidor.
  if (error) {
    console.error("[resend] No se pudo enviar el correo de verificación:", error);
  }
}

export interface SendPasswordResetEmailInput {
  to: string;
  firstName: string;
  resetUrl: string;
}

function passwordResetEmailHtml(input: SendPasswordResetEmailInput): string {
  return `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:0; background-color:#F2F4F7; font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F4F7; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#FFFFFF; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="background-color:${GRAY_900}; padding:24px 32px;">
                <span style="color:#FFFFFF; font-size:18px; font-weight:700;">RepairOps</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px; color:${GRAY_900}; font-size:16px;">Hola ${input.firstName},</p>
                <p style="margin:0 0 24px; color:${GRAY_500}; font-size:14px; line-height:20px;">
                  Recibimos una solicitud para cambiar la contraseña de tu cuenta. Elige una nueva aquí:
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                  <tr>
                    <td style="background-color:${BRAND_500}; border-radius:8px;">
                      <a href="${input.resetUrl}" style="display:inline-block; padding:12px 28px; font-size:14px; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:8px; background-color:${BRAND_600};">
                        Cambiar contraseña
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0; color:${GRAY_500}; font-size:12px; line-height:18px; text-align:center;">
                  El enlace vence en 1 hora y solo sirve una vez. Si no lo pediste, ignora este correo: tu contraseña no cambia.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void> {
  const { error } = await resend().emails.send({
    from: requiredEnv("RESEND_FROM_EMAIL"),
    to: input.to,
    subject: "Cambia tu contraseña de RepairOps",
    html: passwordResetEmailHtml(input),
    text: [
      `Hola ${input.firstName},`,
      "",
      `Elige una nueva contraseña aquí: ${input.resetUrl}`,
      "",
      "El enlace vence en 1 hora y solo sirve una vez. Si no lo pediste, ignora este correo.",
    ].join("\n"),
  });
  // No lanza: la respuesta al usuario es la misma exista o no el correo,
  // así que un fallo de Resend solo queda en el log del servidor.
  if (error) {
    console.error("[resend] No se pudo enviar el correo de recuperación:", error);
  }
}
