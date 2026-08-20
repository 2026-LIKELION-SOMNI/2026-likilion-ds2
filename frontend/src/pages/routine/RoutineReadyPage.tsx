import { useEffect, useState, } from "react";

import { useNavigate, } from "react-router-dom";

import { getLatestInterventionDecision, type InterventionDecision,
} from "../../api/personalization";

import { getUserUuid, } from "../../utils/userStorage";

const RELAXATION_INFO = {
  thought_distancing: {
    title: "생각이 커진 밤",
    name: "생각 거리두기",
    duration: "45초",
    description:
      "불안이 높아 잠들기 전 생각과 잠깐 거리를 둔 뒤 사운드로 이어가요.",
  },

  tension_release: {
    title: "긴장이 남은 밤",
    name: "긴장 해제",
    duration: "30초",
    description:
      "스트레스가 남아 있어 몸의 긴장을 가볍게 풀고 사운드로 이어가요.",
  },

  attention_shift: {
    title: "소리에 집중이 커진 밤",
    name: "주의 옮기기",
    duration: "1분",
    description:
      "불안은 높지 않아서 주의를 부드럽게 옮긴 뒤 사운드로 이어가요.",
  },
} as const;

const BACKGROUND_LABEL: Record<
  string,
  string
> = {
  rain: "잔잔한 빗소리",
  stream: "시냇물 소리",
  ocean: "파도 소리",
  air: "공기음",
};

