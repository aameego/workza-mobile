import { Platform } from "react-native";

/** ScrollView props so the focused field stays above the keyboard on Android and iOS. */
export const KEYBOARD_SCROLL_PROPS = {
  keyboardShouldPersistTaps: "handled" as const,
  keyboardDismissMode: "on-drag" as const,
  automaticallyAdjustKeyboardInsets: true,
};

export const keyboardAvoidingBehavior = (_os: typeof Platform.OS): "padding" => "padding";
