export type SleepLatency =
  | "under_15min"
  | "15_30min"
  | "30_60min"
  | "over_60min"
  | "unknown";

export type SoundReaction =
  | "comfortable"
  | "noise_weak"
  | "sharp"
  | "volume_too_loud"
  | "natural_sound_uncomfortable";

export type EvaluationStatus =
  | "pending"
  | "evaluated"
  | "expired";

export interface RelaxationRecap {
  activity_type: string;
  activity_type_display: string;
  started_at: string | null;
  status: string;
}

export interface SoundRecap {
  status: string;
  is_fallback: boolean;
  playback_started_at: string | null;
  total_played_seconds: number;
}

export interface NightlyEvaluation {
  id: number;
  for_date: string;
  status: EvaluationStatus;

  sleep_latency: SleepLatency | null;
  discomfort_after: number | null;
  anxiety_after: number | null;
  routine_helpfulness: number | null;
  sound_reactions: SoundReaction[];
  current_fatigue: number | null;
  note: string;

  relaxation_recap: RelaxationRecap | null;
  sound_recap: SoundRecap | null;

  created_at: string;
  evaluated_at: string | null;
}

export interface NightlyEvaluationPayload {
  sleep_latency?: SleepLatency | null;
  discomfort_after?: number | null;
  anxiety_after?: number | null;
  routine_helpfulness?: number | null;
  sound_reactions?: SoundReaction[];
  current_fatigue?: number | null;
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
      "결과 기록 API 실패:",
      errorBody,
    );

    throw new Error(
      errorBody?.detail ??
        `API 요청 실패 (${response.status})`,
    );
  }

  return response.json() as Promise<T>;
}

export async function getTodayEvaluation(
  uuid: string,
) {
  const response = await fetch(
    `/api/feedback/${uuid}/today/`,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorBody?.detail ??
        `API 요청 실패 (${response.status})`,
    );
  }

  return (await response.json()) as NightlyEvaluation;
}

export async function getPendingEvaluations(
  uuid: string,
) {
  return request<NightlyEvaluation[]>(
    `/api/feedback/${uuid}/pending/`,
  );
}

export async function getEvaluationDetail(
  uuid: string,
  evaluationId: number,
) {
  return request<NightlyEvaluation>(
    `/api/feedback/${uuid}/${evaluationId}/`,
  );
}

export async function submitEvaluation(
  uuid: string,
  evaluationId: number,
  payload: NightlyEvaluationPayload,
) {
  return request<NightlyEvaluation>(
    `/api/feedback/${uuid}/${evaluationId}/submit/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
