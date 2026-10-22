import { Pressable, View } from "react-native";

import { checkboxStyle, colors, size, space, type } from "@/theme";
import { AppText } from "./Text";

export function AppCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={size.hit}
      style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}
    >
      <View style={checkboxStyle(checked)} importantForAccessibility="no-hide-descendants">
        {checked ? (
          <AppText
            accessible={false}
            style={{ color: colors.white, fontSize: 12, lineHeight: 14, fontFamily: type.label.fontFamily }}
          >
            ✓
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption">{label}</AppText>
    </Pressable>
  );
}
