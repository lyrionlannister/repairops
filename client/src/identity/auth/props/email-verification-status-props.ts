export interface EmailVerificationStatusProps {
  status: "checking" | "pending" | "verified" | "error";
  error: string | null;
  resend: () => void;
  resending: boolean;
  resent: boolean;
}
