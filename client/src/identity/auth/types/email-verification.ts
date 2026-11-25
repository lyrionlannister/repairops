import type { Me } from "./me";

export interface VerifyEmailResponse {
  message: string;
  user: Me;
}

export interface ResendVerificationResponse {
  message: string;
}
