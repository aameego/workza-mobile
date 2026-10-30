import { Redirect, router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, View } from "react-native";

import {
  sendForgotOtpWithClient,
  updateForgotPasswordWithClient,
  verifyForgotOtpWithClient,
} from "@/api/authApi";
import { createApiClient, fetchTransport } from "@/api/client";
import { resetForgotPassword, requestForgotOtp, verifyForgotOtp } from "@/auth/forgotPasswordFlow";
import {
  OTP_RESEND_SECONDS,
  type ForgotStep,
  forgotHeader,
  formatResendCountdown,
  isIdentifyReady,
  isResetReady,
  isVerifyReady,
  normalizeForgotOrgCode,
} from "@/auth/forgotPasswordForm";
import { API_BASE_URL } from "@/config/api";
import { mobileClientRequestHeaders } from "@/config/mobileClient";
import { useSession } from "@/session/SessionProvider";
import { space } from "@/theme";
import { AppButton, AppCard, AppField, AppScreen, AppText, BrandLogo } from "@/ui";

export default function ForgotPasswordScreen() {
  const { session } = useSession();
  const client = useRef(
    createApiClient({
      baseUrl: API_BASE_URL,
      getToken: () => null,
      onUnauthorized: () => {},
      transport: fetchTransport,
      extraHeaders: mobileClientRequestHeaders,
    })
  ).current;

  const [step, setStep] = useState<ForgotStep>("identify");
  const [identifier, setIdentifier] = useState("");
  const [orgCode, setOrgCode] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(OTP_RESEND_SECONDS);

  const header = useMemo(() => forgotHeader(step, identifier), [step, identifier]);
  const mismatch =
    newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;

  useEffect(() => {
    if (step !== "verify" || timer <= 0) return;
    const interval = setInterval(() => setTimer((current) => current - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  if (session) return <Redirect href="/home" />;

  const goBack = () => {
    setError("");
    if (step === "identify") {
      router.replace("/login");
      return;
    }
    setStep(step === "reset" ? "verify" : "identify");
  };

  const sendOtp = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    const result = await requestForgotOtp({
      form: { identifier, orgCode },
      sendOtp: sendForgotOtpWithClient(client),
    });
    setLoading(false);
    if (result.kind === "error") {
      setError(result.message);
      return;
    }
    setOtp("");
    setTimer(OTP_RESEND_SECONDS);
    setStep("verify");
  };

  const onVerify = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    const result = await verifyForgotOtp({
      identifier,
      orgCode,
      otp,
      verifyOtp: verifyForgotOtpWithClient(client),
    });
    setLoading(false);
    if (result.kind === "error") {
      setError(result.message);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setStep("reset");
  };

  const onReset = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    const result = await resetForgotPassword({
      identifier,
      orgCode,
      form: { newPassword, confirmPassword },
      updatePassword: updateForgotPasswordWithClient(client),
    });
    setLoading(false);
    if (result.kind === "error") {
      setError(result.message);
      return;
    }
    router.replace("/login?passwordUpdated=1");
  };

  return (
    <AppScreen scroll keyboard>
      <BrandLogo />
      <AppText variant="kicker" style={{ marginTop: space.xl }}>
        HRMS platform
      </AppText>
      <AppText variant="title" style={{ marginTop: space.xs }}>
        {header.title}
      </AppText>
      <AppText variant="subtitle" style={{ marginTop: space.xs }}>
        {header.subtitle}
      </AppText>

      <AppCard style={{ marginTop: space.xl }}>
        <Pressable onPress={goBack} accessibilityRole="link" hitSlop={8}>
          <AppText variant="link">
            {step === "identify" ? "← Back to Login" : "← Back to details"}
          </AppText>
        </Pressable>

        {step === "identify" ? (
          <>
            <AppField
              label="Organization Code"
              value={orgCode}
              onChangeText={(value) => setOrgCode(normalizeForgotOrgCode(value))}
              placeholder="Enter your organization code"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!loading}
              returnKeyType="next"
            />
            <AppField
              label="Work Email or Mobile Number"
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="Enter your work email or mobile number"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              keyboardType="email-address"
              returnKeyType="done"
              helper="Enter your registered email or mobile number to receive a verification OTP."
            />
            {error ? <AppText variant="error">{error}</AppText> : null}
            <View style={{ marginTop: space.xs }}>
              <AppButton
                label={loading ? "Sending..." : "Send OTP"}
                onPress={sendOtp}
                disabled={!isIdentifyReady({ identifier, orgCode })}
                loading={loading}
              />
            </View>
          </>
        ) : null}

        {step === "verify" ? (
          <>
            <AppField
              label="Verification Code"
              value={otp}
              onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              returnKeyType="done"
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <AppText variant="helper">Didn't receive the code?</AppText>
              {timer > 0 ? (
                <AppText variant="helper">Resend in {formatResendCountdown(timer)}</AppText>
              ) : (
                <Pressable onPress={sendOtp} disabled={loading} accessibilityRole="button">
                  <AppText variant="link">Resend OTP</AppText>
                </Pressable>
              )}
            </View>
            {error ? <AppText variant="error">{error}</AppText> : null}
            <View style={{ marginTop: space.xs }}>
              <AppButton
                label={loading ? "Verifying..." : "Verify OTP"}
                onPress={onVerify}
                disabled={!isVerifyReady(otp)}
                loading={loading}
              />
            </View>
          </>
        ) : null}

        {step === "reset" ? (
          <>
            <AppField
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secure
              editable={!loading}
              textContentType="newPassword"
              returnKeyType="next"
            />
            <AppField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              secure
              editable={!loading}
              textContentType="newPassword"
              returnKeyType="done"
              helper="Please choose a strong, secure password (minimum 5 characters)."
            />
            {mismatch ? <AppText variant="error">Passwords do not match</AppText> : null}
            {error ? <AppText variant="error">{error}</AppText> : null}
            <View style={{ marginTop: space.xs }}>
              <AppButton
                label={loading ? "Updating..." : "Update Password"}
                onPress={onReset}
                disabled={!isResetReady({ newPassword, confirmPassword })}
                loading={loading}
              />
            </View>
          </>
        ) : null}
      </AppCard>
    </AppScreen>
  );
}
