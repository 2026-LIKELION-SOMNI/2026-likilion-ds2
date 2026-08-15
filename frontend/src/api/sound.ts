export interface FallbackSound {
  id: number;
  name: string;
  file_url: string;
  duration_seconds: number;
  loopable: boolean;
  tags: string[];
}

export interface NotchStage {
  center_hz: number;
  q: number;
}

export interface FrequencyBand {
  type: string;
  center_hz: number;
  band_lower_hz: number;
  band_upper_hz: number;
  band_width_octaves: number;
  stages: NotchStage[];
}

export interface SoundSource {
  type: string;
  waveform?: string;
  asset_tag?: string;
  role: string;
}

export interface MixingPointRamp {
  curve: string;
  duration_seconds: number;
  range_db: number;
  target_volume: number;
  formula: string;
}

export interface GeneratedSoundParams {
  frequency_bands: FrequencyBand[];

  sources: SoundSource[];

  mix_ratio: {
    tinnitus_masking: number;
    ambient: number;
  };

  modulation_intensity:
    | "low"
    | "medium"
    | "high";

  duration_minutes: number;
  fade_out_seconds: number;

  initial_volume: number;
  max_volume: number;

  mixing_point_ramp: MixingPointRamp;
}

export interface SoundSession {
  session_id: string;

  status:
    | "generating"
    | "ready"
    | "generation_failed"
    | "playing"
    | "paused"
    | "completed"
    | "stopped_early"
    | "discomfort_stopped";

  generated_params: GeneratedSoundParams | null;

  final_params: GeneratedSoundParams | null;

  recommended_duration_minutes: number | null;

  is_fallback: boolean;

  fallback_sound:
    | FallbackSound
    | null;

  generation_error_code: string;

  initial_volume: number;
  max_volume_applied:
    | number
    | null;

  created_at: string;
}

export type PlaybackAction =
  | "start"
  | "pause"
  | "resume"
  | "stop"
  | "complete";

export type EndReason =
  | "timer"
  | "fade_complete"
  | "user_stop"
  | "discomfort"
  | "sleep_onset";

export type DiscomfortReason =
  | "too_similar"
  | "sharp"
  | "too_much_variation"
  | "dislike_background";

export type FollowUpAction =
  | "regenerate"
  | "switch_previous"
  | "end_session";

export interface VolumeUpdateResponse {
  requested_volume: number;
  applied_volume: number;
  capped: boolean;
  max_volume: number;
}

export interface DiscomfortReportResponse {
  id: number;
  reasons: DiscomfortReason[];
  note: string;
  follow_up_action:
    | FollowUpAction
    | null;
  reported_at: string;

  session_status?: string;
  can_regenerate?: boolean;
  session_ended?: boolean;
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
      "Sound API 실패 응답:",
      errorBody,
    );

    throw new Error(
      errorBody?.detail ??
        `API 요청 실패 (${response.status})`,
    );
  }

  return response.json() as Promise<T>;
}

/*
 * 오늘의 개인화 사운드 생성
 */
export async function generateTodaySound(
  uuid: string,
  forceRegenerate = false,
) {
  return request<SoundSession>(
    `/api/sound/${uuid}/generate-today/`,
    {
      method: "POST",
      body: JSON.stringify({
        force_regenerate:
          forceRegenerate,
      }),
    },
  );
}

/*
 * 사운드 세션 조회
 */
export async function getSoundSession(
  uuid: string,
  sessionId: string,
) {
  return request<SoundSession>(
    `/api/sound/${uuid}/sessions/${sessionId}/`,
  );
}

/*
 * 불편 신고 반영 후 새 사운드 생성
 */
export async function regenerateSound(
  uuid: string,
  sessionId: string,
) {
  return request<SoundSession>(
    `/api/sound/${uuid}/sessions/${sessionId}/regenerate/`,
    {
      method: "POST",
    },
  );
}

/*
 * 생성 실패 시 fallback 사용
 */
export async function useFallbackSound(
  uuid: string,
  sessionId: string,
) {
  return request<SoundSession>(
    `/api/sound/${uuid}/sessions/${sessionId}/use-fallback/`,
    {
      method: "POST",
    },
  );
}

/*
 * 재생 상태 변경
 */
export async function updateSoundPlayback(
  uuid: string,
  sessionId: string,
  action: PlaybackAction,
  playedSecondsDelta = 0,
  endReason?: EndReason,
) {
  return request<SoundSession>(
    `/api/sound/${uuid}/sessions/${sessionId}/playback/`,
    {
      method: "PATCH",
      body: JSON.stringify({
        action,
        played_seconds_delta:
          playedSecondsDelta,
        ...(endReason
          ? {
              end_reason: endReason,
            }
          : {}),
      }),
    },
  );
}

/*
 * 볼륨 변경
 */
export async function updateSoundVolume(
  uuid: string,
  sessionId: string,
  volume: number,
) {
  return request<VolumeUpdateResponse>(
    `/api/sound/${uuid}/sessions/${sessionId}/volume/`,
    {
      method: "PATCH",
      body: JSON.stringify({
        volume,
      }),
    },
  );
}

/*
 * 불편 신고
 */
export async function reportSoundDiscomfort(
  uuid: string,
  sessionId: string,
  reasons: DiscomfortReason[],
  followUpAction?: FollowUpAction,
  note = "",
) {
  return request<DiscomfortReportResponse>(
    `/api/sound/${uuid}/sessions/${sessionId}/discomfort-reports/`,
    {
      method: "POST",
      body: JSON.stringify({
        reasons,
        note,
        ...(followUpAction
          ? {
              follow_up_action:
                followUpAction,
            }
          : {}),
      }),
    },
  );
}

/*
 * 최종 선택한 배경 자연음 저장
 */
export type SoundBackground =
  | "rain"
  | "stream"
  | "white_noise"
  | "ocean"
  | "wind";

export async function updateSoundBackground(
  uuid: string,
  sessionId: string,
  background: SoundBackground,
) {
  return request<SoundSession>(
    `/api/sound/${uuid}/sessions/${sessionId}/background/`,
    {
      method: "PATCH",
      body: JSON.stringify({
        background,
      }),
    },
  );
}