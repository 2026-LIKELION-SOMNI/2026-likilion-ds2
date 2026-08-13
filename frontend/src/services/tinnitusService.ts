import { getUserUuid } from "../utils/userStorage";

export type ToneType =
  | "high"
  | "low"
  | "wide"
  | "multiple";

export type TinnitusType =
  | "tonal"
  | "noise_like";

export interface OctaveTest {
  half: number | null;
  same: number;
  double: number | null;
  limited: boolean;
}

export interface PitchMatchSession {
  id: number;

  tinnitus_type: TinnitusType;
  bandwidth_octave: number;

  round_number: number;

  range_min: number;
  range_max: number;

  freq_a: number | null;
  freq_b: number | null;

  done: boolean;

  octave_test_started: boolean;
  octave_test: OctaveTest | null;

  center_frequency: number | null;
  lower_bound: number | null;
  upper_bound: number | null;

  octave_corrected: boolean;
  octave_check_limited: boolean;

  mixing_point_gain: number | null;

  created_at: string;
  completed_at: string | null;
}

function requireUuid() {
  const uuid = getUserUuid();

  if (!uuid) {
    throw new Error(
      "사용자 UUID가 없습니다.",
    );
  }

  return uuid;
}

/*
 * 이명 프로필 저장
 *
 * high     = 삐
 * low      = 윙
 * wide     = 쉬익
 * multiple = 복합형
 */
export async function saveTinnitusProfile(
  toneType: ToneType,
) {
  const uuid = requireUuid();

  const response = await fetch(
    `/api/tinnitus/profile/${uuid}/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tone_type: toneType,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      "이명 프로필 저장에 실패했습니다.",
    );
  }

  return response.json();
}

/*
 * 음역 매칭 시작
 */
export async function startPitchMatching(
  primaryToneType?: Exclude<
    ToneType,
    "multiple"
  >,
): Promise<PitchMatchSession> {
  const uuid = requireUuid();

  const response = await fetch(
    `/api/tinnitus/matching/start/${uuid}/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        primaryToneType
          ? {
              primary_tone_type:
                primaryToneType,
            }
          : {},
      ),
    },
  );

  if (!response.ok) {
    throw new Error(
      "음역 매칭 시작에 실패했습니다.",
    );
  }

  return response.json();
}

/*
 * A/B 선택
 */
export async function selectPitchMatch(
  sessionId: number,
  selected: "A" | "B",
): Promise<PitchMatchSession> {
  const response = await fetch(
    `/api/tinnitus/matching/select/${sessionId}/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        selected,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      "음역 선택에 실패했습니다.",
    );
  }

  return response.json();
}

/*
 * octave confusion test
 */
export async function selectOctave(
  sessionId: number,
  selected: "half" | "same" | "double",
): Promise<PitchMatchSession> {
  const response = await fetch(
    `/api/tinnitus/matching/octave-check/${sessionId}/`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        selected,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      "옥타브 선택에 실패했습니다.",
    );
  }

  return response.json();
}
export async function saveMixingPoint(
  sessionId: number,
  mixingPointGain: number,
): Promise<PitchMatchSession> {
  const response = await fetch(
    `/api/tinnitus/matching/${sessionId}/mixing-point/`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        mixing_point_gain:
          mixingPointGain,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      "혼합점 저장에 실패했습니다.",
    );
  }

  return response.json();
}