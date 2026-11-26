import * as Haptics from "expo-haptics";
import { ChevronRight } from "lucide-react-native";
import { type ReactNode } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

interface SettingsGroupProps {
  title?: string;
  footer?: string;
  children: ReactNode;
}

export function SettingsGroup({ title, footer, children }: SettingsGroupProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const cardBg = isDark ? "#181513" : "#FFFFFF";
  const cardBorder = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.06)";

  return (
    <View style={styles.groupWrapper}>
      {title && (
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {title}
        </Text>
      )}

      <View
        style={[
          styles.card,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
      >
        {children}
      </View>

      {footer && (
        <Text style={[styles.sectionFooter, { color: theme.textMuted }]}>
          {footer}
        </Text>
      )}
    </View>
  );
}

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: ReactNode;
  iconBgColor?: string;
  rightElement?: ReactNode;
  showChevron?: boolean;
  showDivider?: boolean;
  destructive?: boolean;
  onPress?: () => void | Promise<void>;
}

export function SettingsRow({
  title,
  subtitle,
  value,
  icon,
  iconBgColor,
  rightElement,
  showChevron = true,
  showDivider = false,
  destructive = false,
  onPress,
}: SettingsRowProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const handlePress = async () => {
    if (!onPress) return;
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await onPress();
  };

  const pressedBg = isDark
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(23, 18, 14, 0.04)";
  const dividerColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(23, 18, 14, 0.07)";

  const content = (
    <View style={styles.rowInner}>
      {icon && (
        <View
          style={[
            styles.iconBadge,
            iconBgColor ? { backgroundColor: iconBgColor } : undefined,
          ]}
        >
          {icon}
        </View>
      )}

      <View style={styles.textBlock}>
        <Text
          numberOfLines={1}
          style={[
            styles.rowTitle,
            { color: destructive ? "#FF453A" : theme.text },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            numberOfLines={1}
            style={[styles.rowSubtitle, { color: theme.textSecondary }]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {value && (
        <Text
          numberOfLines={1}
          style={[styles.rowValue, { color: theme.textSecondary }]}
        >
          {value}
        </Text>
      )}

      {rightElement}

      {showChevron && onPress && !rightElement && (
        <ChevronRight size={18} color={theme.textMuted} />
      )}
    </View>
  );

  return (
    <View>
      {onPress ? (
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.rowPressable,
            pressed && { backgroundColor: pressedBg },
          ]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.rowPressable}>{content}</View>
      )}

      {showDivider && (
        <View
          style={[
            styles.divider,
            {
              backgroundColor: dividerColor,
              marginLeft: icon ? 62 : 18,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  groupWrapper: {
    width: "100%",
    gap: 8,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 14,
    letterSpacing: -0.1,
  },

  sectionFooter: {
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 14,
  },

  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  rowPressable: {
    paddingHorizontal: 16,
    paddingVertical: 13,
  },

  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 30,
  },

  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  textBlock: {
    flex: 1,
    gap: 2,
  },

  rowTitle: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: -0.2,
  },

  rowSubtitle: {
    fontSize: 13,
  },

  rowValue: {
    fontSize: 14,
    maxWidth: 140,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
