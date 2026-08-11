import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import FrequencyCard from "../../components/frequency/FrequencyCard";

import playIcon from "../../assets/icons/play.svg";
import pauseIcon from "../../assets/icons/pause.svg";

import {
  frequencyQuestions,
  mockFrequencyResult,
  type FrequencyOptionId,
} from "../../mock/frequencyData";

interface FrequencyAnswer {
  step: number;
  optionId: FrequencyOptionId;
  frequency: number;
}

type FrequencyScreen =
  | "type"
  | "representative"
  | "matching"
  | "octave"
  | "result";

type TinnitusTypeId =
  | "tone"
  | "hum"
  | "wide"
  | "multiple";

interface TinnitusTypeOption {
  id: TinnitusTypeId;
  title: string;
  description: string;
  waveHeights: number[];
}

const TINNITUS_TYPE_OPTIONS: TinnitusTypeOption[] = [
  {
    id: "tone",
    title: "삐- 한 음이 선명해요",
    description: "한 가지 높이의 소리가 또렷하게 느껴져요.",
    waveHeights: [30, 27, 23, 19, 15, 12, 9],
  },
  {
    id: "hum",
    title: "윙- 중심이 되는 울림이 있어요",
    description: "울림이 있지만 중심이 되는 높이가 있어요.",
    waveHeights: [22, 30, 38, 42, 36, 28, 20],
  },
  {
    id: "wide",
    title: "쉬익- 넓게 퍼져 들려요",
    description: "한 음보다 넓은 대역의 소리처럼 느껴져요.",
    waveHeights: [18, 24, 30, 35, 34, 30, 25, 20],
  },
  {
    id: "multiple",
    title: "여러 소리가 함께 들려요",
    description: "두 가지 이상의 소리가 겹쳐 들려요.",
    waveHeights: [20, 30, 22, 36, 26, 32, 18],
  },
];

function FrequencyPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [screen, setScreen] = useState<FrequencyScreen>(
    location.state?.screen === "result"
      ? "result"
      : "type",
  );

  const [currentStep, setCurrentStep] = useState(0);

  const [selectedTinnitusType, setSelectedTinnitusType] =
    useState<TinnitusTypeId | null>(null);

  const [playingTinnitusType, setPlayingTinnitusType] =
    useState<TinnitusTypeId | null>(null);

  const [representativeType, setRepresentativeType] =
    useState<TinnitusTypeId | null>(null);

  const [selectedOptionId, setSelectedOptionId] =
    useState<FrequencyOptionId | null>(null);

  const [playingOptionId, setPlayingOptionId] =
    useState<FrequencyOptionId | null>(null);

  const [selectedOctave, setSelectedOctave] =
    useState<number | null>(null);

  const [playingOctave, setPlayingOctave] =
    useState<number | null>(null);

  const [, setAnswers] = useState<FrequencyAnswer[]>([]);

  const [errorMessage, setErrorMessage] = useState("");

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

  const currentQuestion = frequencyQuestions[currentStep];
  const totalSteps = frequencyQuestions.length;

  /*
    전체 진행 흐름

    1. 이명 소리 유형 선택

    "여러 소리가 함께 들려요" 선택 시
    2. 대표 소리 선택

    이후
    A/B 비교 1~7
    옥타브 확인
    결과 화면 = 100%
  */

  const TOTAL_FLOW_STEPS = totalSteps + 4;

  const progressWidth = (() => {
    if (screen === "type") {
      return (1 / TOTAL_FLOW_STEPS) * 100;
    }

    if (screen === "representative") {
      return (2 / TOTAL_FLOW_STEPS) * 100;
    }

    if (screen === "matching") {
      return ((currentStep + 3) / TOTAL_FLOW_STEPS) * 100;
    }

    if (screen === "octave") {
      return ((totalSteps + 3) / TOTAL_FLOW_STEPS) * 100;
    }

    return 100;
  })();

  /*
    이명 유형 선택
  */

  const handleTinnitusTypeSelect = (
    typeId: TinnitusTypeId,
  ) => {
    setSelectedTinnitusType(typeId);
  };

  const handleTinnitusTypePlay = (
    typeId: TinnitusTypeId,
  ) => {
    // TODO: 실제 음원 재생 연결
    setPlayingTinnitusType((previous) =>
      previous === typeId ? null : typeId,
    );
  };

  const handleTinnitusTypeConfirm = () => {
    if (!selectedTinnitusType) {
      return;
    }

    setPlayingTinnitusType(null);
    setRepresentativeType(null);

    // 어떤 유형을 골라도 대표 소리 선택 화면으로 이동
    setScreen("representative");
  };

  /*
    대표 소리 선택
  */

  const handleRepresentativeSelect = (
    typeId: TinnitusTypeId,
  ) => {
    setRepresentativeType(typeId);
  };

  const handleRepresentativeConfirm = () => {
    if (!representativeType) {
      return;
    }

    setPlayingTinnitusType(null);
    setScreen("matching");
  };

  /*
    A/B 음역 매칭
  */

  const handleSelect = (
    optionId: FrequencyOptionId,
  ) => {
    setSelectedOptionId(optionId);
    setErrorMessage("");
  };

  const handlePlay = (
    optionId: FrequencyOptionId,
    frequency: number,
  ) => {
    // TODO: 실제 음원 재생 연결
    console.log(`${frequency}Hz 재생`);

    setPlayingOptionId((previous) =>
      previous === optionId ? null : optionId,
    );
  };

  const handleConfirm = () => {
    if (!selectedOptionId) {
      setErrorMessage("음역대를 선택해 주세요.");
      return;
    }

    const selectedOption =
      currentQuestion.options.find(
        (option) =>
          option.id === selectedOptionId,
      );

    if (!selectedOption) {
      return;
    }

    setAnswers((previousAnswers) => [
      ...previousAnswers,
      {
        step: currentStep + 1,
        optionId: selectedOption.id,
        frequency: selectedOption.frequency,
      },
    ]);

    if (currentStep === totalSteps - 1) {
      setScreen("octave");

      setSelectedOptionId(null);
      setPlayingOptionId(null);
      setErrorMessage("");

      return;
    }

    setCurrentStep(
      (previousStep) => previousStep + 1,
    );

    setSelectedOptionId(null);
    setPlayingOptionId(null);
    setErrorMessage("");
  };

  /*
    옥타브 확인
  */

  const handleOctavePlay = (
    frequency: number,
  ) => {
    // TODO: 실제 음원 재생 연결
    console.log(`${frequency}Hz 재생`);

    setPlayingOctave((previous) =>
      previous === frequency
        ? null
        : frequency,
    );
  };

  const handleOctaveConfirm = () => {
    if (selectedOctave === null) {
      return;
    }

    setPlayingOctave(null);
    setScreen("result");
  };

  /*
    결과
  */

  const handleResultNext = () => {
    navigate("/nature-sound");
  };

  const handleRestart = () => {
    setScreen("type");

    setCurrentStep(0);

    setSelectedTinnitusType(null);
    setPlayingTinnitusType(null);

    setRepresentativeType(null);

    setSelectedOptionId(null);
    setPlayingOptionId(null);

    setSelectedOctave(null);
    setPlayingOctave(null);

    setAnswers([]);
    setErrorMessage("");
  };

  /*
    Header 뒤로가기
  */

  const handlePreviousStep = useCallback(() => {
    /*
      대표 소리 선택
      → 이명 소리 유형 선택
    */
    if (screen === "representative") {
      setScreen("type");

      setRepresentativeType(null);
      setPlayingTinnitusType(null);

      return;
    }

    /*
      이명 유형 선택
      → 이전 페이지
    */
    if (screen === "type") {
      navigate(-1);
      return;
    }

    /*
      A/B 2~7단계
      → 한 단계 이전
    */
    if (
      screen === "matching" &&
      currentStep > 0
    ) {
      setCurrentStep(
        (previous) => previous - 1,
      );

      setSelectedOptionId(null);
      setPlayingOptionId(null);
      setErrorMessage("");

      return;
    }

    /*
      A/B 1단계에서 뒤로가기

      여러 소리 사용자는 대표 소리 선택,
      그 외 사용자는 유형 선택으로 이동
    */
    if (
      screen === "matching" &&
      currentStep === 0
    ) {
      setSelectedOptionId(null);
      setPlayingOptionId(null);
      setErrorMessage("");

      // A/B 첫 단계의 이전 화면은 항상 대표 소리 선택
      setScreen("representative");

      return;
    }

    /*
      옥타브 확인
      → A/B 7단계
    */
    if (screen === "octave") {
      setScreen("matching");

      setCurrentStep(totalSteps - 1);

      setSelectedOctave(null);
      setPlayingOctave(null);

      return;
    }

    /*
      결과
      → 옥타브 확인
    */
    if (screen === "result") {
      setScreen("octave");
    }
  }, [
    screen,
    currentStep,
    totalSteps,
    navigate,
  ]);

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
    1. 이명 소리 유형 선택
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
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        handleTinnitusTypeSelect(
                          option.id,
                        );
                      }
                    }}
                    className={`
                      flex min-h-[76px] w-full
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
                    {/* 파형 */}
                    <div
                      className="
                        flex h-[56px] w-[56px]
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
                              key={index}
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

                    {/* 텍스트 */}
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
                        {option.description}
                      </p>
                    </div>

                    {/* 재생 버튼 */}
                    <button
                      type="button"
                      aria-label={
                        playing
                          ? `${option.title} 일시정지`
                          : `${option.title} 재생`
                      }
                      onClick={(event) => {
                        event.stopPropagation();

                        handleTinnitusTypePlay(
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
        </section>

        <div className="mt-auto pt-10">
          <button
            type="button"
            disabled={
              selectedTinnitusType === null
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
                selectedTinnitusType
                  ? "bg-[#60CEA7] text-[#07100D]"
                  : "bg-[#214750] text-[#0D1719]"
              }
            `}
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  /*
    2. 복합 유형 선택 시 대표 소리 선택
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
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        handleRepresentativeSelect(
                          option.id,
                        );
                      }
                    }}
                    className={`
                      flex min-h-[76px] w-full
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
                    {/* 파형 */}
                    <div
                      className="
                        flex h-[56px] w-[56px]
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
                              key={index}
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

                    {/* 텍스트 */}
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
                        {option.description}
                      </p>
                    </div>

                    {/* 재생 버튼 */}
                    <button
                      type="button"
                      aria-label={
                        playing
                          ? `${option.title} 일시정지`
                          : `${option.title} 재생`
                      }
                      onClick={(event) => {
                        event.stopPropagation();

                        handleTinnitusTypePlay(
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
            선택한 대표 소리는 나중에 언제든 다시 바꿀 수 있어요.
          </p>
        </section>

        <div className="mt-auto pt-10">
          <button
            type="button"
            disabled={
              representativeType === null
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
                representativeType
                  ? "bg-[#60CEA7] text-[#07100D]"
                  : "bg-[#214750] text-[#0D1719]"
              }
            `}
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  /*
    3. 기존 A/B 음역 비교
  */

  if (screen === "matching") {
    return (
      <div className="flex min-h-full flex-col px-5 pb-6">
        <ProgressSection
          width={progressWidth}
        />

        <section className="pt-16">
          <p className="text-[0.75rem] font-semibold text-text-tertiary">
            {currentStep + 1}/
            {totalSteps}
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
            {currentQuestion.options.map(
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
                    handleSelect(option.id)
                  }
                  onPlay={() =>
                    handlePlay(
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
            onClick={handleConfirm}
            className={`
              h-14
              w-full
              rounded-[0.75rem]
              text-[0.875rem]
              font-bold
              ${
                selectedOptionId
                  ? "bg-[#60CEA7] text-[#07100d]"
                  : "bg-[#214750] text-[#0d1719]"
              }
            `}
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  /*
    4. 옥타브 확인
  */

  if (screen === "octave") {
    const octaveOptions = [
      {
        frequency: 426,
        description:
          "한 옥타브 낮은 소리",
        waveHeights: [
          22, 32, 38, 28, 34, 24, 30,
        ],
      },
      {
        frequency: 853,
        description:
          "지금까지 찾은 중심 소리",
        waveHeights: [
          28, 38, 34, 30, 24, 32, 26,
        ],
      },
      {
        frequency: 1706,
        description:
          "한 옥타브 높은 소리",
        waveHeights: [
          18, 24, 30, 36, 40,
          38, 34, 30, 24, 20,
        ],
      },
    ];

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
                const selected =
                  selectedOctave ===
                  option.frequency;

                const playing =
                  playingOctave ===
                  option.frequency;

                return (
                  <div
                    key={
                      option.frequency
                    }
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setSelectedOctave(
                        option.frequency,
                      )
                    }
                    onKeyDown={(
                      event,
                    ) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key === " "
                      ) {
                        setSelectedOctave(
                          option.frequency,
                        );
                      }
                    }}
                    className={`
                      flex min-h-[76px] w-full
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
                    {/* 파형 */}
                    <div
                      className="
                        flex h-[58px] w-[58px]
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
                              key={index}
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

                    {/* Hz / 설명 */}
                    <div className="ml-4">
                      <p
                        className="
                          text-[14px]
                          font-bold
                          text-text-primary
                        "
                      >
                        {option.frequency.toLocaleString()}{" "}
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

                    {/* 재생 */}
                    <button
                      type="button"
                      aria-label={
                        playing
                          ? `${option.frequency}Hz 일시정지`
                          : `${option.frequency}Hz 재생`
                      }
                      onClick={(
                        event,
                      ) => {
                        event.stopPropagation();

                        handleOctavePlay(
                          option.frequency,
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
        </section>

        <div className="mt-auto pt-10">
          <button
            type="button"
            onClick={
              handleOctaveConfirm
            }
            disabled={
              selectedOctave === null
            }
            className={`
              h-14
              w-full
              rounded-[0.75rem]
              text-[0.875rem]
              font-bold
              ${
                selectedOctave !== null
                  ? "bg-[#60CEA7] text-[#07100D]"
                  : "bg-[#214750] text-[#0D1719]"
              }
            `}
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  /*
    5. 결과 화면
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
            {mockFrequencyResult}
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
            border-[#1d5b49]
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
            추정 범위 842Hz - 863Hz
          </p>
        </div>

        <div className="mt-5 rounded-[0.75rem] bg-[#141f23] p-4">
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
            text-[#07100d]
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