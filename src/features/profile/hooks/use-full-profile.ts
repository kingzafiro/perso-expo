import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import {
  createExperienceYear,
  deleteExperienceYear,
  fetchFullProfile,
  saveAddress,
  saveBio,
  saveDegree,
  saveEnglish,
  saveJobInterests,
  saveLastJob,
  savePersonalInfo,
  saveUniversity,
  updateExperienceYear,
} from "@/features/profile/api/profile.api";
import { useAuthStore } from "@/stores/auth.store";

export const FULL_PROFILE_QUERY_KEY = ["profile", "full"] as const;

async function notifySuccess() {
  if (Platform.OS !== "web") {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

export function useFullProfile() {
  return useQuery({
    queryKey: FULL_PROFILE_QUERY_KEY,
    queryFn: async () => {
      const response = await fetchFullProfile();
      if (response.perfil?.usuario) {
        useAuthStore.getState().setUser(response.perfil.usuario);
      }
      return response.perfil;
    },
  });
}

export function useProfileMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: FULL_PROFILE_QUERY_KEY });
    await notifySuccess();
  };

  const personalInfo = useMutation({
    mutationFn: savePersonalInfo,
    onSuccess: async (data) => {
      if (data.usuario) {
        useAuthStore.getState().setUser(data.usuario);
      }
      await invalidate();
    },
  });

  const address = useMutation({
    mutationFn: saveAddress,
    onSuccess: invalidate,
  });

  const university = useMutation({
    mutationFn: saveUniversity,
    onSuccess: invalidate,
  });

  const degree = useMutation({
    mutationFn: saveDegree,
    onSuccess: invalidate,
  });

  const english = useMutation({
    mutationFn: saveEnglish,
    onSuccess: invalidate,
  });

  const bio = useMutation({
    mutationFn: saveBio,
    onSuccess: invalidate,
  });

  const jobInterests = useMutation({
    mutationFn: saveJobInterests,
    onSuccess: invalidate,
  });

  const lastJob = useMutation({
    mutationFn: saveLastJob,
    onSuccess: invalidate,
  });

  const createExperience = useMutation({
    mutationFn: createExperienceYear,
    onSuccess: invalidate,
  });

  const updateExperience = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { year_one: string; year_two: string; experiencia: string };
    }) => updateExperienceYear(id, payload),
    onSuccess: invalidate,
  });

  const removeExperience = useMutation({
    mutationFn: deleteExperienceYear,
    onSuccess: invalidate,
  });

  return {
    personalInfo,
    address,
    university,
    degree,
    english,
    bio,
    jobInterests,
    lastJob,
    createExperience,
    updateExperience,
    removeExperience,
  };
}
