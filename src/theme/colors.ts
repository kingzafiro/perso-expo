export const brandPalette = {
  50: "#FFF4EC",
  100: "#FFE5D1",
  200: "#FFC69E",
  300: "#FFA064",
  400: "#FB7D2E",
  500: "#F06808",
  600: "#D45504",
  700: "#B04207",
  800: "#8D350D",
  900: "#722D0E",
  950: "#3E1404",
} as const;

export const palette = {
  brand: brandPalette,
  white: "#FFFFFF",
  black: "#000000",
  error: {
    light: "#D92D20",
    dark: "#FCA5A5",
  },
  success: {
    light: "#027A48",
    dark: "#6EE7B7",
  },
} as const;

export const themeColors = {
  light: {
    primary: brandPalette[500],
    primaryPressed: brandPalette[600],
    primarySoft: "rgba(240, 104, 8, 0.12)",
    primaryBorder: "rgba(240, 104, 8, 0.28)",
    onPrimary: "#FFFFFF",

    background: "#FFFFFF",
    authBackdrop: "#FDF5EE",
    backgroundElement: "#F7F1EC",
    backgroundSelected: "#F1E3D8",

    surfaceGlass: "rgba(255, 255, 255, 0.88)",
    surfaceBorder: "rgba(255, 255, 255, 0.88)",
    surfaceElevated: "rgba(255, 255, 255, 0.84)",

    inputBackground: "rgba(22, 16, 12, 0.045)",
    inputBorder: "rgba(22, 16, 12, 0.10)",
    inputBorderFocused: brandPalette[500],

    text: "#17120E",
    textSecondary: "#6B5F57",
    textMuted: "#8E8178",

    divider: "rgba(23, 18, 14, 0.10)",
    grabber: "rgba(23, 18, 14, 0.18)",
    icon: "#5E534B",

    error: "#B42318",
    errorBorder: "#D92D20",
    errorSoft: "rgba(217, 45, 32, 0.10)",

    success: "#027A48",
    successSoft: "rgba(16, 185, 129, 0.12)",

    orbPrimary: "rgba(240, 104, 8, 0.36)",
    orbSecondary: "rgba(255, 160, 100, 0.40)",
    orbBottom: "rgba(240, 104, 8, 0.28)",
  },
  dark: {
    primary: brandPalette[500],
    primaryPressed: brandPalette[400],
    primarySoft: "rgba(240, 104, 8, 0.22)",
    primaryBorder: "rgba(240, 104, 8, 0.42)",
    onPrimary: "#FFFFFF",

    background: "#0B0806",
    authBackdrop: "#0E0906",
    backgroundElement: "#1A1410",
    backgroundSelected: "#2B2018",

    surfaceGlass: "rgba(26, 20, 16, 0.88)",
    surfaceBorder: "rgba(255, 255, 255, 0.14)",
    surfaceElevated: "rgba(255, 255, 255, 0.10)",

    inputBackground: "rgba(255, 255, 255, 0.08)",
    inputBorder: "rgba(255, 255, 255, 0.14)",
    inputBorderFocused: brandPalette[400],

    text: "#FFFFFF",
    textSecondary: "#B3A69E",
    textMuted: "#8F837B",

    divider: "rgba(255, 255, 255, 0.14)",
    grabber: "rgba(255, 255, 255, 0.28)",
    icon: "#B3A69E",

    error: "#FCA5A5",
    errorBorder: "#EF4444",
    errorSoft: "rgba(239, 68, 68, 0.18)",

    success: "#6EE7B7",
    successSoft: "rgba(16, 185, 129, 0.18)",

    orbPrimary: "rgba(240, 104, 8, 0.44)",
    orbSecondary: "rgba(251, 125, 46, 0.30)",
    orbBottom: "rgba(212, 85, 4, 0.36)",
  },
} as const;

export type AppColorScheme = keyof typeof themeColors;
export type AppTheme = (typeof themeColors)[AppColorScheme];
export type ThemeColor = keyof typeof themeColors.light &
  keyof typeof themeColors.dark;
