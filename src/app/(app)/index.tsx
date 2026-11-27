import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  ArrowRight,
  Briefcase,
  FileText,
  UserCheck,
} from "lucide-react-native";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/stores/auth.store";

function getFirstName(nombre?: string | null, email?: string) {
  const clean = (nombre ?? "").trim();
  if (clean) return clean.split(/\s+/)[0];
  if (email) {
    const prefix = email.split("@")[0];
    if (prefix) return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return "hola";
}

function getInitials(nombre?: string | null, email?: string) {
  const clean = (nombre ?? "").trim();
  if (clean) {
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (email?.[0] || "P").toUpperCase();
}

export default function InicioScreen() {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const firstName = getFirstName(user?.nombre, user?.email);
  const initials = getInitials(user?.nombre, user?.email);

  const screenBg = isDark ? "#000000" : "#F5F2EF";
  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.07)";

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top + 14, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: theme.primary }]}>PERSO</Text>
            <Text style={[styles.greeting, { color: theme.text }]}>
              Hola, {firstName}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Encuentra vacantes ideales para ti hoy
            </Text>
          </View>

          <ProfileAvatar
            uri={user?.foto_perfil}
            initials={initials}
            size={48}
            onPress={() => router.push("/(app)/tu/perfil")}
          />
        </View>

        <View
          style={[
            styles.candidateCard,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <View style={styles.cardTopRow}>
            <View
              style={[
                styles.rolePill,
                { backgroundColor: theme.primarySoft },
              ]}
            >
              <Briefcase size={13} color={theme.primary} />
              <Text style={[styles.rolePillText, { color: theme.primary }]}>
                Buscar empleo
              </Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Encuentra tu próxima oportunidad
            </Text>
            <Text
              style={[styles.cardSubtitle, { color: theme.textSecondary }]}
            >
              Descubre vacantes cerca de tu ubicación y postúlate rápido con tu
              perfil y expediente listo.
            </Text>
          </View>

          <Pressable
            onPress={() => {
              triggerHaptic();
              router.push("/(app)/empleos");
            }}
            style={({ pressed }) => [
              styles.primaryCta,
              { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryCtaText}>Explorar empleos</Text>
            <ArrowRight size={17} color="#FFFFFF" />
          </Pressable>

          <View style={styles.quickShortcuts}>
            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push("/(app)/tu/perfil");
              }}
              style={({ pressed }) => [
                styles.shortcutTile,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                },
                pressed && styles.pressed,
              ]}
            >
              <UserCheck size={16} color={theme.primary} />
              <Text style={[styles.shortcutText, { color: theme.text }]}>
                Mi perfil
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push("/(app)/tu/documentos");
              }}
              style={({ pressed }) => [
                styles.shortcutTile,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                },
                pressed && styles.pressed,
              ]}
            >
              <FileText size={16} color={theme.primary} />
              <Text style={[styles.shortcutText, { color: theme.text }]}>
                Mis documentos
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 130,
    gap: 18,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    gap: 12,
  },

  headerText: {
    flex: 1,
    gap: 2,
  },

  eyebrow: {
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  greeting: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.7,
  },

  subtitle: {
    fontSize: 14.5,
    marginTop: 1,
  },

  candidateCard: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 15,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },

  rolePillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  cardBody: {
    gap: 5,
  },

  cardTitle: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  primaryCta: {
    minHeight: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryCtaText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  quickShortcuts: {
    flexDirection: "row",
    gap: 10,
  },

  shortcutTile: {
    flex: 1,
    minHeight: 44,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  shortcutText: {
    fontSize: 13.5,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
});
