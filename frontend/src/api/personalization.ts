export interface StateSnapshot {
  tinnitus_center_hz: number | null;
  tinnitus_freq_min_hz: number | null;
  tinnitus_freq_max_hz: number | null;

  mixing_point_gain: number | null;

  tinnitus_discomfort: number;
  anxiety: number;
  stress: boolean;
  fatigue: number | null;
  caffeine: boolean;

  recent_sleep_hours: number | null;

  soundfit_texture:
    | "soft"
    | "balanced"
    | "clear"
    | null;

  soundfit_layer_mix:
    | "low"
    | "medium"
    | "high"
    | null;

  sound_sample_count: number;
  relaxation_sample_count: number;
  evaluation_sample_count: number;
}

export interface SoundStrategy {
  background: string;
  masking_ratio: number;

  modulation_intensity:
    | "low"
    | "medium"
    | "high";

  mixing_point_gain:
    | number
    | null;

  duration_minutes: number;

  soundfit_applied: {
    texture:
      | "soft"
      | "balanced"
      | "clear"
      | null;

    layer_mix:
      | "low"
      | "medium"
      | "high"
      | null;
  };
}

export interface InterventionDecision {
  id: number;

  intervention_type:
    | "sound_only"
    | "sound_with_relaxation"
    | "none";

  relaxation_activity_type:
    | "thought_distancing"
    | "tension_release"
    | "attention_shift"
    | null;

  relaxation_recommendation_source:
    | "rule_based"
    | "personalized"
    | null;

  sound_strategy: SoundStrategy;

  state_snapshot: StateSnapshot;

  has_sufficient_data: boolean;

  missing_data_sources: string[];

  reason: string;

  sound_session_id:
    | number
    | null;

  relaxation_session_id:
    | number
    | null;

  decided_at: string;
}

export async function getLatestInterventionDecision(
  uuid: string,
): Promise<InterventionDecision> {
  const response = await fetch(
    `/api/personalization/${uuid}/decision/latest/`,
  );

  if (!response.ok) {
    throw new Error(
      "오늘의 루틴을 불러오지 못했어요.",
    );
  }

  return response.json();
}