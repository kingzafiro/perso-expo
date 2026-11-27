import { File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Platform } from "react-native";

export type SaveQrImageResult =
  | { ok: true }
  | { ok: false; permissionDenied?: boolean; message: string };

/**
 * Guarda un código QR en formato PNG (base64) dentro de la galería de fotos del dispositivo.
 */
export async function saveQrPngToGallery(
  base64Png: string,
  shortCode?: string,
): Promise<SaveQrImageResult> {
  const cleanBase64 = base64Png
    .replace(/^data:image\/\w+;base64,/, "")
    .replace(/\s+/g, "");

  if (!cleanBase64) {
    return {
      ok: false,
      message: "No se pudo preparar la imagen del código QR.",
    };
  }

  if (Platform.OS === "web") {
    try {
      const link = document.createElement("a");
      link.href = `data:image/png;base64,${cleanBase64}`;
      const safeName = (shortCode || "pase-qr").replace(/[^a-zA-Z0-9-_]/g, "");
      link.download = `perso-${safeName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { ok: true };
    } catch {
      return {
        ok: false,
        message: "No fue posible descargar la imagen del código QR.",
      };
    }
  }

  const permission = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
  if (!permission.granted) {
    return {
      ok: false,
      permissionDenied: true,
      message:
        "Activa el permiso de Fotos en los ajustes de tu dispositivo para guardar el código QR.",
    };
  }

  const safeCode = (shortCode || "pase").replace(/[^a-zA-Z0-9-_]/g, "");
  const tempFile = new File(
    Paths.cache,
    `perso-qr-${safeCode}-${Date.now()}.png`,
  );

  try {
    await tempFile.write(cleanBase64, { encoding: "base64" });
    await MediaLibrary.Asset.create(tempFile.uri);
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "No fue posible guardar el código QR en tu galería de fotos.",
    };
  } finally {
    try {
      if (tempFile.exists) {
        tempFile.delete();
      }
    } catch {
      // Ignorar fallo de limpieza de archivo temporal
    }
  }
}
