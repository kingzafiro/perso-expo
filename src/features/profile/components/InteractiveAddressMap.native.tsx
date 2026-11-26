import * as Haptics from "expo-haptics";
import { LocateFixed } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Skeleton } from "@/components/ui/Skeleton";

import type { InteractiveAddressMapProps } from "@/features/profile/components/InteractiveAddressMap.types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

const DEFAULT_REGION: Region = {
  latitude: 19.4326,
  longitude: -99.1332,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const STREET_DELTA = 0.0022;

function roundCoord(value: number) {
  return Number(value.toFixed(8));
}

export function InteractiveAddressMap({
  coords,
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

  const lastAnimatedRef = useRef<string | null>(null);
  const userDraggedRef = useRef(false);
  const currentDeltaRef = useRef({
    latitudeDelta: STREET_DELTA,
    longitudeDelta: STREET_DELTA,
  });

  const pinLift = useSharedValue(0);

  useEffect(() => {
    if (!coords) return;
    const key = `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;
    if (lastAnimatedRef.current === key) return;
    lastAnimatedRef.current = key;

    const delta = readOnly
      ? 0.004
      : Math.min(currentDeltaRef.current.latitudeDelta, 0.0045);

    mapRef.current?.animateToRegion(
      {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: delta,
        longitudeDelta: delta,
      },
      340,
    );
  }, [coords, readOnly]);

  const pinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -pinLift.value * 11 },
      { scale: 1 + pinLift.value * 0.07 },
    ],
  }));

  const shadowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.32 - pinLift.value * 0.12,
    transform: [{ scale: 1 - pinLift.value * 0.25 }],
  }));

  const initialRegion: Region = coords
    ? {
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: readOnly ? 0.004 : STREET_DELTA,
        longitudeDelta: readOnly ? 0.004 : STREET_DELTA,
      }
    : DEFAULT_REGION;

  const handlePanDrag = () => {
    if (readOnly) return;
    if (!userDraggedRef.current) {
      userDraggedRef.current = true;
      onMapInteractionChange?.(true);
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
    onMapInteractionChange?.(false);

    if (!userDraggedRef.current || !onSelectCoords) return;
    userDraggedRef.current = false;

    const lat = roundCoord(region.latitude);
    const lng = roundCoord(region.longitude);
    lastAnimatedRef.current = `${lat.toFixed(6)},${lng.toFixed(6)}`;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectCoords({ lat, lng });
  };

  const handleTapMap = (latitude: number, longitude: number) => {
    if (readOnly || !onSelectCoords) return;

    userDraggedRef.current = false;
    const lat = roundCoord(latitude);
    const lng = roundCoord(longitude);
    const delta = Math.min(currentDeltaRef.current.latitudeDelta, STREET_DELTA);

    lastAnimatedRef.current = `${lat.toFixed(6)},${lng.toFixed(6)}`;
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

  const pillBg = isDark
    ? "rgba(22, 18, 15, 0.88)"
    : "rgba(255, 255, 255, 0.94)";

  return (
    <View
      style={[
        styles.container,
        {
          height,
          borderColor: theme.inputBorder,
          backgroundColor: theme.inputBackground,
        },
      ]}
      onTouchStart={() => {
        if (!readOnly) onMapInteractionChange?.(true);
      }}
      onTouchEnd={() => {
        if (!readOnly && !userDraggedRef.current) {
          onMapInteractionChange?.(false);
        }
      }}
      onTouchCancel={() => {
        if (!readOnly) {
          userDraggedRef.current = false;
          pinLift.value = withSpring(0, { damping: 16, stiffness: 280 });
          onMapInteractionChange?.(false);
        }
      }}
    >
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
        onPanDrag={handlePanDrag}
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
          />
        )}
      </MapView>

      {/* Pin central de precisión: arrastra el mapa o toca cualquier punto */}
      {!readOnly && (
        <View pointerEvents="none" style={styles.centerPinAnchor}>
          <Animated.View style={[styles.pinShadow, shadowAnimatedStyle]} />
          <View
            style={[styles.centerTargetDot, { backgroundColor: theme.primary }]}
          />
          <Animated.View style={[styles.pinGraphic, pinAnimatedStyle]}>
            <View style={[styles.pinHead, { backgroundColor: theme.primary }]}>
              <View style={styles.pinInnerDot} />
            </View>
            <View style={[styles.pinStem, { backgroundColor: theme.primary }]} />
          </Animated.View>
        </View>
      )}

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
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>
              {Platform.OS === "ios" ? "Apple Maps" : "Google Maps"} · Arrastra
              para fijar el pin
            </Text>
          )}
        </View>
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

  centerPinAnchor: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },

  centerTargetDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.75,
  },

  pinShadow: {
    position: "absolute",
    width: 14,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#000000",
    transform: [{ translateY: 2 }],
  },

  pinGraphic: {
    alignItems: "center",
    marginBottom: 38,
  },

  pinHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 5,
  },

  pinInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },

  pinStem: {
    width: 3,
    height: 12,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: -2,
  },

  hintPill: {
    position: "absolute",
    top: 10,
    left: 10,
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
