import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import ScaleSelector from "../../components/common/ScaleSelector";
import SelectChip from "../../components/common/SelectChip";
import {
  getTodayEvaluation,
  submitEvaluation,
} from "../../api/feedback";
import type {
  NightlyEvaluation,
  SleepLatency,
  SoundReaction,
} from "../../api/feedback";
import { getUserUuid } from "../../utils/userStorage";

const SLEEP_LATENCY_OPTIONS: {
  value: SleepLatency;
  label: string;
}[] = [
  { value: "under_15min", label: "15분 이내" },
  { value: "15_30min", label: "15-30분" },
  { value: "30_60min", label: "30-60분" },
  { value: "over_60min", label: "60분 초과" },
  { value: "unknown", label: "잘 모르겠어요" },
];

const SOUND_REACTION_OPTIONS: {
  value: SoundReaction;
  label: string;
}[] = [
  { value: "comfortable", label: "편안했어요" },
  { value: "noise_weak", label: "노이즈가 약했어요" },
  { value: "sharp", label: "날카로웠어요" },
  { value: "volume_too_loud", label: "볼륨이 컸어요" },
  {
    value: "natural_sound_uncomfortable",
    label: "자연음이 불편했어요",
  },
];

const NOTE_MAX_LENGTH = 100;

function BackIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatRoutineDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatStartedAt(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p
        className="
          font-sans
          text-[0.9375rem]
          font-bold
          leading-normal
          text-[#F0F7FA]
        "
      >
        {title}
      </p>

      {description && (
        <p
          className="
            mt-[0.25rem]
            font-sans
            text-[0.6875rem]
            font-normal
            leading-normal
            text-[#809EA8]
          "
        >
          {description}
        </p>
      )}
    </div>
  );
}

function FeedbackPage() {
  const navigate = useNavigate();

  const [evaluation, setEvaluation] =
    useState<NightlyEvaluation | null>(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [sleepLatency, setSleepLatency] =
    useState<SleepLatency | null>(null);
  const [discomfortAfter, setDiscomfortAfter] =
    useState<number | null>(null);
  const [anxietyAfter, setAnxietyAfter] =
    useState<number | null>(null);
  const [
    routineHelpfulness,
    setRoutineHelpfulness,
  ] = useState<number | null>(null);
  const [soundReactions, setSoundReactions] =
    useState<SoundReaction[]>([]);
  const [currentFatigue, setCurrentFatigue] =
    useState<number | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const uuid = getUserUuid();

    if (!uuid) {
      setIsLoading(false);
      setErrorMessage(
        "사용자 정보를 찾을 수 없어요. 앱을 새로고침한 뒤 다시 시도해 주세요.",
      );
      return;
    }

    let isMounted = true;

    getTodayEvaluation(uuid)
      .then((data) => {
        if (!isMounted || !data) {
          return;
        }

        setEvaluation(data);
        setSleepLatency(data.sleep_latency);
        setDiscomfortAfter(
          data.discomfort_after,
        );
        setAnxietyAfter(data.anxiety_after);
        setRoutineHelpfulness(
          data.routine_helpfulness,
        );
        setSoundReactions(
          data.sound_reactions ?? [],
        );
        setCurrentFatigue(
          data.current_fatigue,
        );
        setNote(data.note ?? "");
      })
      .catch(() => {
        if (isMounted) {
          setErrorMessage(
            "기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleSoundReaction = (
    value: SoundReaction,
  ) => {
    setSoundReactions((previous) =>
      previous.includes(value)
        ? previous.filter(
            (reaction) => reaction !== value,
          )
        : [...previous, value],
    );
  };

  const handleSubmit = async () => {
    const uuid = getUserUuid();

    if (!uuid || !evaluation || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await submitEvaluation(
        uuid,
        evaluation.id,
        {
          sleep_latency: sleepLatency,
          discomfort_after: discomfortAfter,
          anxiety_after: anxietyAfter,
          routine_helpfulness:
            routineHelpfulness,
          sound_reactions: soundReactions,
          current_fatigue: currentFatigue,
          note: note.trim(),
        },
      );

      navigate("/");
    } catch {
      setErrorMessage(
        "저장에 실패했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const relaxationRecap =
    evaluation?.relaxation_recap ?? null;
  const soundRecap =
    evaluation?.sound_recap ?? null;

  const startedAt = formatStartedAt(
    relaxationRecap?.started_at ??
      soundRecap?.playback_started_at ??
      null,
  );

  return (
    <div className="flex min-h-full flex-col">
      <header
        className="
          flex
          h-[3.25rem]
          shrink-0
          items-center
          justify-between
          px-5
        "
      >
        <button
          type="button"
          aria-label="뒤로 가기"
          onClick={() => navigate(-1)}
          className="text-[#ECF3F2]"
        >
          <BackIcon />
        </button>

        <span
          className="
            font-sans
            text-[0.9375rem]
            font-bold
            leading-normal
            text-[#ECF3F2]
          "
        >
          결과 기록
        </span>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="
            text-right
            font-sans
            text-[1rem]
            font-medium
            leading-[1.125rem]
            text-[#87CBE6]
          "
        >
          나중에
        </button>
      </header>

      <div
        className="
          flex
          flex-1
          flex-col
          px-5
          pb-[2.5rem]
        "
      >
        <h1
          className="
            pt-[1.5rem]
            font-sans
            text-[1.75rem]
            font-bold
            leading-normal
            text-[#F0F7FA]
          "
        >
          좋은 아침이에요.
          <br />
          어젯밤은 어땠나요?
        </h1>

        <p
          className="
            mt-[0.75rem]
            font-sans
            text-[0.8125rem]
            font-normal
            leading-normal
            text-[#809EA8]
          "
        >
          기억나는 만큼만 짧게 남겨주세요.
          <br />
          다음 밤의 루틴을 조정하는 데 사용해요.
        </p>

        {isLoading && (
          <p
            className="
              mt-[1.5rem]
              font-sans
              text-[0.75rem]
              font-normal
              leading-[1.125rem]
              text-[#587176]
            "
          >
            기록을 불러오는 중이에요.
          </p>
        )}

        {!isLoading && !evaluation && (
          <>
            <p
              className="
                mt-[1.5rem]
                font-sans
                text-[0.75rem]
                font-normal
                leading-[1.125rem]
                text-[#587176]
              "
            >
              지금은 기록할 세션이 없어요.
            </p>

            <div className="mt-auto">
              <Button
                onClick={() => navigate("/")}
              >
                홈으로 이동
              </Button>
            </div>
          </>
        )}

        {!isLoading && evaluation && (
          <>
            <div
              className="
                mt-[1.25rem]
                w-full
                rounded-[1rem]
                border
                border-[#2B8E78]
                bg-[#101F1B]
                px-[1rem]
                py-[1rem]
              "
            >
              <p
                className="
                  font-sans
                  text-[0.6875rem]
                  font-bold
                  leading-normal
                  text-[#61DBB8]
                "
              >
                {`${formatRoutineDate(evaluation.for_date)} 루틴`}
              </p>

              <div className="mt-[0.625rem] flex flex-col gap-[0.25rem]">
                {relaxationRecap && (
                  <p
                    className="
                      font-sans
                      text-[0.8125rem]
                      font-bold
                      leading-[1.25rem]
                      text-[#ECF3F2]
                    "
                  >
                    {
                      relaxationRecap.activity_type_display
                    }
                  </p>
                )}

                {soundRecap && (
                  <p
                    className="
                      font-sans
                      text-[0.8125rem]
                      font-bold
                      leading-[1.25rem]
                      text-[#ECF3F2]
                    "
                  >
                    {soundRecap.is_fallback
                      ? "기본 사운드"
                      : "맞춤 수면 사운드"}
                  </p>
                )}
              </div>

              {startedAt && (
                <p
                  className="
                    mt-[0.75rem]
                    font-sans
                    text-[0.6875rem]
                    font-normal
                    leading-normal
                    text-[#8DA2A6]
                  "
                >
                  {`${startedAt} 시작`}
                </p>
              )}
            </div>

            <section className="mt-[1.75rem]">
              <SectionTitle
                title="잠드는 데 얼마나 걸렸나요?"
                description="대략적인 느낌으로 골라도 괜찮아요."
              />

              <div className="mt-[0.875rem] flex flex-wrap gap-[0.5rem]">
                {SLEEP_LATENCY_OPTIONS.map(
                  (option) => (
                    <SelectChip
                      key={option.value}
                      label={option.label}
                      isSelected={
                        sleepLatency ===
                        option.value
                      }
                      onClick={() =>
                        setSleepLatency(
                          option.value,
                        )
                      }
                    />
                  ),
                )}
              </div>
            </section>

            <section className="mt-[1.75rem]">
              <SectionTitle title="이명이 얼마나 불편했나요?" />

              <div className="mt-[0.875rem] flex flex-col gap-[0.75rem]">
                <ScaleSelector
                  label="이명 불편도"
                  hint="1 편안함 · 5 매우 불편함"
                  value={discomfortAfter}
                  onChange={setDiscomfortAfter}
                />

                <ScaleSelector
                  label="불안 정도"
                  hint="1 안정됨 · 5 매우 불안함"
                  value={anxietyAfter}
                  onChange={setAnxietyAfter}
                />
              </div>
            </section>

            {relaxationRecap && (
              <section className="mt-[1.75rem]">
                <SectionTitle title="수면 준비는 도움이 됐나요?" />

                <div className="mt-[0.875rem]">
                  <ScaleSelector
                    label={
                      relaxationRecap.activity_type_display
                    }
                    hint="1 도움되지 않음 · 5 매우 도움됨"
                    description="잠들기 전 긴장을 낮추는 데 얼마나 도움됐나요?"
                    value={routineHelpfulness}
                    onChange={
                      setRoutineHelpfulness
                    }
                    footer={
                      <button
                        type="button"
                        onClick={() =>
                          setRoutineHelpfulness(
                            null,
                          )
                        }
                        className="
                          font-sans
                          text-[0.6875rem]
                          font-normal
                          leading-normal
                          text-[#587176]
                        "
                      >
                        수행하지 않았어요
                      </button>
                    }
                  />
                </div>
              </section>
            )}

            <section className="mt-[1.75rem]">
              <SectionTitle
                title="사운드는 어땠나요?"
                description="여러 개 선택할 수 있어요."
              />

              <div className="mt-[0.875rem] flex flex-wrap gap-[0.5rem]">
                {SOUND_REACTION_OPTIONS.map(
                  (option) => (
                    <SelectChip
                      key={option.value}
                      label={option.label}
                      isSelected={soundReactions.includes(
                        option.value,
                      )}
                      onClick={() =>
                        toggleSoundReaction(
                          option.value,
                        )
                      }
                    />
                  ),
                )}
              </div>
            </section>

            <section className="mt-[1.75rem]">
              <SectionTitle title="지금 피로도는 어떤가요?" />

              <div className="mt-[0.875rem]">
                <ScaleSelector
                  label="피로도"
                  hint="1 개운함 · 5 매우 피곤함"
                  value={currentFatigue}
                  onChange={setCurrentFatigue}
                />
              </div>
            </section>

            <section
              className="
                mt-[1.75rem]
                w-full
                rounded-[1rem]
                border
                border-[#2D4548]
                bg-[#142025]
                px-[0.875rem]
                py-[0.875rem]
              "
            >
              <label
                htmlFor="feedback-note"
                className="
                  font-sans
                  text-[0.6875rem]
                  font-medium
                  leading-[1.0625rem]
                  text-[#8DA2A6]
                "
              >
                한 줄 메모 (선택)
              </label>

              <textarea
                id="feedback-note"
                rows={2}
                maxLength={NOTE_MAX_LENGTH}
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                placeholder="예) 오늘은 평소보다 소리가 덜 신경쓰였어요."
                className="
                  mt-[0.625rem]
                  w-full
                  resize-none
                  bg-transparent
                  font-sans
                  text-[0.6875rem]
                  font-normal
                  leading-[1.0625rem]
                  text-[#ECF3F2]
                  outline-none
                  placeholder:text-[#587176]
                "
              />

              <p
                className="
                  text-right
                  font-sans
                  text-[0.625rem]
                  font-normal
                  leading-normal
                  text-[#587176]
                "
              >
                {`${note.length} / ${NOTE_MAX_LENGTH}`}
              </p>
            </section>

            {errorMessage && (
              <p
                className="
                  mt-[1rem]
                  font-sans
                  text-[0.75rem]
                  font-normal
                  leading-[1.125rem]
                  text-[#E5484D]
                "
              >
                {errorMessage}
              </p>
            )}

            <p
              className="
                mt-[2rem]
                text-center
                font-sans
                text-[0.6875rem]
                font-normal
                leading-[1.0625rem]
                text-[#587176]
              "
            >
              입력한 내용은 다음 루틴 추천과 장기 패턴에 반영돼요.
            </p>

            <div className="mt-[1rem]">
              <Button
                disabled={isSaving}
                onClick={handleSubmit}
              >
                {isSaving
                  ? "저장 중..."
                  : "저장하기"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FeedbackPage;
