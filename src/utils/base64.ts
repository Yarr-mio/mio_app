const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * ASCII 전용 Base64 인코더. Hermes에 btoa/Buffer가 기본 제공되지 않아 직접 구현.
 * 서버 cursor 포맷(Base64(OffsetDateTime.toString()))은 ISO-8601(ASCII)만 다루므로
 * 멀티바이트 처리 없는 이 구현으로 충분하다.
 */
export function encodeBase64(input: string): string {
  let result = '';
  let i = 0;

  while (i < input.length) {
    const byte1 = input.charCodeAt(i++) & 0xff;
    const hasByte2 = i < input.length;
    const byte2 = hasByte2 ? input.charCodeAt(i++) & 0xff : 0;
    const hasByte3 = i < input.length;
    const byte3 = hasByte3 ? input.charCodeAt(i++) & 0xff : 0;

    const triplet = (byte1 << 16) | (byte2 << 8) | byte3;

    result += BASE64_ALPHABET[(triplet >> 18) & 0x3f];
    result += BASE64_ALPHABET[(triplet >> 12) & 0x3f];
    result += hasByte2 ? BASE64_ALPHABET[(triplet >> 6) & 0x3f] : '=';
    result += hasByte3 ? BASE64_ALPHABET[triplet & 0x3f] : '=';
  }

  return result;
}
