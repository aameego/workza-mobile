import { Image, type ImageStyle, type StyleProp } from "react-native";

const workzaLogo = require("../../assets/images/workza-logo.png");

type BrandLogoProps = {
  style?: StyleProp<ImageStyle>;
};

export function BrandLogo({ style }: BrandLogoProps) {
  return (
    <Image
      source={workzaLogo}
      accessibilityLabel="Workza"
      resizeMode="contain"
      style={[{ width: 220, height: 41 }, style]}
    />
  );
}
