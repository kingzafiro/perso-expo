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
      <Stack.Screen name="contacto" />
      <Stack.Screen name="planes" />
    </Stack>
  );
}
