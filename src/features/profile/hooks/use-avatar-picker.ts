import { AxiosError } from "axios";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActionSheetIOS, Alert, Linking, Platform } from "react-native";

import type { ApiErrorResponse } from "@/features/auth/types/auth.types";
import {
  useDeleteProfilePhoto,
  useUploadProfilePhoto,
} from "@/features/profile/hooks/use-profile-photo";
import { useAuthStore } from "@/stores/auth.store";

export function useAvatarPicker() {
  const user = useAuthStore((state) => state.user);
  const uploadMutation = useUploadProfilePhoto();
  const deleteMutation = useDeleteProfilePhoto();

  const [optimisticUri, setOptimisticUri] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const currentPhotoUri = optimisticUri ?? user?.foto_perfil ?? null;
  const isBusy = uploadMutation.isPending || deleteMutation.isPending;

  const uploadSelectedAsset = (asset: ImagePicker.ImagePickerAsset) => {
    setPhotoError(null);
    setOptimisticUri(asset.uri);

    uploadMutation.mutate(
      {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      },
      {
        onSuccess: async () => {
          setOptimisticUri(null);
          if (Platform.OS !== "web") {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          }
        },
        onError: (error) => {
          setOptimisticUri(null);
          const apiError = error as AxiosError<ApiErrorResponse>;
          setPhotoError(
            apiError?.response?.data?.mensaje ??
              "No fue posible actualizar tu foto de perfil.",
          );
        },
      },
    );
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permiso de fotos",
        "Necesitamos acceso a tu galería para elegir una foto de perfil.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Abrir configuración",
            onPress: () => Linking.openSettings(),
          },
        ],
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      uploadSelectedAsset(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permiso de cámara",
        "Necesitamos acceso a tu cámara para tomar una nueva foto de perfil.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Abrir configuración",
            onPress: () => Linking.openSettings(),
          },
        ],
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      uploadSelectedAsset(result.assets[0]);
    }
  };

  const handleDeletePhoto = () => {
    setPhotoError(null);
    deleteMutation.mutate(undefined, {
      onSuccess: async () => {
        setOptimisticUri(null);
        if (Platform.OS !== "web") {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        }
      },
      onError: (error) => {
        const apiError = error as AxiosError<ApiErrorResponse>;
        setPhotoError(
          apiError?.response?.data?.mensaje ??
            "No fue posible eliminar tu foto de perfil.",
        );
      },
    });
  };

  const openPhotoOptions = () => {
    if (isBusy) return;
    setPhotoError(null);

    const hasPhoto = Boolean(currentPhotoUri);

    if (Platform.OS === "ios") {
      const options = hasPhoto
        ? ["Tomar foto", "Elegir de la galería", "Eliminar foto", "Cancelar"]
        : ["Tomar foto", "Elegir de la galería", "Cancelar"];

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: hasPhoto ? 2 : undefined,
          title: "Foto de perfil",
        },
        (buttonIndex) => {
          if (buttonIndex === 0) takePhoto();
          if (buttonIndex === 1) pickFromGallery();
          if (hasPhoto && buttonIndex === 2) handleDeletePhoto();
        },
      );
      return;
    }

    Alert.alert("Foto de perfil", "Elige una opción", [
      { text: "Tomar foto", onPress: takePhoto },
      { text: "Elegir de la galería", onPress: pickFromGallery },
      ...(hasPhoto
        ? [
            {
              text: "Eliminar foto",
              style: "destructive" as const,
              onPress: handleDeletePhoto,
            },
          ]
        : []),
      { text: "Cancelar", style: "cancel" as const },
    ]);
  };

  return {
    currentPhotoUri,
    isBusy,
    photoError,
    openPhotoOptions,
  };
}
