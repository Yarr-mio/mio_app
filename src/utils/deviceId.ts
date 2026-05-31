import * as Crypto from 'expo-crypto';

import { storage } from '@/utils/storage';

const UUID_BYTES_LENGTH = 16;
const VERSION_BYTE_INDEX = 6;
const VARIANT_BYTE_INDEX = 8;
const VERSION_CLEAR_MASK = 0x0f;
const VERSION_4_MASK = 0x40;
const VARIANT_CLEAR_MASK = 0x3f;
const VARIANT_RFC4122_MASK = 0x80;

let pendingDeviceId: Promise<string> | null = null;

/**
 * deviceId(UUID v4) 생성/영속화 유틸
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
  if (pendingDeviceId) {
    return pendingDeviceId;
  }

  pendingDeviceId = (async () => {
    const existing = await storage.deviceId.get();
    if (existing) {
      return existing;
    }
    const id = await createUuidV4();
    await storage.deviceId.set(id);
    return id;
  })();

  try {
    return await pendingDeviceId;
  } finally {
    pendingDeviceId = null;
  }
}
