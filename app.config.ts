import type { ConfigContext, ExpoConfig } from 'expo/config';

const KAKAO_NATIVE_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'mio_app',
  slug: 'mio_app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'mioapp',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: 'com.mio.yarr',
  },
  android: {
    package: 'com.mio.yarr',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/NotoSansKR-Black.ttf',
          './assets/fonts/NotoSansKR-Bold.ttf',
          './assets/fonts/NotoSansKR-ExtraBold.ttf',
          './assets/fonts/NotoSansKR-ExtraLight.ttf',
          './assets/fonts/NotoSansKR-Light.ttf',
          './assets/fonts/NotoSansKR-Medium.ttf',
          './assets/fonts/NotoSansKR-Regular.ttf',
          './assets/fonts/NotoSansKR-SemiBold.ttf',
          './assets/fonts/NotoSansKR-Thin.ttf',
        ],
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0D0D1A',
        image: './assets/images/background/splash_background.png',
        resizeMode: 'cover',
        android: {
          image: './assets/images/background/splash_background.png',
          resizeMode: 'cover',
        },
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'],
        },
      },
    ],
    [
      '@react-native-kakao/core',
      {
        // URL Scheme(kakao{NATIVE_APP_KEY}) 등 네이티브 설정용
        nativeAppKey: KAKAO_NATIVE_APP_KEY,
        ios: {
          // 카카오톡 로그인 후 앱 복귀 URL 처리
          handleKakaoOpenUrl: true,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
