const { requireOptionalNativeModule } = require("expo");
const { Platform } = require("react-native");

const native =
  Platform.OS === "android" ? requireOptionalNativeModule("WorkzaDownloads") : null;

const saveToPublicDownloads = async (fileUri, fileName, mimeType) => {
  if (!native?.saveToPublicDownloads) {
    throw new Error("Saving to Downloads is only available on Android");
  }
  return native.saveToPublicDownloads(fileUri, fileName, mimeType);
};

module.exports = { saveToPublicDownloads };
