import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import BottomNav from "../../components/navigation/BottomNav";
import Button from "../../components/common/Button";
import { toErrorMessage } from "../../api/client";
import { getHomeSummary } from "../../api/home";
import type {
  HomeSummary,
  TodayRoutineSummary,
} from "../../api/home";
import { getLatestCheckin } from "../../api/checkin";
import type { CheckinRecord } from "../../api/checkin";
import { getPendingEvaluations } from "../../api/feedback";
import { getMyPageProfileSummary } from "../../api/mypage";
import {
  createInterventionDecision,
  getLatestInterventionDecision,
} from "../../api/personalization";
import { getRelaxationGuide } from "../relaxation/guideScript";
import { ensureAnonymousUser } from "../../services/accountService";
import { getUserUuid } from "../../utils/userStorage";

const ROUTINE_HEADLINE: Record<
  string,
  string
> = {
  thought_distancing:
    "불안을 먼저 낮추고,\n소리로 자연스럽게 이어가요.",
  tension_release:
    "긴장을 먼저 낮추고,\n소리로 자연스럽게 이어가요.",
  attention_shift:
    "생각을 잠시 멈추고,\n소리로 자연스럽게 이어가요.",
};

const SOUND_WAVE_HEIGHTS = [
  14, 20, 28, 22, 16, 24, 32, 26, 18, 12,
  20, 30, 24, 16, 22, 28, 34, 26, 18, 14,
  24, 30, 20, 16, 26, 32, 22, 18, 28, 24,
];

function toDateKey(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toDateString();
}

function countEvaluationsBeforeToday(
  evaluations: { for_date: string }[],
) {
  const today = new Date().toDateString();

  return evaluations.filter((evaluation) => {
    const key = toDateKey(evaluation.for_date);

    return key !== null && key !== today;
  }).length;
}

function isDecisionOlderThanCheckin(
  decidedAt: string | null,
  checkin: CheckinRecord | null,
) {
  if (!checkin) {
    return false;
  }

  if (!decidedAt) {
    return true;
  }

  const decidedTime = new Date(
    decidedAt,
  ).getTime();

  const checkinTime = new Date(
    checkin.created_at,
  ).getTime();

  if (
    Number.isNaN(decidedTime) ||
    Number.isNaN(checkinTime)
  ) {
    return false;
  }

  return decidedTime < checkinTime;
}

function formatDurationLabel(seconds: number) {
  if (seconds >= 60) {
    return `${Math.round(seconds / 60)}분`;
  }

  return `${seconds}초`;
}

function splitSoundSummary(
  summary: string | null,
) {
  if (!summary) {
    return {
      main: "맞춤 사운드",
      sub: null as string | null,
    };
  }

  const separatorIndex =
    summary.indexOf(" + ");

  if (separatorIndex < 0) {
    return { main: summary, sub: null };
  }

  return {
    main: summary.slice(0, separatorIndex),
    sub: summary.slice(separatorIndex + 1),
  };
}

type SectionCardTone =
  | "plain"
  | "highlight"
  | "accent";

interface SectionCardProps {
  children: React.ReactNode;
  tone?: SectionCardTone;
}

const SECTION_CARD_TONE: Record<
  SectionCardTone,
  string
> = {
  plain:
    "rounded-[18px] border-[#24464E] bg-[#0D1B1E]",
  highlight:
    "rounded-[18px] border-[#2B8E78] bg-[#112126]",
  accent:
    "rounded-[1rem] border-[#2B8E78] bg-[#12382E]",
};

function SectionCard({
  children,
  tone = "plain",
}: SectionCardProps) {
  return (
    <div
      className={`
        border
        px-[16px]
        py-[18px]
        ${SECTION_CARD_TONE[tone]}
      `}
    >
      {children}
    </div>
  );
}

interface StateChipProps {
  label: string;
}

