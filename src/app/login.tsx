import { Redirect } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { isSignInReady, normalizeOrgCode } from "@/auth/loginForm";
import type { LoginFormValues } from "@/auth/loginFormValues";
import { Workza } from "@/constants/theme";
import { useSession } from "@/session/SessionProvider";

const emptyForm = (): LoginFormValues => ({
  identifier: "",
  password: "",
  orgCode: "",
  otp: "",
  rememberMe: false,
  twoFactor: false,
});

export default function LoginScreen() {
  const { session, signIn } = useSession();
  const [form, setForm] = useState<LoginFormValues>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) return <Redirect href="/home" />;

  const ready = isSignInReady(form);

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
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.mark}>Workza</Text>
          <Text style={styles.kicker}>HRMS platform</Text>
          <Text style={styles.title}>Welcome to Workza</Text>
          <Text style={styles.subtitle}>Sign in to your Workza HRMS account.</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Work Email or Mobile Number</Text>
            <TextInput
              value={form.identifier}
              onChangeText={(identifier) => setForm((current) => ({ ...current, identifier }))}
              placeholder="name@workza.com"
              placeholderTextColor={Workza.muted}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!form.twoFactor && !loading}
              style={styles.input}
              textContentType="username"
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={form.password}
                onChangeText={(password) => setForm((current) => ({ ...current, password }))}
                placeholder="Enter your password"
                placeholderTextColor={Workza.muted}
                secureTextEntry={!showPassword}
                editable={!form.twoFactor && !loading}
                style={styles.passwordInput}
                textContentType="password"
              />
              <Pressable
                onPress={() => setShowPassword((current) => !current)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Text style={styles.show}>{showPassword ? "Hide" : "Show"}</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Organization Code</Text>
            <TextInput
              value={form.orgCode}
              onChangeText={(orgCode) =>
                setForm((current) => ({ ...current, orgCode: normalizeOrgCode(orgCode) }))
              }
              placeholder="Enter your organisation code"
              placeholderTextColor={Workza.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!form.twoFactor && !loading}
              style={styles.input}
            />
            <Text style={styles.helper}>Provided by your HR administrator</Text>

            {form.twoFactor ? (
              <>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  value={form.otp}
                  onChangeText={(otp) =>
                    setForm((current) => ({ ...current, otp: otp.replace(/\D/g, "").slice(0, 6) }))
                  }
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={Workza.muted}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.input}
                />
                <Text style={styles.helper}>
                  Code sent to: <Text style={styles.helperStrong}>{sendTo}</Text>
                </Text>
              </>
            ) : null}

            <Pressable
              style={styles.rememberRow}
              onPress={() =>
                setForm((current) => ({ ...current, rememberMe: !current.rememberMe }))
              }
              accessibilityRole="checkbox"
              accessibilityState={{ checked: form.rememberMe }}
            >
              <View style={[styles.checkbox, form.rememberMe && styles.checkboxOn]}>
                {form.rememberMe ? <Text style={styles.check}>✓</Text> : null}
              </View>
              <Text style={styles.remember}>Remember me</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.button, (!ready || loading) && styles.buttonDisabled]}
              onPress={onSubmit}
              disabled={!ready || loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color={Workza.white} />
              ) : (
                <Text style={styles.buttonText}>
                  {form.twoFactor ? "Verify & Confirm Login" : "Sign in"}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Workza.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingVertical: 32, flexGrow: 1 },
  mark: { color: Workza.teal, fontSize: 18, fontWeight: "700" },
  kicker: { marginTop: 28, color: Workza.muted, fontSize: 13 },
  title: { marginTop: 8, color: Workza.navy, fontSize: 32, fontWeight: "700" },
  subtitle: { marginTop: 8, color: Workza.muted, fontSize: 16, lineHeight: 22 },
  card: {
    marginTop: 28,
    backgroundColor: Workza.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Workza.border,
  },
  label: { marginTop: 14, marginBottom: 8, color: Workza.text, fontSize: 14, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: Workza.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Workza.text,
    backgroundColor: Workza.white,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Workza.border,
    borderRadius: 12,
    backgroundColor: Workza.white,
  },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Workza.text },
  show: { paddingHorizontal: 14, color: Workza.teal, fontWeight: "600" },
  helper: { marginTop: 8, color: Workza.muted, fontSize: 13 },
  helperStrong: { color: Workza.text, fontWeight: "600" },
  rememberRow: { marginTop: 18, flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Workza.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: Workza.navy, borderColor: Workza.navy },
  check: { color: Workza.white, fontSize: 14, fontWeight: "700" },
  remember: { color: Workza.text, fontSize: 15 },
  error: { marginTop: 14, color: Workza.error, fontSize: 14, lineHeight: 20 },
  button: {
    marginTop: 20,
    backgroundColor: Workza.navy,
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: Workza.white, fontSize: 16, fontWeight: "700" },
});
