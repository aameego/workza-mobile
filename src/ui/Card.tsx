import { View, type ViewProps } from "react-native";

import { cardStyle, space } from "@/theme";

export function AppCard({ style, ...props }: ViewProps) {
  return <View style={[cardStyle(), { padding: space.lg, gap: space.md }, style]} {...props} />;
}
