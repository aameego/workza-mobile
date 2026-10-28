const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");
const { patchWebChromeClientSource } = require("./patchWebChromeClient");

const RELATIVE =
  "node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebChromeClient.java";

const withWebViewOneTimePermissions = (config) =>
  withDangerousMod(config, [
    "android",
    async (config) => {
      const file = path.join(config.modRequest.projectRoot, RELATIVE);
      if (!fs.existsSync(file)) {
        throw new Error(`withWebViewOneTimePermissions: missing ${RELATIVE}`);
      }
      const src = fs.readFileSync(file, "utf8");
      const next = patchWebChromeClientSource(src);
      if (next === src && !src.includes("Always ask the OS")) {
        throw new Error("withWebViewOneTimePermissions: WebView permission source changed; update the patch.");
      }
      if (next !== src) fs.writeFileSync(file, next);
      return config;
    },
  ]);

module.exports = withWebViewOneTimePermissions;
