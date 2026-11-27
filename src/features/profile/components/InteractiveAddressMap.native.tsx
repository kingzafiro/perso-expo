import * as Haptics from "expo-haptics";
import { LocateFixed, Maximize2, Minimize2, Route } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import { Skeleton } from "@/components/ui/Skeleton";

import type {
  InteractiveAddressMapProps,
  MapCoords,
} from "@/features/profile/components/InteractiveAddressMap.types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

const DEFAULT_REGION: Region = {
  latitude: 19.4326,
  longitude: -99.1332,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const STREET_DELTA = 0.0024;

function roundCoord(value: number) {
  return Number(value.toFixed(8));
}

function buildBoundingRegion(a: MapCoords, b: MapCoords): Region {
  const latMid = (a.lat + b.lat) / 2;
  const lngMid = (a.lng + b.lng) / 2;
  const latDelta = Math.max(Math.abs(a.lat - b.lat) * 1.65, 0.012);
  const lngDelta = Math.max(Math.abs(a.lng - b.lng) * 1.65, 0.012);
  return {
    latitude: latMid,
    longitude: lngMid,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

/**
 * Pin vectorial de alta precisión: la punta inferior coincide exactamente
 * con el punto central del mapa (0, 0).
 */
function PrecisionLocationPin({ lifted }: { lifted: SharedValue<number> }) {
  const pinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -lifted.value * 12 },
      { scale: 1 + lifted.value * 0.08 },
    ],
  }));

  const shadowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.34 - lifted.value * 0.16,
    transform: [{ scale: 1 - lifted.value * 0.3 }],
  }));

  const haloAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.26 + lifted.value * 0.18,
    transform: [{ scale: 1 + lifted.value * 0.35 }],
  }));

  return (
    <View pointerEvents="none" style={styles.centerPinAnchor}>
      {/* Aro y punto exacto en el suelo */}
      <Animated.View style={[styles.groundHalo, haloAnimatedStyle]} />
      <Animated.View style={[styles.pinShadow, shadowAnimatedStyle]} />
      <View style={styles.groundCenterDot} />

      {/* Gota vectorial con gradiente y sombra */}
      <Animated.View style={[styles.pinSvgWrap, pinAnimatedStyle]}>
        <Svg width={42} height={52} viewBox="0 0 42 52">
          <Defs>
            <LinearGradient id="persoPinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FF8D3A" />
              <Stop offset="55%" stopColor="#F06808" />
              <Stop offset="100%" stopColor="#CC4B00" />
            </LinearGradient>
          </Defs>
          <Path
            d="M21 3C11.6 3 4 10.6 4 20c0 11.4 13.7 25.1 16.1 27.4a1.3 1.3 0 0 0 1.8 0C24.3 45.1 38 31.4 38 20 38 10.6 30.4 3 21 3Z"
            fill="url(#persoPinGrad)"
            stroke="#FFFFFF"
            strokeWidth={2.6}
          />
          <Circle cx={21} cy={19.5} r={8.2} fill="#FFFFFF" />
          <Circle cx={21} cy={19.5} r={3.6} fill="#F06808" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function InteractiveAddressMap({
  coords,
  secondaryCoords = null,
  primaryLabel,
  secondaryLabel,
  distanceBadge,
  showRouteLine = false,
  height = 220,
  readOnly = false,
  isResolving = false,
  isLocating = false,
  onSelectCoords,
  onRequestCurrentLocation,
  onMapInteractionChange,
}: InteractiveAddressMapProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);

  const [isExpanded, setIsExpanded] = useState(false);

  const lastAnimatedRef = useRef<string | null>(null);
  const lastCommittedCoordsRef = useRef<MapCoords | null>(coords);
  const isProgrammaticMoveRef = useRef(false);
  const userTouchedRef = useRef(false);
  const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const currentDeltaRef = useRef({
    latitudeDelta: STREET_DELTA,
    longitudeDelta: STREET_DELTA,
  });

  const pinLift = useSharedValue(0);
  const hasDualPoints = Boolean(readOnly && coords && secondaryCoords);
  const effectiveHeight = !readOnly && isExpanded ? Math.max(height, 360) : height;

  useEffect(() => {
    return () => {
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current);
      }
      onMapInteractionChange?.(false);
    };
  }, [onMapInteractionChange]);

  const startProgrammaticMove = (durationMs = 380) => {
    isProgrammaticMoveRef.current = true;
    userTouchedRef.current = false;
    if (programmaticTimerRef.current) {
      clearTimeout(programmaticTimerRef.current);
    }
    programmaticTimerRef.current = setTimeout(() => {
      isProgrammaticMoveRef.current = false;
      programmaticTimerRef.current = null;
    }, durationMs);
  };

  useEffect(() => {
    if (!coords) return;

    if (readOnly && secondaryCoords) {
      const key = `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}|${secondaryCoords.lat.toFixed(5)},${secondaryCoords.lng.toFixed(5)}`;
      if (lastAnimatedRef.current === key) return;
      lastAnimatedRef.current = key;

      mapRef.current?.fitToCoordinates(
        [
          { latitude: coords.lat, longitude: coords.lng },
          { latitude: secondaryCoords.lat, longitude: secondaryCoords.lng },
        ],
        {
          edgePadding: { top: 44, right: 44, bottom: 38, left: 44 },
          animated: true,
        },
      );
      return;
    }

    const key = `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;
    if (lastAnimatedRef.current === key) return;
    lastAnimatedRef.current = key;
    lastCommittedCoordsRef.current = coords;

    const delta = readOnly
      ? 0.004
      : Math.min(currentDeltaRef.current.latitudeDelta, 0.0045);

    startProgrammaticMove(420);
    mapRef.current?.animateToRegion(
      {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: delta,
        longitudeDelta: delta,
      },
      320,
    );
  }, [coords, secondaryCoords, readOnly]);

  const initialRegion: Region =
    readOnly && coords && secondaryCoords
      ? buildBoundingRegion(coords, secondaryCoords)
      : coords
        ? {
            latitude: coords.lat,
            longitude: coords.lng,
            latitudeDelta: readOnly ? 0.004 : STREET_DELTA,
            longitudeDelta: readOnly ? 0.004 : STREET_DELTA,
          }
        : DEFAULT_REGION;

  const handleRegionChange = () => {
    if (readOnly) return;
    if (isProgrammaticMoveRef.current || !userTouchedRef.current) return;
    if (pinLift.value < 0.5) {
      pinLift.value = withSpring(1, { damping: 18, stiffness: 320 });
    }
  };

  const handleRegionChangeComplete = (region: Region) => {
    if (readOnly) return;

    currentDeltaRef.current = {
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    };

    pinLift.value = withSpring(0, { damping: 16, stiffness: 280 });
    if (!isExpanded) {
      onMapInteractionChange?.(false);
    }

    if (isProgrammaticMoveRef.current) {
      isProgrammaticMoveRef.current = false;
      return;
    }

    // En iOS Apple Maps bajo Fabric, details.isGesture siempre llega en false
    // porque AIRMap no rellena ese campo. Por eso validamos con userTouchedRef
    // en vez de descartar eventos por isGesture === false.
    if (!userTouchedRef.current) {
      return;
    }
    userTouchedRef.current = false;

    if (!onSelectCoords) return;

    const lat = roundCoord(region.latitude);
    const lng = roundCoord(region.longitude);

    const prev = lastCommittedCoordsRef.current;
    if (
      prev &&
      Math.abs(prev.lat - lat) < 0.00001 &&
      Math.abs(prev.lng - lng) < 0.00001
    ) {
      return;
    }

    lastAnimatedRef.current = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    lastCommittedCoordsRef.current = { lat, lng };

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectCoords({ lat, lng });
  };

  const handleTapMap = (latitude: number, longitude: number) => {
    if (readOnly || !onSelectCoords) return;

    const lat = roundCoord(latitude);
    const lng = roundCoord(longitude);
    const delta = Math.min(currentDeltaRef.current.latitudeDelta, STREET_DELTA);

    lastAnimatedRef.current = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    lastCommittedCoordsRef.current = { lat, lng };
    startProgrammaticMove(340);
    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lng,
        latitudeDelta: delta,
        longitudeDelta: delta,
      },
      260,
    );

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectCoords({ lat, lng });
  };

  const toggleExpandMap = () => {
    if (readOnly) return;
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => {
      const next = !prev;
      onMapInteractionChange?.(next);
      return next;
    });
  };

  const pillBg = isDark
    ? "rgba(22, 18, 15, 0.90)"
    : "rgba(255, 255, 255, 0.95)";

  return (
    <View
      style={[
        styles.container,
        {
          height: effectiveHeight,
          borderColor: isExpanded ? theme.primary : theme.inputBorder,
          backgroundColor: theme.inputBackground,
        },
      ]}
      onTouchStart={() => {
        if (!readOnly) {
          userTouchedRef.current = true;
          isProgrammaticMoveRef.current = false;
          onMapInteractionChange?.(true);
        }
      }}
      onTouchEnd={() => {
        if (!readOnly && !isExpanded) {
          onMapInteractionChange?.(false);
        }
      }}
      onTouchCancel={() => {
        if (!readOnly) {
          pinLift.value = withSpring(0, { damping: 16, stiffness: 280 });
          if (!isExpanded) {
            onMapInteractionChange?.(false);
          }
        }
      }}
    >
      {/* IMPORTANTE: NO pasar `onPanDrag` en iOS porque react-native-maps habilita
          handlePanDrag y bloquea el desplazamiento nativo de MKMapView. */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        userInterfaceStyle={colorScheme}
        showsUserLocation={!readOnly}
        showsMyLocationButton={false}
        showsCompass={false}
        scrollEnabled={!readOnly}
        zoomEnabled={!readOnly}
        pitchEnabled={false}
        rotateEnabled={false}
        pointerEvents={readOnly ? "none" : "auto"}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPress={(event) => {
          const { latitude, longitude } = event.nativeEvent.coordinate;
          handleTapMap(latitude, longitude);
        }}
      >
        {readOnly && coords && (
          <Marker
            coordinate={{ latitude: coords.lat, longitude: coords.lng }}
            pinColor={theme.primary}
            title={primaryLabel}
          />
        )}

        {hasDualPoints && secondaryCoords && (
          <Marker
            coordinate={{
              latitude: secondaryCoords.lat,
              longitude: secondaryCoords.lng,
            }}
            pinColor="#0A84FF"
            title={secondaryLabel}
          />
        )}

        {hasDualPoints && showRouteLine && coords && secondaryCoords && (
          <Polyline
            coordinates={[
              { latitude: coords.lat, longitude: coords.lng },
              {
                latitude: secondaryCoords.lat,
                longitude: secondaryCoords.lng,
              },
            ]}
            strokeColor={theme.primary}
            strokeWidth={2.5}
            lineDashPattern={[6, 5]}
          />
        )}
      </MapView>

      {readOnly && distanceBadge ? (
        <View
          pointerEvents="none"
          style={[
            styles.distanceOverlayPill,
            { backgroundColor: pillBg, borderColor: theme.surfaceBorder },
          ]}
        >
          <Route size={13} color={theme.primary} />
          <Text style={[styles.distanceOverlayText, { color: theme.text }]}>
            {distanceBadge}
          </Text>
        </View>
      ) : null}

      {/* Pin vectorial central de precisión */}
      {!readOnly && <PrecisionLocationPin lifted={pinLift} />}

      {!readOnly && (
        <View
          pointerEvents="none"
          style={[
            styles.hintPill,
            { backgroundColor: pillBg, borderColor: theme.surfaceBorder },
          ]}
        >
          {isResolving ? (
            <View style={styles.resolvingRow}>
              <Skeleton width={10} height={10} borderRadius={5} />
              <Skeleton width={118} height={11} borderRadius={6} />
            </View>
          ) : (
            <Text
              numberOfLines={1}
              style={[styles.hintText, { color: theme.textSecondary }]}
            >
              {isExpanded
                ? "Arrastra libremente para ubicar el pin"
                : "Mueve el mapa o toca para fijar el pin"}
            </Text>
          )}
        </View>
      )}

      {/* Botón para ampliar el mapa y fijar el scroll del modal mientras mueves el pin */}
      {!readOnly && (
        <Pressable
          onPress={toggleExpandMap}
          accessibilityRole="button"
          accessibilityLabel={
            isExpanded ? "Reducir mapa" : "Ampliar mapa para ajustar ubicación"
          }
          style={({ pressed }) => [
            styles.expandButton,
            {
              backgroundColor: isExpanded ? theme.primary : pillBg,
              borderColor: isExpanded ? theme.primary : theme.surfaceBorder,
            },
            pressed && styles.pressed,
          ]}
        >
          {isExpanded ? (
            <Minimize2 size={15} color="#FFFFFF" />
          ) : (
            <Maximize2 size={15} color={theme.text} />
          )}
        </Pressable>
      )}

      {!readOnly && coords && (
        <View
          pointerEvents="none"
          style={[
            styles.coordsPill,
            { backgroundColor: pillBg, borderColor: theme.surfaceBorder },
          ]}
        >
          <Text style={[styles.coordsText, { color: theme.textSecondary }]}>
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </Text>
        </View>
      )}

      {!readOnly && onRequestCurrentLocation && (
        <Pressable
          onPress={onRequestCurrentLocation}
          disabled={isLocating}
          accessibilityRole="button"
          accessibilityLabel="Usar mi ubicación actual"
          style={({ pressed }) => [
            styles.locateButton,
            { backgroundColor: pillBg, borderColor: theme.surfaceBorder },
            pressed && styles.pressed,
          ]}
        >
          {isLocating ? (
            <Skeleton width={18} height={18} borderRadius={9} />
          ) : (
            <LocateFixed size={18} color={theme.primary} />
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },

  distanceOverlayPill: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },

  distanceOverlayText: {
    fontSize: 12,
    fontWeight: "800",
  },

  centerPinAnchor: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },

  groundHalo: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(240, 104, 8, 0.28)",
  },

  groundCenterDot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#F06808",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },

  pinShadow: {
    position: "absolute",
    width: 18,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#000000",
    transform: [{ translateY: 2 }],
  },

  pinSvgWrap: {
    marginBottom: 49,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 6,
  },

  hintPill: {
    position: "absolute",
    top: 10,
    left: 10,
    maxWidth: "78%",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },

  hintText: {
    fontSize: 11.5,
    fontWeight: "600",
  },

  resolvingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 1,
  },

  expandButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 3,
  },

  coordsPill: {
    position: "absolute",
    left: 10,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },

  coordsText: {
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  locateButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },

  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.94 }],
  },
});
