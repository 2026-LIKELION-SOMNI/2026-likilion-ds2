import { useState } from "react";
import { useNavigate } from "react-router-dom";
import arrowLeftIcon from "../../assets/icons/ArrowClockwise-left.svg";
import arrowRightIcon from "../../assets/icons/ArrowClockwise-right.svg";
import playIcon from "../../assets/icons/Play.svg";
import pauseIcon from "../../assets/icons/pause-recovery.svg";

type RecoveryScreen =
  | "session"
  | "safety"
  | "feedback";

const SYMPTOMS = [
  "이명이 더 커짐",
  "귀가 먹먹함",
  "두통",
  "어지러움",
  "통증",
  "불안해짐",
];

const FEEDBACK_REASONS = [
  "너무 날카로워요",
  "이명과 너무 비슷해요",
  "변화가 너무 많아요",
  "배경음이 불편해요",
];

function RecoverySessionPage() {
  const navigate = useNavigate();

  const [screen, setScreen] =
    useState<RecoveryScreen>("session");

  const [playing, setPlaying] = useState(true);

  const [selectedSymptoms, setSelectedSymptoms] =
    useState<string[]>([]);

  const [selectedFeedback, setSelectedFeedback] =
    useState<string | null>(null);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((previous) =>
      previous.includes(symptom)
        ? previous.filter((item) => item !== symptom)
        : [...previous, symptom],
    );
  };

  const handleBack = () => {
    if (screen === "safety") {
      setScreen("session");
      return;
    }

    if (screen === "feedback") {
      setScreen("session");
      return;
    }

    navigate(-1);
  };
  const handleChangeSound = () => {
    if (!selectedFeedback) {
        return;
    }

    // TODO:
    // selectedFeedback을 백엔드에 전달
    // 백엔드가 불편 사유를 바탕으로 새로운 사운드를 결정
    // 결정된 사운드를 받아 회복 세션에 적용

    setSelectedFeedback(null);
    setPlaying(true);
    setScreen("session");
    };

  /*
   * 1. 회복 세션
   */
  if (screen === "session" || screen === "feedback") {
    return (
        <div className="relative flex min-h-full flex-col px-5 pb-6">
        {/* 자체 헤더 */}
        <div className="relative flex h-16 shrink-0 items-center justify-center">
        <h1
            className="
            text-center
            font-sans
            text-[20px]
            leading-[23px]
            font-bold
            text-[#ECF3F2]
            "
        >
            회복 세션
        </h1>

        <button
            type="button"
            onClick={() => setScreen("feedback")}
            className="
            absolute
            right-0
            font-sans
            text-[16px]
            leading-[18px]
            font-medium
            text-[#87CBE6]
            "
        >
            중단
        </button>
        </div>

        {/* 원형 그래픽 */}
        <div className="mt-12 flex justify-center">
        <div
            className="
            relative flex
            h-[300px] w-[358px]
            max-w-full
            items-center justify-center
            overflow-hidden
            rounded-[34px]
            bg-[#071B22]
            "
        >
            <div
            className="
                absolute
                h-[270px] w-[270px]
                rounded-full
                bg-[#2EA694]/35
                blur-[42px]
            "
            />

            <div
            className="
                relative flex
                h-[210px] w-[210px]
                items-center justify-center
                rounded-full
                border border-[#24665D]
            "
            >
            <div
                className="
                flex h-[176px] w-[176px]
                items-center justify-center
                rounded-full
                border border-[#287469]
                "
            >
                <div
                className="
                    flex h-[142px] w-[142px]
                    items-center justify-center
                    rounded-full
                    border border-[#31887A]
                "
                >
                <div
                    className="
                    flex h-[108px] w-[108px]
                    items-center justify-center
                    rounded-full
                    border border-[#3C9D8D]
                    "
                >
                    <div
                    className="
                        h-[82px] w-[82px]
                        rounded-full
                        bg-[#48B9A5]
                        shadow-[0_0_60px_20px_rgba(72,185,165,0.40)]
                    "
                    />  
                </div>
                </div>
            </div>
            </div>
        </div>
        </div>

        {/* 시간 */}
        <div className="mt-8 text-center">
          <p
            className="
              text-[2rem]
              leading-none
              font-bold
              text-text-primary
            "
          >
            08:42
          </p>

          <p className="mt-3 text-[0.6875rem] text-text-secondary">
            천천히 호흡하세요.
          </p>
        </div>

        {/* 현재 사운드 */}
        <p
          className="
            mt-7 text-center
            text-[0.6875rem]
            font-semibold
            text-text-primary
          "
        >
          빗소리 + 853Hz 노이즈
        </p>

        {/* 진행바 */}
        <div className="mt-5">
          <div className="h-[4px] w-full overflow-hidden rounded-full bg-[#294A4F]">
            <div className="h-full w-[58%] rounded-full bg-[#60CEA7]" />
          </div>

          <div
            className="
              mt-2 flex justify-between
              text-[0.5625rem]
              text-text-secondary
            "
          >
            <span>06:18</span>
            <span>15:00</span>
          </div>
        </div>

        {/* 재생 컨트롤 */}
        <div className="mt-8 flex w-full items-center justify-center">
        {/* 15초 이전 */}
        <button
            type="button"
            aria-label="15초 이전"
            className="
            flex items-center
            gap-[6px]
            text-[#92A8AB]
            "
        >
            <span
            className="
                font-sans
                text-[16px]
                leading-none
                font-medium
            "
            >
            15
            </span>

            <img
            src={arrowLeftIcon}
            alt=""
            aria-hidden="true"
            className="h-6 w-6"
            />
        </button>

        {/* 재생 / 일시정지 */}
        <button
            type="button"
            aria-label={playing ? "일시정지" : "재생"}
            onClick={() =>
            setPlaying((previous) => !previous)
            }
            className="
            mx-[42px]
            flex h-[66px] w-[66px]
            shrink-0
            items-center justify-center
            rounded-full
            bg-[#60CEA7]
            "
        >
            <img
            src={playing ? pauseIcon : playIcon}
            alt=""
            aria-hidden="true"
            className="h-[30px] w-[30px]"
            />
        </button>

        {/* 15초 이후 */}
        <button
            type="button"
            aria-label="15초 이후"
            className="
            flex items-center
            gap-[6px]
            text-[#92A8AB]
            "
        >
            <img
            src={arrowRightIcon}
            alt=""
            aria-hidden="true"
            className="h-6 w-6"
            />

            <span
            className="
                font-sans
                text-[16px]
                leading-none
                font-medium
            "
            >
            15
            </span>
        </button>
        </div>

        {screen === "feedback" && (
        <>
            {/* 뒤 회복 세션 어둡게 처리 */}
            <div
            className="
                absolute inset-0
                z-40
                bg-black/35
            "
            />

            {/* 하단 피드백 모달 */}
            <section
            className="
                absolute
                bottom-0 left-0 right-0
                z-50
                flex flex-col
                rounded-t-[22px]
                border-t border-[#24464A]
                bg-[#102126]
                px-5
                pb-6
                pt-6
            "
            >
            <h2
                className="
                text-[20px]
                leading-[28px]
                font-bold
                text-[#ECF3F2]
                "
            >
                소리가 불편했나요?
            </h2>

            <p
                className="
                mt-3
                text-[11px]
                text-text-secondary
                "
            >
                느낌을 골라주면 지금 세션과 다음 추천을 조정할게요.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2">
                {FEEDBACK_REASONS.map((reason) => {
                const selected =
                    selectedFeedback === reason;

                return (
                    <button
                    key={reason}
                    type="button"
                    onClick={() =>
                        setSelectedFeedback(reason)
                    }
                    className={`
                        h-[36px]
                        rounded-full
                        border
                        text-[11px]
                        ${
                        selected
                            ? "border-[#38A887] bg-[#154638] text-[#60CEA7]"
                            : "border-[#294A4F] bg-[#102126] text-text-secondary"
                        }
                    `}
                    >
                    {reason}
                    </button>
                );
                })}
            </div>

            <div
                className="
                mt-7
                rounded-[12px]
                border border-[#24665D]
                bg-[#10332F]
                p-4
                "
            >
                <p
                className="
                    text-[12px]
                    font-bold
                    text-[#60CEA7]
                "
                >
                지금 바로 바꿀 수 있어요.
                </p>

                <p
                className="
                    mt-2
                    text-[10px]
                    leading-5
                    text-text-secondary
                "
                >
                오늘 상태는 유지하고 불편 요인만 제외해 다시 준비해요.
                </p>
            </div>

            <button
                type="button"
                onClick={handleChangeSound}
                disabled={!selectedFeedback}
                className={`
                mt-7
                h-14 w-full
                rounded-[12px]
                text-[14px]
                font-bold
                ${
                    selectedFeedback
                    ? "bg-[#60CEA7] text-[#07100D]"
                    : "bg-[#214750] text-[#0D1719]"
                }
                `}
            >
                다른 사운드로 바꾸기
            </button>

            <button
                type="button"
                onClick={() => setScreen("safety")}
                className="
                mt-5
                w-full
                text-center
                text-[12px]
                font-medium
                text-[#87CBE6]
                "
            >
                오늘은 세션 마치기
            </button>
            </section>
        </>
        )}
      </div>
    );
  }

  /*
   * 2. 안전 확인
   */
  if (screen === "safety") {
    const hasSymptoms = selectedSymptoms.length > 0;

    return (
      <div className="flex min-h-full flex-col px-5 pb-6">
        {/* 헤더 */}
        <div className="relative flex h-16 shrink-0 items-center justify-center">
          <button
            type="button"
            onClick={handleBack}
            aria-label="이전 화면"
            className="
              absolute left-[-8px]
              flex h-10 w-10
              items-center justify-center
              text-[1.8rem]
              font-light
              text-text-primary
            "
          >
            ‹
          </button>

          <h1 className="text-[1rem] font-bold text-text-primary">
            안전 확인
          </h1>
        </div>

        <section className="pt-10">
          <h2
            className="
              text-[1.25rem]
              leading-[1.75rem]
              font-bold
              text-text-primary
            "
          >
            더 불편하거나
            <br />
            이상하게 느껴졌나요?
          </h2>

          <p className="mt-4 text-[0.6875rem] text-text-secondary">
            느낀 증상을 알려주면 다음 추천에서 제외할게요.
          </p>

          <p
            className="
              mt-9
              text-[0.75rem]
              font-semibold
              text-text-primary
            "
          >
            어떤 느낌이었나요?
          </p>

          {/* 증상 선택 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {SYMPTOMS.map((symptom) => {
              const selected =
                selectedSymptoms.includes(symptom);

              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`
                    h-[32px]
                    rounded-full
                    border
                    px-4
                    text-[0.6875rem]
                    ${
                      selected
                        ? "border-[#38A887] bg-[#154638] text-[#60CEA7]"
                        : "border-[#294A4F] bg-[#102126] text-text-secondary"
                    }
                  `}
                >
                  {symptom}
                </button>
              );
            })}
          </div>

          {/* 의료 안내 */}
          <div
            className="
              mt-8
              rounded-[14px]
              border border-[#744343]
              bg-[#382526]
              p-4
            "
          >
            <p
              className="
                text-[0.75rem]
                font-bold
                text-[#F58C8C]
              "
            >
              이런 증상은 진료가 우선이에요.
            </p>

            <p
              className="
                mt-3
                text-[0.625rem]
                leading-[1.125rem]
                text-[#E7CACA]
              "
            >
              갑작스러운 한쪽 청력 저하, 심한 어지러움이나
              통증이 있으면 사용을 멈추고 의료기관에
              문의하세요.
            </p>

            <button
              type="button"
              className="
                mt-4
                text-[0.625rem]
                font-semibold
                text-[#F58C8C]
              "
            >
              의료기관 찾아보기 〉
            </button>
          </div>
        </section>

        {/* 하단 버튼 */}
        <div className="mt-auto">
          <button
            type="button"
            disabled={!hasSymptoms}
            className={`
              h-14 w-full
              rounded-[12px]
              text-[0.875rem]
              font-bold
              ${
                hasSymptoms
                  ? "bg-[#60CEA7] text-[#07100D]"
                  : "bg-[#214750] text-[#0D1719]"
              }
            `}
          >
            호흡 가이드로 전환하기
          </button>

          <button
            type="button"
            onClick={() => setScreen("feedback")}
            className="
              mt-5 w-full
              text-center
              text-[0.75rem]
              font-medium
              text-[#87CBE6]
            "
          >
            오늘은 세션 마치기
          </button>
        </div>
      </div>
    );
  }


}

export default RecoverySessionPage;