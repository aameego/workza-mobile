import { Redirect } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { organisationsForSwitcher } from "@/auth/organisations";
import { Workza } from "@/constants/theme";
import { useSession } from "@/session/SessionProvider";

export default function HomeScreen() {
  const { session, signOut, switchOrganisation } = useSession();
  const [otpFor, setOtpFor] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loadingCode, setLoadingCode] = useState("");

  if (!session) return <Redirect href="/login" />;

  const organisations = organisationsForSwitcher(session.organisations, session.user.vendor_code);
  const organisation = session.user.vendorName || session.user.vendor_code || "Your organisation";

  const onSwitch = async (code: string, codeOtp = "") => {
    setLoadingCode(code);
    setError("");
    const result = await switchOrganisation(code, codeOtp);
    setLoadingCode("");
    if (result.kind === "twoFactor") {
      setOtpFor(code);
      setOtp("");
      setError(result.message);
      return;
    }
    if (result.kind === "error") {
      setError(result.message);
      return;
    }
    setOtpFor("");
    setOtp("");
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.kicker}>Signed in</Text>
      <Text style={styles.title}>{session.user.name}</Text>
      <Text style={styles.meta}>
        {session.user.role} · {organisation}
      </Text>

      {organisations.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Organisations</Text>
          {organisations.map((org) => (
            <View key={org.code}>
              <Pressable
                style={styles.orgRow}
                disabled={org.current || loadingCode !== ""}
                onPress={() => onSwitch(org.code)}
              >
                <Text style={styles.orgName}>{org.name}</Text>
                <Text style={styles.orgCode}>{org.current ? "Current" : org.code}</Text>
              </Pressable>
              {otpFor === org.code ? (
                <View style={styles.otpRow}>
                  <TextInput
                    value={otp}
                    onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit OTP"
                    placeholderTextColor={Workza.muted}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.otpInput}
                  />
                  <Pressable
                    style={styles.otpButton}
                    disabled={otp.length !== 6 || loadingCode !== ""}
                    onPress={() => onSwitch(org.code, otp)}
                  >
                    {loadingCode === org.code ? (
                      <ActivityIndicator color={Workza.white} />
                    ) : (
                      <Text style={styles.otpButtonText}>Confirm</Text>
                    )}
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.signOut} onPress={() => signOut()} accessibilityRole="button">
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Workza.background, padding: 24 },
  kicker: { color: Workza.teal, fontSize: 14, fontWeight: "700" },
  title: { marginTop: 8, color: Workza.navy, fontSize: 32, fontWeight: "700" },
  meta: { marginTop: 8, color: Workza.muted, fontSize: 16 },
  card: {
    marginTop: 28,
    backgroundColor: Workza.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Workza.border,
    padding: 8,
  },
  cardTitle: { paddingHorizontal: 12, paddingTop: 8, color: Workza.navy, fontWeight: "700" },
  orgRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  orgName: { color: Workza.text, fontSize: 16 },
  orgCode: { color: Workza.muted },
  otpRow: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Workza.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: Workza.text,
  },
  otpButton: {
    backgroundColor: Workza.navy,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  otpButtonText: { color: Workza.white, fontWeight: "700" },
  error: { marginTop: 16, color: Workza.error },
  signOut: {
    marginTop: 28,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Workza.navy,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  signOutText: { color: Workza.navy, fontWeight: "700" },
});
