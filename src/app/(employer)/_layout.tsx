import { Stack } from "expo-router";

export default function EmployerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="verificacion" />
      <Stack.Screen name="planes" />
      <Stack.Screen name="panel" />
    </Stack>
  );
}
