import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FrequencyCard from "../../components/frequency/FrequencyCard";
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

function FrequencyPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const [selectedOptionId, setSelectedOptionId] =
    useState<FrequencyOptionId | null>(null);

  const [playingOptionId, setPlayingOptionId] =
    useState<FrequencyOptionId | null>(null);

  const [, setAnswers] = useState<FrequencyAnswer[]>([]);

  const [errorMessage, setErrorMessage] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = frequencyQuestions[currentStep];
  const totalSteps = frequencyQuestions.length;

  const progressWidth = ((currentStep + 1) / totalSteps) * 100;

  const handleSelect = (optionId: FrequencyOptionId) => {
    setSelectedOptionId(optionId);
    setErrorMessage("");
  };

  const handlePlay = (
    optionId: FrequencyOptionId,
    frequency: number,
  ) => {
    // TODO: 실제 음원 재생 로직 연결
    console.log(`${frequency}Hz 임시 재생 버튼 클릭`);

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

    if (currentStep === totalSteps - 1) {
      setIsCompleted(true);
      setPlayingOptionId(null);
      return;
    }

    setCurrentStep((previousStep) => previousStep + 1);
    setSelectedOptionId(null);
    setPlayingOptionId(null);
    setErrorMessage("");
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setSelectedOptionId(null);
    setPlayingOptionId(null);
    setAnswers([]);
    setErrorMessage("");
    setIsCompleted(false);
  };

  if (isCompleted) {
    return (
      <div className="flex min-h-full flex-col px-6 pb-6">
        <section className="pt-12">
          <h1 className="text-[1.25rem] leading-[1.75rem] font-bold">
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

          <div className="mt-5 rounded-[1rem] border border-[#1d5b49] bg-[#102821] p-4">
            <div className="flex h-[7rem] items-center justify-center gap-1">
              {[
                32, 44, 56, 46, 38, 52, 60, 44, 34, 50, 58, 42, 54,
              ].map((height, index) => (
                <span
                  key={index}
                  className="w-1 rounded-full bg-primary"
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
            onClick={() => navigate("/nature-sound")}
            className="
              h-14 w-full rounded-[0.75rem]
              bg-[#60CEA7]
              text-[0.875rem] font-bold text-[#07100d]
            "
          >
            시작하기
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="
              mt-3 h-11 w-full
              text-[0.8125rem] font-medium text-text-tertiary
            "
          >
            다시 측정하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-6 pb-6">
      {/* 헤더 아래 여백 + 진행바 */}
      <div className="pt-5">
        <div
          className="
            h-[3px] w-full
            overflow-hidden rounded-full
            bg-[#2D4548]
          "
        >
          <ProgressBar width={progressWidth} />
        </div>
      </div>

      {/* 질문 영역 */}
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

        {/* A / B 카드 */}
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

        {/* 선택 없이 확인 눌렀을 때 */}
        {errorMessage && (
          <p className="mt-3 text-[0.75rem] text-[#F09292]">
            {errorMessage}
          </p>
        )}
      </section>

      {/* 하단 확인 버튼 */}
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

interface ProgressBarProps {
  width: number;
}

function ProgressBar({ width }: ProgressBarProps) {
  return (
    <div
      className="
        h-full rounded-full
        bg-[#60CEA7]
        transition-[width] duration-300
      "
      style={{ width: `${width}%` }}
    />
  );
}

export default FrequencyPage;