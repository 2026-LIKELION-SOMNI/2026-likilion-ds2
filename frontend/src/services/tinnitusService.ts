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
    throw new Error("사용자 UUID가 없습니다.");
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

        /*
         * 이전에 multiple을 선택했다가
         * 일반 유형으로 다시 선택하는 경우
         * 기존 대표 소리를 초기화한다.
         */
        ...(toneType !== "multiple"
          ? {
              primary_tone_type: null,
            }
          : {}),
      }),
    },
  );

  if (!response.ok) {
    const errorData =
      await response.json().catch(
        () => null,
      );

    console.error(
      "이명 프로필 저장 실패 응답:",
      errorData,
    );

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
    const errorData =
      await response.json().catch(
        () => null,
      );

    console.error(
      "음역 매칭 시작 실패 응답:",
      errorData,
    );

    throw new Error(
      "음역 매칭 시작에 실패했습니다.",
    );
  }

  return response.json();
}

/*
 * A/B 음역 선택
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
    const errorData =
      await response.json().catch(
        () => null,
      );

    console.error(
      "음역 선택 실패 응답:",
      errorData,
    );

    throw new Error(
      "음역 선택에 실패했습니다.",
    );
  }

  return response.json();
}

/*
 * 옥타브 혼동 검사
 */
export async function selectOctave(
  sessionId: number,
  selected:
    | "half"
    | "same"
    | "double",
): Promise<PitchMatchSession> {
  const response = await fetch(
    `/api/tinnitus/matching/octave-check/${sessionId}/`,
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
    const errorData =
      await response.json().catch(
        () => null,
      );

    console.error(
      "옥타브 선택 실패 응답:",
      errorData,
    );

    throw new Error(
      "옥타브 선택에 실패했습니다.",
    );
  }

  return response.json();
}

/*
 * 음역 매칭 이전 단계
 *
 * 백엔드의 back API가 구현된 이후 사용
 */
export async function goBackPitchMatch(
  sessionId: number,
): Promise<PitchMatchSession> {
  const response = await fetch(
    `/api/tinnitus/matching/back/${sessionId}/`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    const errorData =
      await response.json().catch(
        () => null,
      );

    console.error(
      "이전 음역 단계 이동 실패 응답:",
      errorData,
    );

    throw new Error(
      "이전 음역 단계로 이동하지 못했습니다.",
    );
  }

  return response.json();
}

/*
 * 혼합점 저장
 *
 * volume은 Web Audio API gain 값으로
 * 0.0 ~ 0.6 범위를 사용한다.
 */
export async function saveMixingPoint(
  sessionId: number,
  gain: number,
): Promise<PitchMatchSession> {
  const response = await fetch(
    `/api/tinnitus/matching/${sessionId}/mixing-point/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mixing_point_gain: gain,
      }),
    },
  );

  if (!response.ok) {
    const errorData =
      await response.json().catch(
        () => null,
      );

    console.error(
      "혼합점 저장 실패 응답:",
      errorData,
    );

    throw new Error(
      "혼합점 저장에 실패했습니다.",
    );
  }

  return response.json();
}