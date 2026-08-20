import { useEffect, useState } from "react";
import { useLocation, useNavigate, } from "react-router-dom";
import plusIcon from "../../assets/icons/Plus.svg";
import minusIcon from "../../assets/icons/Minus.svg";
import {
  generateTodaySound,
} from "../../api/sound";

import {
  getUserUuid,
} from "../../utils/userStorage";
import {
  playMixingPointNoise,
  setMixingPointGain,
  stopTinnitusAudio,
} from "../../audio/tinnitusAudio";

import {
  getPitchMatchSession,
  savePitchMatchSession,
} from "../../utils/pitchMatchStorage";

import {
  getMatchingResult,
  saveMixingPoint,
  type PitchMatchSession,
} from "../../services/tinnitusService";

const MIXING_WAVE_HEIGHTS = [
  48, 42, 34, 28, 24, 22, 24, 28,
  34, 42, 48, 52, 48, 42, 34, 28,
  24, 22, 24, 28, 36, 44, 50, 52,
  48, 42, 34, 28, 24, 22, 24, 28,
  36, 44, 50, 52, 48, 42, 34, 28,
  24, 22, 24, 30, 38, 46, 52,
];

const MAX_MIXING_GAIN = 0.6;
const INITIAL_VOLUME = 22;

function volumeToGain(
  volume: number,
) {
  return (
    (volume / 100) *
    MAX_MIXING_GAIN
  );
}