function StateChip({ label }: StateChipProps) {
  return (
    <span
      className="
        inline-flex
        h-[30px]
        items-center
        rounded-full
        border
        border-[#2B8E78]
        px-[14px]
        text-[11px]
        font-medium
        text-[#61DBB8]
      "
    >
      {label}
    </span>
  );
}

interface RoutineStepProps {
  order: number;
  label: string;
  duration: string;
}

function RoutineStep({
  order,
  label,
  duration,
}: RoutineStepProps) {
  return (
    <div
      className="
        flex
        items-center
        gap-[10px]
      "
    >
      <span
        className="
          text-[13px]
          font-bold
          text-[#61DBB8]
        "
      >
        {order}
      </span>

      <span
        className="
          flex-1
          text-[13px]
          font-bold
          text-[#F0F7FA]
        "
      >
        {label}
      </span>

      <span
        className="
          text-[11px]
          font-normal
          text-[#809EA8]
        "
      >
        {duration}
      </span>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();

  const [nickname, setNickname] =
    useState("");

  const [summary, setSummary] =
    useState<HomeSummary | null>(null);

  const [isSetupDone, setIsSetupDone] =
    useState(true);

  const [soundMinutes, setSoundMinutes] =
    useState<number | null>(null);

  const [pendingCount, setPendingCount] =
    useState<number | null>(null);

  const [
    isRoutineStale,
    setIsRoutineStale,
  ] = useState(false);

  const [hasLoadFailed, setHasLoadFailed] =
    useState(false);

  const loadSequenceRef = useRef(0);

  const isStartingRef = useRef(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isStarting, setIsStarting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const isDataDeleted =
    localStorage.getItem(
      "somni-data-deleted",
    ) === "true";

  const loadHome = useCallback(async () => {
    loadSequenceRef.current += 1;
    const sequence = loadSequenceRef.current;

    const isLatest = () =>
      sequence === loadSequenceRef.current;

    setErrorMessage(null);

    try {
      const profile =
        await ensureAnonymousUser();

      if (!isLatest()) {
        return;
      }

      setNickname(profile.nickname);

      const uuid =
        getUserUuid() ?? profile.uuid;

      const [
        homeSummary,
        profileSummary,
        decision,
        pendingEvaluations,
        latestCheckin,
      ] = await Promise.all([
        getHomeSummary(uuid),
        getMyPageProfileSummary(uuid).catch(
          () => "error" as const,
        ),
        getLatestInterventionDecision(
          uuid,
        ).catch(() => null),
        getPendingEvaluations(uuid).catch(
          () => null,
        ),
        getLatestCheckin(uuid).catch(
          () => null,
        ),
      ]);

      if (!isLatest()) {
        return;
      }

      setHasLoadFailed(false);
      setSummary(homeSummary);

      if (profileSummary !== "error") {
        setIsSetupDone(
          profileSummary?.center_frequency !=
            null,
        );
      }

      setSoundMinutes(
        decision?.sound_strategy
          ?.duration_minutes ?? null,
      );

      setPendingCount(
        pendingEvaluations
          ? countEvaluationsBeforeToday(
              pendingEvaluations,
            )
          : null,
      );

      setIsRoutineStale(
        isDecisionOlderThanCheckin(
          decision?.decided_at ?? null,
          latestCheckin,
        ),
      );
    } catch (error) {
      if (!isLatest()) {
        return;
      }

      setHasLoadFailed(true);

      setErrorMessage(
        toErrorMessage(
          error,
          "홈 정보를 불러오지 못했어요.",
        ),
      );
    } finally {
      if (isLatest()) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  useEffect(() => {
    const handleVisible = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        loadHome();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisible,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisible,
      );
    };
  }, [loadHome]);

  const handleStartRoutine = async () => {
    if (isStartingRef.current) {
      return;
    }

    isStartingRef.current = true;

    const uuid = getUserUuid();

    if (!uuid) {
      setErrorMessage(
        "사용자 정보를 찾지 못했어요.",
      );

      return;
    }

    setIsStarting(true);
    setErrorMessage(null);

    try {
      if (
        !summary?.today_routine ||
        isRoutineStale
      ) {
        const checkin =
          await getLatestCheckin(uuid);

        if (!checkin) {
          setErrorMessage(
            "오늘 상태 기록이 필요해요.",
          );

          setIsStarting(false);
          isStartingRef.current = false;
          return;
        }

        const factors =
          checkin.daily_factors ?? [];

        await createInterventionDecision(
          uuid,
          {
            tinnitus_discomfort:
              checkin.discomfort,
            anxiety: checkin.tension,
            stress:
              factors.includes("stress"),
            fatigue: factors.includes(
              "fatigue",
            )
              ? 4
              : null,
            caffeine: factors.includes(
              "caffeine",
            ),
          },
        );
      }

      navigate("/routine-ready");
    } catch (error) {
      setErrorMessage(
        toErrorMessage(
          error,
          "오늘의 루틴을 준비하지 못했어요.",
        ),
      );

      setIsStarting(false);
      isStartingRef.current = false;
    }
  };

  if (isLoading) {
    return (
      <div
        className="
          flex
          min-h-full
          items-center
          justify-center
          pb-[82px]
        "
      >
        <p
          className="
            text-[13px]
            text-[#809EA8]
          "
        >
          오늘의 상태를 불러오는 중이에요...
        </p>

        <BottomNav />
      </div>
    );
  }

  const routine: TodayRoutineSummary | null =
    summary?.today_routine ?? null;

  const relaxationGuide =
    routine?.relaxation_activity_type
      ? getRelaxationGuide(
          routine.relaxation_activity_type,
        )
      : null;

  const hasCheckedIn =
    summary?.has_checked_in_today ?? false;

  const hasPendingEvaluation =
    pendingCount !== null
      ? pendingCount > 0
      : (summary?.has_pending_evaluation ??
        false);

  const showRoutine = hasCheckedIn;

  const sound = splitSoundSummary(
    routine?.sound_summary ?? null,
  );

  const stateChips = routine
    ? [
        routine.tinnitus_discomfort != null
          ? `이명 ${routine.tinnitus_discomfort}/5`
          : null,
        routine.anxiety != null
          ? `불안 ${routine.anxiety}/5`
          : null,
        routine.stress ? "스트레스" : null,
      ].filter(
        (chip): chip is string =>
          chip !== null,
      )
    : [];

  return (
    <div
      className="
        min-h-full
        px-5
        pb-[110px]
      "
    >
      <h1
        className="
          pt-[10px]
          font-sans
          text-[24px]
          font-bold
          leading-[36px]
          text-[#ECF3F2]
        "
      >
        {showRoutine
          ? "오늘 밤 루틴이 준비됐어요."
          : `좋은 밤이에요, ${
              nickname || "게스트"
            } 님!`}
      </h1>

      {!showRoutine && (
        <p
          className="
            mt-[6px]
            font-sans
            text-[11px]
            font-normal
            leading-[18px]
            text-[#809EA8]
          "
        >
          {summary?.is_new_user
            ? "오늘 상태를 기록하면 첫 루틴을 준비할게요."
            : "오늘 상태를 기록하면 루틴을 준비할게요."}
        </p>
      )}

      {errorMessage && (
        <p
          role="alert"
          className="
            mt-[16px]
            font-sans
            text-[12px]
            leading-[18px]
            text-[#E5484D]
          "
        >
          {errorMessage}
        </p>
      )}

      {hasLoadFailed && (
        <div className="mt-[16px]">
          <Button onClick={() => loadHome()}>
            다시 불러오기
          </Button>
        </div>
      )}

      {!hasLoadFailed && !isSetupDone && (
        <div className="mt-[24px]">
          <SectionCard>
            <p
              className="
                text-[11px]
                font-bold
                text-[#809EA8]
              "
            >
              {isDataDeleted
                ? "설정이 초기화 되었어요."
                : "아직 설정이 남아 있어요."}
            </p>

            <h2
              className="
                mt-[10px]
                text-[18px]
                font-bold
                leading-normal
                text-[#F0F7FA]
              "
            >
              다시 나만의 사운드를 만들어 볼까요?
            </h2>

            <p
              className="
                mt-[10px]
                text-[11px]
                leading-[18px]
                text-[#809EA8]
              "
            >
              약 5분 · 이명 음역을 측정하고 나에게 딱
              맞는 소리를 찾을 수 있어요
            </p>

            <div className="mt-[18px]">
              <Button
                onClick={() => {
                  localStorage.removeItem(
                    "somni-data-deleted",
                  );

                  navigate("/frequency");
                }}
              >
                개인화 다시 시작하기
              </Button>
            </div>
          </SectionCard>
        </div>
      )}

      {!hasLoadFailed && isSetupDone && (
        <>
          {hasPendingEvaluation && (
            <div className="mt-[24px]">
              <SectionCard tone="accent">
                <p
                  className="
                    font-sans
                    text-[0.8125rem]
                    font-bold
                    leading-normal
                    text-[#61DBB8]
                  "
                >
                  어젯밤 기록이 남아 있어요
                </p>

                <p
                  className="
                    mt-[8px]
                    font-sans
                    text-[0.6875rem]
                    font-normal
                    leading-normal
                    text-[#809EA8]
                  "
                >
                  평가를 이어서 작성할 수 있어요.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/feedback")
                  }
                  className="
                    mt-[10px]
                    flex
                    w-full
                    items-center
                    justify-end
                    gap-[4px]
                    text-[12px]
                    font-medium
                    text-[#7CCDE4]
                  "
                >
                  기록하기
                  <span aria-hidden="true">
                    ›
                  </span>
                </button>
              </SectionCard>
            </div>
          )}

          {!hasCheckedIn && (
            <div className="mt-[16px]">
              <SectionCard tone="highlight">
                <p
                  className="
                    text-[11px]
                    font-bold
                    text-[#61DBB8]
                  "
                >
                  오늘 상태를 남겨주세요
                </p>

                <h2
                  className="
                    mt-[12px]
                    text-[16px]
                    font-bold
                    leading-[24px]
                    text-[#F0F7FA]
                  "
                >
                  이명 불편도 · 불안도 · 생활요인만
                  <br />
                  간단히 확인하면 돼요.
                </h2>

                <div className="mt-[18px]">
                  <Button
                    onClick={() =>
                      navigate("/check-in")
                    }
                  >
                    오늘 상태 기록하기
                  </Button>
                </div>
              </SectionCard>
            </div>
          )}

          {!hasCheckedIn &&
            summary?.is_new_user && (
              <div className="mt-[28px]">
                <h2
                  className="
                    text-[14px]
                    font-bold
                    text-[#ECF3F2]
                  "
                >
                  처음이라 이렇게 시작해요
                </h2>

                <div className="mt-[16px]">
                  <SectionCard>
                    <p
                      className="
                        text-[11px]
                        font-bold
                        text-[#61DBB8]
                      "
                    >
                      오늘은 첫 기록이에요
                    </p>

                    <p
                      className="
                        mt-[12px]
                        text-[11px]
                        leading-[18px]
                        text-[#809EA8]
                      "
                    >
                      지금은 오늘 상태와 이명 설정만으로
                      <br />
                      무리 없는 기본 루틴을 준비했어요.
                    </p>
                  </SectionCard>
                </div>
              </div>
            )}

          {showRoutine && (
            <>
              {stateChips.length > 0 && (
                <div className="mt-[20px]">
                  <p
                    className="
                      text-[11px]
                      font-normal
                      text-[#809EA8]
                    "
                  >
                    오늘 반영한 상태
                  </p>

                  <div
                    className="
                      mt-[10px]
                      flex
                      flex-wrap
                      gap-[8px]
                    "
                  >
                    {stateChips.map(
                      (chip) => (
                        <StateChip
                          key={chip}
                          label={chip}
                        />
                      ),
                    )}
                  </div>
                </div>
              )}

              <div className="mt-[16px]">
                <SectionCard tone="highlight">
                  <p
                    className="
                      text-[11px]
                      font-bold
                      text-[#61DBB8]
                    "
                  >
                    오늘의 추천 루틴
                  </p>

                  {!routine ? (
                    <>
                      <h2
                        className="
                          mt-[12px]
                          text-[18px]
                          font-bold
                          leading-[27px]
                          text-[#F0F7FA]
                        "
                      >
                        오늘 상태를 반영해
                        <br />
                        루틴을 준비할게요.
                      </h2>

                      <p
                        className="
                          mt-[10px]
                          text-[11px]
                          leading-[18px]
                          text-[#809EA8]
                        "
                      >
                        시작하기를 누르면 오늘 기록에 맞는
                        <br />
                        루틴을 정리해서 보여드려요.
                      </p>
                    </>
                  ) : relaxationGuide ? (
                    <>
                      <h2
                        className="
                          mt-[12px]
                          whitespace-pre-line
                          text-[18px]
                          font-bold
                          leading-[27px]
                          text-[#F0F7FA]
                        "
                      >
                        {ROUTINE_HEADLINE[
                          relaxationGuide
                            .activityType
                        ] ??
                          "오늘 상태에 맞는 루틴을 준비했어요."}
                      </h2>

                      <div
                        className="
                          mt-[22px]
                          flex
                          flex-col
                          gap-[14px]
                        "
                      >
                        <RoutineStep
                          order={1}
                          label={
                            relaxationGuide.cardTitle
                          }
                          duration={formatDurationLabel(
                            relaxationGuide.durationSeconds,
                          )}
                        />

                        <RoutineStep
                          order={2}
                          label={sound.main}
                          duration={
                            soundMinutes
                              ? `${soundMinutes}분`
                              : "-"
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h2
                        className="
                          mt-[12px]
                          text-[18px]
                          font-bold
                          leading-[27px]
                          text-[#F0F7FA]
                        "
                      >
                        {sound.main}
                      </h2>

                      {sound.sub && (
                        <p
                          className="
                            mt-[4px]
                            text-[13px]
                            font-normal
                            text-[#809EA8]
                          "
                        >
                          {sound.sub}
                        </p>
                      )}

                      <div
                        aria-hidden="true"
                        className="
                          mt-[18px]
                          flex
                          h-[44px]
                          items-center
                          justify-between
                        "
                      >
                        {SOUND_WAVE_HEIGHTS.map(
                          (height, index) => (
                            <span
                              key={index}
                              className="
                                w-[3px]
                                shrink-0
                                rounded-full
                                bg-[#60CEA7]
                              "
                              style={{
                                height: `${height}px`,
                              }}
                            />
                          ),
                        )}
                      </div>
                    </>
                  )}
                </SectionCard>
              </div>

              <div className="mt-[20px]">
                <Button
                  disabled={isStarting}
                  onClick={handleStartRoutine}
                >
                  {isStarting
                    ? "준비 중..."
                    : "오늘 루틴 시작하기"}
                </Button>
              </div>
            </>
          )}

          {summary?.comfortable_sound
            ?.session_id && (
            <div className="mt-[28px]">
              <h2
                className="
                  text-[14px]
                  font-bold
                  text-[#ECF3F2]
                "
              >
                편안했던 사운드
              </h2>

              <div className="mt-[16px]">
                <SectionCard>
                  <p
                    className="
                      text-[14px]
                      font-bold
                      text-[#F0F7FA]
                    "
                  >
                    {summary.comfortable_sound
                      .sound_summary ??
                      "저장된 사운드"}
                  </p>

                  {summary.comfortable_sound
                    .evaluated_at && (
                    <p
                      className="
                        mt-[8px]
                        text-[11px]
                        leading-[18px]
                        text-[#809EA8]
                      "
                    >
                      {new Date(
                        summary.comfortable_sound.evaluated_at,
                      ).toLocaleDateString(
                        "ko-KR",
                        {
                          month: "long",
                          day: "numeric",
                        },
                      )}{" "}
                      평가에서 &quot;편안했어요&quot;로 저장
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/my/sounds")
                    }
                    className="
                      mt-[14px]
                      flex
                      w-full
                      items-center
                      justify-between
                      border-t
                      border-[#24464E]
                      pt-[14px]
                      text-[12px]
                      font-medium
                      text-[#7CCDE4]
                    "
                  >
                    다시 듣기
                    <span aria-hidden="true">
                      ›
                    </span>
                  </button>
                </SectionCard>
              </div>
            </div>
          )}
        </>
      )}

      <BottomNav />
    </div>
  );
}

export default HomePage;
