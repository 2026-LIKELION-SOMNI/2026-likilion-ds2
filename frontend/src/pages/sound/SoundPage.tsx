import { useEffect, useState, } from "react";
import { useNavigate } from "react-router-dom";

import BottomNav from "../../components/navigation/BottomNav";

import playIcon from "../../assets/icons/Play.svg";
import pauseIcon from "../../assets/icons/Pause.svg";

import rainAudio from "../../assets/audio/nature/rain.mp3";
import airAudio from "../../assets/audio/nature/air.mp3";
import oceanAudio from "../../assets/audio/nature/ocean.mp3";
import streamAudio from "../../assets/audio/nature/stream.mp3";

import { playNatureAudio, stopNatureAudio, } from "../../audio/natureAudio";

import { pauseRecoveryAudio, playRecoveryAudio, resumeRecoveryAudio,
  stopRecoveryAudio, } from "../../audio/recoveryAudio";

import {
  getLatestSoundSession,
  type SoundSession,
} from "../../api/sound";
import {
  getMyPageProfileSummary,
  type MyPageProfileSummary,
} from "../../api/mypage";

import { getUserUuid, } from "../../utils/userStorage";

const PREVIEW_SOUNDS = [
  {
    id: 1,
    title: "비",
    audio: rainAudio,
    heights: [
      17, 22, 24, 22,
      19, 16, 14, 13,
    ],
  },
  {
    id: 2,
    title: "시냇물",
    audio: streamAudio,
    heights: [
      23, 20, 18, 16,
      15, 14, 13, 12,
    ],
  },
  {
    id: 3,
    title: "파도",
    audio: oceanAudio,
    heights: [
      23, 20, 17, 15,
      14, 15, 17, 20,
    ],
  },
  {
    id: 4,
    title: "공기음",
    audio: airAudio,
    heights: [
      17, 15, 14, 15,
      17, 20, 22, 24,
    ],
  },
];

const MAIN_WAVE_HEIGHTS = [
  48, 44, 36, 28, 22,
  20, 24, 32, 42, 48,
  44, 34, 26, 20, 22,
  30, 40, 48, 46, 36,
  28, 22, 20, 24, 34,
  44, 48, 42, 32, 24,
  20, 22, 30, 40, 48,
];

