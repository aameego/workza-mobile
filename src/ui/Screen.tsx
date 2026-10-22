import { type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, space } from "@/theme";
import { KEYBOARD_SCROLL_PROPS, keyboardAvoidingBehavior } from "./keyboard";

export function AppScreen({
  children,
  scroll = false,
  keyboard = false,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  keyboard?: boolean;
  contentStyle?: ViewStyle;
}) {
  const content = scroll ? (
    <ScrollView
      {...(keyboard ? KEYBOARD_SCROLL_PROPS : { keyboardShouldPersistTaps: "handled" as const })}
      contentContainerStyle={[
        { padding: space.xl, flexGrow: 1, gap: space.xs },
        keyboard ? { paddingBottom: space.xxl * 2 } : null,
        contentStyle,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, padding: space.xl, gap: space.xs }, contentStyle]}>{children}</View>
  );

  const framed = keyboard ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={keyboardAvoidingBehavior(Platform.OS)}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>{framed}</SafeAreaView>;
}
