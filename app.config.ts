import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_VARIANTS = ['development', 'preview', 'production'] as const;
type AppVariant = (typeof APP_VARIANTS)[number];

function isAppVariant(value: string | undefined): value is AppVariant {
  return !!value && APP_VARIANTS.includes(value as AppVariant);
}

// 우선순위 EAS_BUILD_PROFILE 다음 APP_VARIANT 다음 development
// EAS 클라우드 및 로컬 시뮬레이션 모두 프로필이 있으면 .env.local APP_VARIANT 무시
function resolveAppVariant(): AppVariant {
  if (isAppVariant(process.env.EAS_BUILD_PROFILE)) {
    return process.env.EAS_BUILD_PROFILE;
  }

  if (isAppVariant(process.env.APP_VARIANT)) {
    return process.env.APP_VARIANT;
  }

  return 'development';
}

const APP_VARIANT = resolveAppVariant();
const IS_DEV_VARIANT = APP_VARIANT === 'development' || APP_VARIANT === 'preview';

const VERSION = '1.0.0';

// runtimeVersion을 variant별로 분리해 잘못 평가된 번들이 다른 variant 빌드에 설치되는 것을 차단
// production은 기존 배포 빌드와의 업데이트 호환을 위해 appVersion 정책 유지
// dev/preview는 명시 문자열이라 production 채널에 올라가도 runtimeVersion 불일치로 설치 거부됨
const RUNTIME_VERSION: ExpoConfig['runtimeVersion'] =
  APP_VARIANT === 'production' ? { policy: 'appVersion' } : `${VERSION}-${APP_VARIANT}`;

// build/update 실행 로그에서 어느 variant로 평가됐는지 즉시 확인용
console.log(
  `[app.config] variant=${APP_VARIANT} runtimeVersion=${JSON.stringify(RUNTIME_VERSION)}`
);

// 네이티브 플러그인 키 빌드 시 고정 pnpm start 만으로는 변경 불가
// 모듈 로드 시 throw 금지 eas bootstrap config 후 Dashboard 키 주입
const KAKAO_NATIVE_APP_KEY = IS_DEV_VARIANT
  ? (process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY_DEV?.trim() ?? '')
  : (process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim() ?? '');

const APP_NAME = IS_DEV_VARIANT ? 'Mio Dev' : 'MIO';
const BUNDLE_IDENTIFIER = IS_DEV_VARIANT ? 'com.mio.yarr.dev' : 'com.mio.yarr';

// 앱 자체 커스텀 스킴도 variant별로 분리
// dev/preview/prod 앱이 동시에 설치돼 있을 때 동일한 scheme을 쓰면 OS가 어느 앱을 열지 비결정적으로 고름
// (카카오/애플 로그인 리다이렉트 딥링크가 엉뚱한 앱으로 빠지는 원인이 될 수 있음
const APP_SCHEME =
  APP_VARIANT === 'production'
    ? 'mioapp'
    : APP_VARIANT === 'preview'
      ? 'mioapp-preview'
      : 'mioapp-dev';

// Android FCM 클라이언트 FCM 토큰 발급용 백엔드 발송은 Firebase Admin SDK
const GOOGLE_SERVICES_FILE = './google-services.json';

const kakaoPlugin: [string, { nativeAppKey: string; ios: { handleKakaoOpenUrl: boolean } }] = [
  '@react-native-kakao/core',
  {
    // URL Scheme kakao NATIVE_APP_KEY 등 네이티브 설정용
    nativeAppKey: KAKAO_NATIVE_APP_KEY,
    ios: {
      // 카카오톡 로그인 후 앱 복귀 URL 처리함
      handleKakaoOpenUrl: true,
    },
  },
];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: 'mio',
  version: VERSION,
  runtimeVersion: RUNTIME_VERSION,
  orientation: 'portrait',
  // 홈 화면 앱 아이콘 mio_logo 적용함
  icon: './assets/images/mio_logo.png',
  scheme: APP_SCHEME,
  userInterfaceStyle: 'automatic',
  ios: {
    // iOS 아이콘 정사각 원본 사용함
    icon: './assets/images/mio_logo.png',
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
      // 밤하늘 상단 배경색 적용함
      backgroundColor: '#000010',
      foregroundImage: './assets/images/mio_logo.png',
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
        // Android 12+는 splashscreen_logo drawable이 필수라 image 없으면 빌드 실패함
        // 네이티브 로고는 최소화하고 실제 UI는 JS 커스텀 스플래시로 전환
        backgroundColor: '#0D0D1A',
        image: './assets/images/splash-icon.png',
        imageWidth: 1,
        resizeMode: 'contain',
        android: {
          backgroundColor: '#0D0D1A',
          image: './assets/images/splash-icon.png',
          imageWidth: 1,
          resizeMode: 'contain',
        },
        ios: {
          backgroundColor: '#0D0D1A',
          image: './assets/images/splash-icon.png',
          imageWidth: 1,
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
    'expo-secure-store',
    'expo-web-browser',
    // 키 있을 때만 등록 eas 1차 config 통과 후 Dashboard 키로 2차 등록
    ...(KAKAO_NATIVE_APP_KEY ? [kakaoPlugin] : []),
  ],
  extra: {
    ...config.extra,
    appVariant: APP_VARIANT,
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
