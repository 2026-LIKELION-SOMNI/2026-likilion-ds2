import { request, requestOrNull } from "./client";

export type DailyFactor =
  | "caffeine"
  | "stress"
  | "fatigue"
  | "noise_exposure";

export interface CheckinRecord {
  id: number;
  user: number;

  discomfort: number;
  tension: number;

  sleep_hours: number | null;
  daily_factors: DailyFactor[];
  note: string;

  created_at: string;
}

export interface CheckinPayload {
  discomfort: number;
  tension: number;

  sleep_hours?: number | null;
  daily_factors?: DailyFactor[];
  note?: string;
}

export const CHECKIN_NOTE_MAX_LENGTH = 255;

export function createCheckin(
  uuid: string,
  payload: CheckinPayload,
) {
  return request<CheckinRecord>(
    `/api/checkin/${uuid}/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function getLatestCheckin(uuid: string) {
  return requestOrNull<CheckinRecord>(
    `/api/checkin/${uuid}/latest/`,
  );
}

export function getCheckinList(
  uuid: string,
  date?: string,
) {
  const query = date
    ? `?date=${encodeURIComponent(date)}`
    : "";

  return request<CheckinRecord[]>(
    `/api/checkin/${uuid}/list/${query}`,
  );
}