function SoundPage() {
  const navigate = useNavigate();

  /*
   * 현재 개인화 사운드 세션
   */
  const [
    currentSoundSession,
    setCurrentSoundSession,
  ] = useState<SoundSession | null>(
    null,
  );
  const [
    profileSummary,
    setProfileSummary,
  ] = useState<MyPageProfileSummary | null>(
    null,
  );

  /*
   * 상단 개인화 사운드 상태
   */
  const [
    playing,
    setPlaying,
  ] = useState(false);

  const [
    hasStartedPersonalSound,
    setHasStartedPersonalSound,
  ] = useState(false);

  /*
   * 다른 소리 들어보기 상태
   */
  const [
    previewPlayingId,
    setPreviewPlayingId,
  ] = useState<number | null>(
    null,
  );

  /*
   * =========================
   * 현재 사운드 세션 조회
   * =========================
   */
  useEffect(() => {
    const loadCurrentSound =
      async () => {
        const uuid =
          getUserUuid();

        if (!uuid) {
          console.warn(
            "사용자 정보를 찾을 수 없습니다.",
          );

          return;
        }
        let currentProfile:
          MyPageProfileSummary | null = null;

        try {
          currentProfile =
            await getMyPageProfileSummary(
              uuid,
            );

          setProfileSummary(
            currentProfile,
          );
        } catch (error) {
          console.error(
            "개인화 사운드 프로필 조회 실패",
            error,
          );
        }

        try {
          const session =
            await getLatestSoundSession(
              uuid,
            );

          const sessionParams =
            session.final_params ??
            session.generated_params;

          const sessionCenterFrequency =
            sessionParams
              ?.frequency_bands?.[0]
              ?.center_hz;

          const currentCenterFrequency =
            currentProfile
              ?.center_frequency;

          const isCurrentSoundSession =
            currentCenterFrequency != null &&
            sessionCenterFrequency != null &&
            Math.abs(
              currentCenterFrequency -
                sessionCenterFrequency,
            ) < 1;

          /*
          * 새 음역매칭은 끝났지만
          * 아직 해당 음역으로 회복세션을
          * 생성하지 않은 상태
          */
          if (!isCurrentSoundSession) {
            setCurrentSoundSession(null);
            return;
          }

          sessionStorage.setItem(
            "somni-current-sound-session-id",
            session.session_id,
          );

          console.log(
            "현재 사운드 세션:",
            session,
          );

          setCurrentSoundSession(
            session,
          );
        } catch (error) {
          console.error(
            "최신 사운드 세션 조회 실패",
            error,
          );

          setCurrentSoundSession(null);
        }
      };

    void loadCurrentSound();
  }, []);

  /*
   * 페이지 이탈 시
   * 모든 오디오 종료
   */
  useEffect(() => {
    return () => {
      stopNatureAudio();
      stopRecoveryAudio();
    };
  }, []);

  /*
   * generated_params는 최초 생성 결과,
   * final_params는 사용자가 자연음 등을
   * 변경한 최종 재생 설정.
   *
   * 화면/실제 재생에서는 final_params 우선.
   */
  const activeSoundParams =
    currentSoundSession
      ?.final_params ??
    currentSoundSession
      ?.generated_params ??
    null;

    const hasPersonalizedProfile =
      profileSummary?.center_frequency != null &&
      profileSummary?.texture != null &&
      profileSummary?.layer_mix != null;

    const canPlayPersonalizedSound =
      activeSoundParams !== null;
  /*
   * =========================
   * 현재 자연음 이름
   * =========================
   */
  const getBackgroundSoundLabel =
    () => {
      if (!activeSoundParams) {
        return "아직 생성된 사운드가 없어요";
      }

      const backgroundSource =
        activeSoundParams.sources?.find(
          (source) =>
            source.role ===
              "ambient" ||
            source.type ===
              "background",
        );

      const background =
        backgroundSource
          ?.asset_tag;

      const backgroundLabelMap: Record<
        string,
        string
      > = {
        rain: "잔잔한 빗소리",
        stream: "시냇물 소리",
        ocean: "파도",
        air: "공기음",
      };

      if (!background) {
        return "개인화 노이즈";
      }

      return (
        backgroundLabelMap[
          background
        ] ??
        "개인화 사운드"
      );
    };

  /*
   * =========================
   * 노이즈 이름
   * =========================
   */
  const getNoiseLabel = () => {
    if (!activeSoundParams) {
      return "";
    }

    const maskingSource =
      activeSoundParams
        .sources?.find(
          (source) =>
            source.role ===
            "tinnitus_masking",
        );

    if (
      maskingSource?.waveform ===
      "pink_noise"
    ) {
      return "+ 노치 핑크노이즈";
    }

    return "";
  };

  /*
   * =========================
   * 개인화 사운드 재생
   * =========================
   */
  const handlePlayToggle =
    async () => {
      if (!activeSoundParams) {
        console.warn(
          "재생할 개인화 사운드가 없습니다.",
        );

        return;
      }

      try {
        /*
         * 자연음 미리듣기가 재생 중이면
         * 먼저 종료
         */
        stopNatureAudio();
        setPreviewPlayingId(null);

        /*
         * 최초 재생
         */
        if (
          !hasStartedPersonalSound
        ) {
          await playRecoveryAudio(
            activeSoundParams,
          );

          setHasStartedPersonalSound(
            true,
          );

          setPlaying(true);

          return;
        }

        /*
         * 일시정지
         */
        if (playing) {
          await pauseRecoveryAudio();

          setPlaying(false);

          return;
        }

        /*
         * 다시 재생
         */
        await resumeRecoveryAudio();

        setPlaying(true);
      } catch (error) {
        console.error(
          "개인화 사운드 재생 실패",
          error,
        );
      }
    };

  /*
   * =========================
   * 자연음 미리듣기
   * =========================
   */
  const handlePreviewPlay =
    async (
      soundId: number,
    ) => {
      const sound =
        PREVIEW_SOUNDS.find(
          (item) =>
            item.id ===
            soundId,
        );

      if (!sound) {
        return;
      }

      /*
       * 같은 자연음 다시 클릭
       * → 정지
       */
      if (
        previewPlayingId ===
        soundId
      ) {
        stopNatureAudio();

        setPreviewPlayingId(
          null,
        );

        return;
      }

      try {
        /*
         * 개인화 사운드가 재생 중이면
         * 미리듣기 전에 종료
         */
        stopRecoveryAudio();

        setPlaying(false);

        setHasStartedPersonalSound(
          false,
        );

        await playNatureAudio(
          sound.audio,
        );

        setPreviewPlayingId(
          soundId,
        );
      } catch (error) {
        console.error(
          "자연음 재생 실패",
          error,
        );
      }
    };

  return (
    <div className="flex min-h-full flex-col px-5 pb-[96px]">
      <main className="pt-10">
        <h1 className="text-[28px] font-bold text-text-primary">
          사운드
        </h1>

        {/* 개인화 사운드 */}
        <div
          className="
            mt-10
            w-full
            rounded-[20px]
            border
            border-[#2B8E78]
            bg-[#103D30]
            px-4
            py-5
          "
        >
          {/* 상세 화면 이동 */}
          <button
            type="button"
            onClick={() => {
              if (
                hasPersonalizedProfile
              ) {
                navigate(
                  "/sound/my-sound",
                );
              }
            }}
            className="
              block
              w-full
              text-left
            "
          >
            <div
              className="
                flex
                items-center
                gap-1
                font-sans
                text-[11px]
                font-bold
                leading-normal
                text-[#60CEA7]
              "
            >
              <span>
                개인화 사운드
              </span>

              <span
                className="
                  flex
                  h-[14px]
                  w-[14px]
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-[#60CEA7]
                  text-[9px]
                "
              >
                i
              </span>
            </div>

            {/* 개인화 사운드 상태 */}
            <p
              className="
                mt-4
                font-sans
                text-[22px]
                font-bold
                text-text-primary
              "
            >
              {!hasPersonalizedProfile
                ? "개인화 회복 사운드가 없습니다."
                : !canPlayPersonalizedSound
                  ? "개인화 회복 사운드"
                  : getBackgroundSoundLabel()}
            </p>

            {!canPlayPersonalizedSound ? (
              <p
                className="
                  mt-1
                  font-sans
                  text-[14px]
                  font-medium
                  leading-normal
                  text-[#809EA8]
                "
              >
                {hasPersonalizedProfile
                  ? "회복 세션 기록이 생기면 다시 들어볼 수 있어요."
                  : "음역 매칭으로 개인화를 시작해보세요."}
              </p>
            ) : (
              getNoiseLabel() && (
                <p
                  className="
                    mt-1
                    font-sans
                    text-[14px]
                    font-medium
                    leading-normal
                    text-[#809EA8]
                  "
                >
                  {getNoiseLabel()}
                </p>
              )
            )}

          </button>

          <div
            className="
              mt-6
              flex
              items-center
              gap-4
            "
          >
            {/* 파형 클릭 → 상세 이동 */}
            <button
              type="button"
              onClick={() => {
                if (
                  hasPersonalizedProfile
                ) {
                  navigate(
                    "/sound/my-sound",
                  );
                }
              }}
              className="
                flex
                h-[58px]
                min-w-0
                flex-1
                items-center
                gap-[3px]
              "
              aria-label="나만의 사운드 정보 보기"
            >
            {MAIN_WAVE_HEIGHTS.map(
              (
                height,
                index,
              ) => (
                <span
                  key={index}
                  className={`
                    min-w-[3px]
                    flex-1
                    rounded-full
                    bg-[#60CEA7]
                    origin-center
                    ${
                      playing
                        ? "animate-[soundWave_0.9s_ease-in-out_infinite_alternate]"
                        : ""
                    }
                  `}
                  style={{
                    height: `${height}px`,
                    animationDelay: playing
                      ? `${index * 35}ms`
                      : undefined,
                    animationDuration: playing
                      ? `${700 + (index % 5) * 90}ms`
                      : undefined,
                  }}
                />
              ),
            )}
            </button>

            {/* 실제 개인화 사운드 재생 */}
            <button
              type="button"
              disabled={
                !canPlayPersonalizedSound
              }
              onClick={
                handlePlayToggle
              }
              aria-label={
                !canPlayPersonalizedSound
                  ? "회복 세션 시작 후 재생 가능"
                  : playing
                    ? "일시정지"
                    : "재생"
              }
              className="
                flex
                h-11
                w-11
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
                  h-[20px]
                  w-[20px]
                "
              />
            </button>
          </div>
        </div>

        {/* 다른 소리 들어보기 */}
        <section className="mt-9">
          <h2 className="text-[16px] font-bold text-text-primary">
            다른 소리 들어보기
          </h2>

          <div className="mt-4 flex justify-between gap-2">
            {PREVIEW_SOUNDS.map(
              (sound) => {
                const isPlaying =
                  previewPlayingId ===
                  sound.id;

                return (
                  <button
                    key={sound.id}
                    type="button"
                    onClick={() =>
                      handlePreviewPlay(
                        sound.id,
                      )
                    }
                    className={`
                      relative
                      h-[86px]
                      w-[82px]
                      shrink-0
                      rounded-[16px]
                      border
                      transition-colors
                      ${
                        isPlaying
                          ? "border-[#2B8E78] bg-[#12382E]"
                          : "border-[#24464A] bg-[#102126]"
                      }
                    `}
                  >
                    {/* 파형 */}
                    <div
                      className="
                        absolute
                        left-1/2
                        top-[15px]
                        flex
                        h-[24px]
                        -translate-x-1/2
                        items-center
                        justify-center
                        gap-[3px]
                      "
                      aria-hidden="true"
                    >
                      {sound.heights.map(
                        (
                          height,
                          waveIndex,
                        ) => (
                          <span
                            key={
                              waveIndex
                            }
                            className={`
                              w-[3px]
                              shrink-0
                              rounded-full
                              bg-[#61DBB8]
                              origin-center
                              ${
                                isPlaying
                                  ? "animate-[soundWave_0.8s_ease-in-out_infinite_alternate]"
                                  : ""
                              }
                            `}
                            style={{
                              height: `${height}px`,

                              animationDelay:
                                isPlaying
                                  ? `${waveIndex * 70}ms`
                                  : undefined,

                              animationDuration:
                                isPlaying
                                  ? `${
                                      550 +
                                      (waveIndex % 4) *
                                        110
                                    }ms`
                                  : undefined,
                            }}
                          />
                        ),
                      )}
                    </div>

                    {/* 자연음 이름 */}
                    <span
                      className="
                        absolute
                        left-0
                        top-[50px]
                        w-full
                        text-center
                        font-sans
                        text-[11px]
                        font-bold
                        leading-[13px]
                        text-[#F0F7FA]
                      "
                    >
                      {sound.title}
                    </span>

                    {/* 재생중 */}
                    {isPlaying && (
                      <span
                        className="
                          absolute
                          left-0
                          top-[67px]
                          w-full
                          text-center
                          font-sans
                          text-[9px]
                          font-medium
                          leading-[11px]
                          text-[#61DBB8]
                        "
                      >
                        재생중
                      </span>
                    )}
                  </button>
                );
              },
            )}
          </div>
        </section>

        {/* 사운드 설정 */}
        <section className="mt-9">
          <h2 className="text-[16px] font-bold text-text-primary">
            사운드 설정
          </h2>

          <button
            type="button"
            disabled={!canPlayPersonalizedSound}
            onClick={() => {
              if (!canPlayPersonalizedSound) {
                return;
              }

              navigate(
                "/sound/change-nature",
              );
            }}
            className={`
              mt-4
              flex
              w-full
              items-center
              justify-between
              rounded-[14px]
              border
              px-4
              py-5
              text-left
              ${
                canPlayPersonalizedSound
                  ? `
                    border-[#24464A]
                    bg-[#102126]
                  `
                  : `
                    border-[#1B3339]
                    bg-[#0D1B1F]
                    opacity-50
                  `
              }
            `}
          >
            <div>
              <p className="text-[14px] font-semibold text-text-primary">
                자연음 바꾸기
              </p>

              <p className="mt-2 text-[11px] text-text-secondary">
                {canPlayPersonalizedSound
                  ? "비 · 시냇물 · 파도 · 공기음"
                  : "첫 회복 세션 이후 변경할 수 있어요."}
              </p>
            </div>

            <span className="text-[24px] font-light text-text-primary">
              ›
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopNatureAudio();
              stopRecoveryAudio();

              sessionStorage.removeItem(
                "somni-current-sound-session-id",
              );

              sessionStorage.removeItem(
                "somni-sound-setup-completed",
              );

              sessionStorage.removeItem(
                "somni-pitch-match-session",
              );

              sessionStorage.removeItem(
                "somni-selected-nature-sound",
              );

              sessionStorage.removeItem(
                "somni-selected-nature-sound-label",
              );

              sessionStorage.removeItem(
                "somni-previous-nature-sound-label",
              );

              sessionStorage.setItem(
                "somni-personal-sound-pending",
                "true",
              );

              navigate("/frequency");
            }}
            className="
              mt-3
              flex
              w-full
              items-center
              justify-between
              rounded-[14px]
              border
              border-[#24464A]
              bg-[#102126]
              px-4
              py-5
              text-left
            "
          >
            <div>
              <p className="text-[14px] font-semibold text-text-primary">
                음역대 다시 측정하기
              </p>

              <p className="mt-2 text-[11px] text-text-secondary">
                음역 매칭 · 볼륨 조절
              </p>
            </div>

            <span className="text-[24px] font-light text-text-primary">
              ›
            </span>
          </button>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

export default SoundPage;