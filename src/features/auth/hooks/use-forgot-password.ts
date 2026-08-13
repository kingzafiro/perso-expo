import { useMutation } from "@tanstack/react-query";

import { forgotPassword } from "@/features/auth/api/forgot-password";

export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPassword,
  });
}
