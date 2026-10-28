const { withAppBuildGradle } = require("expo/config-plugins");

const DEBUG_SIGNING = `        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

const DEBUG_AND_RELEASE_SIGNING = `        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            def keystorePropertiesFile = rootProject.file("../credentials/keystore.properties")
            if (keystorePropertiesFile.exists()) {
                def keystoreProperties = new Properties()
                keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
                storeFile file(keystoreProperties["storeFile"])
                storePassword keystoreProperties["storePassword"]
                keyAlias keystoreProperties["keyAlias"]
                keyPassword keystoreProperties["keyPassword"]
            }
        }
    }`;

const RELEASE_USES_UPLOAD = `            signingConfig rootProject.file("../credentials/keystore.properties").exists() ? signingConfigs.release : signingConfigs.debug`;

/** Play upload key lives in credentials/ so expo prebuild cannot wipe it. */
const withAndroidReleaseSigning = (config) =>
  withAppBuildGradle(config, (config) => {
    let src = config.modResults.contents;
    if (!src.includes("credentials/keystore.properties")) {
      if (!src.includes(DEBUG_SIGNING)) {
        throw new Error("withAndroidReleaseSigning: debug signing block not found");
      }
      src = src.replace(DEBUG_SIGNING, DEBUG_AND_RELEASE_SIGNING);
    }
    if (src.includes("signingConfigs.debug") && src.includes("// Caution! In production")) {
      src = src.replace(
        /\/\/ Caution! In production, you need to generate your own keystore file\.\n            \/\/ see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\n            signingConfig signingConfigs\.debug/,
        `// Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
${RELEASE_USES_UPLOAD}`
      );
    }
    config.modResults.contents = src;
    return config;
  });

module.exports = withAndroidReleaseSigning;
