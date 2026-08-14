import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import arrowLeftIcon from "../../assets/icons/ArrowClockwise-left.svg";
import arrowRightIcon from "../../assets/icons/ArrowClockwise-right.svg";
import playIcon from "../../assets/icons/Play.svg";
import pauseIcon from "../../assets/icons/pause-recovery.svg";
import { pauseRecoveryAudio, playRecoveryAudio, resumeRecoveryAudio, 
  stopRecoveryAudio, } from "../../audio/recoveryAudio";

import { generateTodaySound, updateSoundPlayback, type SoundSession,
} from "../../api/sound";import { getUserUuid } from "../../utils/userStorage";


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
  "기타",
];

function RecoverySessionPage() {
  const navigate = useNavigate();

  const [screen, setScreen] =
    useState<RecoveryScreen>("session");

  const [playing, setPlaying] = useState(false);

    const [
    elapsedSeconds,
    setElapsedSeconds,
    ] = useState(0);

    const [
    hasStarted,
    setHasStarted,
    ] = useState(false);

    const [
    soundSession,
    setSoundSession,
    ] = useState<SoundSession | null>(null);

    const [isSoundLoading, setIsSoundLoading] =
    useState(true);

    const [
    soundError,
    setSoundError,
    ] = useState<string | null>(null);


    const totalSeconds =
    (soundSession
        ?.recommended_duration_minutes ??
        0) * 60;

    const remainingSeconds =
    Math.max(
        0,
        totalSeconds - elapsedSeconds,
    );

    const progress =
    totalSeconds > 0
        ? Math.min(
            100,
            (elapsedSeconds /
            totalSeconds) *
            100,
        )
        : 0;

    const formatTime = (
    seconds: number,
    ) => {
    const minutes = Math.floor(
        seconds / 60,
    );

    const restSeconds =
        seconds % 60;

    return `${String(minutes).padStart(
        2,
        "0",
    )}:${String(restSeconds).padStart(
        2,
        "0",
    )}`;
    };




  const [selectedSymptoms, setSelectedSymptoms] =
    useState<string[]>([]);

    const [selectedFeedback, setSelectedFeedback] =
        useState<string[]>([]);

    useEffect(() => {
    const loadSoundSession = async () => {
        const uuid = getUserUuid();

        if (!uuid) {
        setSoundError(
            "사용자 정보를 찾을 수 없습니다.",
        );
        setIsSoundLoading(false);
        return;
        }

        try {
        setIsSoundLoading(true);
        setSoundError(null);

        const session =
            await generateTodaySound(uuid);

        console.log(
            "오늘의 사운드 생성 결과:",
            session,
        );

        setSoundSession(session);
        } catch (error) {
        console.error(
            "오늘의 사운드 생성 실패",
            error,
        );

        setSoundError(
            error instanceof Error
            ? error.message
            : "사운드를 불러오지 못했습니다.",
        );
        } finally {
        setIsSoundLoading(false);
        }
    };

    void loadSoundSession();
    }, []);

    useEffect(() => {
        if (screen === "safety") {
            window.dispatchEvent(
            new CustomEvent("recovery-header", {
                detail: {
                title: "세션 마치기",
                showBackButton: true,
                showStopButton: false,
                },
            }),
            );

            return;
        }

    window.dispatchEvent(
        new CustomEvent("recovery-header", {
        detail: {
            title: "회복 세션",
            showBackButton: false,
            showStopButton: true,
        },
        }),
    );
    }, [screen]);

    useEffect(() => {
    const handleStop = async () => {
        if (playing && soundSession) {
            const uuid = getUserUuid();

            await pauseRecoveryAudio();

            if (uuid) {
            await updateSoundPlayback(
                uuid,
                soundSession.session_id,
                "pause",
            );
            }

            setPlaying(false);
        }

        setScreen("feedback");
        };

    const handleRecoveryBack = () => {
        if (
        screen === "safety" ||
        screen === "feedback"
        ) {
        setScreen("session");
        return;
        }

        navigate(-1);
    };

    window.addEventListener(
        "recovery-stop",
        handleStop,
    );

    window.addEventListener(
        "recovery-back",
        handleRecoveryBack,
    );

    return () => {
        window.removeEventListener(
        "recovery-stop",
        handleStop,
        );

        window.removeEventListener(
        "recovery-back",
        handleRecoveryBack,
        );
    };
    }, [screen, navigate]);

    useEffect(() => {
    if (
        !playing ||
        totalSeconds <= 0
    ) {
        return;
    }

    const timer = window.setInterval(
        () => {
        setElapsedSeconds(
            (previous) => {
            if (
                previous >=
                totalSeconds - 1
            ) {
                return totalSeconds;
            }

            return previous + 1;
            },
        );
        },
        1000,
    );

    return () => {
        window.clearInterval(timer);
    };
    }, [
    playing,
    totalSeconds,
    ]);

    useEffect(() => {
    if (
        !soundSession ||
        totalSeconds <= 0 ||
        elapsedSeconds <
        totalSeconds
    ) {
        return;
    }

    const completeSession =
        async () => {
        const uuid =
            getUserUuid();

        stopRecoveryAudio();
        setPlaying(false);

        if (!uuid) {
            return;
        }

        try {
            await updateSoundPlayback(
            uuid,
            soundSession.session_id,
            "complete",
            elapsedSeconds,
            "timer",
            );
        } catch (error) {
            console.error(
            "회복 세션 완료 처리 실패",
            error,
            );
        }
        };

    void completeSession();
    }, [
    elapsedSeconds,
    totalSeconds,
    soundSession,
    ]);


    const toggleFeedback = (reason: string) => {
        setSelectedFeedback((previous) =>
            previous.includes(reason)
            ? previous.filter((item) => item !== reason)
            : [...previous, reason],
        );
        };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((previous) =>
      previous.includes(symptom)
        ? previous.filter((item) => item !== symptom)
        : [...previous, symptom],
    );
  };

    const handlePlayToggle =
    async () => {
        if (
        !soundSession ||
        !soundSession.generated_params
        ) {
        return;
        }

        const uuid = getUserUuid();

        if (!uuid) {
        return;
        }

        try {
        if (!hasStarted) {
            await playRecoveryAudio(
            soundSession.generated_params,
            );

            await updateSoundPlayback(
            uuid,
            soundSession.session_id,
            "start",
            );

            setHasStarted(true);
            setPlaying(true);

            return;
        }

        if (playing) {
            await pauseRecoveryAudio();

            await updateSoundPlayback(
            uuid,
            soundSession.session_id,
            "pause",
            );

            setPlaying(false);

            return;
        }

        await resumeRecoveryAudio();

        await updateSoundPlayback(
            uuid,
            soundSession.session_id,
            "resume",
        );

        setPlaying(true);
        } catch (error) {
        console.error(
            "회복 세션 재생 상태 변경 실패",
            error,
        );
        }
    };

    useEffect(() => {
    return () => {
        stopRecoveryAudio();
    };
    }, []);

  const handleChangeSound = () => {
    if (selectedFeedback.length === 0) {
        return;
    }

    // TODO:
    // selectedFeedback을 백엔드에 전달
    // 백엔드가 불편 사유를 바탕으로 새로운 사운드를 결정
    // 결정된 사운드를 받아 회복 세션에 적용

        setSelectedFeedback([]);
        setPlaying(false);
        setScreen("session");
    };

  /*
   * 1. 회복 세션
   */
  if (screen === "session" || screen === "feedback") {
    return (
        <div className="hide-scrollbar relative flex min-h-full 
        flex-col overflow-y-auto px-5 pb-6">


        {/* 임시*/}
        {isSoundLoading && (
        <p className="mt-4 text-center text-[12px] text-[#809EA8]">
            사운드를 준비하고 있어요.
        </p>
        )}

        {soundError && (
        <p className="mt-4 text-center text-[12px] text-[#F09292]">
            {soundError}
        </p>
        )}


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
            {formatTime(
                remainingSeconds,
            )}
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
        {soundSession?.generated_params
            ?.frequency_bands?.[0]
            ?.center_hz
            ? `개인화 노이즈 ${
                Math.round(
                soundSession.generated_params
                    .frequency_bands[0].center_hz,
                )
            }Hz`
            : "사운드 준비 중"}
        </p>

        {/* 진행바 */}
        <div className="mt-5">
          <div className="h-[4px] w-full overflow-hidden rounded-full bg-[#294A4F]">
            <div
                className="
                    h-full
                    rounded-full
                    bg-[#60CEA7]
                "
                style={{
                    width: `${progress}%`,
                }}
                />
          </div>

          <div
            className="
              mt-2 flex justify-between
              text-[0.5625rem]
              text-text-secondary
            "
          >
            <span>
            {formatTime(
                elapsedSeconds,
            )}
            </span>

            <span>
            {formatTime(
                totalSeconds,
            )}
            </span>
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
            onClick={handlePlayToggle}
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
                font-sans
                text-[22px]
                font-bold
                leading-normal
                text-[#F0F7FA]
            "
            >
                소리가 불편했나요?
            </h2>

            <p
            className="
                mt-3
                font-sans
                text-[13px]
                font-normal
                leading-normal
                text-[#809EA8]
            "
            >
            느낌을 골라주면 지금 세션과 다음 추천을 조정할게요.
            </p>

            <div className="mt-6 flex flex-col gap-2">
            {/* 첫 번째 줄 */}
            <div className="flex gap-2">
                {FEEDBACK_REASONS.slice(0, 2).map((reason) => {
                const selected =
                    selectedFeedback.includes(reason);

                return (
                    <button
                    key={reason}
                    type="button"
                    onClick={() => toggleFeedback(reason)}
                    className={`
                    inline-flex
                    items-center
                    justify-center
                    rounded-[99px]
                    border
                    px-[20px]
                    py-[10px]
                    font-sans
                    text-[13px]
                    font-normal
                    leading-normal
                    whitespace-nowrap
                    ${
                        selected
                        ? "border-[#38A887] bg-[#154638] text-[#61DBB8]"
                        : "border-[#24464E] bg-[#112126] text-[#809EA8]"
                    }
                    `}
                    >
                    {reason}
                    </button>
                );
                })}
            </div>

            {/* 두 번째 줄 */}
            <div className="flex gap-2">
                {FEEDBACK_REASONS.slice(2).map((reason) => {
                const selected =
                    selectedFeedback.includes(reason);

                return (
                    <button
                    key={reason}
                    type="button"
                    onClick={() => toggleFeedback(reason)}
                    className={`
                    inline-flex
                    items-center
                    justify-center
                    rounded-[99px]
                    border
                    px-[20px]
                    py-[10px]
                    font-sans
                    text-[13px]
                    font-normal
                    leading-normal
                    whitespace-nowrap
                    ${
                        selected
                        ? "border-[#38A887] bg-[#154638] text-[#61DBB8]"
                        : "border-[#24464E] bg-[#112126] text-[#809EA8]"
                    }
                    `}
                    >
                    {reason}
                    </button>
                );
                })}
            </div>
            </div>

            <div
            className="
                mt-7
                flex
                w-full
                flex-col
                items-start
                justify-center
                gap-[13px]
                rounded-[18px]
                border border-[#24464E]
                bg-[#0F2B2C]
                px-[16px]
                pt-[24px]
                pb-[25px]
            "
            >
            <p
                className="
                font-sans
                text-[13px]
                font-bold
                leading-normal
                text-[#61DBB8]
                "
            >
                지금 바로 바꿀 수 있어요.
            </p>

            <p
                className="
                font-sans
                text-[12px]
                font-normal
                leading-normal
                text-[#F0F7FA]
                "
            >
                오늘 상태는 유지하고 불편 요인만 제외해 다시 준비해요.
            </p>
            </div>

            <button
                type="button"
                onClick={handleChangeSound}
                disabled={selectedFeedback.length === 0}
                className={`
                mt-7
                h-14 w-full
                rounded-[12px]
                text-[14px]
                font-bold
                ${
                    selectedFeedback.length > 0
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
 * 2. 세션 마치기
 */
    if (screen === "safety") {
    const handleSafetyConfirm = () => {
        if (selectedSymptoms.length > 0) {
        console.log(
            "선택된 증상:",
            selectedSymptoms,
        );
        }

        navigate("/");
    };

    return (
        <div className="flex min-h-dvh flex-col px-5 pb-6">

        {/* 내용 */}
        <section className="pt-10">
            <h2
            className="
                font-sans
                text-[27px]
                font-bold
                leading-normal
                text-[#F0F7FA]
            "
            >
            더 불편하거나
            <br />
            이상하게 느껴졌나요?
            </h2>

            <p
            className="
                mt-5
                font-sans
                text-[13px]
                font-normal
                leading-normal
                text-[#809EA8]
            "
            >
            느낀 증상을 알려주면 다음 추천에서 제외할게요.
            </p>

            <p
            className="
                mt-10
                font-sans
                text-[15px]
                font-bold
                leading-normal
                text-[#F0F7FA]
            "
            >
            어떤 느낌이었나요?
            </p>

            {/* 증상 선택 */}
            <div className="mt-4 flex flex-col gap-2">
            {/* 첫 번째 줄 */}
            <div className="flex gap-2">
                {SYMPTOMS.slice(0, 3).map((symptom) => {
                const selected = selectedSymptoms.includes(symptom);

                return (
                    <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    className={`
                        inline-flex
                        items-center
                        justify-center
                        rounded-[99px]
                        border
                        px-[20px]
                        py-[10px]
                        font-sans
                        text-[12px]
                        font-medium
                        leading-normal
                        whitespace-nowrap
                        transition-colors
                        ${
                        selected
                            ? "border-[#38A887] bg-[#154638] text-[#61DBB8]"
                            : "border-[#24464E] bg-[#112126] text-[#809EA8]"
                        }
                    `}
                    >
                    {symptom}
                    </button>
                );
                })}
            </div>

            {/* 두 번째 줄 */}
            <div className="flex gap-2">
                {SYMPTOMS.slice(3).map((symptom) => {
                    const selected = selectedSymptoms.includes(symptom);

                    return (
                    <button
                        key={symptom}
                        type="button"
                        onClick={() => toggleSymptom(symptom)}
                        className={`
                        inline-flex
                        items-center
                        justify-center
                        rounded-[99px]
                        border
                        px-[20px]
                        py-[10px]
                        font-sans
                        text-[12px]
                        font-medium
                        leading-normal
                        whitespace-nowrap
                        transition-colors
                        ${
                            selected
                            ? "border-[#38A887] bg-[#154638] text-[#61DBB8]"
                            : "border-[#24464E] bg-[#112126] text-[#809EA8]"
                        }
                        `}
                    >
                        {symptom}
                    </button>
                    );
                })}
                </div>

            </div>

        </section>

        {/* 확인 버튼 */}
        <div
        className="
            sticky
            bottom-0
            mt-auto
            bg-[#07191D]
            pt-4
            pb-6
        "
        >
        <button
            type="button"
            onClick={handleSafetyConfirm}
            className="
            h-14
            w-full
            rounded-[12px]
            bg-[#60CEA7]
            font-sans
            text-[14px]
            font-bold
            text-[#07100D]
            "
        >
            확인
        </button>
        </div>
        </div>
    );
    }


}

export default RecoverySessionPage;