import { useCallback, useEffect, useState, } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import FrequencyCard from "../../components/frequency/FrequencyCard";
import { frequencyQuestions, mockFrequencyResult, type FrequencyOptionId,} from "../../mock/frequencyData";

interface FrequencyAnswer {
  step: number;
  optionId: FrequencyOptionId;
  frequency: number;
}

type FrequencyScreen = "matching" | "octave" | "result";

function FrequencyPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [screen, setScreen] = useState<FrequencyScreen>(
    location.state?.screen === "result"
      ? "result"
      : "matching",
  );

const [currentStep, setCurrentStep] = useState(0);

const [selectedOptionId, setSelectedOptionId] =
  useState<FrequencyOptionId | null>(null);

const [playingOptionId, setPlayingOptionId] =
  useState<FrequencyOptionId | null>(null);

const [, setAnswers] = useState<FrequencyAnswer[]>([]);

const [errorMessage, setErrorMessage] = useState("");

const currentQuestion = frequencyQuestions[currentStep];
const totalSteps = frequencyQuestions.length;

/*
  전체 흐름
  음역 선택 7단계 + 옥타브 확인 + 결과 = 9단계

  결과 화면에서 100%
*/
const progressWidth =
  screen === "result"
    ? 100
    : screen === "octave"
      ? ((totalSteps + 1) / (totalSteps + 2)) * 100
      : ((currentStep + 1) / (totalSteps + 2)) * 100;

