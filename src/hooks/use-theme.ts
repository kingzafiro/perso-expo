import { useColorScheme } from "@/hooks/use-color-scheme";
import { themeColors, type AppTheme } from "@/theme";

export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  const mode = scheme === "dark" ? "dark" : "light";

  return themeColors[mode];
}
