import { request, requestOrNull } from "./client";

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

export const EVALUATION_NOTE_MAX_LENGTH = 100;

export function getTodayEvaluation(uuid: string) {
  return requestOrNull<NightlyEvaluation>(
    `/api/feedback/${uuid}/today/`,
  );
}

export function getPendingEvaluations(
  uuid: string,
) {
  return request<NightlyEvaluation[]>(
    `/api/feedback/${uuid}/pending/`,
  );
}

export function getEvaluationDetail(
  uuid: string,
  evaluationId: number,
) {
  return request<NightlyEvaluation>(
    `/api/feedback/${uuid}/${evaluationId}/`,
  );
}

export function submitEvaluation(
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
