import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import plusIcon from "../../assets/icons/Plus.svg";
import minusIcon from "../../assets/icons/Minus.svg";

import {
  playMixingPointNoise,
  setMixingPointGain,
  stopTinnitusAudio,
} from "../../audio/tinnitusAudio";

import {
  saveMixingPoint,
} from "../../services/tinnitusService";

import {
  getPitchMatchSession,
} from "../../utils/pitchMatchStorage";

type SoundSetupScreen =
  | "ready"
  | "mixing";

const READY_WAVE_HEIGHTS = [
  40, 42, 44, 46, 46, 44, 42, 40,
  38, 36, 34, 32, 30, 28, 28, 30,
  32, 34, 36, 38, 40, 42, 44, 46,

  // 가운데 notch
  12, 12, 12, 12,

  38, 40, 42, 44, 46, 48, 46, 44,
  42, 40, 38, 36, 34, 32, 30, 30,
  32, 34, 36, 38, 40, 42, 44, 44,
];

const MIXING_WAVE_HEIGHTS = [
  48, 42, 34, 28, 24, 22, 24, 28,
  34, 42, 48, 52, 48, 42, 34, 28,
  24, 22, 24, 28, 36, 44, 50, 52,
  48, 42, 34, 28, 24, 22, 24, 28,
  36, 44, 50, 52, 48, 42, 34, 28,
  24, 22, 24, 30, 38, 46, 52,
];

const NOTCH_START = 24;
const NOTCH_END = 27;

/*
 * sound/services.py 기준
 */
const MAX_MIXING_GAIN = 0.6;

function volumeToGain(
  volume: number,
) {
  return (
    (volume / 100) *
    MAX_MIXING_GAIN
  );
}

