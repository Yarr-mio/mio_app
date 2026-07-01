import apiClient from '@/api/client';
import { CHECKIN_LIST_PAGE_SIZE } from '@/constants/config';
import type { ApiResponse } from '@/types/common';
import type {
  CheckinRecord,
  SubmitCheckinBody,
  TodayCheckinStatus,
  UpdateCheckinBody,
  UpdatedCheckinRecord,
} from '@/types/checkin';
import { encodeBase64 } from '@/utils/base64';

export async function fetchCheckinToday(): Promise<TodayCheckinStatus> {
  const { data } = await apiClient.get<ApiResponse<TodayCheckinStatus>>('/v1/checkins/today');
  return data.data;
}

export async function fetchCheckinDetail(id: string): Promise<CheckinRecord> {
  const { data } = await apiClient.get<ApiResponse<CheckinRecord>>(`/v1/checkins/${id}`);
  return data.data;
}

export async function fetchCheckinList({
  cursor,
}: {
  cursor?: string;
}): Promise<{ data: CheckinRecord[]; next_cursor: string | null; has_more: boolean }> {
  const { data } = await apiClient.get<ApiResponse<CheckinRecord[]>>('/v1/checkins', {
    params: { cursor },
  });
  const records = data.data;
  const lastRecord = records[records.length - 1];

  return {
    data: records,
    next_cursor: lastRecord ? encodeBase64(lastRecord.created_at) : null,
    has_more: records.length === CHECKIN_LIST_PAGE_SIZE,
  };
}

export async function submitCheckin(
  body: SubmitCheckinBody,
  idempotencyKey: string
): Promise<CheckinRecord> {
  const { data } = await apiClient.post<ApiResponse<CheckinRecord>>('/v1/checkins', body, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return data.data;
}

export async function updateCheckin(
  checkinId: string,
  body: UpdateCheckinBody
): Promise<UpdatedCheckinRecord> {
  const { data } = await apiClient.put<ApiResponse<UpdatedCheckinRecord>>(
    `/v1/checkins/${checkinId}`,
    body
  );
  return data.data;
}
