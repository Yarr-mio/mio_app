import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_VARIANTS = ['development', 'preview', 'production'] as const;
type AppVariant = (typeof APP_VARIANTS)[number];

function isAppVariant(value: string | undefined): value is AppVariant {
  return !!value && APP_VARIANTS.includes(value as AppVariant);
}

// Expo CLI 가 @expo/env 로 .env 로드 기존 process.env 는 덮어쓰지 않음
// EAS 빌드는 EAS_BUILD_PROFILE 우선 .env.local 의 APP_VARIANT 오염 차단
function resolveAppVariant(): AppVariant {
  const isEasBuild = process.env.EAS_BUILD === 'true';

  if (isEasBuild && isAppVariant(process.env.EAS_BUILD_PROFILE)) {
    return process.env.EAS_BUILD_PROFILE;
  }

  if (isAppVariant(process.env.APP_VARIANT)) {
    return process.env.APP_VARIANT;
  }

  return 'development';
}

const APP_VARIANT = resolveAppVariant();
const IS_DEV_VARIANT = APP_VARIANT === 'development' || APP_VARIANT === 'preview';

// 네이티브 플러그인 키 빌드 시 고정 pnpm start 만으로는 변경 불가
const KAKAO_NATIVE_APP_KEY = IS_DEV_VARIANT
  ? (process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY_DEV ?? '')
  : (process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? '');

const APP_NAME = IS_DEV_VARIANT ? 'Mio Dev' : 'MIO';
const BUNDLE_IDENTIFIER = IS_DEV_VARIANT ? 'com.mio.yarr.dev' : 'com.mio.yarr';

// Android FCM 클라이언트 FCM 토큰 발급용 백엔드 발송은 Firebase Admin SDK
const GOOGLE_SERVICES_FILE = './google-services.json';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: 'mio',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'mioapp',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: BUNDLE_IDENTIFIER,
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: BUNDLE_IDENTIFIER,
    googleServicesFile: GOOGLE_SERVICES_FILE,
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
      'expo-notifications',
      {
        defaultChannel: 'default',
        // iOS APNs remote-notification background mode 백엔드는 APNs HTTP2 직접 연동
        enableBackgroundRemoteNotifications: true,
      },
    ],
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
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        android: {
          backgroundColor: '#0D0D1A',
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
        },
        ios: {
          backgroundColor: '#0D0D1A',
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
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
    'expo-apple-authentication',
    ...(KAKAO_NATIVE_APP_KEY
      ? [
          [
            '@react-native-kakao/core',
            {
              // URL Scheme kakao NATIVE_APP_KEY 등 네이티브 설정용
              nativeAppKey: KAKAO_NATIVE_APP_KEY,
              ios: {
                // 카카오톡 로그인 후 앱 복귀 URL 처리함
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
