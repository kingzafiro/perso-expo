import { useLocalSearchParams } from "expo-router";

import { AuthSheetLayout } from "@/features/auth/components/AuthSheetLayout";
import { VerifyRecoveryForm } from "@/features/auth/components/VerifyRecoveryForm";

export default function VerificarRecuperacionScreen() {
  const { email } = useLocalSearchParams<{
    email?: string;
  }>();

  if (!email) {
    return null;
  }

  return (
    <AuthSheetLayout
      title="Verifica tu código"
      subtitle="Ingresa el código de 6 dígitos que enviamos a tu correo."
      showBackButton
    >
      <VerifyRecoveryForm email={email} />
    </AuthSheetLayout>
  );
}
