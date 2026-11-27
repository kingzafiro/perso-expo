import { Stack } from "expo-router";

export default function TuLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="perfil" />
      <Stack.Screen name="documentos" />
      <Stack.Screen name="solicitudes" />
      <Stack.Screen
        name="escanear"
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen name="cuenta" />
      <Stack.Screen name="notificaciones" />
      <Stack.Screen name="permisos" />
      <Stack.Screen name="apariencia" />
    </Stack>
  );
}
