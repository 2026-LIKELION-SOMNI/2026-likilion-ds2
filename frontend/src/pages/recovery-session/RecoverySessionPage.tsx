import { useEffect, useRef, useState, } from "react";
import { useNavigate } from "react-router-dom";

import playIcon from "../../assets/icons/Play.svg";
import pauseIcon from "../../assets/icons/pause-recovery.svg";
import recoveryEndRings from "../../assets/icons/recovery-end-rings.svg";
import recoverySessionVisual from "../../assets/icons/recovery-session-visual.svg";

import { pauseRecoveryAudio, playRecoveryAudio, resumeRecoveryAudio,
  stopRecoveryAudio, } from "../../audio/recoveryAudio";

import {
  generateTodaySound,
  getSoundSession,
  getComfortableSounds,
  switchToComfortableSound,
  regenerateSound,
  reportSoundDiscomfort,
  updateSoundPlayback,
  useFallbackSound as requestFallbackSound,
  type ComfortableSoundItem,
  type DiscomfortReason,
  type SoundSession,
} from "../../api/sound";

import { getUserUuid, } from "../../utils/userStorage";
import previousSoundEmptyIcon from "../../assets/icons/my-sound-empty.svg";

type RecoveryScreen =
  | "initial-loading"
  | "initial-error"
  | "session"
  | "feedback"
  | "change-select"
  | "previous-sounds"
  | "regenerating"
  | "change-ready"
  | "end-confirm"
  | "end-complete";

type ChangeSoundOption =
  | "regenerate"
  | "previous";



const FEEDBACK_REASONS = [
  "너무 날카로워요",
  "이명과 너무 비슷해요",
  "변화가 너무 많아요",
  "배경음이 불편해요",
  "기타",
];

const FEEDBACK_REASON_MAP: Record<
  string,
  DiscomfortReason
> = {
  "너무 날카로워요": "sharp",
  "이명과 너무 비슷해요":
    "too_similar",
  "변화가 너무 많아요":
    "too_much_variation",
  "배경음이 불편해요":
    "dislike_background",
};



// const PREVIOUS_COMFORT_SOUNDS: PreviousComfortSound[] = [
//   // 백엔드 연동 전 테스트용.
//   // 아래 두 개를 주석 처리하면 "아직 다시 들을 사운드가 없어요." 화면이 뜸.

//   {
//     id: 1,
//     title: "잔잔한 빗소리 + 핑크노이즈",
//     date: "8월 12일",
//     durationMinutes: 35,
//   },
//   {
//     id: 2,
//     title: "팬 · 공기음 + 핑크노이즈",
//     date: "8월 1일",
//     durationMinutes: 35,
//   },
// ];

