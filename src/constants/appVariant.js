/**
 * 앱 variant dev preview prod 판별 규칙 단일 소스
 *
 * 실행 컨텍스트가 다른 두 곳에서 공유
 *   app config 빌드 네이티브 설정 평가 시점 Node CommonJS require
 *   config 파일 JS 런타임 설치 바이너리 Metro import
 *
 * variant 판별 근거는 상이 app config 는 EAS_BUILD_PROFILE APP_VARIANT env 사용
 * config 파일은 OTA 불변 Application applicationId 사용
 * 근거가 달라도 결과 동일 필요 네이티브 URL scheme 과 JS SDK 초기화 키 불일치 방지
 * 단일화 대상 번들 ID 리터럴과 키 선택 로직
 *
 * 주의 반드시 CommonJS js module exports 유지
 *   app config 는 expo require utils 가 CommonJS 로 require sibling ts 확장자 미해석
 *   ESM js 는 require 실패 타입은 appVariant 선언 파일 제공
 * 주의 expo application 등 런타임 전용 모듈 require 금지 config 평가 시점 파손
 */

/** production 앱 네이티브 번들 ID iOS bundleIdentifier Android applicationId */
const PROD_APPLICATION_ID = 'com.mio.yarr';

/** dev preview 앱 네이티브 번들 ID */
const DEV_APPLICATION_ID = 'com.mio.yarr.dev';

/**
 * variant 기준 카카오 네이티브 앱 키 선택
 *
 * app config 네이티브 플러그인 nativeAppKey 와 config 파일 initializeKakaoSDK 인자
 * 동일 규칙 선택 일원화 prod 는 접미사 없는 EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY
 * 그 외 는 _DEV 대시보드 변수명과 일치
 */
function selectKakaoNativeAppKey(isProd) {
  const key = isProd
    ? process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY
    : process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY_DEV;
  return key?.trim() ?? '';
}

module.exports = {
  PROD_APPLICATION_ID,
  DEV_APPLICATION_ID,
  selectKakaoNativeAppKey,
};