function RoutineReadyPage() {
  const navigate =
    useNavigate();

  const [
    decision,
    setDecision,
  ] =
    useState<InterventionDecision | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    starting,
    setStarting,
  ] =
    useState(false);

    useEffect(() => {
    const uuid = getUserUuid();

    if (!uuid) {
        return;
    }

    let cancelled = false;

    getLatestInterventionDecision(uuid)
        .then((data) => {
        if (cancelled) {
            return;
        }

        setDecision(data);
        setErrorMessage("");
        })
        .catch((error) => {
        if (cancelled) {
            return;
        }

        console.error(
            "오늘의 루틴 조회 실패",
            error,
        );

        setErrorMessage(
            "오늘의 루틴을 불러오지 못했어요.",
        );
        })
        .finally(() => {
        if (!cancelled) {
            setLoading(false);
        }
        });

    return () => {
        cancelled = true;
    };
    }, []);

    const handleRetry = async () => {
    const uuid = getUserUuid();

    if (!uuid) {
        setErrorMessage(
        "사용자 정보를 찾지 못했어요.",
        );
        return;
    }

    try {
        setLoading(true);
        setErrorMessage("");

        const data =
        await getLatestInterventionDecision(
            uuid,
        );

        setDecision(data);
    } catch (error) {
        console.error(
        "오늘의 루틴 조회 실패",
        error,
        );

        setErrorMessage(
        "오늘의 루틴을 불러오지 못했어요.",
        );
    } finally {
        setLoading(false);
    }
    };
    const handleStartRoutine =
      async () => {
        const uuid =
          getUserUuid();

        if (!uuid) {
          setErrorMessage(
            "사용자 정보를 찾지 못했어요.",
          );
          return;
        }

        if (starting) {
          return;
        }

        try {
          setStarting(true);
          setErrorMessage("");

          navigate(
            "/mixing-point",
            {
              state: {
                shouldRelax:
                  Boolean(
                    decision?.relaxation_activity_type,
                  ),
              },
            },
          );
        } catch (error) {
          console.error(
            "사운드 생성 실패",
            error,
          );

          setErrorMessage(
            "개인화 사운드를 준비하지 못했어요.",
          );

          setStarting(false);
        }
      };

  if (loading) {
    return (
      <div
        className="
          flex
          h-full
          items-center
          justify-center
          px-5
        "
      >
        <p
          className="
            text-[13px]
            text-[#809EA8]
          "
        >
          오늘의 루틴을 준비하고 있어요.
        </p>
      </div>
    );
  }

    if (errorMessage || !decision) {
        return (
            <div
            className="
                flex
                h-full
                min-h-0
                flex-col
                px-5
                pb-[40px]
            "
            >
            <main
                className="
                flex
                min-h-0
                flex-1
                flex-col
                "
            >
                <section className="pt-[50px]">
                <h1
                    className="
                    font-sans
                    text-[24px]
                    font-bold
                    leading-[36px]
                    text-[#ECF3F2]
                    "
                >
                    개인화 사운드를
                    <br />
                    완성하지 못했어요.
                </h1>

                <p
                    className="
                    mt-[20px]
                    font-sans
                    text-[11px]
                    font-normal
                    leading-[18px]
                    text-[#809EA8]
                    "
                >
                    입력한 기록은 저장되어 있어요.
                    <br />
                    다시 시도하거나 이전에 편안했던 사운드를 이용할 수 있어요.
                </p>

                {/* 예비 사운드 */}
                <div
                    className="
                    mt-[24px]
                    rounded-[18px]
                    border
                    border-[#24464E]
                    bg-[#0D1B1E]
                    px-[16px]
                    py-[18px]
                    "
                >
                    <p
                    className="
                        text-[11px]
                        font-bold
                        text-[#61DBB8]
                    "
                    >
                    예비 사운드
                    </p>

                    <p
                    className="
                        mt-[14px]
                        text-[14px]
                        font-bold
                        text-[#ECF3F2]
                    "
                    >
                    잔잔한 빗소리 + 핑크노이즈
                    </p>

                    <p
                    className="
                        mt-[12px]
                        text-[11px]
                        leading-normal
                        text-[#809EA8]
                    "
                    >
                    안전한 기본 조합이에요.
                    </p>
                </div>
                </section>

                {/* 하단 버튼 */}
                <div
                className="
                    mt-auto
                    pt-[40px]
                "
                >
                <button
                    type="button"
                    onClick={() => {
                    console.log(
                        "예비 사운드 시작 연동 예정",
                    );
                    }}
                    className="
                    flex
                    h-[54px]
                    w-full
                    items-center
                    justify-center
                    rounded-[14px]
                    bg-[#61DBB8]
                    text-[14px]
                    font-bold
                    text-[#07100D]
                    "
                >
                    예비 사운드로 시작하기
                </button>

                <button
                    type="button"
                    onClick={() => {
                    void handleRetry();
                    }}
                    className="
                    mt-[14px]
                    flex
                    w-full
                    items-center
                    justify-center
                    text-[12px]
                    font-normal
                    text-[#7CCDE4]
                    "
                >
                    사운드 다시 준비하기
                </button>
                </div>
            </main>
            </div>
        );
        }

  /*
   * 이완 활동
   */
  const relaxationType =
    decision
      .relaxation_activity_type;

  const relaxationInfo =
    relaxationType
      ? RELAXATION_INFO[
          relaxationType
        ]
      : null;

  /*
   * 사운드
   */
  const background =
    decision
      .sound_strategy
      .background;

  const backgroundLabel =
    BACKGROUND_LABEL[
      background
    ] ??
    "맞춤 사운드";

  const duration =
    decision
      .sound_strategy
      .duration_minutes;

  /*
   * 오늘 상태
   */
  const snapshot =
    decision.state_snapshot;

  const frequency =
    snapshot
      .tinnitus_center_hz
      ? Math.round(
          snapshot
            .tinnitus_center_hz,
        )
      : null;

  /*
   * 개인화 단계
   *
   * 백엔드 기준:
   * 평가 3개부터 개인화 데이터 충분
   */
  const personalizationStep =
    Math.min(
      snapshot
        .evaluation_sample_count +
        1,
      3,
    );

  /*
   * 오늘 반영한 정보
   */
  const reflectedInfo = [
    `불편도 ${snapshot.tinnitus_discomfort}`,
    `불안 ${snapshot.anxiety}`,

    snapshot.stress
      ? "스트레스"
      : null,

    frequency
      ? `${frequency}Hz`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  /*
   * 카드 제목
   */
  const routineTitle =
    relaxationInfo?.title ??
    "편안한 사운드로 이어가는 밤";

    const routineDescription =
    relaxationInfo?.description ??
    "오늘은 별도의 이완 활동 없이 맞춤 사운드로 바로 이어가요.";

  return (
    <div
      className="
        flex
        h-full
        min-h-0
        flex-col
        px-5
        pb-[40px]
      "
    >
      <main
        className="
          flex
          min-h-0
          flex-1
          flex-col
        "
      >
        <section className="pt-[50px]">
          <h1
            className="
              font-sans
              text-[24px]
              font-bold
              leading-[36px]
              text-[#ECF3F2]
            "
          >
            오늘 밤 루틴이 준비됐어요.
          </h1>

          {/* 오늘의 추천 루틴 */}
          <div className="mt-[36px]">
            <h2
              className="
                font-sans
                text-[14px]
                font-bold
                text-[#ECF3F2]
              "
            >
              오늘의 추천 루틴
            </h2>

            <div
              className="
                mt-[16px]
                rounded-[18px]
                border
                border-[#2B8E78]
                bg-[#112126]
                px-[16px]
                py-[18px]
              "
            >
              <h3
                className="
                  font-sans
                  text-[18px]
                  font-bold
                  leading-normal
                  text-[#F0F7FA]
                "
              >
                {routineTitle}
              </h3>

            <p
            className="
                mt-[8px]
                font-sans
                text-[11px]
                font-normal
                leading-[18px]
                text-[#809EA8]
            "
            >
            {routineDescription}
            </p>

              {/* 이완 활동이 있는 경우 */}
              {relaxationInfo && (
                <div
                  className="
                    mt-[24px]
                    flex
                    items-center
                    gap-[10px]
                  "
                >
                  <span
                    className="
                      text-[13px]
                      font-bold
                      text-[#F0F7FA]
                    "
                  >
                    1
                  </span>

                  <span
                    className="
                      text-[13px]
                      font-bold
                      text-[#F0F7FA]
                    "
                  >
                    {relaxationInfo.name}
                  </span>

                  <span
                    className="
                      text-[13px]
                      font-bold
                      text-[#F0F7FA]
                    "
                  >
                    {
                      relaxationInfo.duration
                    }
                  </span>
                </div>
              )}

              {/* 사운드 */}
              <div
                className={`
                  flex
                  items-center
                  gap-[10px]

                  ${
                    relaxationInfo
                      ? "mt-[18px]"
                      : "mt-[24px]"
                  }
                `}
              >
                <span
                  className="
                    text-[13px]
                    font-bold
                    text-[#F0F7FA]
                  "
                >
                  {relaxationInfo
                    ? "2"
                    : "1"}
                </span>

                <span
                  className="
                    text-[13px]
                    font-bold
                    text-[#F0F7FA]
                  "
                >
                  {backgroundLabel}
                </span>

                <span
                  className="
                    text-[13px]
                    font-bold
                    text-[#F0F7FA]
                  "
                >
                  {duration}분
                </span>
              </div>

              <div
                className="
                  mt-[18px]
                  h-px
                  w-full
                  bg-[#24464E]
                "
              />

              <p
                className="
                  mt-[14px]
                  text-[11px]
                  font-bold
                  text-[#61DBB8]
                "
              >
                개인화 단계{" "}
                {personalizationStep} / 3
              </p>

              <p
                className="
                  mt-[8px]
                  text-[11px]
                  text-[#809EA8]
                "
              >
                사용 후 평가가 쌓이면 더 조정돼요.
              </p>
            </div>
          </div>

          {/* 오늘 반영한 정보 */}
          <div className="mt-[30px]">
            <h2
              className="
                text-[14px]
                font-bold
                text-[#ECF3F2]
              "
            >
              오늘 반영한 정보
            </h2>

            <div
              className="
                mt-[16px]
                flex
                h-[44px]
                items-center
                rounded-[18px]
                border
                border-[#24464E]
                bg-[#112126]
                px-[16px]
              "
            >
              <p
                className="
                  text-[11px]
                  text-[#F0F7FA]
                "
              >
                {reflectedInfo}
              </p>
            </div>
          </div>
        </section>

        {/* 하단 계속 */}
        <div
          className="
            mt-auto
            pt-[40px]
          "
        >
          <button
            type="button"
            disabled={starting}
            onClick={() => {
              void handleStartRoutine();
            }}
            className="
              flex
              h-[54px]
              w-full
              items-center
              justify-center
              rounded-[14px]
              bg-[#61DBB8]
              text-[14px]
              font-bold
              text-[#07100D]
              disabled:bg-[#27423C]
              disabled:text-[#6B8580]
            "
          >
            {starting ? "준비 중..." : "계속"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default RoutineReadyPage;