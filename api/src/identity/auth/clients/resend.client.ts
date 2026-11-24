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
  verifyUrl: string;
}

export async function sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
  const { error } = await resend().emails.send({
    from: requiredEnv("RESEND_FROM_EMAIL"),
    to: input.to,
    subject: "Verifica tu correo en RepairOps",
    html: `
      <p>Hola ${input.firstName},</p>
      <p>Confirma tu correo para terminar de configurar tu taller en RepairOps:</p>
      <p><a href="${input.verifyUrl}">${input.verifyUrl}</a></p>
      <p>Este enlace vence en 24 horas.</p>
    `,
  });
  // Error de Resend (dominio no verificado, cuota, etc.): no lanza -- el
  // registro ya terminó y el owner puede pedir el correo de nuevo con
  // POST /auth/resend-verification. Solo queda en el log del servidor.
  if (error) {
    console.error("[resend] No se pudo enviar el correo de verificación:", error);
  }
}
