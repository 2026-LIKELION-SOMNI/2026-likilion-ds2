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

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => null);

    console.error(
      "체크인 API 실패:",
      errorBody,
    );

    throw new Error(
      errorBody?.detail ??
        `API 요청 실패 (${response.status})`,
    );
  }

  return response.json() as Promise<T>;
}

export async function createCheckin(
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

export async function getLatestCheckin(
  uuid: string,
) {
  const response = await fetch(
    `/api/checkin/${uuid}/latest/`,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `API 요청 실패 (${response.status})`,
    );
  }

  return (await response.json()) as CheckinRecord;
}

export async function getCheckinList(
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
