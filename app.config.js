export default {
  expo: {
    name: "fitfx-mobile",
    slug: "fitfx-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "fitfxmobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#000000",
        foregroundImage: "./assets/images/android-icon-foreground.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.ywaldia.fitfxmobile"
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#000000",
          dark: {
            backgroundColor: "#ffffff"
          }
        }
      ],
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "cfd1b3d7-9dea-459e-93c8-9862039d2efe"
      },
      // ✅ Reads from .env locally, uses Expo Console vars when built
      geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      geminiImageApiKey: process.env.EXPO_PUBLIC_GEMINI_IMAGE_API_KEY
    }
  }
};
