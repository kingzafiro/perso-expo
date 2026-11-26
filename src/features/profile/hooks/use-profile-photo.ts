import { useMutation } from "@tanstack/react-query";

import {
  deleteProfilePhoto,
  uploadProfilePhoto,
} from "@/features/profile/api/profile-photo";
import { useAuthStore } from "@/stores/auth.store";

function syncUserPhoto(fotoUrl: string | null) {
  const { user, setUser } = useAuthStore.getState();
  if (!user) return;
  setUser({
    ...user,
    foto_perfil: fotoUrl,
  });
}

export function useUploadProfilePhoto() {
  return useMutation({
    mutationFn: uploadProfilePhoto,
    onSuccess: (data) => {
      syncUserPhoto(data.foto);
    },
  });
}

export function useDeleteProfilePhoto() {
  return useMutation({
    mutationFn: deleteProfilePhoto,
    onSuccess: () => {
      syncUserPhoto(null);
    },
  });
}
