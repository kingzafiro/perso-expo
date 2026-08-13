import { useMutation } from "@tanstack/react-query";

import { resendVerificationCode } from "@/features/auth/api/resend-verification-code";

export function useResendVerificationCode() {
  return useMutation({
    mutationFn: resendVerificationCode,
  });
}
