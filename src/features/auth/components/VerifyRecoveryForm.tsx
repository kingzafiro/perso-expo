import { AxiosError } from "axios";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { OtpCodeCard } from "@/components/ui/OtpVerificationOverlay";
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password";
import { useVerifyRecovery } from "@/features/auth/hooks/use-verify-recovery";

interface ApiErrorResponse {
  ok: false;
  codigo?: string;
  mensaje: string;
}

interface VerifyRecoveryFormProps {
  email: string;
}

export function VerifyRecoveryForm({ email }: VerifyRecoveryFormProps) {
  const verifyRecoveryMutation = useVerifyRecovery();
  const resendRecoveryMutation = useForgotPassword();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleComplete = (codigo: string) => {
    if (codigo.length !== 6 || verifyRecoveryMutation.isPending) return;
    setErrorMsg(null);
    setResendMessage(null);

    verifyRecoveryMutation.mutate(
      { email, codigo },
      {
        onSuccess: (data) => {
          if (Platform.OS !== "web") {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          }
          router.push({
            pathname: "/nueva-password",
            params: {
              resetToken: data.resetToken,
            },
          });
        },
        onError: (error) => {
          if (Platform.OS !== "web") {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Error,
            );
          }
          const apiError = error as AxiosError<ApiErrorResponse>;
          setErrorMsg(
            apiError?.response?.data?.mensaje ??
              "No fue posible validar el código.",
          );
        },
      },
    );
  };

  const handleResend = async (): Promise<number> => {
    setErrorMsg(null);
    setResendMessage(null);
    try {
      await resendRecoveryMutation.mutateAsync({ email });
      setResendMessage("Enviamos un nuevo código a tu correo.");
      return 60;
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      setErrorMsg(
        apiError?.response?.data?.mensaje ??
          "No fue posible reenviar el código.",
      );
      return 30;
    }
  };

  return (
    <View style={styles.container}>
      <OtpCodeCard
        channel="email"
        title="Código de recuperación"
        targetLabel={email}
        initialCooldown={60}
        verifying={verifyRecoveryMutation.isPending}
        resending={resendRecoveryMutation.isPending}
        errorMessage={errorMsg}
        successMessage={resendMessage}
        onComplete={handleComplete}
        onResend={handleResend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 8,
  },
});
