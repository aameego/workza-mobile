import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { isSignInReady, normalizeOrgCode } from "@/auth/loginForm";
import type { LoginFormValues } from "@/auth/loginFormValues";
import { space } from "@/theme";
import { AppButton, AppCard, AppField, AppScreen, AppText, BrandLogo } from "@/ui";
import { useSession } from "@/session/SessionProvider";

const emptyForm = (): LoginFormValues => ({
  identifier: "",
  password: "",
  orgCode: "",
  otp: "",
  twoFactor: false,
});

export default function LoginScreen() {
  const { session, signIn } = useSession();
  const params = useLocalSearchParams<{ passwordUpdated?: string }>();
  const [form, setForm] = useState<LoginFormValues>(emptyForm);
  const [sendTo, setSendTo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) return <Redirect href="/home" />;

  const ready = isSignInReady(form);
  const locked = form.twoFactor || loading;

  const onSubmit = async () => {
    if (!ready || loading) return;
    setLoading(true);
    setError("");
    const result = await signIn(form);
    setLoading(false);
    if (result.kind === "error") setError(result.message);
    if (result.kind === "twoFactor") {
      setSendTo(result.sendTo);
      setForm((current) => ({ ...current, twoFactor: true, otp: "" }));
    }
  };

  return (
    <AppScreen scroll keyboard>
      <BrandLogo />
      <AppText variant="kicker" style={{ marginTop: space.xl }}>
        HRMS platform
      </AppText>
      <AppText variant="title" style={{ marginTop: space.xs }}>
        Welcome to Workza
      </AppText>
      <AppText variant="subtitle" style={{ marginTop: space.xs }}>
        Sign in to your Workza HRMS account.
      </AppText>

      <AppCard style={{ marginTop: space.xl }}>
        <AppField
          label="Work Email or Mobile Number"
          value={form.identifier}
          onChangeText={(identifier) => setForm((current) => ({ ...current, identifier }))}
          placeholder="name@workza.com"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!locked}
          textContentType="username"
          returnKeyType="next"
        />

        <AppField
          label="Password"
          value={form.password}
          onChangeText={(password) => setForm((current) => ({ ...current, password }))}
          placeholder="Enter your password"
          secure
          editable={!locked}
          textContentType="password"
          returnKeyType="next"
        />

        <Pressable
          onPress={() => router.push("/forgot-password")}
          accessibilityRole="link"
          hitSlop={8}
          style={{ alignSelf: "flex-start" }}
        >
          <AppText variant="link">Forgot Password?</AppText>
        </Pressable>

        <AppField
          label="Organization Code"
          value={form.orgCode}
          onChangeText={(orgCode) =>
            setForm((current) => ({ ...current, orgCode: normalizeOrgCode(orgCode) }))
          }
          placeholder="Enter your organisation code"
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!locked}
          helper="Provided by your HR administrator"
          returnKeyType="done"
        />

        {form.twoFactor ? (
          <AppField
            label="Verification Code"
            value={form.otp}
            onChangeText={(otp) =>
              setForm((current) => ({ ...current, otp: otp.replace(/\D/g, "").slice(0, 6) }))
            }
            placeholder="Enter 6-digit OTP"
            keyboardType="number-pad"
            maxLength={6}
            helper={
              <AppText variant="helper">
                Code sent to: <AppText variant="helper" tone="ink">{sendTo}</AppText>
              </AppText>
            }
          />
        ) : null}

        {params.passwordUpdated === "1" ? (
          <AppText variant="helper" tone="success">
            Password updated successfully. Sign in with your new password.
          </AppText>
        ) : null}
        {error ? <AppText variant="error">{error}</AppText> : null}

        <View style={{ marginTop: space.xs }}>
          <AppButton
            label={form.twoFactor ? "Verify & Confirm Login" : "Sign in"}
            onPress={onSubmit}
            disabled={!ready}
            loading={loading}
          />
        </View>
      </AppCard>
    </AppScreen>
  );
}
