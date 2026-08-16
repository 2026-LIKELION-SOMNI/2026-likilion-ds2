import { useEffect, useState, } from "react";
import { useNavigate, } from "react-router-dom";

import SoundFitOptionCard from "../../components/sound-fit/SoundFitOptionCard";

import soundFitIntroWave from "../../assets/icons/sound-fit-intro-wave.svg";
import soundFitProfileWave from "../../assets/icons/sound-fit-profile-wave.svg";
import { getSoundFitProfile, selectSoundFitOption, startSoundFit,
  type SoundFitProfile, type SoundFitSession, } from "../../api/soundFit";
import { playSoundFitPreview, stopSoundFitAudio, } from "../../audio/soundFitAudio";


import rainSound from "../../assets/audio/nature/rain.mp3";
import streamAudio from "../../assets/audio/nature/stream.mp3";
import oceanAudio from "../../assets/audio/nature/ocean.mp3";
import airAudio from "../../assets/audio/nature/air.mp3";

import { getSoundSession, } from "../../api/sound";

import { getUserUuid, } from "../../utils/userStorage";

type Screen =
  | "intro"
  | "compare"
  | "result";

type SelectedOption =
  | "A"
  | "B"
  | null;

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
    useState<1 | 2>(1);

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
    ] = useState<string | null>(
    null,
    );

    useEffect(() => {
    const loadCurrentNatureSound =
        async () => {
        const natureAudioMap:
            Record<string, string> = {
            rain: rainSound,
            stream: streamAudio,
            ocean: oceanAudio,
            air: airAudio,
            };

        /*
        * 1순위:
        * 사용자가 직접 선택한 자연음
        */
        const savedNature =
            sessionStorage.getItem(
            "somni-selected-nature-sound",
            );

        if (
            savedNature &&
            natureAudioMap[savedNature]
        ) {
            console.log(
            "Sound Fit 자연음:",
            savedNature,
            );

            setCurrentNatureAudio(
            natureAudioMap[
                savedNature
            ],
            );

            return;
        }

        /*
        * 2순위:
        * 기존 SoundSession에서 조회
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
            backgroundSource?.asset_tag;

            console.log(
            "SoundSession 자연음:",
            background,
            );

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
        setIsLoading(true);
        setErrorMessage("");

        const data =
          await startSoundFit(
            uuid,
          );

        setSession(data);

        setSelectedOption(
          null,
        );

        setPlayingOption(
          null,
        );

        setVisibleRound(1);
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
        setIsLoading(false);
      }
    };

  /*
   * =========================
   * 들어보기
   *
   * 지금은 UI 상태만 변경.
   * 다음 단계에서 실제 Audio 연결.
   * =========================
   */
    const handlePlay = async (
    option: "A" | "B",
    ) => {
    /*
    * 같은 카드 다시 누름
    * → 정지
    */
    if (
        playingOption === option
    ) {
        stopSoundFitAudio();

        setPlayingOption(
        null,
        );

        return;
    }

    /*
    * 다른 카드 재생 시
    * 기존 재생 정지
    */
    stopSoundFitAudio();

    try {
        setPlayingOption(
        option,
        );

        const axis =
        visibleRound === 1
            ? "texture"
            : "layer_mix";

        if (!currentNatureAudio) {
        console.error(
            "현재 자연음을 찾지 못했어요.",
        );

        setErrorMessage(
            "비교에 사용할 자연음을 찾지 못했어요.",
        );

        setPlayingOption(null);
        return;
        }

        /*
        * 자연음이 정상적으로 있으면
        * 기존 오류 메시지 제거 후 재생
        */
        setErrorMessage("");

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
    setPlayingOption(null);

      try {
        setIsLoading(true);
        setErrorMessage("");

        if (
        session.round_number === 1
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

        setSession(next);
        if (!next.done) {
            setVisibleRound(2);
        }

        setSelectedOption(
          null,
        );

        setPlayingOption(
          null,
        );

        /*
         * 2/2 완료
         */
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
        setIsLoading(false);
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
   * =========================
   * 카드 설명
   * =========================
   */
    const getDescription = (
    option: "A" | "B",
    ) => {
    if (
        visibleRound === 1
    ) {
        return option === "A"
        ? "더 부드럽고 둥글게"
        : "조금 더 또렷하게";
    }

    return option === "A"
        ? "자연음 위주"
        : "노이즈 위주";
    };

  /*
   * =========================
   * 이전 화면
   * =========================
   */
    const handleBack = () => {
        stopSoundFitAudio();

        setPlayingOption(null);
    setErrorMessage("");

    /*
    * 2/2 → 1/2
    */
    if (
        screen === "compare" &&
        visibleRound === 2
    ) {
        setVisibleRound(1);

        setSelectedOption(
        roundOneSelection,
        );

        return;
    }

    /*
    * 1/2 → 시작 화면
    */
    if (
        screen === "compare" &&
        visibleRound === 1
    ) {
        setSelectedOption(null);
        setScreen("intro");

        return;
    }

    /*
    * 결과 → 2/2
    */
    if (screen === "result") {
        setScreen("compare");
        setVisibleRound(2);
        setSelectedOption(null);

        return;
    }

    setScreen("intro");
    };

  /*
   * =====================================
   * INTRO
   * =====================================
   */
  if (screen === "intro") {
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
        {/* 자체 헤더 */}
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
              leading-normal
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
          {/* 상단 콘텐츠 */}
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
                font-normal
                leading-[20px]
                text-[#8DA2A6]
              "
            >
              기존 설정은 유지하고
              소리의 질감과 혼합 정도를
              <br />
              나에게 딱 맞게 조절해요.
            </p>

            {/* 안내 카드 */}
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
                  font-sans
                  text-[12px]
                  font-bold
                  leading-normal
                  text-[#61DBB8]
                "
              >
                약 1분 · 2번 비교
              </p>

              <img
                src={
                  soundFitIntroWave
                }
                alt=""
                aria-hidden="true"
                className="
                  mt-[24px]
                  h-[54px]
                  w-full
                  object-contain
                "
              />

              <p
                className="
                  mt-[12px]
                  text-center
                  font-sans
                  text-[11px]
                  font-normal
                  leading-normal
                  text-[#809EA8]
                "
              >
                정답은 없어요. 더 편하게 느껴지는 쪽만 골라주세요.
              </p>
            </div>

            {errorMessage && (
              <p
                className="
                  mt-3
                  text-[12px]
                  text-[#F09292]
                "
              >
                {errorMessage}
              </p>
            )}
          </section>

          {/* 하단 버튼 */}
          <div
            className="
              mt-auto
              pt-10
            "
          >
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
                font-sans
                text-[14px]
                font-bold
                leading-normal
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
   * =====================================
   * RESULT
   * =====================================
   */
  if (
    screen === "result" &&
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
        {/* 자체 헤더 */}
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
            onClick={handleBack}
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
              font-sans
              text-[20px]
              font-bold
              leading-normal
              text-[#F0F7FA]
            "
          >
            AI Sound Fit
          </h1>
        </header>

        {/* 진행률 100% */}
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
                font-sans
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
                font-sans
                text-[13px]
                font-normal
                leading-normal
                text-[#809EA8]
              "
            >
              저장된 사운드 프로필은
              마이페이지에서도 확인할 수 있어요.
            </p>

            {/* Sound Profile 카드 */}
            <div
            className="
                relative
                mt-[40px]
                h-[125px]
                w-full
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
                font-['Noto_Sans_KR']
                text-[11px]
                font-bold
                leading-normal
                text-[#61DBB8]
                "
            >
                My Sound Profile
            </p>

            <p
                className="
                mt-[10px]
                font-['Noto_Sans_KR']
                text-[18px]
                font-bold
                leading-normal
                text-[#F0F7FA]
                "
            >
                {TEXTURE_LABEL[profile.texture]}
            </p>

            <p
                className="
                mt-[8px]
                font-['Noto_Sans_KR']
                text-[18px]
                font-bold
                leading-normal
                text-[#F0F7FA]
                "
            >
                {MIX_LABEL[profile.layer_mix]}
            </p>

            <img
                src={soundFitProfileWave}
                alt=""
                aria-hidden="true"
                className="
                absolute
                right-[16px]
                top-[39px]
                h-[70px]
                w-[100px]
                "
            />
            </div>

          </section>

          {/* 결과 버튼도 무조건 하단 */}
          <div
            className="
              mt-auto
              pt-10
            "
          >
            <button
              type="button"
              onClick={() =>
                navigate("/my")
              }
              className="
                h-[54px]
                w-full
                rounded-[14px]
                bg-[#61DBB8]
                font-sans
                text-[14px]
                font-bold
                leading-normal
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
                font-sans
                text-[13px]
                font-medium
                leading-normal
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
   * =====================================
   * COMPARE
   * 1/2 Texture
   * 2/2 Layer Mix
   * =====================================
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
      {/* 자체 헤더 */}
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
            font-sans
            text-[20px]
            font-bold
            leading-normal
            text-[#F0F7FA]
          "
        >
          AI Sound Fit
        </h1>
      </header>

      {/* 진행바 */}
        <ProgressSection
        width={
            visibleRound === 1
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
        {/* 기존 음역매칭 화면과 동일하게 위에서 시작 */}
        <section className="pt-16">
          <p
            className="
              font-sans
              text-[12px]
              font-semibold
              leading-normal
              text-[#809EA8]
            "
          >
            {visibleRound}/3
          </p>

          <h2
            className="
              mt-2
              font-sans
              text-[20px]
              font-bold
              leading-[28px]
              text-[#ECF3F2]
            "
          >
            더 편안한 소리를 골라주세요.
          </h2>

          {/* A/B 카드 */}
          <div
            className="
              mt-10
              flex
              gap-3
            "
          >
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
                handlePlay("A")
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
                handlePlay("B")
              }
            />
          </div>

          {errorMessage && (
            <p
              className="
                mt-3
                text-[12px]
                text-[#F09292]
              "
            >
              {errorMessage}
            </p>
          )}
        </section>

        {/* 계속 버튼은 항상 화면 하단 */}
        <div
          className="
            mt-auto
            pt-10
          "
        >
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
              font-sans
              text-[14px]
              font-bold
              leading-normal
              ${
                selectedOption &&
                !isLoading
                  ? `
                    bg-[#61DBB8]
                    text-[#07100D]
                  `
                  : `
                    bg-[#1F4047]
                    text-[#0D1719]
                  `
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

/*
 * FrequencyPage와 동일한 형태의 진행바
 */
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

export default AISoundFitPage;