function MixingPointPage() {
  const navigate = useNavigate();
    const location = useLocation();

    const shouldRelax =
      Boolean(
        (
          location.state as
            | {
                shouldRelax?: boolean;
              }
            | null
        )?.shouldRelax,
      );

  /*
   * 음역 매칭 세션
   *
   * sessionStorage에 값이 없는 경우(세션 재진입 등)를 대비해
   * state로 관리하고, 없으면 서버에서 다시 조회한다.
   */
  const [
    pitchMatchSession,
    setPitchMatchSession,
  ] = useState<PitchMatchSession | null>(
    getPitchMatchSession(),
  );

  const [
    isRestoringSession,
    setIsRestoringSession,
  ] = useState(false);

  const [
    volume,
    setVolume,
  ] = useState(
    INITIAL_VOLUME,
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  /*
   * 혼합점 저장 후
   * 회복 세션 시작
   */
  const handleStart =
    async () => {
      /*
       * 저장 요청 중에는
       * 중복 요청 방지
       */
      if (isSaving) {
        return;
      }

      if (!pitchMatchSession) {
        setErrorMessage(
          "음역 매칭 정보를 찾지 못했어요.",
        );
        return;
      }

      try {
        setIsSaving(true);
        setErrorMessage("");

        const mixingPointGain =
          volumeToGain(volume);

        stopTinnitusAudio();

        await saveMixingPoint(
          pitchMatchSession.id,
          mixingPointGain,
        );

        const uuid =
          getUserUuid();

        if (!uuid) {
          throw new Error(
            "사용자 UUID가 없습니다.",
          );
        }

        const selectedBackground =
          sessionStorage.getItem(
            "somni-selected-nature-sound",
          ) as
            | "rain"
            | "stream"
            | "ocean"
            | "air"
            | null;

        const soundSession =
          await generateTodaySound(
            uuid,
            false,
            selectedBackground ?? undefined,
          );

        sessionStorage.setItem(
          "somni-current-sound-session-id",
          soundSession.session_id,
        );

        sessionStorage.setItem(
          "somni-sound-setup-completed",
          "true",
        );

        sessionStorage.removeItem(
          "somni-personal-sound-pending",
        );

        navigate(
          shouldRelax
            ? "/relaxation"
            : "/recovery-session",
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(
          "혼합점 저장 실패",
          error,
        );

        setErrorMessage(
          "볼륨 설정을 저장하지 못했어요.",
        );

        /*
         * 실패한 경우에만
         * 다시 시도할 수 있도록 해제
         */
        setIsSaving(false);
      }
    };

  /*
   * 페이지 진입 시
   * sessionStorage에 음역 매칭 정보가 없으면
   * (세션 재진입, 탭 재시작 등)
   * 서버에서 최신 완료 결과를 다시 조회해 복원한다.
   */
  useEffect(() => {
    if (pitchMatchSession?.center_frequency) {
      return;
    }

    const restoreSession = async () => {
      try {
        setIsRestoringSession(true);
        setErrorMessage("");

        const result = await getMatchingResult();

        setPitchMatchSession(result);
        savePitchMatchSession(result);
      } catch (error) {
        console.error(
          "음역 매칭 결과 재조회 실패",
          error,
        );

        setErrorMessage(
          "음역 정보를 불러오지 못했어요.",
        );
      } finally {
        setIsRestoringSession(false);
      }
    };

    void restoreSession();
    // 최초 마운트 시 1회만 재조회 시도
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * 페이지 진입 시 / 세션 복원 완료 시
   * 현재 기본 볼륨으로 사운드 재생
   */
  useEffect(() => {
    const startAudio =
      async () => {
        if (
          !pitchMatchSession
            ?.center_frequency
        ) {
          /*
           * 아직 서버에서 세션을 복원하는 중일 수 있으므로
           * 여기서는 에러 문구를 세팅하지 않는다.
           * (복원 실패 시엔 위 useEffect에서 이미 세팅됨)
           */
          return;
        }

        try {
          const gain =
            volumeToGain(
              INITIAL_VOLUME,
            );

          await playMixingPointNoise(
            pitchMatchSession
              .center_frequency,
            gain,
          );
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

    void startAudio();

    return () => {
      stopTinnitusAudio();
    };
  }, [
    pitchMatchSession?.center_frequency,
  ]);

  /*
   * 모든 볼륨 변경은
   * 이 함수 사용
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

    setVolume(
      safeVolume,
    );

    const gain =
      volumeToGain(
        safeVolume,
      );

    setMixingPointGain(
      gain,
    );
  };

  const handleVolumeDown =
    () => {
      updateVolume(
        volume - 1,
      );
    };

  const handleVolumeUp =
    () => {
      updateVolume(
        volume + 1,
      );
    };

  const handleVolumeChange =
    (
      value: number,
    ) => {
      updateVolume(
        value,
      );
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
          이명이 노이즈랑 자연스럽게
          <br />
          어울리는 지점을 찾아보세요.
        </h1>

        {/* 현재 볼륨 */}
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
                  volume *
                    0.009;

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

        {/* 볼륨 조절 */}
        <div className="mt-7 flex w-full items-center justify-between">
          <button
            type="button"
            onClick={
              handleVolumeDown
            }
            disabled={
              isSaving ||
              isRestoringSession
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
              disabled:opacity-50
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
            disabled={
              isSaving ||
              isRestoringSession
            }
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
              disabled:opacity-50
            "
          />

          <button
            type="button"
            onClick={
              handleVolumeUp
            }
            disabled={
              isSaving ||
              isRestoringSession
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
              disabled:opacity-50
            "
          >
            <img
              src={plusIcon}
              alt=""
              className="h-5 w-5"
            />
          </button>
        </div>

        {/* 설명 */}
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
              이명이 완전히 들리지 않는다면
              볼륨을 조금 낮춰주세요.
              <br />
              반대로 이명이 커서 신경 쓰인다면
              볼륨을 키워주세요.
            </p>

            {isRestoringSession && (
              <p className="mt-3 text-[12px] text-[#809EA8]">
                음역 정보를 불러오는 중이에요...
              </p>
            )}

            {!isRestoringSession &&
              errorMessage && (
                <p className="mt-3 text-[12px] text-[#F09292]">
                  {
                    errorMessage
                  }
                </p>
              )}
          </div>
        </div>
      </section>

      {/* 저장 */}
      <div className="mt-auto pt-10">
        <button
          type="button"
          disabled={
            isSaving ||
            isRestoringSession ||
            !pitchMatchSession
          }
          onClick={() => {
            void handleStart();
          }}
          className="
            h-14
            w-full
            rounded-[0.75rem]
            bg-[#60CEA7]
            text-[0.875rem]
            font-bold
            text-[#07100D]
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {isSaving
            ? "저장 중..."
            : isRestoringSession
              ? "불러오는 중..."
              : "시작하기"}
        </button>
      </div>
    </div>
  );
}

export default MixingPointPage;
