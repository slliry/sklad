export default {
  expo: {
    name: 'LuxSclad',
    slug: 'LuxSclad',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.luxsclad.app',
      "newArchEnabled": true,
      "googleServicesFile": "./ios/GoogleService-Info.plist"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
        "newArchEnabled": true,
        "googleServicesFile": "./android/app/google-services.json"
      },
      package: 'com.luxsclad.app'
    },
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static'
          }
        }
      ]
    ]
  }
} 