function RecoverySessionPage() {
  const navigate = useNavigate();

  const hasLoadedSoundRef =
    useRef(false);

  const [
    changeSoundOption,
    setChangeSoundOption,
  ] = useState<ChangeSoundOption | null>(
    null,
  );

  const [
    selectedPreviousSoundId,
    setSelectedPreviousSoundId,
  ] = useState<string| null>(
    null,
  );
  const [
    previousSounds,
    setPreviousSounds,
  ] =
    useState<ComfortableSoundItem[]>(
      [],
    );

  const [screen, setScreen] =
    useState<RecoveryScreen>(
      "initial-loading",
    );

  const [playing, setPlaying] =
    useState(false);

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
  ] =
    useState<SoundSession | null>(
      null,
    );

  const [
    isSoundLoading,
    setIsSoundLoading,
  ] = useState(true);

  const [
    soundError,
    setSoundError,
  ] = useState<string | null>(
    null,
  );

  const [
    selectedFeedback,
    setSelectedFeedback,
  ] = useState<string[]>([]);

  /*
   * =========================
   * 시간 계산
   * =========================
   */
  const activeSoundParams =
    soundSession?.final_params ??
    soundSession?.generated_params ??
    null;

  const getRecoverySoundLabel = () => {
    if (!activeSoundParams) {
      return "사운드 준비 중";
    }

    const centerHz =
      activeSoundParams
        .frequency_bands?.[0]
        ?.center_hz;

    const backgroundSource =
      activeSoundParams.sources?.find(
        (source) =>
          source.role === "ambient" ||
          source.type === "background",
      );

  const backgroundLabelMap: Record<
    string,
    string
  > = {
    rain: "빗소리",
    stream: "시냇물 소리",
    ocean: "파도",
    air: "공기음",
  };

    const backgroundLabel =
      backgroundSource?.asset_tag
        ? backgroundLabelMap[
            backgroundSource.asset_tag
          ]
        : null;

    if (
      backgroundLabel &&
      centerHz
    ) {
      return `${backgroundLabel} + ${Math.round(
        centerHz,
      )}Hz 노이즈`;
    }

    if (backgroundLabel) {
      return backgroundLabel;
    }

    if (centerHz) {
      return `개인화 노이즈 ${Math.round(
        centerHz,
      )}Hz`;
    }

    return "개인화 사운드";
  };

  const totalSeconds =
    (soundSession
      ?.recommended_duration_minutes ??
      0) * 60;

  const remainingSeconds =
    Math.max(
      0,
      totalSeconds -
        elapsedSeconds,
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

    return `${String(
      minutes,
    ).padStart(
      2,
      "0",
    )}:${String(
      restSeconds,
    ).padStart(2, "0")}`;
  };

  /*
   * =========================
   * 오늘의 사운드 생성
   * =========================
   */

  useEffect(() => {
    if (
      hasLoadedSoundRef.current
    ) {
      return;
    }

    hasLoadedSoundRef.current =
      true;

    const loadSoundSession =
      async () => {
        const uuid =
          getUserUuid();

        if (!uuid) {
          setSoundError(
            "사용자 정보를 찾을 수 없습니다.",
          );

          setIsSoundLoading(
            false,
          );

          return;
        }

        try {
          setIsSoundLoading(
            true,
          );

          setSoundError(null);

          const existingSessionId =
            sessionStorage.getItem(
              "somni-recovery-existing-session-id",
            );

            const selectedBackground =
              sessionStorage.getItem(
                "somni-selected-nature-sound",
              ) as
                | "rain"
                | "stream"
                | "ocean"
                | "air"
                | null;

            const session =
              existingSessionId
                ? await getSoundSession(
                    uuid,
                    existingSessionId,
                  )
                : await generateTodaySound(
                    uuid,
                    false,
                    selectedBackground ?? undefined,
                  );

          if (existingSessionId) {
            sessionStorage.removeItem(
              "somni-recovery-existing-session-id",
            );
          }

          console.log(
            "오늘의 사운드 생성 결과:",
            session,
          );

          setSoundSession(session);

          sessionStorage.setItem(
            "somni-current-sound-session-id",
            session.session_id,
          );

          
        if (
          session.status ===
          "generation_failed"
        ) {
          setScreen(
            "initial-error",
          );

          return;
        }

        localStorage.removeItem(
          "somni-data-deleted",
        );

        setScreen("session");
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
          setScreen(
            "initial-error",
          );
        } finally {
          setIsSoundLoading(
            false,
          );
        }
      };

    void loadSoundSession();
  }, []);

  /*
   * =========================
   * 공통 Header 상태
   * =========================
   */

  useEffect(() => {
    /*
    * 최초 사운드 생성 중 / 생성 실패
    */
    if (
      screen === "initial-loading" ||
      screen === "initial-error"
    ) {
      window.dispatchEvent(
        new CustomEvent(
          "recovery-header",
          {
            detail: {
              title: "오늘의 루틴",
              showBackButton: true,
              showStopButton: false,
            },
          },
        ),
      );

      return;
    }

    /*
    * 다른 사운드 재생성 중 /
    * 새 사운드 준비 완료
    */
    if (
      screen === "change-select" ||
      screen === "previous-sounds" ||
      screen === "regenerating" ||
      screen === "change-ready"
    ) {
      window.dispatchEvent(
        new CustomEvent(
          "recovery-header",
          {
            detail: {
              title: "다른 사운드로 바꾸기",
              showBackButton: true,
              showStopButton: false,
            },
          },
        ),
      );

      return;
    }

    /*
    * 종료 확인
    */
    if (screen === "end-confirm") {
      window.dispatchEvent(
        new CustomEvent(
          "recovery-header",
          {
            detail: {
              title: "종료",
              showBackButton: true,
              showStopButton: false,
            },
          },
        ),
      );

      return;
    }

    /*
    * 종료 완료
    */
    if (screen === "end-complete") {
      window.dispatchEvent(
        new CustomEvent(
          "recovery-header",
          {
            detail: {
              title: "종료",
              showBackButton: false,
              showStopButton: false,
            },
          },
        ),
      );

      return;
    }
    /*
    * 기본 회복 세션 /
    * 불편 신고 모달
    */
    window.dispatchEvent(
      new CustomEvent(
        "recovery-header",
        {
          detail: {
            title: "회복 세션",
            showBackButton: false,
            showStopButton: true,
          },
        },
      ),
    );
  }, [screen]);

  /*
   * =========================
   * Header 중단 / 뒤로가기
   * =========================
   */

  useEffect(() => {
    const handleStop =
      async () => {
        if (
          playing &&
          soundSession
        ) {
          const uuid =
            getUserUuid();

          try {
            await pauseRecoveryAudio();

            if (uuid) {
              await updateSoundPlayback(
                uuid,
                soundSession.session_id,
                "pause",
              );
            }

            setPlaying(false);
          } catch (error) {
            console.error(
              "회복 세션 중단 처리 실패",
              error,
            );
          }
        }

        setScreen("feedback");
      };

  const handleRecoveryBack =
    () => {
      /*
      * 불편 신고 모달
      */
      if (screen === "feedback") {
        setScreen("session");
        return;
      }

      /*
      * 새 사운드 생성 중 /
      * 새 사운드 준비 완료
      * → 기존 회복 세션
      */
      if (screen === "previous-sounds") {
        setSelectedPreviousSoundId(null);
        setScreen("change-select");
        return;
      }

      if (
        screen === "change-select" ||
        screen === "regenerating" ||
        screen === "change-ready"
      ) {
        setScreen("session");
        return;
      }

      /*
      * 종료 확인
      * → 회복 세션
      */
      if (
        screen === "end-confirm"
      ) {
        setScreen("session");
        return;
      }

      /*
      * 최초 생성 중 / 실패 화면
      * → 이전 페이지
      */
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
  }, [
    screen,
    navigate,
    playing,
    soundSession,
  ]);

  /*
   * =========================
   * 재생 중 타이머
   * =========================
   */

  useEffect(() => {
    if (
      !playing ||
      totalSeconds <= 0
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setElapsedSeconds(
            (previous) => {
              if (
                previous >=
                totalSeconds - 1
              ) {
                return totalSeconds;
              }

              return (
                previous + 1
              );
            },
          );
        },
        1000,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [
    playing,
    totalSeconds,
  ]);

  /*
   * =========================
   * 타이머 자동 종료
   * =========================
   */

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
          setScreen(
            "end-complete",
          );
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
        } finally {
          setScreen(
            "end-complete",
          );
        }
      };

    void completeSession();
  }, [
    elapsedSeconds,
    totalSeconds,
    soundSession,
  ]);

  /*
   * 페이지 이탈 시 오디오 종료
   */
  useEffect(() => {
    return () => {
      stopRecoveryAudio();
    };
  }, []);

  /*
   * =========================
   * 재생 / 일시정지
   * =========================
   */

  const handlePlayToggle =
    async () => {
      if (
        !soundSession ||
        !activeSoundParams
      ) {
        return;
      }

      const uuid =
        getUserUuid();

      if (!uuid) {
        return;
      }

      try {
        /*
         * 최초 시작
         */
        if (!hasStarted) {
          await playRecoveryAudio(
            activeSoundParams,
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

        /*
         * 일시정지
         */
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

        /*
         * 재개
         */
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

  /*
   * =========================
   * 불편 사유 선택
   * =========================
   */

  const toggleFeedback = (
    reason: string,
  ) => {
    setSelectedFeedback(
      (previous) =>
        previous.includes(
          reason,
        )
          ? previous.filter(
              (item) =>
                item !== reason,
            )
          : [
              ...previous,
              reason,
            ],
    );
  };

  /*
   * =========================
   * 다른 사운드로 바꾸기
   * =========================
   */

  const handleChangeSound =
    async () => {
      if (
        selectedFeedback.length ===
          0 ||
        !soundSession
      ) {
        return;
      }

      const uuid =
        getUserUuid();

      if (!uuid) {
        return;
      }

      if (
        selectedFeedback.includes(
          "기타",
        )
      ) {
        setSoundError(
          "'기타' 불편 사유는 아직 지원되지 않습니다.",
        );

        return;
      }

      const reasons =
        selectedFeedback.map(
          (reason) =>
            FEEDBACK_REASON_MAP[
              reason
            ],
        );

      try {
        setIsSoundLoading(
          true,
        );
      setScreen(
        "regenerating",
      );

        setSoundError(null);

        stopRecoveryAudio();

        await reportSoundDiscomfort(
          uuid,
          soundSession.session_id,
          reasons,
          "regenerate",
        );

        const newSession =
          await regenerateSound(
            uuid,
            soundSession.session_id,
          );

        console.log(
          "재생성된 사운드:",
          newSession,
        );

        sessionStorage.setItem(
          "somni-current-sound-session-id",
          newSession.session_id,
        );

        localStorage.removeItem(
          "somni-data-deleted",
        );
        setSoundSession(
          newSession,
        );

        setElapsedSeconds(0);
        setHasStarted(false);
        setPlaying(false);

        setScreen(
          "change-ready",
        );
      } catch (error) {
        console.error(
          "사운드 변경 실패",
          error,
        );

        setSoundError(
          error instanceof Error
            ? error.message
            : "다른 사운드를 준비하지 못했습니다.",
        );
      } finally {
        setIsSoundLoading(
          false,
        );
      }
    };

  const handleContinueWithNewSound =
    async () => {
      if (
        !soundSession ||
        !activeSoundParams
      ) {
        return;
      }

      const uuid =
        getUserUuid();

      if (!uuid) {
        return;
      }

      try {
        await playRecoveryAudio(
          activeSoundParams,
        );

        await updateSoundPlayback(
          uuid,
          soundSession.session_id,
          "start",
        );

        setElapsedSeconds(0);
        setHasStarted(true);
        setPlaying(true);

        setSelectedFeedback(
          [],
        );

        setScreen("session");
      } catch (error) {
        console.error(
          "새 사운드 재생 시작 실패",
          error,
        );
      }
    };

  /*
   * =========================
   * 종료 확인 화면으로 이동
   * =========================
   */

  const handleMoveToEndConfirm =
    () => {
      stopRecoveryAudio();

      setPlaying(false);

      setScreen(
        "end-confirm",
      );
    };

  const handleUsePreviousSound =
    async () => {
      if (
        !selectedPreviousSoundId
      ) {
        return;
      }

      const uuid =
        getUserUuid();

      if (!uuid) {
        return;
      }

      try {
        stopRecoveryAudio();

        const newSession =
          await switchToComfortableSound(
            uuid,
            selectedPreviousSoundId,
          );

        setSoundSession(
          newSession,
        );

        sessionStorage.setItem(
          "somni-current-sound-session-id",
          newSession.session_id,
        );

        setElapsedSeconds(0);
        setHasStarted(false);
        setPlaying(false);
        setSelectedFeedback([]);
        setSelectedPreviousSoundId(
          null,
        );

        setScreen("session");
      } catch (error) {
        console.error(
          "이전 사운드 전환 실패",
          error,
        );
      }
    };

  /*
   * =========================
   * 오늘 세션 종료 확정
   * =========================
   */

  const handleEndSession =
    async () => {
      stopRecoveryAudio();
      setPlaying(false);

      if (!soundSession) {
        setScreen(
          "end-complete",
        );

        return;
      }

      const uuid =
        getUserUuid();

      if (!uuid) {
        setScreen(
          "end-complete",
        );

        return;
      }

      try {
        await updateSoundPlayback(
          uuid,
          soundSession.session_id,
          "stop",
          elapsedSeconds,
          "user_stop",
        );
      } catch (error) {
        console.error(
          "수동 세션 종료 저장 실패",
          error,
        );
      } finally {
        setScreen(
          "end-complete",
        );
      }
    };

    if (screen === "change-select") {
      return (
        <div
          className="
            flex
            h-full
            min-h-0
            flex-col
            overflow-hidden
            px-5
            pb-6
          "
        >
          <section className="mt-[50px]">
            <h2
              className="
                font-sans
                text-[28px]
                font-bold
                text-[#F0F7FA]
              "
            >
              어떻게 바꿔볼까요?
            </h2>

            <p
              className="
                mt-[18px]
                font-sans
                text-[13px]
                text-[#809EA8]
              "
            >
              모든 설정은 그대로 두고,
              소리만 변경할게요.
            </p>

            {/* 새 사운드 다시 준비 */}
            <button
              type="button"
              onClick={() =>
                setChangeSoundOption("regenerate")
              }
              className={`
                mt-[38px]
                flex
                min-h-[106px]
                w-full
                items-start
                rounded-[18px]
                border
                px-4
                py-5
                text-left
                ${
                  changeSoundOption === "regenerate"
                    ? `
                      border-[#2B8E78]
                      bg-[#12382E]
                    `
                    : `
                      border-[#24464E]
                      bg-[#112126]
                    `
                }
              `}
            >
              <span
                className={`
                  mt-[1px]
                  flex
                  h-[22px]
                  w-[22px]
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  ${
                    changeSoundOption === "regenerate"
                      ? `
                        border-2
                        border-[#2B8E78]
                      `
                      : `
                        border
                        border-[#24464E]
                      `
                  }
                `}
              >
                {changeSoundOption === "regenerate" && (
                  <span
                    className="
                      h-[12px]
                      w-[12px]
                      rounded-full
                      border
                      border-[#61DBB8]
                      bg-[#61DBB8]
                    "
                  />
                )}
              </span>

              <span className="ml-4">
                <span
                  className="
                    block
                    text-[16px]
                    font-bold
                    text-[#F0F7FA]
                  "
                >
                  새 사운드 다시 준비
                </span>

                <span
                  className="
                    mt-3
                    block
                    text-[12px]
                    leading-[17px]
                    text-[#809EA8]
                  "
                >
                  불편했던 요소를 줄여 오늘 상태에 맞는
                  <br />
                  새 조합을 다시 만들어요.
                </span>
              </span>
            </button>

            {/* 이전에 편안했던 사운드 */}
            <button
              type="button"
              onClick={() =>
                setChangeSoundOption("previous")
              }
              className={`
                mt-[18px]
                flex
                min-h-[106px]
                w-full
                items-start
                rounded-[18px]
                border
                px-4
                py-5
                text-left
                ${
                  changeSoundOption === "previous"
                    ? `
                      border-[#2B8E78]
                      bg-[#12382E]
                    `
                    : `
                      border-[#24464E]
                      bg-[#112126]
                    `
                }
              `}
            >
              <span
                className={`
                  mt-[1px]
                  flex
                  h-[22px]
                  w-[22px]
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  ${
                    changeSoundOption === "previous"
                      ? `
                        border-2
                        border-[#2B8E78]
                      `
                      : `
                        border
                        border-[#24464E]
                      `
                  }
                `}
              >
                {changeSoundOption === "previous" && (
                  <span
                    className="
                      h-[12px]
                      w-[12px]
                      rounded-full
                      border
                      border-[#61DBB8]
                      bg-[#61DBB8]
                    "
                  />
                )}
              </span>

              <span className="ml-4">
                <span
                  className="
                    block
                    text-[16px]
                    font-bold
                    text-[#F0F7FA]
                  "
                >
                  이전에 편안했던 사운드
                </span>

                <span
                  className="
                    mt-3
                    block
                    text-[12px]
                    leading-[17px]
                    text-[#809EA8]
                  "
                >
                  이전 평가에서 “편안했어요”로 남긴
                  <br />
                  사운드를 골라 바로 이어 들을 수 있어요.
                </span>
              </span>
            </button>
          </section>

          {/* 하단 */}
          <div className="mt-auto">
            <button
              type="button"
              disabled={!changeSoundOption}
              onClick={async () => {
                if (
                  changeSoundOption ===
                  "regenerate"
                ) {
                  void handleChangeSound();
                  return;
                }

                if (
                  changeSoundOption ===
                  "previous"
                ) {
                  const uuid =
                    getUserUuid();

                  if (!uuid) {
                    return;
                  }

                  setSelectedPreviousSoundId(
                    null,
                  );

                  /*
                  * 기존 regenerating 화면을
                  * 목록 로딩 화면으로도 사용
                  */
                  setScreen("regenerating");

                  try {
                    const data =
                      await getComfortableSounds(
                        uuid,
                      );

                    setPreviousSounds(data);

                    setScreen(
                      "previous-sounds",
                    );
                  } catch (error) {
                    console.error(
                      "이전 사운드 조회 실패",
                      error,
                    );

                    setSoundError(
                      "이전 사운드를 불러오지 못했어요.",
                    );

                    setScreen(
                      "change-select",
                    );
                  }
                }
              }}
              className="
                h-14
                w-full
                rounded-[12px]
                bg-[#60CEA7]
                text-[14px]
                font-bold
                text-[#07100D]
                disabled:bg-[#244D55]
                disabled:text-[#07100D]
              "
            >
              확인
            </button>

            <button
              type="button"
              onClick={() => {
                setChangeSoundOption(null);
                setScreen("session");
              }}
              className="
                mt-5
                w-full
                text-center
                text-[13px]
                font-medium
                text-[#87CBE6]
              "
            >
              취소하고 세션으로 돌아가기
            </button>
          </div>
        </div>
      );
    }


    if (screen === "previous-sounds") {
      /*
      * =========================
      * 이전에 편안했던 사운드
      * =========================
      */

      const hasPreviousSounds =
        previousSounds.length > 0;

      /*
      * 1. 이전에 편안했던 사운드가 없는 경우
      */
      if (!hasPreviousSounds) {
        return (
          <div
            className="
              flex
              h-full
              min-h-0
              flex-col
              px-5
              pb-6
            "
          >
            <div
              className="
                pt-[110px]
                flex
                justify-center
              "
            >
              <img
                src={previousSoundEmptyIcon}
                alt=""
                aria-hidden="true"
                className="
                  h-[120px]
                  w-[120px]
                "
              />
            </div>

            <div
              className="
                mt-[38px]
                text-center
              "
            >
              <h2
                className="
                  font-sans
                  text-[24px]
                  font-bold
                  leading-normal
                  text-[#F0F7FA]
                "
              >
                아직 다시 들을 사운드가 없어요.
              </h2>

              <p
                className="
                  mt-[15px]
                  font-sans
                  text-[14px]
                  font-normal
                  leading-normal
                  text-[#809EA8]
                "
              >
                편안하게 들은 사운드가 생기면
                <br />
                여기에서 바로 다시 들을 수 있어요.
              </p>
            </div>

            <div className="mt-auto">
              <button
                type="button"
                onClick={() => {
                  setChangeSoundOption(
                    "regenerate",
                  );

                  void handleChangeSound();
                }}
                className="
                  h-14
                  w-full
                  rounded-[12px]
                  bg-[#61DBB8]
                  font-sans
                  text-[14px]
                  font-bold
                  text-[#07100D]
                "
              >
                새 사운드 다시 준비
              </button>

              <button
                type="button"
                onClick={() =>
                  setScreen("session")
                }
                className="
                  mt-[16px]
                  h-14
                  w-full
                  rounded-[12px]
                  border
                  border-[#24464E]
                  bg-[#112126]
                  font-sans
                  text-[14px]
                  font-bold
                  text-[#F0F7FA]
                "
              >
                세션으로 돌아가기
              </button>
            </div>
          </div>
        );
      }

      /*
      * 2. 이전에 편안했던 사운드가 있는 경우
      */
      return (
        <div
          className="
            flex
            h-full
            min-h-0
            flex-col
            overflow-hidden
            px-5
            pb-6
          "
        >
          <section
            className="
              flex
              min-h-0
              flex-1
              flex-col
              pt-[50px]
            "
          >
            <h2
              className="
                shrink-0
                font-sans
                text-[25px]
                font-bold
                leading-[38px]
                text-[#ECF3F2]
              "
            >
              편안하게 들었던 사운드를
              <br />
              다시 들을 수 있어요.
            </h2>

            <div
              className="
                hide-scrollbar
                mt-[30px]
                min-h-0
                flex-1
                overflow-y-auto
                overscroll-y-contain
                pb-6
              "
            >
              <div
                className="
                  flex
                  flex-col
                  gap-[15px]
                "
              >
                {previousSounds.map(
                  (sound) => {
                    const selected =
                      selectedPreviousSoundId ===
                      sound.session_id;

                    return (
                      <button
                        key={sound.session_id}
                        type="button"
                        onClick={() =>
                          setSelectedPreviousSoundId(
                            sound.session_id,
                          )
                        }
                        className={`
                          flex
                          h-[77px]
                          w-full
                          shrink-0
                          items-start
                          rounded-[18px]
                          border
                          px-[14px]
                          pt-[14px]
                          pb-[15px]
                          text-left
                          ${
                            selected
                              ? `
                                border-[#2B8E78]
                                bg-[#12382E]
                              `
                              : `
                                border-[#24464E]
                                bg-[#112126]
                              `
                          }
                        `}
                      >
                        <span
                          className={`
                            mt-[1px]
                            flex
                            h-[22px]
                            w-[22px]
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            ${
                              selected
                                ? `
                                  border-2
                                  border-[#2B8E78]
                                `
                                : `
                                  border
                                  border-[#24464E]
                                `
                            }
                          `}
                        >
                          {selected && (
                            <span
                              className="
                                h-[12px]
                                w-[12px]
                                rounded-full
                                border
                                border-[#61DBB8]
                                bg-[#61DBB8]
                              "
                            />
                          )}
                        </span>

                        <span className="ml-[14px]">
                          <span
                            className="
                              block
                              font-sans
                              text-[15px]
                              font-bold
                              leading-normal
                              text-[#F0F7FA]
                            "
                          >
                            {sound.sound_summary ??
                              "개인화 사운드"}
                          </span>

                          <span
                            className="
                              mt-[13px]
                              block
                              font-sans
                              text-[11px]
                              font-normal
                              leading-normal
                              text-[#809EA8]
                            "
                          >
                            {new Date(
                              sound.evaluated_at,
                            ).toLocaleDateString(
                              "ko-KR",
                              {
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          </section>

          {/* 하단 */}
          <div className="mt-auto">
            <button
              type="button"
              disabled={
                selectedPreviousSoundId ===
                null
              }
              onClick={() => {
                void handleUsePreviousSound();
              }}
              className="
                h-14
                w-full
                rounded-[12px]
                bg-[#60CEA7]
                font-sans
                text-[14px]
                font-bold
                text-[#07100D]
                disabled:bg-[#1F4047]
                disabled:text-[#0D1719]
              "
            >
              이 사운드로 이어 듣기
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedPreviousSoundId(
                  null,
                );

                setChangeSoundOption(
                  "regenerate",
                );

                void handleChangeSound();
              }}
              className="
                mt-5
                w-full
                text-center
                font-sans
                text-[13px]
                font-medium
                text-[#87CBE6]
              "
            >
              새 사운드 다시 준비하기
            </button>
          </div>
        </div>
      );
    }
    
  /*
   * =========================
   * 1. 회복 세션
   * =========================
   */
  if (
    screen === "initial-loading"
  ) {
    return (
      <div
        className="
          flex
          h-full
          min-h-0
          flex-col
          overflow-hidden
          px-5
        "
      >
        <div
          className="
            mt-[120px]
            flex
            justify-center
          "
        >
          <div
            className="
              h-[210px]
              w-[210px]
              rounded-full
              bg-[radial-gradient(circle,#2EA694_0%,rgba(46,166,148,0.35)_35%,rgba(46,166,148,0)_70%)]
              blur-[2px]
            "
          />
        </div>

        <div
          className="
            mt-[55px]
            text-center
          "
        >
          <h2
            className="
            shrink-0
            font-sans
            text-[25px]
            font-bold
            leading-[38px]
            text-[#ECF3F2]
            "
          >
            사운드를 준비하고
            있어요.
          </h2>

          <p
            className="
              mt-[18px]
              font-sans
              text-[13px]
              font-normal
              text-[#809EA8]
            "
          >
            오늘 상태와 나의 음역,
            최근 평가를 함께 확인하고
            있어요.
          </p>
        </div>
      </div>
    );
  }

  if (
    screen === "initial-error"
  ) {
    const handleRetryInitialSound =
      async () => {
        const uuid =
          getUserUuid();

        if (!uuid) {
          return;
        }

        try {
          setSoundError(null);
          setScreen(
            "initial-loading",
          );

          const selectedBackground =
            sessionStorage.getItem(
              "somni-selected-nature-sound",
            ) as
              | "rain"
              | "stream"
              | "ocean"
              | "air"
              | null;

          const session =
            await generateTodaySound(
              uuid,
              true,
              selectedBackground ?? undefined,
            );

          setSoundSession(
            session,
          );
          sessionStorage.setItem(
            "somni-current-sound-session-id",
            session.session_id,
          );
          if (
            session.status ===
            "generation_failed"
          ) {
            setScreen(
              "initial-error",
            );

            return;
          }

          localStorage.removeItem(
            "somni-data-deleted",
          );

          setScreen("session");
        } catch (error) {
          console.error(
            "사운드 다시 준비 실패",
            error,
          );

          setScreen(
            "initial-error",
          );
        }
      };

    const handleUseFallback =
      async () => {
        if (!soundSession) {
          return;
        }

        const uuid =
          getUserUuid();

        if (!uuid) {
          return;
        }

        try {
          const session =
            await requestFallbackSound(
              uuid,
              soundSession.session_id,
            );

          setSoundSession(
            session,
          );

          setElapsedSeconds(0);
          setHasStarted(false);
          setPlaying(false);

          setScreen("session");
        } catch (error) {
          console.error(
            "예비 사운드 사용 실패",
            error,
          );
        }
      };

    return (
      <div
        className="
          flex
          h-full
          min-h-0
          flex-col
          px-5
          pb-6
        "
      >
        <section className="mt-[50px]">
          <h2
            className="
              font-sans
              text-[27px]
              font-bold
              leading-normal
              text-[#F0F7FA]
            "
          > 
            개인화 사운드를
            <br />
            완성하지 못했어요.
          </h2>

          <p
            className="
              mt-[20px]
              font-sans
              text-[13px]
              font-normal
              leading-normal
              text-[#809EA8]
            "
          >
            입력한 기록은 저장되어
            있어요.
            <br />
            다시 시도하거나 이전에
            편안했던 사운드를 이용할
            수 있어요.
          </p>

          <div
            className="
              mt-[20px]
              flex
              w-full
              flex-col
              items-start
              gap-[10px]
              rounded-[16px]
              border
              border-[#213030]
              bg-[#0E1819]
              p-[16px]
            "
          >
            <p
              className="
                font-sans
                text-[12px]
                font-semibold
                leading-[145%]
                text-[#59E8BF]
              "
            >
              예비 사운드
            </p>

            <p
              className="
                font-sans
                text-[15px]
                font-semibold
                leading-[145%]
                text-[#F0F7F5]
              "
            >
              {soundSession?.fallback_sound?.name ??
                "잔잔한 빗소리 + 핑크노이즈"}
            </p>

            <p
              className="
                font-sans
                text-[12px]
                font-normal
                leading-[145%]
                text-[#9EB0AD]
              "
            >
              안전한 기본 조합이에요.
            </p>
          </div>
        </section>

        <div className="mt-auto">
          <button
            type="button"
            disabled={
              !soundSession
                ?.fallback_sound
            }
            onClick={
              handleUseFallback
            }
            className="
              h-14
              w-full
              rounded-[12px]
              bg-[#60CEA7]
              text-[14px]
              font-bold
              text-[#07100D]
              disabled:opacity-40
            "
          >
            예비 사운드로 시작하기
          </button>

          <button
            type="button"
            onClick={
              handleRetryInitialSound
            }
            className="
              mt-5
              w-full
              text-center
              text-[13px]
              font-medium
              text-[#87CBE6]
            "
          >
            사운드 다시 준비하기
          </button>
        </div>
      </div>
    );
  }
  if (
    screen === "regenerating"
  ) {
    return (
      <div
        className="
          flex
          h-full
          min-h-0
          flex-col
          overflow-hidden
          px-5
        "
      >
        <div
          className="
            mt-[120px]
            flex
            justify-center
          "
        >
          <div
            className="
              h-[210px]
              w-[210px]
              rounded-full
              bg-[radial-gradient(circle,#2EA694_0%,rgba(46,166,148,0.35)_35%,rgba(46,166,148,0)_70%)]
            "
          />
        </div>

        <div
          className="
            mt-[55px]
            text-center
          "
        >
          <h2
            className="
              font-sans
              text-[28px]
              font-bold
              text-[#F0F7FA]
            "
          >
            사운드를 준비하고
            있어요.
          </h2>

          <p
            className="
              mt-[18px]
              font-sans
              text-[13px]
              text-[#809EA8]
            "
          >
            불편했던 부분을 반영해
            다시 준비하고 있어요.
          </p>
        </div>
      </div>
    );
  }
  if (
  screen === "change-ready"
  ) {
    const centerFrequency =
      Math.round(
        soundSession
          ?.generated_params
          ?.frequency_bands?.[0]
          ?.center_hz ?? 0,
      );

    const ambient =
      soundSession
        ?.generated_params
        ?.sources
        ?.find(
          (source) =>
            source.role ===
            "ambient",
        );

    const ambientLabel =
      ambient?.asset_tag === "rain"
        ? "잔잔한 빗소리"
        : ambient?.asset_tag ===
            "ocean"
          ? "파도 소리"
          : ambient?.asset_tag ===
              "air"
            ? "공기음"
            : ambient
              ? "배경 사운드"
              : "";

    return (
      <div
        className="
          flex
          h-full
          min-h-0
          flex-col
          px-5
          pb-6
        "
      >
        <section className="mt-[50px]">
          <h2
            className="
              text-[28px]
              font-bold
              text-[#F0F7FA]
            "
          >
            새 사운드가
            준비됐어요.
          </h2>

          <p
            className="
              mt-[18px]
              text-[13px]
              text-[#809EA8]
            "
          >
            불편했던 요소는 줄이고
            오늘 설정은 유지했어요.
          </p>

          <div
            className="
              mt-[40px]
              rounded-[18px]
              border
              border-[#2B8E78]
              bg-[#103D30]
              p-4
            "
          >
            <p
              className="
                text-[11px]
                font-bold
                text-[#61DBB8]
              "
            >
              새 조합
            </p>

            <p
              className="
                mt-4
                text-[18px]
                font-bold
                text-[#F0F7FA]
              "
            >
              {ambientLabel
                ? `${ambientLabel} + 핑크노이즈`
                : "개인화 핑크노이즈"}
            </p>

            <div
              className="
                mt-7
                flex
                h-[60px]
                items-center
                gap-[5px]
              "
            >
              {[
                30, 42, 48, 44, 32,
                24, 20, 28, 40, 46,
                50, 42, 30, 24, 20,
                28, 38, 48, 52, 44,
                34, 24, 20, 30, 42,
                48, 40, 30, 24, 34,
                46, 40,
              ].map(
                (
                  height,
                  index,
                ) => (
                  <span
                    key={index}
                    className="
                      min-w-[3px]
                      flex-1
                      rounded-full
                      bg-[#61DBB8]
                    "
                    style={{
                      height: `${height}px`,
                    }}
                  />
                ),
              )}
            </div>

            <div
              className="
                mt-5
                h-px
                bg-[#29554D]
              "
            />

            <p
              className="
                mt-4
                text-center
                text-[11px]
                text-[#809EA8]
              "
            >
              {selectedFeedback.includes(
                "너무 날카로워요",
              )
                ? "날카로움 ↓ · "
                : ""}
              {selectedFeedback.includes(
                "변화가 너무 많아요",
              )
                ? "변화량 ↓ · "
                : ""}
              {centerFrequency}Hz 유지
            </p>
          </div>
        </section>

        <div className="mt-auto">
          <button
            type="button"
            onClick={
              handleContinueWithNewSound
            }
            className="
              h-14
              w-full
              rounded-[12px]
              bg-[#60CEA7]
              text-[14px]
              font-bold
              text-[#07100D]
            "
          >
            이 사운드로 이어 듣기
          </button>

          <button
            type="button"
            onClick={() =>
              setScreen("feedback")
            }
            className="
              mt-5
              w-full
              text-center
              text-[13px]
              font-medium
              text-[#87CBE6]
            "
          >
            이전에 편안했던
            사운드로 바꾸기
          </button>
        </div>
      </div>
    );
  }


  if (
    screen === "session" ||
    screen === "feedback"
  ) {
    return (
      <div
        className="
          relative
          flex
          h-full
          min-h-0
          flex-col
          overflow-hidden
          px-5
          pb-[16px]
        "
      >


        {soundError && (
          <p
            className="
              mt-4
              text-center
              text-[12px]
              text-[#F09292]
            "
          >
            {soundError}
          </p>
        )}

        {/* 원형 그래픽 */}
        {/* 회복 세션 비주얼 */}
        <div
          className="
            mt-[24px]
            flex
            shrink-0
            justify-center
          "
        >
          <img
            src={recoverySessionVisual}
            alt=""
            aria-hidden="true"
            className="
              h-auto
              w-[358px]
              max-w-full
              rounded-[34px]
              object-contain
            "
          />
        </div>

        {/* 남은 시간 */}
        <div
          className="
            mt-[27px]
            shrink-0
            text-center
          "
        >
          <p
            className="
              font-sans
              text-[42px]
              leading-[63px]
              font-bold
              text-[#ECF3F2]
            "
          >
            {formatTime(remainingSeconds)}
          </p>

          <p
            className="
              font-sans
              text-[12px]
              leading-[18px]
              font-normal
              text-[#8DA2A6]
            "
          >
            천천히 호흡하세요.
          </p>
        </div>

        {/* 천천히 호흡하세요 → 현재 사운드 28px */}
        <p
          className="
            mt-[28px]
            shrink-0
            text-center
            font-sans
            text-[13px]
            leading-[20px]
            font-bold
            text-[#ECF3F2]
          "
        >
          {getRecoverySoundLabel()}
        </p>

        {/* 진행바 */}
        <div className="mt-5 shrink-0">
          <div
            className="
              h-[4px]
              w-full
              overflow-hidden
              rounded-full
              bg-[#294A4F]
            "
          >
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
              mt-2
              flex
              justify-between
              font-sans
              text-[9px]
              text-[#8DA2A6]
            "
          >
            <span>
              {formatTime(elapsedSeconds)}
            </span>

            <span>
              {formatTime(totalSeconds)}
            </span>
          </div>
        </div>

        {/* 진행바 → 재생 / 일시정지 버튼 */}
        <div
          className="
            mt-[32px]
            flex
            shrink-0
            justify-center
          "
        >
          <button
            type="button"
              disabled={
                !activeSoundParams ||
                isSoundLoading
              }
            aria-label={
              playing
                ? "일시정지"
                : "재생"
            }
            onClick={handlePlayToggle}
            className="
              flex
              h-[66px]
              w-[66px]
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#60CEA7]
              disabled:opacity-40
            "
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
                h-[30px]
                w-[30px]
              "
            />
          </button>
        </div>

        {/* 재생 버튼 아래 여백 */}
        <div className="min-h-[16px] shrink-0" />

        {/* 불편 신고 모달 */}
        {screen ===
          "feedback" && (
          <>
            <button
              type="button"
              aria-label="불편 신고 창 닫기"
              onClick={() => {
                setScreen("session");
                setSelectedFeedback([]);
                setSoundError(null);
              }}
              className="
                absolute
                inset-0
                z-40
                cursor-default
                bg-black/35
              "
            />

            <section
              className="
                absolute
                bottom-0
                left-0
                right-0
                z-50
                flex
                max-h-[calc(100%-16px)]
                overflow-hidden
                flex-col
                rounded-t-[22px]
                border-t
                border-[#24464A]
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
                느낌을 골라주면
                지금 세션과 다음
                추천을 조정할게요.
              </p>

              <div className="mt-6 flex flex-col gap-2">
                <div className="flex gap-2">
                  {FEEDBACK_REASONS
                    .slice(0, 2)
                    .map(
                      (reason) => {
                        const selected =
                          selectedFeedback.includes(
                            reason,
                          );

                        return (
                          <button
                            key={
                              reason
                            }
                            type="button"
                            onClick={() =>
                              toggleFeedback(
                                reason,
                              )
                            }
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
                                  ? "border-[#2B8E78] bg-[#12382E] text-[#61DBB8]"
                                  : "border-[#24464E] bg-[#112126] text-[#809EA8]"
                              }
                            `}
                          >
                            {
                              reason
                            }
                          </button>
                        );
                      },
                    )}
                </div>

                <div className="flex gap-2">
                  {FEEDBACK_REASONS
                    .slice(2)
                    .map(
                      (reason) => {
                        const selected =
                          selectedFeedback.includes(
                            reason,
                          );

                        return (
                          <button
                            key={
                              reason
                            }
                            type="button"
                            onClick={() =>
                              toggleFeedback(
                                reason,
                              )
                            }
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
                            {
                              reason
                            }
                          </button>
                        );
                      },
                    )}
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
                  border
                  border-[#24464E]
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
                  지금 바로 바꿀 수
                  있어요.
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
                  오늘 상태는
                  유지하고 불편
                  요인만 제외해 다시
                  준비해요.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setChangeSoundOption(null);
                  setScreen("change-select");
                }}
                disabled={
                  selectedFeedback
                    .length === 0 ||
                  isSoundLoading
                }
                className={`
                  mt-7
                  h-14
                  w-full
                  rounded-[12px]
                  text-[14px]
                  font-bold
                  ${
                    selectedFeedback
                      .length > 0
                      ? "bg-[#60CEA7] text-[#07100D]"
                      : "bg-[#214750] text-[#0D1719]"
                  }
                `}
              >
                {isSoundLoading
                  ? "다시 준비하고 있어요"
                  : "다른 사운드로 바꾸기"}
              </button>

              <button
                type="button"
                disabled={
                  selectedFeedback.length === 0 ||
                  isSoundLoading
                }
                onClick={
                  handleMoveToEndConfirm
                }
                className={`
                  mt-5
                  w-full
                  text-center
                  font-sans
                  text-[13px]
                  font-medium
                  leading-normal
                  ${
                    selectedFeedback.length === 0 ||
                    isSoundLoading
                      ? "cursor-not-allowed text-[#1F4047]"
                      : "text-[#87CBE6]"
                  }
                `}
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
   * =========================
   * 2. 종료 확인
   * =========================
   */

  if (screen === "end-confirm") {
    return (
      <div
        className="
          flex
          h-full
          min-h-0
          flex-col
          px-5
          pb-6
        "
      >
        {/* 
          Header가 이미 64px을 차지함.
          피그마의 '종료' 기준으로 원 시작까지 161px이므로
          본문에서는 161 - 64 = 97px
        */}
        <div
          className="
            mt-[97px]
            flex
            shrink-0
            justify-center
          "
        >
          <img
            src={recoveryEndRings}
            alt=""
            aria-hidden="true"
            className="
              h-[220px]
              w-[220px]
              shrink-0
            "
          />
        </div>

        {/* 원 → 제목 34px */}
        <div
          className="
            mt-[34px]
            shrink-0
            text-center
          "
        >
          <h2
            className="
              font-sans
              text-[28px]
              leading-normal
              font-bold
              text-[#F0F7FA]
            "
          >
            세션을 여기서 마칠까요?
          </h2>

          {/* 제목 → 설명 13px */}
          <p
            className="
              mt-[13px]
              text-center
              font-sans
              text-[13px]
              leading-normal
              font-light
              text-[#809EA8]
            "
          >
            지금 재생은 멈추고, 사용 기록은 저장할게요.
          </p>
        </div>

        {/*
          여기부터 남은 공간을 차지하게 함.
          따라서 화면이 충분히 크면 피그마처럼 버튼이 아래쪽에 위치하고,
          작은 화면에서도 스크롤이 생기지 않음.
        */}
        <div
          className="
            mt-auto
            shrink-0
            pt-6
          "
        >

        <button
          type="button"
          onClick={
            handleEndSession
          }
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
          오늘 세션 마치기
        </button>

          <button
            type="button"
            onClick={() =>
              setScreen("session")
            }
            className="
              mt-4
              h-14
              w-full
              rounded-[12px]
              border
              border-[#24464E]
              bg-[#102126]
              font-sans
              text-[14px]
              font-bold
              text-[#F0F7FA]
            "
          >
            세션으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

/*
 * =========================
 * 3. 종료 완료
 * =========================
 */

  if (screen === "end-complete") {
    return (
      <div
        className="
          flex
          h-full
          min-h-0
          flex-col
          px-5
          pb-6
        "
      >
        {/*
          end-confirm과 완전히 동일
          - 위치
          - 이미지
          - 이미지 크기
        */}
        <div
          className="
            mt-[97px]
            flex
            shrink-0
            justify-center
          "
        >
          <img
            src={recoveryEndRings}
            alt=""
            aria-hidden="true"
            className="
              h-[220px]
              w-[220px]
              shrink-0
            "
          />
        </div>

        {/*
          end-confirm과 완전히 동일
          - 원 → 제목 간격
          - 제목 크기
          - 설명 위치
        */}
        <div
          className="
            mt-[34px]
            shrink-0
            text-center
          "
        >
          <h2
            className="
              font-sans
              text-[28px]
              leading-normal
              font-bold
              text-[#F0F7FA]
            "
          >
            오늘은 여기까지예요.
          </h2>

          <p
            className="
              mt-[13px]
              text-center
              font-sans
              text-[13px]
              leading-normal
              font-light
              text-[#809EA8]
            "
          >
            이제 화면을 보지 않고 쉬어도 괜찮아요.
          </p>
        </div>

        {/* 여기부터만 end-confirm과 다름 */}
        <div
          className="
            mt-auto
            shrink-0
            pt-6
          "
        >
          <button
            type="button"
            onClick={() => {
              stopRecoveryAudio();
              navigate("/");
            }}
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
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default RecoverySessionPage;