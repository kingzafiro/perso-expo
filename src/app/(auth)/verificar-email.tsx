import { useLocalSearchParams } from "expo-router";

import { AuthSheetLayout } from "@/features/auth/components/AuthSheetLayout";
import { VerifyEmailForm } from "@/features/auth/components/VerifyEmailForm";

export default function VerificarEmailScreen() {
  const { email } = useLocalSearchParams<{
    email?: string;
  }>();

  if (!email) {
    return (
      <AuthSheetLayout
        title="Correo no encontrado"
        subtitle="Regresa al registro e intenta nuevamente."
        showBackButton
      >
        {null}
      </AuthSheetLayout>
    );
  }

  return (
    <AuthSheetLayout
      title="Verifica tu correo"
      subtitle="Ingresa el código de 6 dígitos que enviamos a tu correo electrónico."
      showBackButton
    >
      <VerifyEmailForm email={email} />
    </AuthSheetLayout>
  );
}
