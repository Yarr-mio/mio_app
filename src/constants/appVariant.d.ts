/**
 * appVariant js CommonJS 단일 소스 타입 선언
 * 런타임 구현은 appVariant js 이 파일은 타입만 제공
 */

/** production 앱 네이티브 번들 ID iOS bundleIdentifier Android applicationId */
export const PROD_APPLICATION_ID: string;

/** dev preview 앱 네이티브 번들 ID */
export const DEV_APPLICATION_ID: string;

/** variant isProd 기준 카카오 네이티브 앱 키 선택 */
export function selectKakaoNativeAppKey(isProd: boolean): string;
