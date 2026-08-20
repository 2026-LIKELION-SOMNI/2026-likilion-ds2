import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import SoundFitOptionCard from "../../components/sound-fit/SoundFitOptionCard";

import {
  getSoundFitProfile,
  goToPreviousSoundFitStep,
  selectSoundFitOption,
  startSoundFit,
  type SoundFitProfile,
  type SoundFitSession,
} from "../../api/soundFit";

import {
  playSoundFitPreview,
  stopSoundFitAudio,
} from "../../audio/soundFitAudio";

import rainSound from "../../assets/audio/nature/rain.mp3";
import streamAudio from "../../assets/audio/nature/stream.mp3";
import oceanAudio from "../../assets/audio/nature/ocean.mp3";
import airAudio from "../../assets/audio/nature/air.mp3";

import {
  getSoundSession,
} from "../../api/sound";

import {
  getUserUuid,
} from "../../utils/userStorage";

type Screen =
  | "intro"
  | "compare"
  | "result";

type SelectedOption =
  | "A"
  | "B"
  | null;

const TEXTURE_LABEL = {
  soft: "부드러운 질감",
  balanced: "균형 있는 질감",
  clear: "선명한 질감",
};

const MIX_LABEL = {
  low: "자연음 중심",
  medium: "균형",
  high: "노이즈 중심",
};

/*
 * 시작 화면 큰 파형
 */
const INTRO_WAVE_HEIGHTS = [
  38, 42, 40, 34, 26,
  20, 18, 22, 30, 38,
  42, 40, 34, 26, 20,
  18, 22, 30, 38, 42,
  40, 34, 26, 20, 18,
  22, 30, 38, 42, 40,
  34, 26, 20, 18, 22,
  30, 38, 42,
];

/*
 * 결과 카드 우측 파형
 */
const PROFILE_WAVE_HEIGHTS = [
  24, 36, 44, 32,
  22, 30, 40, 28,
  20, 34, 42, 26,
];

/*
 * 파형 공통 컴포넌트
 */
interface WaveBarsProps {
  heights: number[];
  playing?: boolean;
  barWidth?: string;
  gap?: string;
}

function WaveBars({
  heights,
  playing = false,
  barWidth = "w-[4px]",
  gap = "gap-[4px]",
}: WaveBarsProps) {
  return (
    <div
      className={`
        flex
        items-center
        justify-center
        ${gap}
      `}
      aria-hidden="true"
    >
      {heights.map(
        (
          height,
          index,
        ) => (
          <span
            key={index}
            className={`
              ${barWidth}
              shrink-0
              origin-center
              rounded-full
              bg-[#61DBB8]
              ${
                playing
                  ? "animate-[soundWave_0.8s_ease-in-out_infinite_alternate]"
                  : ""
              }
            `}
            style={{
              height: `${height}px`,

              animationDelay:
                playing
                  ? `${index * 45}ms`
                  : undefined,

              animationDuration:
                playing
                  ? `${
                      540 +
                      (index % 5) *
                        90
                    }ms`
                  : undefined,
            }}
          />
        ),
      )}
    </div>
  );
}

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

