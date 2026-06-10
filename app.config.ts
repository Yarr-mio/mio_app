import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_VARIANTS = ['development', 'preview', 'production'] as const;
type AppVariant = (typeof APP_VARIANTS)[number];

const rawAppVariant = process.env.APP_VARIANT ?? 'development';
if (!APP_VARIANTS.includes(rawAppVariant as AppVariant)) {
  throw new Error(`APP_VARIANT must be one of: ${APP_VARIANTS.join(', ')}`);
}
const APP_VARIANT = rawAppVariant as AppVariant;
const IS_DEV_VARIANT = APP_VARIANT === 'development' || APP_VARIANT === 'preview';

const KAKAO_NATIVE_APP_KEY =
  process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY_DEV ??
  process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ??
  '';

const APP_NAME = IS_DEV_VARIANT ? 'Mio Dev' : 'MIO';
const BUNDLE_IDENTIFIER = IS_DEV_VARIANT ? 'com.mio.yarr.dev' : 'com.mio.yarr';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: 'mio_app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'mioapp',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: BUNDLE_IDENTIFIER,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: BUNDLE_IDENTIFIER,
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
    ...(KAKAO_NATIVE_APP_KEY
      ? [
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
          ] as [string, any],
        ]
      : []),
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
