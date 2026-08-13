import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="registro" />
      <Stack.Screen name="verificar-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verificar-recuperacion" />
      <Stack.Screen name="nueva-password" />
    </Stack>
  );
}
