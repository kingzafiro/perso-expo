import { useMutation } from "@tanstack/react-query";

import { verifyRecovery } from "@/features/auth/api/verify-recovery";

export function useVerifyRecovery() {
  return useMutation({
    mutationFn: verifyRecovery,
  });
}
