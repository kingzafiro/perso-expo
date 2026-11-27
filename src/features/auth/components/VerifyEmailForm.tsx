import { AxiosError } from "axios";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { OtpCodeCard } from "@/components/ui/OtpVerificationOverlay";
import { useResendVerificationCode } from "@/features/auth/hooks/use-resend-verification-code";
import { useVerifyEmail } from "@/features/auth/hooks/use-verify-email";

interface ApiErrorResponse {
  ok: false;
  codigo?: string;
  mensaje: string;
  retryAfter?: number;
}

interface VerifyEmailFormProps {
  email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerificationCode();

  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleComplete = (codigo: string) => {
    if (codigo.length !== 6 || verifyMutation.isPending) return;
    setErrorMsg(null);
    setResendMessage(null);

    verifyMutation.mutate(
      { email, codigo },
      {
        onSuccess: () => {
          if (Platform.OS !== "web") {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          }
          router.replace("/");
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
              "No fue posible verificar el correo.",
          );
        },
      },
    );
  };

  const handleResendCode = async (): Promise<number> => {
    setErrorMsg(null);
    setResendMessage(null);

    try {
      const data = await resendMutation.mutateAsync({ email });
      setResendMessage(data.mensaje);
      return data.retryAfter ?? 60;
    } catch (error) {
      const apiError = error as AxiosError<ApiErrorResponse>;
      setErrorMsg(
        apiError?.response?.data?.mensaje ??
          "No fue posible reenviar el código.",
      );
      return apiError?.response?.data?.retryAfter ?? 30;
    }
  };

  return (
    <View style={styles.container}>
      <OtpCodeCard
        channel="email"
        targetLabel={email}
        initialCooldown={60}
        verifying={verifyMutation.isPending}
        resending={resendMutation.isPending}
        errorMessage={errorMsg}
        successMessage={resendMessage}
        onComplete={handleComplete}
        onResend={handleResendCode}
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