function AISoundFitPage() {
  const navigate =
    useNavigate();

  const [
    screen,
    setScreen,
  ] =
    useState<Screen>(
      "intro",
    );

  const [
    session,
    setSession,
  ] =
    useState<SoundFitSession | null>(
      null,
    );

  const [
    profile,
    setProfile,
  ] =
    useState<SoundFitProfile | null>(
      null,
    );

  const [
    selectedOption,
    setSelectedOption,
  ] =
    useState<SelectedOption>(
      null,
    );

  const [
    roundOneSelection,
    setRoundOneSelection,
  ] =
    useState<SelectedOption>(
      null,
    );

  const [
    visibleRound,
    setVisibleRound,
  ] =
    useState<1 | 2>(
      1,
    );

  const [
    playingOption,
    setPlayingOption,
  ] =
    useState<SelectedOption>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    currentNatureAudio,
    setCurrentNatureAudio,
  ] =
    useState<string | null>(
      null,
    );

  /*
   * =========================
   * 현재 자연음 조회
   * =========================
   */
  useEffect(() => {
    const loadCurrentNatureSound =
      async () => {
        const natureAudioMap:
          Record<string, string> = {
            rain: rainSound,
            stream:
              streamAudio,
            ocean:
              oceanAudio,
            air:
              airAudio,
          };

        /*
         * 1순위
         * 사용자가 직접 선택한 자연음
         */
        const savedNature =
          sessionStorage.getItem(
            "somni-selected-nature-sound",
          );

        if (
          savedNature &&
          natureAudioMap[
            savedNature
          ]
        ) {
          setCurrentNatureAudio(
            natureAudioMap[
              savedNature
            ],
          );

          return;
        }

        /*
         * 2순위
         * 현재 SoundSession
         */
        const uuid =
          getUserUuid();

        const sessionId =
          sessionStorage.getItem(
            "somni-current-sound-session-id",
          );

        if (
          !uuid ||
          !sessionId
        ) {
          console.warn(
            "현재 자연음 정보를 찾을 수 없습니다.",
          );

          return;
        }

        try {
          const soundSession =
            await getSoundSession(
              uuid,
              sessionId,
            );

          const params =
            soundSession.final_params ??
            soundSession.generated_params;

          const backgroundSource =
            params?.sources?.find(
              (source) =>
                source.role ===
                  "ambient" ||
                source.type ===
                  "background",
            );

          const background =
            backgroundSource
              ?.asset_tag;

          if (
            background &&
            natureAudioMap[
              background
            ]
          ) {
            setCurrentNatureAudio(
              natureAudioMap[
                background
              ],
            );
          }
        } catch (error) {
          console.error(
            "현재 자연음 조회 실패",
            error,
          );
        }
      };

    void loadCurrentNatureSound();
  }, []);

  /*
   * 페이지 이탈 시 정리
   */
  useEffect(() => {
    return () => {
      stopSoundFitAudio();
    };
  }, []);

  /*
   * =========================
   * Sound Fit 시작
   * =========================
   */
  const handleStart =
    async () => {
      const uuid =
        getUserUuid();

      if (
        !uuid ||
        isLoading
      ) {
        return;
      }

      try {
        setIsLoading(
          true,
        );

        setErrorMessage(
          "",
        );

        const data =
          await startSoundFit(
            uuid,
          );

        setSession(
          data,
        );

        setSelectedOption(
          null,
        );

        setPlayingOption(
          null,
        );

        setVisibleRound(
          1,
        );

        setScreen(
          "compare",
        );
      } catch (error) {
        console.error(
          "Sound Fit 시작 실패",
          error,
        );

        setErrorMessage(
          "Sound Fit을 시작하지 못했어요.",
        );
      } finally {
        setIsLoading(
          false,
        );
      }
    };

  /*
   * =========================
   * A/B 들어보기
   * =========================
   */
  const handlePlay =
    async (
      option:
        "A" | "B",
    ) => {
      if (
        playingOption ===
        option
      ) {
        stopSoundFitAudio();

        setPlayingOption(
          null,
        );

        return;
      }

      stopSoundFitAudio();

      try {
        setPlayingOption(
          option,
        );

        const axis =
          visibleRound === 1
            ? "texture"
            : "layer_mix";

        if (
          !currentNatureAudio
        ) {
          console.error(
            "현재 자연음을 찾지 못했어요.",
          );

          setErrorMessage(
            "비교에 사용할 자연음을 찾지 못했어요.",
          );

          setPlayingOption(
            null,
          );

          return;
        }

        setErrorMessage(
          "",
        );

        await playSoundFitPreview(
          currentNatureAudio,
          axis,
          option,
        );
      } catch (error) {
        console.error(
          "Sound Fit 미리듣기 실패",
          error,
        );

        setPlayingOption(
          null,
        );
      }
    };

  /*
   * =========================
   * A/B 선택 제출
   * =========================
   */
  const handleContinue =
    async () => {
      if (
        !session ||
        !selectedOption ||
        isLoading
      ) {
        return;
      }

      stopSoundFitAudio();

      setPlayingOption(
        null,
      );

      try {
        setIsLoading(
          true,
        );

        setErrorMessage(
          "",
        );

        if (
          session.round_number ===
          1
        ) {
          setRoundOneSelection(
            selectedOption,
          );
        }

        const next =
          await selectSoundFitOption(
            session.id,
            selectedOption,
          );

        setSession(
          next,
        );

        if (!next.done) {
          setVisibleRound(
            2,
          );
        }

        setSelectedOption(
          null,
        );

        setPlayingOption(
          null,
        );

        if (next.done) {
          const uuid =
            getUserUuid();

          if (!uuid) {
            return;
          }

          const profileData =
            await getSoundFitProfile(
              uuid,
            );

          setProfile(
            profileData,
          );

          setScreen(
            "result",
          );
        }
      } catch (error) {
        console.error(
          "Sound Fit 선택 실패",
          error,
        );

        setErrorMessage(
          "선택을 저장하지 못했어요.",
        );
      } finally {
        setIsLoading(
          false,
        );
      }
    };

  /*
   * =========================
   * 다시 측정
   * =========================
   */
  const handleRestart =
    async () => {
      stopSoundFitAudio();

      setProfile(null);
      setSession(null);

      setSelectedOption(
        null,
      );

      setPlayingOption(
        null,
      );

      await handleStart();
    };

  /*
   * 카드 설명
   */
  const getDescription =
    (
      option:
        "A" | "B",
    ) => {
      if (
        visibleRound ===
        1
      ) {
        return option ===
          "A"
          ? "더 부드럽고 둥글게"
          : "조금 더 또렷하게";
      }

      return option ===
        "A"
        ? "자연음 위주"
        : "노이즈 위주";
    };

  /*
   * =========================
   * 이전
   * =========================
   */
  const handleBack =
    async () => {
      stopSoundFitAudio();

      setPlayingOption(
        null,
      );

      setErrorMessage(
        "",
      );

      if (
        screen ===
          "compare" &&
        visibleRound ===
          2 &&
        session
      ) {
        try {
          setIsLoading(
            true,
          );

          const previousSession =
            await goToPreviousSoundFitStep(
              session.id,
            );

          setSession(
            previousSession,
          );

          setVisibleRound(
            1,
          );

          setSelectedOption(
            roundOneSelection,
          );
        } catch (error) {
          console.error(
            "Sound Fit 이전 단계 이동 실패",
            error,
          );

          setErrorMessage(
            "이전 단계로 돌아가지 못했어요.",
          );
        } finally {
          setIsLoading(
            false,
          );
        }

        return;
      }

      if (
        screen ===
          "result" &&
        session
      ) {
        try {
          setIsLoading(
            true,
          );

          const previousSession =
            await goToPreviousSoundFitStep(
              session.id,
            );

          setSession(
            previousSession,
          );

          setScreen(
            "compare",
          );

          setVisibleRound(
            2,
          );

          setSelectedOption(
            null,
          );
        } catch (error) {
          console.error(
            "Sound Fit 결과 이전 이동 실패",
            error,
          );

          setErrorMessage(
            "이전 단계로 돌아가지 못했어요.",
          );
        } finally {
          setIsLoading(
            false,
          );
        }

        return;
      }

      if (
        screen ===
          "compare" &&
        visibleRound ===
          1
      ) {
        setSelectedOption(
          null,
        );

        setScreen(
          "intro",
        );

        return;
      }

      setScreen(
        "intro",
      );
    };

  /*
   * =========================
   * INTRO
   * =========================
   */
  if (
    screen === "intro"
  ) {
    return (
      <div
        className="
          flex
          min-h-dvh
          w-full
          flex-col
          px-5
          pb-[40px]
        "
      >
        <header
          className="
            flex
            h-16
            shrink-0
            items-center
            justify-center
          "
        >
          <h1
            className="
              font-sans
              text-[20px]
              font-bold
              text-[#F0F7FA]
            "
          >
            AI Sound Fit
          </h1>
        </header>

        <main
          className="
            flex
            flex-1
            flex-col
          "
        >
          <section className="pt-[58px]">
            <h2
              className="
                font-sans
                text-[25px]
                font-bold
                leading-[38px]
                text-[#ECF3F2]
              "
            >
              내가 편하게 느끼는
              <br />
              소리 기준을 찾아볼게요.
            </h2>

            <p
              className="
                mt-[6px]
                font-sans
                text-[13px]
                leading-[20px]
                text-[#8DA2A6]
              "
            >
              기존 설정은 유지하고
              소리의 질감과 혼합 정도를
              <br />
              나에게 딱 맞게 조절해요.
            </p>

            <div
              className="
                mt-[30px]
                h-[158px]
                w-full
                rounded-[20px]
                border
                border-[#24464E]
                bg-[#0F2B2C]
                px-[16px]
                pt-[16px]
              "
            >
              <p
                className="
                  text-[12px]
                  font-bold
                  text-[#61DBB8]
                "
              >
                약 1분 · 2번 비교
              </p>

              {/* 기존 SVG 대신 실제 파형 */}
              <div
                className="
                  mt-[22px]
                  flex
                  h-[58px]
                  w-full
                  items-center
                  justify-center
                  overflow-hidden
                "
              >
                <WaveBars
                  heights={
                    INTRO_WAVE_HEIGHTS
                  }
                  barWidth="w-[4px]"
                  gap="gap-[4px]"
                />
              </div>

              <p
                className="
                  mt-[10px]
                  text-center
                  text-[11px]
                  text-[#809EA8]
                "
              >
                정답은 없어요. 더 편하게 느껴지는 쪽만 골라주세요.
              </p>
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
                isLoading
              }
              onClick={() =>
                void handleStart()
              }
              className="
                h-[54px]
                w-full
                rounded-[14px]
                bg-[#61DBB8]
                text-[14px]
                font-bold
                text-[#07100D]
              "
            >
              {isLoading
                ? "시작 중..."
                : "계속"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  /*
   * =========================
   * RESULT
   * =========================
   */
  if (
    screen ===
      "result" &&
    profile
  ) {
    return (
      <div
        className="
          flex
          min-h-dvh
          w-full
          flex-col
          px-5
          pb-[40px]
        "
      >
        <header
          className="
            relative
            flex
            h-16
            shrink-0
            items-center
            justify-center
          "
        >
          <button
            type="button"
            onClick={() => {
              void handleBack();
            }}
            aria-label="이전 화면"
            className="
              absolute
              left-0
              flex
              size-10
              items-center
              justify-center
              text-[#ECF3F2]
            "
          >
            <BackIcon />
          </button>

          <h1
            className="
              text-[20px]
              font-bold
              text-[#F0F7FA]
            "
          >
            AI Sound Fit
          </h1>
        </header>

        <ProgressSection
          width={100}
        />

        <main
          className="
            flex
            flex-1
            flex-col
          "
        >
          <section className="pt-[61px]">
            <h2
              className="
                text-[24px]
                font-bold
                leading-[36px]
                text-[#ECF3F2]
              "
            >
              내 사운드 취향을 찾았어요.
            </h2>

            <p
              className="
                mt-[2px]
                text-[13px]
                text-[#809EA8]
              "
            >
              저장된 사운드 프로필은
              마이페이지에서도 확인할 수 있어요.
            </p>

            <div
              className="
                relative
                mt-[40px]
                h-[125px]
                w-full
                overflow-hidden
                rounded-[20px]
                border
                border-[#2B8E78]
                bg-[#12382E]
                px-[16px]
                pt-[16px]
              "
            >
              <p
                className="
                  text-[11px]
                  font-bold
                  text-[#61DBB8]
                "
              >
                My Sound Profile
              </p>

              <p
                className="
                  mt-[10px]
                  text-[18px]
                  font-bold
                  text-[#F0F7FA]
                "
              >
                {
                  TEXTURE_LABEL[
                    profile.texture
                  ]
                }
              </p>

              <p
                className="
                  mt-[8px]
                  text-[18px]
                  font-bold
                  text-[#F0F7FA]
                "
              >
                {
                  MIX_LABEL[
                    profile.layer_mix
                  ]
                }
              </p>

              {/* 기존 SVG 대신 막대 파형 */}
              <div
                className="
                  absolute
                  right-[16px]
                  top-[37px]
                  flex
                  h-[70px]
                  w-[108px]
                  items-center
                  justify-center
                "
              >
                <WaveBars
                  heights={
                    PROFILE_WAVE_HEIGHTS
                  }
                  barWidth="w-[3px]"
                  gap="gap-[3px]"
                />
              </div>
            </div>
          </section>

          <div className="mt-auto pt-10">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(
                  "somni-onboarding-completed",
                  "true",
                );

                navigate(
                  "/",
                  {
                    replace: true,
                  },
                );
              }}
              className="
                h-[54px]
                w-full
                rounded-[14px]
                bg-[#61DBB8]
                text-[14px]
                font-bold
                text-[#07100D]
              "
            >
              저장하기
            </button>

            <button
              type="button"
              onClick={() =>
                void handleRestart()
              }
              className="
                mt-[18px]
                w-full
                text-center
                text-[13px]
                font-medium
                text-[#87CBE6]
              "
            >
              다시 측정하기
            </button>
          </div>
        </main>
      </div>
    );
  }

  /*
   * =========================
   * COMPARE
   * =========================
   */
  return (
    <div
      className="
        flex
        min-h-dvh
        w-full
        flex-col
        px-5
        pb-[40px]
      "
    >
      <header
        className="
          relative
          flex
          h-16
          shrink-0
          items-center
          justify-center
        "
      >
        <button
          type="button"
          onClick={
            handleBack
          }
          aria-label="이전 화면"
          className="
            absolute
            left-0
            flex
            size-10
            items-center
            justify-center
            text-[#ECF3F2]
          "
        >
          <BackIcon />
        </button>

        <h1
          className="
            text-[20px]
            font-bold
            text-[#F0F7FA]
          "
        >
          AI Sound Fit
        </h1>
      </header>

      <ProgressSection
        width={
          visibleRound ===
          1
            ? 33.33
            : 66.67
        }
      />

      <main
        className="
          flex
          flex-1
          flex-col
        "
      >
        <section className="pt-16">
          <p
            className="
              text-[12px]
              font-semibold
              text-[#809EA8]
            "
          >
            {visibleRound}/2
          </p>

          <h2
            className="
              mt-2
              text-[20px]
              font-bold
              leading-[28px]
              text-[#ECF3F2]
            "
          >
            더 편안한 소리를 골라주세요.
          </h2>

          <div className="mt-10 flex gap-3">
            <SoundFitOptionCard
              label="A"
              description={
                getDescription(
                  "A",
                )
              }
              selected={
                selectedOption ===
                "A"
              }
              playing={
                playingOption ===
                "A"
              }
              onSelect={() => {
                setSelectedOption(
                  "A",
                );

                setErrorMessage(
                  "",
                );
              }}
              onPlay={() =>
                void handlePlay(
                  "A",
                )
              }
            />

            <SoundFitOptionCard
              label="B"
              description={
                getDescription(
                  "B",
                )
              }
              selected={
                selectedOption ===
                "B"
              }
              playing={
                playingOption ===
                "B"
              }
              onSelect={() => {
                setSelectedOption(
                  "B",
                );

                setErrorMessage(
                  "",
                );
              }}
              onPlay={() =>
                void handlePlay(
                  "B",
                )
              }
            />
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
              !selectedOption ||
              isLoading
            }
            onClick={() =>
              void handleContinue()
            }
            className={`
              h-[54px]
              w-full
              rounded-[14px]
              text-[14px]
              font-bold
              ${
                selectedOption &&
                !isLoading
                  ? "bg-[#61DBB8] text-[#07100D]"
                  : "bg-[#1F4047] text-[#0D1719]"
              }
            `}
          >
            {isLoading
              ? "반영 중..."
              : "계속"}
          </button>
        </div>
      </main>
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
            width:
              `${width}%`,
          }}
        />
      </div>
    </div>
  );
}

export default AISoundFitPage;