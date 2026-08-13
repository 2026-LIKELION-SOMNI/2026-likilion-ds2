import { useCallback, useEffect, useState, } from "react";
import { useLocation, useNavigate, } from "react-router-dom";

import FrequencyCard from "../../components/frequency/FrequencyCard";
import { savePitchMatchSession, } from "../../utils/pitchMatchStorage";
import playIcon from "../../assets/icons/play.svg";
import pauseIcon from "../../assets/icons/pause.svg";

import {
  saveTinnitusProfile,
  startPitchMatching,
  selectPitchMatch,
  selectOctave,
  type PitchMatchSession,
  type ToneType,
} from "../../services/tinnitusService";

import {
  playMatchingNoise,
  playTinnitusTypePreview,
  stopTinnitusAudio,
} from "../../audio/tinnitusAudio";

type FrequencyOptionId = "A" | "B";

type OctaveOptionId =
  | "half"
  | "same"
  | "double";

type FrequencyScreen =
  | "type"
  | "representative"
  | "matching"
  | "octave"
  | "result";

type TinnitusTypeId = ToneType;

interface TinnitusTypeOption {
  id: TinnitusTypeId;
  title: string;
  description: string;
  waveHeights: number[];
}

const TINNITUS_TYPE_OPTIONS: TinnitusTypeOption[] = [
  {
    id: "high",
    title: "삐- 한 음이 선명해요",
    description:
      "한 가지 높이의 소리가 또렷하게 느껴져요.",
    waveHeights: [
      30, 27, 23, 19, 15, 12, 9,
    ],
  },
  {
    id: "low",
    title: "윙- 중심이 되는 울림이 있어요",
    description:
      "울림이 있지만 중심이 되는 높이가 있어요.",
    waveHeights: [
      22, 30, 38, 42, 36, 28, 20,
    ],
  },
  {
    id: "wide",
    title: "쉬익- 넓게 퍼져 들려요",
    description:
      "한 음보다 넓은 대역의 소리처럼 느껴져요.",
    waveHeights: [
      18, 24, 30, 35, 34, 30, 25, 20,
    ],
  },
  {
    id: "multiple",
    title: "여러 소리가 함께 들려요",
    description:
      "두 가지 이상의 소리가 겹쳐 들려요.",
    waveHeights: [
      20, 30, 22, 36, 26, 32, 18,
    ],
  },
];

const TOTAL_MATCHING_STEPS = 7;
const TOTAL_FLOW_STEPS =
  TOTAL_MATCHING_STEPS + 4;

function FrequencyPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [screen, setScreen] =
    useState<FrequencyScreen>(
      location.state?.screen === "result"
        ? "result"
        : "type",
    );

  const [currentStep, setCurrentStep] =
    useState(0);

  const [
    selectedTinnitusType,
    setSelectedTinnitusType,
  ] = useState<TinnitusTypeId | null>(
    null,
  );

  const [
    playingTinnitusType,
    setPlayingTinnitusType,
  ] = useState<TinnitusTypeId | null>(
    null,
  );

  const [
    representativeType,
    setRepresentativeType,
  ] = useState<TinnitusTypeId | null>(
    null,
  );

  const [
    selectedOptionId,
    setSelectedOptionId,
  ] = useState<FrequencyOptionId | null>(
    null,
  );

  const [
    playingOptionId,
    setPlayingOptionId,
  ] = useState<FrequencyOptionId | null>(
    null,
  );

  const [
    matchSession,
    setMatchSession,
  ] = useState<PitchMatchSession | null>(
    null,
  );

  const [
    selectedOctave,
    setSelectedOctave,
  ] = useState<OctaveOptionId | null>(
    null,
  );

  const [
    playingOctave,
    setPlayingOctave,
  ] = useState<OctaveOptionId | null>(
    null,
  );

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /*
   * 화면이 바뀌거나
   * FrequencyPage가 사라질 때
   * 재생 중인 소리 정리
   */
  useEffect(() => {
    return () => {
      stopTinnitusAudio();
    };
  }, []);

  /*
   * 공통 Header 제목 변경
   */
  useEffect(() => {
    const title =
      screen === "representative"
        ? "대표 소리 선택"
        : "음역 매칭";

    window.dispatchEvent(
      new CustomEvent("frequency-title", {
        detail: title,
      }),
    );
  }, [screen]);

  /*
   * 진행률
   */
  const progressWidth = (() => {
    if (screen === "type") {
      return (
        (1 / TOTAL_FLOW_STEPS) *
        100
      );
    }

    if (screen === "representative") {
      return (
        (2 / TOTAL_FLOW_STEPS) *
        100
      );
    }

    if (screen === "matching") {
      return (
        ((currentStep + 3) /
          TOTAL_FLOW_STEPS) *
        100
      );
    }

    if (screen === "octave") {
      return (
        ((TOTAL_MATCHING_STEPS + 3) /
          TOTAL_FLOW_STEPS) *
        100
      );
    }

    return 100;
  })();

  /*
   * =========================
   * 1. 이명 유형 선택
   * =========================
   */

  const handleTinnitusTypeSelect = (
    typeId: TinnitusTypeId,
  ) => {
    setSelectedTinnitusType(typeId);
    setErrorMessage("");
  };

  const handleTinnitusTypePlay = async (
    typeId: TinnitusTypeId,
  ) => {
    if (
      playingTinnitusType === typeId
    ) {
      stopTinnitusAudio();

      setPlayingTinnitusType(null);

      return;
    }

    try {
      stopTinnitusAudio();

      await playTinnitusTypePreview(
        typeId,
      );

      setPlayingTinnitusType(typeId);
    } catch (error) {
      console.error(
        "예시음 재생 실패",
        error,
      );
    }
  };

  const handleTinnitusTypeConfirm =
    async () => {
      if (
        !selectedTinnitusType ||
        isLoading
      ) {
        return;
      }

      stopTinnitusAudio();
      setPlayingTinnitusType(null);
      setErrorMessage("");

      try {
        setIsLoading(true);

        await saveTinnitusProfile(
          selectedTinnitusType,
        );

        /*
        * 어떤 유형을 선택했든
        * 다음은 대표 소리 선택 화면
        */
        setRepresentativeType(null);
        setPlayingTinnitusType(null);

        setScreen("representative");
      } catch (error) {
        console.error(
          "이명 프로필 저장 실패",
          error,
        );

        setErrorMessage(
          "선택 결과를 저장하지 못했어요.",
        );
      } finally {
        setIsLoading(false);
      }
    };

  /*
   * =========================
   * 2. 복합형 대표 소리 선택
   * =========================
   */

  const handleRepresentativeSelect = (
    typeId: TinnitusTypeId,
  ) => {
    setRepresentativeType(typeId);
    setErrorMessage("");
  };

  const handleRepresentativeConfirm =
    async () => {
      if (
        !representativeType ||
        isLoading
      ) {
        return;
      }

      stopTinnitusAudio();
      setPlayingTinnitusType(null);
      setErrorMessage("");

      try {
        setIsLoading(true);
        
        const primaryTone =
          representativeType as Exclude<
            ToneType,
            "multiple"
          >;

        sessionStorage.removeItem(
          "somni-sound-setup-completed",
        );

        const session =
          selectedTinnitusType === "multiple"
            ? await startPitchMatching(
                primaryTone,
              )
            : await startPitchMatching();


        setMatchSession(session);

        setCurrentStep(
          session.round_number - 1,
        );

        setSelectedOptionId(null);
        setPlayingOptionId(null);

        setScreen("matching");
      } catch (error) {
        console.error(
          "음역 매칭 시작 실패",
          error,
        );

        setErrorMessage(
          "음역 매칭을 시작하지 못했어요.",
        );
      } finally {
        setIsLoading(false);
      }
    };

  /*
   * =========================
   * 3. A/B 음역 매칭
   * =========================
   */

  const handleSelect = (
    optionId: FrequencyOptionId,
  ) => {
    setSelectedOptionId(optionId);
    setErrorMessage("");
  };

  const handlePlay = async (
    optionId: FrequencyOptionId,
    frequency: number,
  ) => {
    if (!matchSession) {
      return;
    }

    if (
      playingOptionId === optionId
    ) {
      stopTinnitusAudio();

      setPlayingOptionId(null);

      return;
    }

    try {
      stopTinnitusAudio();

      await playMatchingNoise(
        frequency,
        matchSession.bandwidth_octave,
      );

      setPlayingOptionId(optionId);
    } catch (error) {
      console.error(
        "비교음 재생 실패",
        error,
      );
    }
  };

  const handleConfirm = async () => {
    if (
      !selectedOptionId ||
      !matchSession
    ) {
      setErrorMessage(
        "음역대를 선택해 주세요.",
      );

      return;
    }

    if (isLoading) {
      return;
    }

    stopTinnitusAudio();
    setPlayingOptionId(null);

    try {
      setIsLoading(true);

      const nextSession =
        await selectPitchMatch(
          matchSession.id,
          selectedOptionId,
        );

      setMatchSession(nextSession);

      setSelectedOptionId(null);
      setErrorMessage("");

      /*
       * 7회 완료
       * → octave test
       */
      if (
        nextSession.octave_test_started
      ) {
        setSelectedOctave(null);
        setPlayingOctave(null);

        setScreen("octave");

        return;
      }

      setCurrentStep(
        nextSession.round_number - 1,
      );
    } catch (error) {
      console.error(
        "음역 선택 제출 실패",
        error,
      );

      setErrorMessage(
        "선택 결과를 저장하지 못했어요.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * =========================
   * 4. Octave Confusion Test
   * =========================
   */

  const handleOctavePlay = async (
    optionId: OctaveOptionId,
    frequency: number,
  ) => {
    if (!matchSession) {
      return;
    }

    if (
      playingOctave === optionId
    ) {
      stopTinnitusAudio();

      setPlayingOctave(null);

      return;
    }

    try {
      stopTinnitusAudio();

      await playMatchingNoise(
        frequency,
        matchSession.bandwidth_octave,
      );

      setPlayingOctave(optionId);
    } catch (error) {
      console.error(
        "옥타브 비교음 재생 실패",
        error,
      );
    }
  };

  const handleOctaveConfirm =
    async () => {
      if (
        selectedOctave === null ||
        !matchSession ||
        isLoading
      ) {
        return;
      }

      stopTinnitusAudio();
      setPlayingOctave(null);

      try {
        setIsLoading(true);

        const resultSession =
          await selectOctave(
            matchSession.id,
            selectedOctave,
          );

        setMatchSession(
          resultSession,
        );

        savePitchMatchSession(
          resultSession,
        );

        setErrorMessage("");

        setScreen("result");
      } catch (error) {
        console.error(
          "옥타브 선택 실패",
          error,
        );

        setErrorMessage(
          "선택 결과를 저장하지 못했어요.",
        );
      } finally {
        setIsLoading(false);
      }
    };

  /*
   * =========================
   * 5. 결과
   * =========================
   */

  const handleResultNext = () => {
    stopTinnitusAudio();

    navigate("/nature-sound");
  };

  const handleRestart = () => {
    stopTinnitusAudio();

    setScreen("type");

    setCurrentStep(0);

    setSelectedTinnitusType(null);
    setPlayingTinnitusType(null);

    setRepresentativeType(null);

    setSelectedOptionId(null);
    setPlayingOptionId(null);

    setMatchSession(null);

    setSelectedOctave(null);
    setPlayingOctave(null);

    setErrorMessage("");
  };

  /*
   * =========================
   * Header 뒤로가기
   * =========================
   *
   * 중요:
   * A/B 매칭 도중 이전 라운드 이동은
   * 백엔드 이전 단계 API가 생기기 전까지
   * 프론트에서 임의로 구현하지 않음.
   */

  const handlePreviousStep =
    useCallback(() => {
      stopTinnitusAudio();

      /*
       * 대표 소리 선택
       * → 유형 선택
       */
      if (
        screen === "representative"
      ) {
        setRepresentativeType(null);
        setPlayingTinnitusType(null);

        setScreen("type");

        return;
      }

      /*
       * 최초 유형 선택
       * → 이전 페이지
       */
      if (screen === "type") {
        navigate(-1);

        return;
      }

      /*
       * matching / octave / result의
       * 이전 단계 복원은
       * 현재 백엔드 API가 없으므로
       * 여기서 임의 처리하지 않음.
       */
    }, [screen, navigate]);

  useEffect(() => {
    window.addEventListener(
      "frequency-back",
      handlePreviousStep,
    );

    return () => {
      window.removeEventListener(
        "frequency-back",
        handlePreviousStep,
      );
    };
  }, [handlePreviousStep]);

  /*
   * =========================
   * 화면 1
   * 이명 소리 유형
   * =========================
   */

  if (screen === "type") {
    return (
      <div className="flex min-h-full flex-col px-5 pb-6">
        <ProgressSection
          width={progressWidth}
        />

        <section className="pt-16">
          <h1
            className="
              text-[1.25rem]
              leading-[1.75rem]
              font-bold
              text-text-primary
            "
          >
            어떤 소리와 가장 비슷한가요?
          </h1>

          <p className="mt-2 text-[0.75rem] text-text-secondary">
            소리의 느낌만 골라주세요.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {TINNITUS_TYPE_OPTIONS.map(
              (option) => {
                const selected =
                  selectedTinnitusType ===
                  option.id;

                const playing =
                  playingTinnitusType ===
                  option.id;

                return (
                  <div
                    key={option.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      handleTinnitusTypeSelect(
                        option.id,
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();

                        handleTinnitusTypeSelect(
                          option.id,
                        );
                      }
                    }}
                    className={`
                      flex
                      min-h-[76px]
                      w-full
                      cursor-pointer
                      items-center
                      rounded-[12px]
                      border
                      px-3
                      transition-colors
                      ${
                        selected
                          ? "border-[#38A887] bg-[#173A34]"
                          : "border-[#24464A] bg-[#102126]"
                      }
                    `}
                  >
                    <div
                      className="
                        flex
                        h-[56px]
                        w-[56px]
                        shrink-0
                        items-center
                        justify-center
                        rounded-[10px]
                        bg-[#07191D]
                      "
                    >
                      <div className="flex items-center gap-[3px]">
                        {option.waveHeights.map(
                          (
                            height,
                            index,
                          ) => (
                            <span
                              key={
                                index
                              }
                              className="
                                w-[3px]
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
                    </div>

                    <div className="ml-4 min-w-0">
                      <p
                        className="
                          text-[13px]
                          font-semibold
                          text-text-primary
                        "
                      >
                        {option.title}
                      </p>

                      <p
                        className="
                          mt-1
                          text-[10px]
                          text-text-secondary
                        "
                      >
                        {
                          option.description
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label={
                        playing
                          ? `${option.title} 일시정지`
                          : `${option.title} 재생`
                      }
                      onClick={(
                        event,
                      ) => {
                        event.stopPropagation();

                        void handleTinnitusTypePlay(
                          option.id,
                        );
                      }}
                      className={`
                        ml-auto
                        flex
                        h-[34px]
                        w-[34px]
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        ${
                          playing
                            ? "bg-[#61DBB8]"
                            : "bg-[#12382E]"
                        }
                      `}
                    >
                      <img
                        src={
                          playing
                            ? pauseIcon
                            : playIcon
                        }
                        alt=""
                        aria-hidden="true"
                        className="
                          h-[13.496px]
                          w-[11.25px]
                          object-contain
                        "
                      />
                    </button>
                  </div>
                );
              },
            )}
          </div>

          {errorMessage && (
            <p className="mt-3 text-[12px] text-[#F09292]">
              {errorMessage}
            </p>
          )}
        </section>

        <div className="mt-auto pt-10">
          <button
            type="button"
            disabled={
              selectedTinnitusType ===
                null || isLoading
            }
            onClick={
              handleTinnitusTypeConfirm
            }
            className={`
              h-14
              w-full
              rounded-[12px]
              text-[14px]
              font-bold
              ${
                selectedTinnitusType &&
                !isLoading
                  ? "bg-[#60CEA7] text-[#07100D]"
                  : "bg-[#214750] text-[#0D1719]"
              }
            `}
          >
            {isLoading
              ? "잠시만 기다려주세요"
              : "확인"}
          </button>
        </div>
      </div>
    );
  }

  /*
   * =========================
   * 화면 2
   * 복합형 대표 소리
   * =========================
   */

  if (screen === "representative") {
    const representativeOptions =
      TINNITUS_TYPE_OPTIONS.filter(
        (option) =>
          option.id !== "multiple",
      );

    return (
      <div className="flex min-h-full flex-col px-5 pb-6">
        <ProgressSection
          width={progressWidth}
        />

        <section className="pt-16">
          <h1
            className="
              text-[1.25rem]
              leading-[1.75rem]
              font-bold
              text-text-primary
            "
          >
            잠들 때 가장 신경 쓰이는
            <br />
            소리 하나를 골라주세요.
          </h1>

          <p className="mt-2 text-[0.75rem] text-text-secondary">
            소리의 느낌만 골라주세요.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {representativeOptions.map(
              (option) => {
                const selected =
                  representativeType ===
                  option.id;

                const playing =
                  playingTinnitusType ===
                  option.id;

                return (
                  <div
                    key={option.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      handleRepresentativeSelect(
                        option.id,
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();

                        handleRepresentativeSelect(
                          option.id,
                        );
                      }
                    }}
                    className={`
                      flex
                      min-h-[76px]
                      w-full
                      cursor-pointer
                      items-center
                      rounded-[12px]
                      border
                      px-3
                      transition-colors
                      ${
                        selected
                          ? "border-[#38A887] bg-[#173A34]"
                          : "border-[#24464A] bg-[#102126]"
                      }
                    `}
                  >
                    <div
                      className="
                        flex
                        h-[56px]
                        w-[56px]
                        shrink-0
                        items-center
                        justify-center
                        rounded-[10px]
                        bg-[#07191D]
                      "
                    >
                      <div className="flex items-center gap-[3px]">
                        {option.waveHeights.map(
                          (
                            height,
                            index,
                          ) => (
                            <span
                              key={
                                index
                              }
                              className="
                                w-[3px]
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
                    </div>

                    <div className="ml-4 min-w-0">
                      <p
                        className="
                          text-[13px]
                          font-semibold
                          text-text-primary
                        "
                      >
                        {option.title}
                      </p>

                      <p
                        className="
                          mt-1
                          text-[10px]
                          text-text-secondary
                        "
                      >
                        {
                          option.description
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label={
                        playing
                          ? `${option.title} 일시정지`
                          : `${option.title} 재생`
                      }
                      onClick={(
                        event,
                      ) => {
                        event.stopPropagation();

                        void handleTinnitusTypePlay(
                          option.id,
                        );
                      }}
                      className={`
                        ml-auto
                        flex
                        h-[34px]
                        w-[34px]
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        ${
                          playing
                            ? "bg-[#61DBB8]"
                            : "bg-[#12382E]"
                        }
                      `}
                    >
                      <img
                        src={
                          playing
                            ? pauseIcon
                            : playIcon
                        }
                        alt=""
                        aria-hidden="true"
                        className="
                          h-[13.496px]
                          w-[11.25px]
                          object-contain
                        "
                      />
                    </button>
                  </div>
                );
              },
            )}
          </div>

          <p
            className="
              mt-4
              text-[10px]
              leading-4
              text-text-secondary
            "
          >
            선택한 대표 소리는 나중에
            언제든 다시 바꿀 수 있어요.
          </p>

          {errorMessage && (
            <p className="mt-3 text-[12px] text-[#F09292]">
              {errorMessage}
            </p>
          )}
        </section>

        <div className="mt-auto pt-10">
          <button
            type="button"
            disabled={
              representativeType ===
                null || isLoading
            }
            onClick={
              handleRepresentativeConfirm
            }
            className={`
              h-14
              w-full
              rounded-[12px]
              text-[14px]
              font-bold
              ${
                representativeType &&
                !isLoading
                  ? "bg-[#60CEA7] text-[#07100D]"
                  : "bg-[#214750] text-[#0D1719]"
              }
            `}
          >
            {isLoading
              ? "잠시만 기다려주세요"
              : "확인"}
          </button>
        </div>
      </div>
    );
  }

  /*
   * =========================
   * 화면 3
   * A/B 비교 1~7
   * =========================
   */

  if (screen === "matching") {
    if (
      !matchSession ||
      matchSession.freq_a === null ||
      matchSession.freq_b === null
    ) {
      return (
        <div className="flex min-h-full items-center justify-center px-5">
          <p className="text-[13px] text-text-secondary">
            음역 정보를 불러오는 중이에요.
          </p>
        </div>
      );
    }

    const matchingOptions = [
      {
        id: "A" as const,
        frequency:
          matchSession.freq_a,
      },
      {
        id: "B" as const,
        frequency:
          matchSession.freq_b,
      },
    ];

    return (
      <div className="flex min-h-full flex-col px-5 pb-6">
        <ProgressSection
          width={progressWidth}
        />

        <section className="pt-16">
          <p className="text-[0.75rem] font-semibold text-text-tertiary">
            {currentStep + 1}/
            {TOTAL_MATCHING_STEPS}
          </p>

          <h1
            className="
              mt-2
              text-[1.25rem]
              leading-[1.75rem]
              font-bold
              text-text-primary
            "
          >
            어느 소리가 지금 들리는
            <br />
            이명과 더 비슷한가요?
          </h1>

          <div className="mt-10 flex gap-3">
            {matchingOptions.map(
              (option) => (
                <FrequencyCard
                  key={option.id}
                  label={option.id}
                  frequency={
                    option.frequency
                  }
                  selected={
                    selectedOptionId ===
                    option.id
                  }
                  playing={
                    playingOptionId ===
                    option.id
                  }
                  showError={Boolean(
                    errorMessage,
                  )}
                  onSelect={() =>
                    handleSelect(
                      option.id,
                    )
                  }
                  onPlay={() =>
                    void handlePlay(
                      option.id,
                      option.frequency,
                    )
                  }
                />
              ),
            )}
          </div>

          {errorMessage && (
            <p className="mt-3 text-[0.75rem] text-[#F09292]">
              {errorMessage}
            </p>
          )}
        </section>

        <div className="mt-auto pt-10">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleConfirm}
            className={`
              h-14
              w-full
              rounded-[0.75rem]
              text-[0.875rem]
              font-bold
              ${
                selectedOptionId &&
                !isLoading
                  ? "bg-[#60CEA7] text-[#07100D]"
                  : "bg-[#214750] text-[#0D1719]"
              }
            `}
          >
            {isLoading
              ? "잠시만 기다려주세요"
              : "확인"}
          </button>
        </div>
      </div>
    );
  }

  /*
   * =========================
   * 화면 4
   * 옥타브 확인
   * =========================
   */

  if (screen === "octave") {
    const octaveTest =
      matchSession?.octave_test;

    const octaveOptions =
      octaveTest
        ? [
            {
              id: "half" as const,
              frequency:
                octaveTest.half,
              description:
                "한 옥타브 낮은 소리",
              waveHeights: [
                22, 32, 38, 28, 34,
                24, 30,
              ],
            },
            {
              id: "same" as const,
              frequency:
                octaveTest.same,
              description:
                "지금까지 찾은 중심 소리",
              waveHeights: [
                28, 38, 34, 30, 24,
                32, 26,
              ],
            },
            {
              id: "double" as const,
              frequency:
                octaveTest.double,
              description:
                "한 옥타브 높은 소리",
              waveHeights: [
                18, 24, 30, 36, 40,
                38, 34, 30, 24, 20,
              ],
            },
          ]
        : [];

    return (
      <div className="flex min-h-full flex-col px-5 pb-6">
        <ProgressSection
          width={progressWidth}
        />

        <section className="pt-12">
          <h1
            className="
              text-[1.25rem]
              leading-[1.75rem]
              font-bold
              text-text-primary
            "
          >
            마지막으로 확인할게요.
          </h1>

          <p
            className="
              mt-2
              text-[0.75rem]
              leading-5
              text-text-secondary
            "
          >
            비슷하게 느껴지는 높이 중
            <br />
            평소 들리는 소리와 가장
            가까운 것을 골라주세요.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {octaveOptions.map(
              (option) => {
                if (
                  option.frequency ===
                  null
                ) {
                  return null;
                }
                const frequency = option.frequency;
                const selected =
                  selectedOctave ===
                  option.id;

                const playing =
                  playingOctave ===
                  option.id;

                return (
                  <div
                    key={option.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedOctave(
                        option.id,
                      );

                      setErrorMessage(
                        "",
                      );
                    }}
                    onKeyDown={(
                      event,
                    ) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();

                        setSelectedOctave(
                          option.id,
                        );

                        setErrorMessage(
                          "",
                        );
                      }
                    }}
                    className={`
                      flex
                      min-h-[76px]
                      w-full
                      cursor-pointer
                      items-center
                      rounded-[12px]
                      border
                      px-3
                      transition-colors
                      ${
                        selected
                          ? "border-[#38A887] bg-[#173A34]"
                          : "border-[#24464A] bg-[#102126]"
                      }
                    `}
                  >
                    <div
                      className="
                        flex
                        h-[58px]
                        w-[58px]
                        shrink-0
                        items-center
                        justify-center
                        rounded-[10px]
                        bg-[#07191D]
                      "
                    >
                      <div className="flex items-center gap-[3px]">
                        {option.waveHeights.map(
                          (
                            height,
                            index,
                          ) => (
                            <span
                              key={
                                index
                              }
                              className="
                                w-[3px]
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
                    </div>

                    <div className="ml-4">
                      <p
                        className="
                          text-[14px]
                          font-bold
                          text-text-primary
                        "
                      >
                        {Math.round(
                          frequency,
                        ).toLocaleString()}{" "}
                        Hz
                      </p>

                      <p
                        className="
                          mt-1
                          text-[11px]
                          text-text-secondary
                        "
                      >
                        {
                          option.description
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label={
                        playing
                          ? `${frequency}Hz 일시정지`
                          : `${frequency}Hz 재생`
                      }
                      onClick={(
                        event,
                      ) => {
                        event.stopPropagation();

                        void handleOctavePlay(
                          option.id,
                          frequency,
                        );
                      }}
                      className={`
                        ml-auto
                        flex
                        h-[34px]
                        w-[34px]
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        ${
                          playing
                            ? "bg-[#61DBB8]"
                            : "bg-[#12382E]"
                        }
                      `}
                    >
                      <img
                        src={
                          playing
                            ? pauseIcon
                            : playIcon
                        }
                        alt=""
                        aria-hidden="true"
                        className="
                          h-[13.496px]
                          w-[11.25px]
                          object-contain
                        "
                      />
                    </button>
                  </div>
                );
              },
            )}
          </div>

          <p
            className="
              mt-8
              text-[0.6875rem]
              leading-5
              text-text-secondary
            "
          >
            지원 범위를 벗어나는 후보는
            자동으로 제외해요.
            <br />
            선택한 결과에 따라 저장할 대표
            음역을 마지막으로 보정합니다.
          </p>

          {errorMessage && (
            <p className="mt-3 text-[12px] text-[#F09292]">
              {errorMessage}
            </p>
          )}
        </section>

        <div className="mt-auto pt-10">
          <button
            type="button"
            onClick={
              handleOctaveConfirm
            }
            disabled={
              selectedOctave === null ||
              isLoading
            }
            className={`
              h-14
              w-full
              rounded-[0.75rem]
              text-[0.875rem]
              font-bold
              ${
                selectedOctave !==
                  null && !isLoading
                  ? "bg-[#60CEA7] text-[#07100D]"
                  : "bg-[#214750] text-[#0D1719]"
              }
            `}
          >
            {isLoading
              ? "잠시만 기다려주세요"
              : "확인"}
          </button>
        </div>
      </div>
    );
  }

  /*
   * =========================
   * 화면 5
   * 결과
   * =========================
   */

  return (
    <div className="flex min-h-full flex-col px-5 pb-6">
      <ProgressSection width={100} />

      <section className="pt-16">
        <h1
          className="
            text-[1.25rem]
            leading-[1.75rem]
            font-bold
            text-text-primary
          "
        >
          이명과 가까운 음역을 찾았어요
        </h1>

        <p className="mt-10 flex items-baseline font-bold leading-none text-[#60CEA7]">
          <span className="text-[44px]">
            {Math.round(
              matchSession
                ?.center_frequency ??
                0,
            ).toLocaleString()}
          </span>

          <span className="ml-1 text-[18px]">
            Hz
          </span>
        </p>

        <div
          className="
            mt-5
            rounded-[1rem]
            border
            border-[#1D5B49]
            bg-[#102821]
            p-4
          "
        >
          <div className="flex h-[7rem] items-center justify-center gap-1">
            {[
              32, 44, 56, 46, 38,
              52, 60, 44, 34, 50,
              58, 42, 54,
            ].map(
              (height, index) => (
                <span
                  key={index}
                  className="
                    w-1
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

          <p className="mt-2 text-center text-[0.6875rem] text-text-secondary">
            추정 범위{" "}
            {Math.round(
              matchSession
                ?.lower_bound ?? 0,
            ).toLocaleString()}
            Hz -{" "}
            {Math.round(
              matchSession
                ?.upper_bound ?? 0,
            ).toLocaleString()}
            Hz
          </p>
        </div>

        <div className="mt-5 rounded-[0.75rem] bg-[#141F23] p-4">
          <p className="text-[0.75rem] text-text-tertiary">
            의료 검사 결과가 아닌
            추정값입니다.
          </p>

          <p className="mt-1 text-[0.75rem] text-text-secondary">
            이 값을 기준으로 개인화
            사운드를 제공합니다.
          </p>
        </div>
      </section>

      <div className="mt-auto pt-10">
        <button
          type="button"
          onClick={handleResultNext}
          className="
            h-14
            w-full
            rounded-[0.75rem]
            bg-[#60CEA7]
            text-[0.875rem]
            font-bold
            text-[#07100D]
          "
        >
          다음
        </button>

        <button
          type="button"
          onClick={handleRestart}
          className="
            mt-3
            h-11
            w-full
            text-[0.8125rem]
            font-medium
            text-text-tertiary
          "
        >
          다시 측정하기
        </button>
      </div>
    </div>
  );
}

interface ProgressSectionProps {
  width: number;
}

function ProgressSection({
  width,
}: ProgressSectionProps) {
  return (
    <div className="pt-5">
      <div
        className="
          h-[3px]
          w-full
          overflow-hidden
          rounded-full
          bg-[#294247]
        "
      >
        <div
          className="
            h-full
            rounded-full
            bg-[#60CEA7]
            transition-[width]
            duration-300
          "
          style={{
            width: `${width}%`,
          }}
        />
      </div>
    </div>
  );
}

export default FrequencyPage;