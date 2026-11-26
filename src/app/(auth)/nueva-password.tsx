import { useLocalSearchParams } from "expo-router";

import { AuthSheetLayout } from "@/features/auth/components/AuthSheetLayout";
import { NewPasswordForm } from "@/features/auth/components/NewPasswordForm";

export default function NuevaPasswordScreen() {
  const params = useLocalSearchParams<{
    resetToken?: string | string[];
  }>();

  const resetToken = Array.isArray(params.resetToken)
    ? params.resetToken[0]
    : params.resetToken;

  if (!resetToken) {
    return null;
  }

  return (
    <AuthSheetLayout
      title="Nueva contraseña"
      subtitle="Crea una nueva contraseña segura para tu cuenta."
      showBackButton
    >
      <NewPasswordForm resetToken={resetToken} />
    </AuthSheetLayout>
  );
}
