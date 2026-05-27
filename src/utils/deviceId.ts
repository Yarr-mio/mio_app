import * as Crypto from 'expo-crypto';

import { storage } from '@/utils/storage';

const UUID_BYTES_LENGTH = 16;
const VERSION_BYTE_INDEX = 6;
const VARIANT_BYTE_INDEX = 8;
const VERSION_CLEAR_MASK = 0x0f;
const VERSION_4_MASK = 0x40;
const VARIANT_CLEAR_MASK = 0x3f;
const VARIANT_RFC4122_MASK = 0x80;

/**
 * device_id 생성/영속화 유틸.
 *
 * 요구사항:
 * - device_id는 최초 1회 생성 후 영속 저장
 * - 이후 모든 API 요청 헤더 `X-Device-Id` 및 일부 Body(device_id)에 동일 값 사용
 *
 * 구현 포인트:
 * - Expo 환경에서는 Node의 crypto.randomUUID()를 직접 쓰기 어려우므로 `expo-crypto` 사용
 * - UUIDv4 규격에 맞게 "버전/variant" 비트를 세팅한다.
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function createUuidV4(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(UUID_BYTES_LENGTH);
  // UUID v4: version(0100)을 7번째 바이트 상위 4bit에 세팅
  bytes[VERSION_BYTE_INDEX] = (bytes[VERSION_BYTE_INDEX] & VERSION_CLEAR_MASK) | VERSION_4_MASK;
  // UUID variant(RFC4122): 9번째 바이트 상위 2bit를 10으로 세팅
  bytes[VARIANT_BYTE_INDEX] =
    (bytes[VARIANT_BYTE_INDEX] & VARIANT_CLEAR_MASK) | VARIANT_RFC4122_MASK;

  const hex = bytesToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  // 이미 저장된 값이 있으면 그대로 재사용 (앱 재설치 전까지 동일)
  const existing = await storage.deviceId.get();
  if (existing) return existing;
  const id = await createUuidV4();
  await storage.deviceId.set(id);
  return id;
}