const handleSelect = (optionId: FrequencyOptionId) => {
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

  const selectedOption = currentQuestion.options.find(
    (option) => option.id === selectedOptionId,
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

  /*
    7번째 선택까지 끝났으면
    바로 결과 화면으로 가지 않고
    옥타브 확인 화면으로 이동
  */
  if (currentStep === totalSteps - 1) {
    setScreen("octave");
    setSelectedOptionId(null);
    setPlayingOptionId(null);
    setErrorMessage("");
    return;
  }

  setCurrentStep((previousStep) => previousStep + 1);
  setSelectedOptionId(null);
  setPlayingOptionId(null);
  setErrorMessage("");
};

const handleOctaveConfirm = () => {
  setPlayingOptionId(null);
  setScreen("result");
};

const handleRestart = () => {
  setScreen("matching");
  setCurrentStep(0);
  setSelectedOptionId(null);
  setPlayingOptionId(null);
  setAnswers([]);
  setErrorMessage("");
};

const handleResultNext = () => {
  navigate("/nature-sound");
};

const handlePreviousStep = useCallback(() => {
  // 음역 선택 2/7 ~ 7/7
  if (screen === "matching" && currentStep > 0) {
    setCurrentStep((previous) => previous - 1);
    setSelectedOptionId(null);
    setPlayingOptionId(null);
    setErrorMessage("");
    return;
  }

  // 음역 선택 1/7
  if (screen === "matching" && currentStep === 0) {
    navigate(-1);
    return;
  }

  // 옥타브 확인 → 7/7
  if (screen === "octave") {
    setScreen("matching");
    setCurrentStep(totalSteps - 1);
    setSelectedOptionId(null);
    setPlayingOptionId(null);
    setErrorMessage("");
    return;
  }

  // 결과 → 옥타브 확인
  if (screen === "result") {
    setScreen("octave");
  }
}, [screen, currentStep, totalSteps, navigate]);

useEffect(() => {
  window.addEventListener("frequency-back", handlePreviousStep);

  return () => {
    window.removeEventListener("frequency-back", handlePreviousStep);
  };
}, [handlePreviousStep]);

/*
  옥타브 확인 화면
*/
if (screen === "octave") {
  return (
    <div className="flex min-h-full flex-col px-5 pb-6">
      <ProgressSection width={progressWidth} />

      <section className="pt-12">
        <h1
          className="
            text-[1.25rem]
            leading-[1.75rem]
            font-bold
            text-text-primary
          "
        >
          마지막으로 한 번만
          <br />
          확인할게요.
        </h1>

        <p className="mt-3 text-[0.75rem] leading-5 text-text-secondary">
          비슷하게 느껴지는 높이 중
          평소 들리는 소리와 가장 가까운 것을
          골라주세요.
        </p>

        <div
          className="
            mt-6 flex h-14 items-center justify-center
            rounded-[0.75rem]
            border border-[#236653]
            bg-[#103329]
            text-[0.75rem] font-semibold
            text-[#60CEA7]
          "
        >
          7번 비교 결과 · 약 853 Hz 부근
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <OctaveOption
            label="A"
            frequency={426}
            description="한 옥타브 낮은 소리"
          />

          <OctaveOption
            label="B"
            frequency={853}
            description="지금까지 찾은 중심 소리"
            selected
          />

          <OctaveOption
            label="C"
            frequency={1706}
            description="한 옥타브 높은 소리"
          />
        </div>

        <div
          className="
            mt-5 rounded-[0.75rem]
            border border-[#24464A]
            bg-[#102126]
            p-4
            text-[0.6875rem]
            leading-5
            text-text-secondary
          "
        >
          지원 범위를 벗어나는 후보는 자동으로 제외해요.
          <br />
          선택한 결과에 따라 저장할 대표 음역을 마지막으로 보정합니다.
        </div>
      </section>

      <div className="mt-auto pt-10">
        <button
          type="button"
          onClick={handleOctaveConfirm}
          className="
            h-14 w-full rounded-[0.75rem]
            bg-[#60CEA7]
            text-[0.875rem]
            font-bold
            text-[#07100d]
          "
        >
          확인
        </button>
      </div>
    </div>
  );
}

/*
  매칭 완료 화면
*/
if (screen === "result") {
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
            mt-5 rounded-[1rem]
            border border-[#1d5b49]
            bg-[#102821]
            p-4
          "
        >
          <div className="flex h-[7rem] items-center justify-center gap-1">
            {[
              32, 44, 56, 46, 38, 52, 60,
              44, 34, 50, 58, 42, 54,
            ].map((height, index) => (
              <span
                key={index}
                className="w-1 rounded-full bg-[#60CEA7]"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>

          <p className="mt-2 text-center text-[0.6875rem] text-text-secondary">
            추정 범위 842Hz - 863Hz
          </p>
        </div>

        <div className="mt-5 rounded-[0.75rem] bg-[#141f23] p-4">
          <p className="text-[0.75rem] text-text-tertiary">
            의료 검사 결과가 아닌 추정값입니다.
          </p>

          <p className="mt-1 text-[0.75rem] text-text-secondary">
            이 값을 기준으로 개인화 사운드를 제공합니다.
          </p>
        </div>
      </section>

      <div className="mt-auto pt-10">
        <button
          type="button"
          onClick={handleResultNext}
          className="
            h-14 w-full rounded-[0.75rem]
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
            mt-3 h-11 w-full
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

/*
  기존 음역 선택 화면
*/
return (
  <div className="flex min-h-full flex-col px-5 pb-6">
    <ProgressSection width={progressWidth} />

    <section className="pt-16">
      <p className="text-[0.75rem] font-semibold text-text-tertiary">
        {currentStep + 1}/{totalSteps}
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
        {currentQuestion.options.map((option) => (
          <FrequencyCard
            key={option.id}
            label={option.id}
            frequency={option.frequency}
            selected={selectedOptionId === option.id}
            playing={playingOptionId === option.id}
            showError={Boolean(errorMessage)}
            onSelect={() => handleSelect(option.id)}
            onPlay={() =>
              handlePlay(option.id, option.frequency)
            }
          />
        ))}
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
          h-14 w-full rounded-[0.75rem]
          text-[0.875rem] font-bold
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

interface ProgressSectionProps {
  width: number;
}

function ProgressSection({
  width,
}: ProgressSectionProps) {
  return (
    /*
      Header 아래에 위치.
      기존에 맞춰둔 Header 간격 기준 유지.
    */
    <div className="pt-5">
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#294247]">
        <div
          className="
            h-full rounded-full
            bg-[#60CEA7]
            transition-[width]
            duration-300
          "
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

interface OctaveOptionProps {
  label: string;
  frequency: number;
  description: string;
  selected?: boolean;
}

function OctaveOption({
  label,
  frequency,
  description,
  selected = false,
}: OctaveOptionProps) {
  return (
    <div
      className={`
        flex min-h-[76px] items-center
        rounded-[0.75rem] border px-3
        ${
          selected
            ? "border-[#60CEA7] bg-[#173A34]"
            : "border-[#24464A] bg-[#102126]"
        }
      `}
    >
      <div
        className={`
          flex size-8 shrink-0
          items-center justify-center
          rounded-full
          text-[0.75rem] font-semibold
          ${
            selected
              ? "bg-[#60CEA7] text-[#07100d]"
              : "border border-[#315259] text-text-secondary"
          }
        `}
      >
        {label}
      </div>

      <div className="ml-3">
        <p className="text-[0.8125rem] font-semibold text-text-primary">
          {frequency.toLocaleString()} Hz
        </p>

        <p className="mt-1 text-[0.6875rem] text-text-secondary">
          {description}
        </p>

        {selected && (
          <p className="mt-1 text-[0.6875rem] font-medium text-[#60CEA7]">
            ✓ 가장 비슷해요
          </p>
        )}
      </div>

      <button
        type="button"
        className="
          ml-auto
          text-[0.6875rem]
          font-medium
          text-[#60CEA7]
        "
      >
        ▶ 듣기
      </button>
    </div>
  );
}

export default FrequencyPage;