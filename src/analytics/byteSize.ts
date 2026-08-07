/**
 * UTF-8 바이트 길이 계산
 *
 * 배치 본문·영속 버퍼의 **상한 판정용**으로만 쓴다. `TextEncoder`로 실제 인코딩하면 상한을 재려고
 * 문자열 전체를 한 번 더 버퍼로 복제하게 되므로, 코드 포인트만 훑어 길이를 센다.
 */
export function utf8ByteLength(text: string): number {
  let bytes = 0;

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      // surrogate pair — 4바이트 문자 하나
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }

  return bytes;
}
