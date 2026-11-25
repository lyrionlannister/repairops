export interface EmailVerificationStatusProps {
  code: string;
  setCode: (code: string) => void;
  status: "idle" | "verifying" | "verified" | "error";
  error: string | null;
  confirm: () => void;
  resend: () => void;
  resending: boolean;
  resent: boolean;
}
