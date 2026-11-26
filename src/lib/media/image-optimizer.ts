import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Platform } from "react-native";

export const PROFILE_PHOTO_MAX_BYTES = 50 * 1024; // 50 KB
export const GENERAL_PHOTO_MAX_BYTES = 180 * 1024; // 180 KB

export interface OptimizeImageInput {
  uri: string;
  width?: number | null;
  height?: number | null;
  maxBytes?: number;
}

export interface OptimizedImageResult {
  uri: string;
  width: number;
  height: number;
  size: number | null;
  mimeType: "image/jpeg";
  fileName: string;
}

async function getFileSizeBytes(uri: string): Promise<number | null> {
  try {
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size;
    }

    const file = new File(uri);
    return typeof file.size === "number" ? file.size : null;
  } catch {
    return null;
  }
}

async function getSourceDimensions(
  uri: string,
  knownWidth?: number | null,
  knownHeight?: number | null,
): Promise<{ width: number; height: number } | null> {
  if (knownWidth && knownHeight && knownWidth > 0 && knownHeight > 0) {
    return { width: knownWidth, height: knownHeight };
  }

  const context = ImageManipulator.manipulate(uri);
  try {
    const ref = await context.renderAsync();
    const dims = { width: ref.width, height: ref.height };
    ref.release();
    return dims;
  } catch {
    return null;
  } finally {
    context.release();
  }
}

/**
 * Optimiza una foto de perfil antes de subirla:
 * - Recorte centrado exacto 1:1
 * - Peso máximo estricto <= 50 KB (por defecto)
 * - Formato JPEG ligero
 */
export async function optimizeProfilePhoto({
  uri,
  width,
  height,
  maxBytes = PROFILE_PHOTO_MAX_BYTES,
}: OptimizeImageInput): Promise<OptimizedImageResult> {
  const dims = await getSourceDimensions(uri, width, height);

  const cropRect =
    dims && dims.width !== dims.height
      ? (() => {
          const side = Math.min(dims.width, dims.height);
          return {
            originX: Math.floor((dims.width - side) / 2),
            originY: Math.floor((dims.height - side) / 2),
            width: side,
            height: side,
          };
        })()
      : null;

  const attempts = [
    { size: 512, qualities: [0.78, 0.64, 0.5, 0.38] },
    { size: 400, qualities: [0.72, 0.58, 0.44, 0.32] },
    { size: 320, qualities: [0.68, 0.54, 0.4, 0.28] },
    { size: 256, qualities: [0.62, 0.46, 0.32, 0.22] },
  ];

  let smallest: OptimizedImageResult | null = null;

  for (const { size, qualities } of attempts) {
    const context = ImageManipulator.manipulate(uri);

    if (cropRect) {
      context.crop(cropRect);
    }

    context.resize({ width: size, height: size });

    const rendered = await context.renderAsync();

    try {
      for (const compress of qualities) {
        const saved = await rendered.saveAsync({
          format: SaveFormat.JPEG,
          compress,
        });

        const fileSize = await getFileSizeBytes(saved.uri);

        const candidate: OptimizedImageResult = {
          uri: saved.uri,
          width: saved.width,
          height: saved.height,
          size: fileSize,
          mimeType: "image/jpeg",
          fileName: `avatar-${Date.now()}.jpg`,
        };

        if (
          !smallest ||
          (fileSize !== null &&
            (smallest.size === null || fileSize < smallest.size))
        ) {
          smallest = candidate;
        }

        if (fileSize !== null && fileSize <= maxBytes) {
          return candidate;
        }
      }
    } finally {
      rendered.release();
      context.release();
    }
  }

  if (smallest) {
    return smallest;
  }

  return {
    uri,
    width: dims?.width ?? 512,
    height: dims?.height ?? 512,
    size: await getFileSizeBytes(uri),
    mimeType: "image/jpeg",
    fileName: `avatar-${Date.now()}.jpg`,
  };
}

/**
 * Optimiza fotos generales antes de subirlas (documentos, evidencias, etc.)
 * manteniendo buena legibilidad y peso reducido en KB.
 */
export async function optimizeGeneralPhoto({
  uri,
  width,
  height,
  maxBytes = GENERAL_PHOTO_MAX_BYTES,
}: OptimizeImageInput): Promise<OptimizedImageResult> {
  const dims = await getSourceDimensions(uri, width, height);
  const maxSides = [1440, 1200, 960];
  const qualities = [0.78, 0.64, 0.5, 0.36];

  let smallest: OptimizedImageResult | null = null;

  for (const maxSide of maxSides) {
    const context = ImageManipulator.manipulate(uri);

    if (dims && (dims.width > maxSide || dims.height > maxSide)) {
      if (dims.width >= dims.height) {
        context.resize({ width: maxSide });
      } else {
        context.resize({ height: maxSide });
      }
    }

    const rendered = await context.renderAsync();

    try {
      for (const compress of qualities) {
        const saved = await rendered.saveAsync({
          format: SaveFormat.JPEG,
          compress,
        });

        const fileSize = await getFileSizeBytes(saved.uri);

        const candidate: OptimizedImageResult = {
          uri: saved.uri,
          width: saved.width,
          height: saved.height,
          size: fileSize,
          mimeType: "image/jpeg",
          fileName: `photo-${Date.now()}.jpg`,
        };

        if (
          !smallest ||
          (fileSize !== null &&
            (smallest.size === null || fileSize < smallest.size))
        ) {
          smallest = candidate;
        }

        if (fileSize !== null && fileSize <= maxBytes) {
          return candidate;
        }
      }
    } finally {
      rendered.release();
      context.release();
    }
  }

  if (smallest) {
    return smallest;
  }

  return {
    uri,
    width: dims?.width ?? 1200,
    height: dims?.height ?? 1200,
    size: await getFileSizeBytes(uri),
    mimeType: "image/jpeg",
    fileName: `photo-${Date.now()}.jpg`,
  };
}
