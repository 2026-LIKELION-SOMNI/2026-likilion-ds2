import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  stopTinnitusAudio,
} from "../../audio/tinnitusAudio";

import {
  saveMixingPoint,
} from "../../services/tinnitusService";

import {
  getPitchMatchSession,
} from "../../utils/pitchMatchStorage";

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

const NOTCH_START = 24;
const NOTCH_END = 27;

/*
 * sound/services.py 기준
 */
const MAX_MIXING_GAIN = 0.6;

/*
 * 기존 혼합점 화면의 초기값이 22%였으므로
 * 초기 플로우에서는 이 값을 기본값으로 저장
 */
const DEFAULT_VOLUME = 22;

const DEFAULT_MIXING_GAIN =
  (DEFAULT_VOLUME / 100) *
  MAX_MIXING_GAIN;

function SoundSetupPage() {
  const navigate = useNavigate();

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

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
   * 페이지 이탈 시 소리 정리
   */
  useEffect(() => {
    return () => {
      stopTinnitusAudio();
    };
  }, []);

  /*
   * 이미 노이즈 준비 단계를 완료했다면
   * 다시 들어왔을 때 회복 세션으로 이동
   */
  useEffect(() => {
    const setupCompleted =
      sessionStorage.getItem(
        "somni-sound-setup-completed",
      );

    if (setupCompleted === "true") {
      navigate(
        "/sound-fit",
        {
          replace: true,
        },
      );
    }
  }, [navigate]);

  /*
   * 노이즈 준비 완료
   * → 기본 mixing gain 저장
   * → 바로 회복 세션 이동
   */
  const handleStartRecovery =
    async () => {
      if (!pitchMatchSession) {
        setErrorMessage(
          "음역 매칭 정보를 찾지 못했어요.",
        );

        return;
      }

      if (isSaving) {
        return;
      }

      try {
        setIsSaving(true);
        setErrorMessage("");

        stopTinnitusAudio();

        /*
         * 별도의 혼합점 화면을
         * 초기 플로우에서 거치지 않으므로
         * 기본값 22%에 해당하는 gain 저장
         */
        await saveMixingPoint(
          pitchMatchSession.id,
          DEFAULT_MIXING_GAIN,
        );

        sessionStorage.setItem(
          "somni-sound-setup-completed",
          "true",
        );

        navigate(
          "/sound-fit",
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          "기본 볼륨 저장 실패",
          error,
        );

        setErrorMessage(
          "사운드 설정을 저장하지 못했어요.",
        );
      } finally {
        setIsSaving(false);
      }
    };

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

        {/* 노치 파형 */}
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

        {/* 이번 사운드 구성 */}
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

        {/* 설명 */}
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

      {/* 바로 회복 세션으로 */}
      <div className="mt-auto pt-10">
        <button
          type="button"
          disabled={isSaving}
          onClick={
            handleStartRecovery
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
            ? "준비 중..."
            : "다음"}
        </button>
      </div>
    </div>
  );
}

export default SoundSetupPage;