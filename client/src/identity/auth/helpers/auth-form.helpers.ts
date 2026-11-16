import type { LoginPayload } from "../../../core/common/hooks/use-login";
import type { RegisterPayload } from "../../../core/common/hooks/use-register";

export function updateAuthFormField(
  prev: LoginPayload,
  name: string,
  value: string,
): LoginPayload {
  return {
    ...prev,
    [name]: value,
  };
}

export function updateRegisterFormField(
  prev: RegisterPayload,
  name: string,
  value: string,
): RegisterPayload {
  return {
    ...prev,
    [name]: value,
  };
}
