import type { LoginPayload } from "../../../core/common/types/login";
import type { RegisterPayload } from "../../../core/common/types/register";

export const AUTH_REDIRECT_DELAY_MS = 1000;
export const REGISTER_REDIRECT_DELAY_MS = 2000;

export const INITIAL_AUTH_FORM_DATA: LoginPayload = {
  email: "",
  password: "",
};

export const INITIAL_REGISTER_FORM_DATA: RegisterPayload = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};