function SoundSetupPage() {
  const navigate = useNavigate();

  const [screen, setScreen] =
    useState<SoundSetupScreen>(
      "ready",
    );

  const [volume, setVolume] =
    useState(22);

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /*
   * FrequencyPage에서 저장해둔
   * 현재 PitchMatchSession
   */
  const pitchMatchSession =
    getPitchMatchSession();

  /*
   * 페이지 자체를 나갈 때
   * 소리가 계속 재생되지 않도록 정리
   */
  useEffect(() => {
    return () => {
      stopTinnitusAudio();
    };
  }, []);
  useEffect(() => {
    const setupCompleted =
      sessionStorage.getItem(
        "somni-sound-setup-completed",
      );

    if (setupCompleted === "true") {
      navigate(
        "/recovery-session",
        {
          replace: true,
        },
      );
    }
  }, [navigate]);
  /*
   * 준비 화면 → 혼합점 화면
   *
   * 사용자가 "다음"을 직접 눌렀기 때문에
   * 브라우저 오디오 재생 정책에도 걸리지 않음.
   */
  const handleNext = async () => {
    if (
      !pitchMatchSession
        ?.center_frequency
    ) {
      setErrorMessage(
        "음역 정보를 불러오지 못했어요.",
      );

      return;
    }

    setErrorMessage("");

    const gain =
      volumeToGain(volume);

    try {
      await playMixingPointNoise(
        pitchMatchSession
          .center_frequency,
        gain,
      );

      setScreen("mixing");
    } catch (error) {
      console.error(
        "혼합점 사운드 재생 실패",
        error,
      );

      setErrorMessage(
        "사운드를 재생하지 못했어요.",
      );
    }
  };

  /*
   * 모든 볼륨 변경은
   * 이 함수를 거치도록 통일
   */
  const updateVolume = (
    nextVolume: number,
  ) => {
    const safeVolume =
      Math.max(
        0,
        Math.min(
          nextVolume,
          100,
        ),
      );

    setVolume(safeVolume);

    const gain =
      volumeToGain(
        safeVolume,
      );

    setMixingPointGain(gain);
  };

  const handleVolumeDown = () => {
    updateVolume(
      volume - 1,
    );
  };

  const handleVolumeUp = () => {
    updateVolume(
      volume + 1,
    );
  };

  const handleVolumeChange = (
    value: number,
  ) => {
    updateVolume(value);
  };

  /*
   * 혼합점 저장
   */
  const handleStart = async () => {
    if (
      !pitchMatchSession
    ) {
      setErrorMessage(
        "음역 매칭 정보를 찾지 못했어요.",
      );

      return;
    }

    if (isSaving) {
      return;
    }

    const mixingPointGain =
      volumeToGain(
        volume,
      );

    try {
      setIsSaving(true);
      setErrorMessage("");

      stopTinnitusAudio();

      await saveMixingPoint(
        pitchMatchSession.id,
        mixingPointGain,
      );

        // 혼합점 설정 완료 표시
        sessionStorage.setItem(
          "somni-sound-setup-completed",
          "true",
        );

        navigate(
          "/recovery-session",
          { replace: true },
        );
    } catch (error) {
      console.error(
        "혼합점 저장 실패",
        error,
      );

      setErrorMessage(
        "볼륨 설정을 저장하지 못했어요.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * Header 뒤로가기
   */
  const handlePreviousScreen =
    useCallback(() => {
      stopTinnitusAudio();

      /*
       * 혼합점
       * → 노이즈 준비
       */
      if (
        screen === "mixing"
      ) {
        setScreen("ready");

        return;
      }

      /*
       * 노이즈 준비
       * → 자연음 선택
       */
      if (
        screen === "ready"
      ) {
        navigate(
          "/nature-sound",
        );
      }
    }, [
      screen,
      navigate,
    ]);

  useEffect(() => {
    window.addEventListener(
      "sound-setup-back",
      handlePreviousScreen,
    );

    return () => {
      window.removeEventListener(
        "sound-setup-back",
        handlePreviousScreen,
      );
    };
  }, [
    handlePreviousScreen,
  ]);

  /*
   * =========================
   * 첫 번째 화면
   * 사운드 준비
   * =========================
   */
  if (screen === "ready") {
    return (
      <div className="flex min-h-full flex-col px-5 pb-6">
        <section className="pt-8">
          <h1
            className="
              font-sans
              text-[24px]
              font-bold
              leading-[36px]
              text-[#ECF3F2]
            "
          >
            이명 대역을 참고하여
            <br />
            노이즈를 준비했어요.
          </h1>

          <div
            className="
              mt-10
              rounded-[1rem]
              border
              border-[#236653]
              bg-[#103329]
              px-4
              py-7
            "
          >
            <div className="flex h-[72px] w-full items-center justify-center gap-[2px]">
              {READY_WAVE_HEIGHTS.map(
                (
                  height,
                  index,
                ) => {
                  const isNotch =
                    index >=
                      NOTCH_START &&
                    index <=
                      NOTCH_END;

                  return (
                    <span
                      key={index}
                      className={
                        isNotch
                          ? "w-[4px] shrink-0 rounded-[2px] bg-[rgba(243,197,106,0.55)]"
                          : "min-w-[3px] flex-1 rounded-full bg-[#60CEA7]"
                      }
                      style={{
                        height:
                          isNotch
                            ? "12px"
                            : `${height}px`,
                      }}
                    />
                  );
                },
              )}
            </div>

            <div
              className="
                mt-2
                flex
                justify-center
                gap-5
                text-[0.6875rem]
                text-text-secondary
              "
            >
              <span>
                {Math.round(
                  pitchMatchSession
                    ?.lower_bound ??
                    0,
                ).toLocaleString()}
                Hz
              </span>

              <span>
                {Math.round(
                  pitchMatchSession
                    ?.upper_bound ??
                    0,
                ).toLocaleString()}
                Hz
              </span>
            </div>
          </div>

          <div
            className="
              mt-5
              rounded-[0.875rem]
              border
              border-[#24464A]
              bg-[#102126]
              p-4
            "
          >
            <h2 className="text-[0.875rem] font-bold text-text-primary">
              이번 사운드 구성
            </h2>

            <div className="mt-3 h-px bg-[#294A4F]" />

            <div className="mt-5 flex justify-between">
              <span className="text-[0.75rem] text-text-secondary">
                원본 자연음
              </span>

              <span className="text-[0.75rem] font-semibold text-text-primary">
                잔잔한 빗소리
              </span>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-[0.75rem] text-text-secondary">
                맞춤 노이즈
              </span>

              <span className="text-[0.75rem] font-semibold text-text-primary">
                핑크노이즈
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2">
            <span className="text-[0.75rem] text-[#87A3A7]">
              ⓘ
            </span>

            <div className="text-[0.6875rem] leading-5 text-text-secondary">
              <p>
                맞춤 노이즈는 어떻게
                만들어지나요?
              </p>

              <p className="mt-2">
                이명 음역을 기준으로 해당
                음역대가 줄어들도록 소리를
                조정해요.
                <br />
                이러한 방식을 노치
                사운드(Notched Sound)라고
                해요.
              </p>
            </div>
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
            onClick={
              handleNext
            }
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
        </div>
      </div>
    );
  }

  /*
   * =========================
   * 두 번째 화면
   * 혼합점 / 볼륨 조절
   * =========================
   */

  return (
    <div className="flex min-h-full flex-col px-5 pb-6">
      <section className="pt-8">
        <h1
          className="
            font-sans
            text-[24px]
            font-bold
            leading-[36px]
            text-[#ECF3F2]
          "
        >
          이명이 노이즈랑 자연스럽게
          <br />
          어울리는 지점을 찾아보세요.
        </h1>

        <div
          className="
            mt-10
            rounded-[1rem]
            border
            border-[#236653]
            bg-[#103329]
            p-5
          "
        >
          <p className="text-[0.6875rem] font-semibold text-[#60CEA7]">
            현재 볼륨
          </p>

          <p className="mt-2 text-[2rem] font-bold text-text-primary">
            {volume}%
          </p>

          <div className="mt-3 flex h-[72px] w-full items-center gap-[2px]">
            {MIXING_WAVE_HEIGHTS.map(
              (
                height,
                index,
              ) => {
                const volumeScale =
                  0.35 +
                  volume * 0.009;

                return (
                  <span
                    key={index}
                    className="
                      min-w-[3px]
                      flex-1
                      rounded-full
                      bg-[#60CEA7]
                      transition-[height]
                      duration-150
                    "
                    style={{
                      height: `${Math.max(
                        6,
                        height *
                          volumeScale,
                      )}px`,
                    }}
                  />
                );
              },
            )}
          </div>
        </div>

        <div className="mt-7 flex w-full items-center justify-between">
          <button
            type="button"
            onClick={
              handleVolumeDown
            }
            aria-label="볼륨 낮추기"
            className="
              flex
              h-[35px]
              w-[35px]
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-[#2B8E78]
            "
          >
            <img
              src={minusIcon}
              alt=""
              className="h-5 w-5"
            />
          </button>

          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(
              event,
            ) =>
              handleVolumeChange(
                Number(
                  event.target
                    .value,
                ),
              )
            }
            aria-label="볼륨 조절"
            className="
              mx-5
              min-w-0
              flex-1
              accent-[#60CEA7]
            "
          />

          <button
            type="button"
            onClick={
              handleVolumeUp
            }
            aria-label="볼륨 높이기"
            className="
              flex
              h-[35px]
              w-[35px]
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-[#2B8E78]
            "
          >
            <img
              src={plusIcon}
              alt=""
              className="h-5 w-5"
            />
          </button>
        </div>

        <div className="mt-[40px] flex items-start gap-[11px]">
          <span
            className="
              shrink-0
              text-[15px]
              leading-none
              text-[#809EA8]
            "
            aria-hidden="true"
          >
            ⓘ
          </span>

          <div className="min-w-0">
            <p className="text-[12px] text-[#809EA8]">
              무엇을 기준으로 조절하면 되나요?
            </p>

            <p className="mt-[8px] text-[11px] leading-normal text-[#809EA8]">
              이명이 완전히 들리지 않는다면 볼륨을 조금 낮춰주세요.
              <br />
              반대로 이명이 커서 신경 쓰인다면 볼륨을 키워주세요.
            </p>

            {errorMessage && (
              <p className="mt-3 text-[12px] text-[#F09292]">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="mt-auto pt-10">
        <button
          type="button"
          disabled={isSaving}
          onClick={
            handleStart
          }
          className={`
            h-14
            w-full
            rounded-[0.75rem]
            text-[0.875rem]
            font-bold
            ${
              isSaving
                ? "bg-[#214750] text-[#0D1719]"
                : "bg-[#60CEA7] text-[#07100D]"
            }
          `}
        >
          {isSaving
            ? "저장 중..."
            : "시작하기"}
        </button>
      </div>
    </div>
  );
}

export default SoundSetupPage;