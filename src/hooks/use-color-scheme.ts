import { useColorScheme as useRNColorScheme } from "react-native";

import { usePreferencesStore } from "@/stores/preferences.store";

export function useColorScheme(): "light" | "dark" {
  const systemScheme = useRNColorScheme();
  const preference = usePreferencesStore((state) => state.colorScheme);

  if (preference === "light" || preference === "dark") {
    return preference;
  }

  return systemScheme === "dark" ? "dark" : "light";
}
