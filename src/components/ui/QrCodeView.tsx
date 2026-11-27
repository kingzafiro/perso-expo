import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import { encodeQrMatrix } from "@/lib/qr/qr-encoder";

export interface QrCodeViewHandle {
  toPngBase64: () => Promise<string>;
}

interface QrCodeViewProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  quietZone?: number;
}

/**
 * Renderiza un código QR vectorial ISO/IEC 18004 nítido y escaneable con `react-native-svg`.
 * Permite exportar el QR a PNG base64 mediante ref (`toPngBase64`).
 */
export const QrCodeView = forwardRef<QrCodeViewHandle, QrCodeViewProps>(
  function QrCodeView(
    {
      value,
      size = 200,
      color = "#111111",
      backgroundColor = "#FFFFFF",
      quietZone = 3,
    },
    ref,
  ) {
    const svgRef = useRef<Svg>(null);

    const { totalSize, pathData } = useMemo(() => {
      const { size: matrixSize, modules } = encodeQrMatrix(value);
      const total = matrixSize + quietZone * 2;
      const segments: string[] = [];

      for (let r = 0; r < matrixSize; r++) {
        for (let c = 0; c < matrixSize; c++) {
          if (modules[r][c]) {
            const x = c + quietZone;
            const y = r + quietZone;
            segments.push(`M${x} ${y}h1v1h-1z`);
          }
        }
      }

      return { totalSize: total, pathData: segments.join("") };
    }, [value, quietZone]);

    useImperativeHandle(
      ref,
      () => ({
        toPngBase64: () =>
          new Promise<string>((resolve, reject) => {
            const instance = svgRef.current;
            if (!instance || typeof instance.toDataURL !== "function") {
              reject(new Error("El código QR aún no está listo para guardarse."));
              return;
            }
            instance.toDataURL((base64) => {
              if (!base64) {
                reject(new Error("No se pudo generar la imagen del código QR."));
                return;
              }
              resolve(base64);
            });
          }),
      }),
      [],
    );

    return (
      <View
        style={[styles.frame, { width: size, height: size, backgroundColor }]}
      >
        <Svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${totalSize} ${totalSize}`}
        >
          <Rect
            x={0}
            y={0}
            width={totalSize}
            height={totalSize}
            fill={backgroundColor}
          />
          <Path d={pathData} fill={color} />
        </Svg>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  frame: {
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
