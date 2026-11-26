import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

import { usePreferencesStore } from "@/stores/preferences.store";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): "light" | "dark" {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemScheme = useRNColorScheme();
  const preference = usePreferencesStore((state) => state.colorScheme);

  if (preference === "light" || preference === "dark") {
    return preference;
  }

  if (hasHydrated) {
    return systemScheme === "dark" ? "dark" : "light";
  }

  return "light";
}
