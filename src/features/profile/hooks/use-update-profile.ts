import { useMutation } from "@tanstack/react-query";

import { updateProfile } from "@/features/profile/api/update-profile";
import { useAuthStore } from "@/stores/auth.store";

export function useUpdateProfile() {
  return useMutation({
    mutationFn: updateProfile,

    onSuccess: (data) => {
      useAuthStore.getState().setUser(data.usuario);
    },
  });
}
