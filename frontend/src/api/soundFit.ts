const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000";

export type SoundFitAxis =
  | "texture"
  | "layer_mix";

export type SoundFitOption =
  | "soft"
  | "clear"
  | "low"
  | "high"
  | null;

export interface SoundFitSession {
  id: number;
  round_number: number;
  current_axis: SoundFitAxis;

  option_a: SoundFitOption;
  option_b: SoundFitOption;

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

  confirm_started: boolean;
  done: boolean;

  created_at: string;
  completed_at: string | null;
}

export interface SoundFitProfile {
  texture:
    | "soft"
    | "balanced"
    | "clear";

  layer_mix:
    | "low"
    | "medium"
    | "high";

  created_at: string;
  updated_at: string;
}

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    url,
    {
      ...options,
      headers: {
        "Content-Type":
          "application/json",
        ...options?.headers,
      },
    },
  );

  if (!response.ok) {
    const errorBody =
      await response
        .json()
        .catch(() => null);

    console.error(
      "SoundFit API 오류",
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
 * 이전 단계
 */
export async function goToPreviousSoundFitStep(
  sessionId: number,
) {
  return request<SoundFitSession>(
    `${API_BASE_URL}/api/soundfit/previous/${sessionId}/`,
    {
      method: "POST",
    },
  );
}

/*
 * Sound Fit 시작
 */
export async function startSoundFit(
  uuid: string,
) {
    return request<SoundFitSession>(
      `${API_BASE_URL}/api/soundfit/start/${uuid}/`,
    {
      method: "POST",
    },
  );
}

/*
 * A/B 선택
 */
export async function selectSoundFitOption(
  sessionId: number,
  selected: "A" | "B",
) {
  return request<SoundFitSession>(
    `${API_BASE_URL}/api/soundfit/select/${sessionId}/`,
    {
      method: "POST",
      body: JSON.stringify({
        selected,
      }),
    },
  );
}

/*
 * 최종 프로필 조회
 */
export async function getSoundFitProfile(
  uuid: string,
) {
  return request<SoundFitProfile>(
    `${API_BASE_URL}/api/soundfit/profile/${uuid}/`,
  );
}