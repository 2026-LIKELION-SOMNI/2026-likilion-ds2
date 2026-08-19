import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import GuideEqualizer from "../../components/relaxation/GuideEqualizer";
import GuideLyrics from "../../components/relaxation/GuideLyrics";
import { toErrorMessage } from "../../api/client";
import {
  cancelRelaxationSession,
  completeRelaxationSession,
} from "../../api/relaxation";
import type { RelaxationSession } from "../../api/relaxation";
import {
  getActiveLineIndex,
  getRelaxationGuide,
  resolveGuideAudioUrl,
} from "./guideScript";
import {
  playNatureAudio,
  stopNatureAudio,
} from "../../audio/natureAudio";
import natureAudioSource from "../../assets/audio/nature/rain.mp3";
import { getUserUuid } from "../../utils/userStorage";

const NEXT_PATH = "/recovery-session";

const TICK_MS = 200;

interface RelaxationSessionLocationState {
  session?: RelaxationSession;
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(
    0,
    Math.floor(seconds),
  );

  const minutes = Math.floor(
    safeSeconds / 60,
  );

  const restSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0",
  )}:${String(restSeconds).padStart(2, "0")}`;
}

function RelaxationSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const session = (
    location.state as
      | RelaxationSessionLocationState
      | null
  )?.session;

  const guide = session
    ? getRelaxationGuide(session.activity_type)
    : null;

  const audioRef = useRef<HTMLAudioElement | null>(
    null,
  );

  const isAudioReadyRef = useRef(false);

  const isFinishingRef = useRef(false);

  const [isPlaying, setIsPlaying] =
    useState(true);

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const totalSeconds =
    guide?.durationSeconds ?? 0;

  const remainingSeconds = Math.max(
    0,
    totalSeconds - elapsedSeconds,
  );

  const progress =
    totalSeconds > 0
      ? Math.min(
          100,
          (elapsedSeconds / totalSeconds) * 100,
        )
      : 0;

  const activeIndex = useMemo(() => {
    if (!guide) {
      return 0;
    }

    return getActiveLineIndex(
      guide.lines,
      elapsedSeconds,
    );
  }, [elapsedSeconds, guide]);

  useEffect(() => {
    if (!session || !guide) {
      navigate("/relaxation", {
        replace: true,
      });
    }
  }, [guide, navigate, session]);

  useEffect(() => {
    if (!guide) {
      return;
    }

    const audio = new Audio(
      resolveGuideAudioUrl(guide.activityType),
    );

    audio.preload = "auto";
    audioRef.current = audio;

    const handleCanPlay = () => {
      isAudioReadyRef.current = true;
    };

    const handleAudioError = () => {
      isAudioReadyRef.current = false;
    };

    audio.addEventListener(
      "canplay",
      handleCanPlay,
    );

    audio.addEventListener(
      "error",
      handleAudioError,
    );

    audio.play().catch(() => {
      isAudioReadyRef.current = false;
    });

    if (guide.withNatureSound) {
      playNatureAudio(natureAudioSource).catch(() => {});
    }

    return () => {
      audio.removeEventListener(
        "canplay",
        handleCanPlay,
      );

      audio.removeEventListener(
        "error",
        handleAudioError,
      );

      audio.pause();
      audioRef.current = null;
      isAudioReadyRef.current = false;

      stopNatureAudio();
    };
  }, [guide]);

  useEffect(() => {
    if (!isPlaying || totalSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((previous) => {
        const audio = audioRef.current;

        const canUseAudioTime =
          audio !== null &&
          isAudioReadyRef.current &&
          !audio.paused;

        const next = canUseAudioTime
          ? audio.currentTime
          : previous + TICK_MS / 1000;

        return Math.min(next, totalSeconds);
      });
    }, TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPlaying, totalSeconds]);

  const finishSession = useCallback(async () => {
    const uuid = getUserUuid();

    if (
      !uuid ||
      !session ||
      isFinishingRef.current
    ) {
      return;
    }

    isFinishingRef.current = true;

    try {
      await completeRelaxationSession(
        uuid,
        session.id,
      );
    } catch (error) {
      setErrorMessage(
        toErrorMessage(
          error,
          "세션 완료 기록에 실패했어요.",
        ),
      );
    } finally {
      navigate(NEXT_PATH, { replace: true });
    }
  }, [navigate, session]);

  const handleCancel = useCallback(async () => {
    const uuid = getUserUuid();

    if (
      !uuid ||
      !session ||
      isFinishingRef.current
    ) {
      return;
    }

    isFinishingRef.current = true;

    audioRef.current?.pause();
    setIsPlaying(false);

    try {
      await cancelRelaxationSession(
        uuid,
        session.id,
      );
    } catch (error) {
      setErrorMessage(
        toErrorMessage(
          error,
          "중단 기록에 실패했어요.",
        ),
      );
    } finally {
      navigate(NEXT_PATH, { replace: true });
    }
  }, [navigate, session]);

  useEffect(() => {
    if (
      totalSeconds <= 0 ||
      elapsedSeconds < totalSeconds
    ) {
      return;
    }

    finishSession();
  }, [elapsedSeconds, finishSession, totalSeconds]);

  const handlePlayToggle = () => {
    const audio = audioRef.current;

    setIsPlaying((previous) => {
      const next = !previous;

      if (next) {
        audio?.play().catch(() => {});
      } else {
        audio?.pause();
      }

      return next;
    });
  };

  useEffect(() => {
    if (!guide) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("relaxation-header", {
        detail: {
          title: guide.headerTitle,
          showBackButton: false,
          actionLabel: "중단",
        },
      }),
    );
  }, [guide]);

  useEffect(() => {
    window.addEventListener(
      "relaxation-action",
      handleCancel,
    );

    return () => {
      window.removeEventListener(
        "relaxation-action",
        handleCancel,
      );
    };
  }, [handleCancel]);

  if (!guide) {
    return null;
  }

  return (
    <div
      className="
        flex
        min-h-full
        flex-col
        px-5
        pb-[2.5rem]
      "
    >
      <div className="pt-[3.5rem]">
        <GuideEqualizer isActive={isPlaying} />
      </div>

      <h1
        className="
          mt-[1.5rem]
          text-center
          font-sans
          text-[1.0625rem]
          font-bold
          leading-normal
          text-[#ECF3F2]
        "
      >
        {guide.sessionTitle}
      </h1>

      <div className="mt-[2rem]">
        <GuideLyrics
          lines={guide.lines}
          activeIndex={activeIndex}
        />
      </div>

      <div className="mt-auto pt-[2rem]">
        <p
          className="
            text-center
            font-sans
            text-[1.125rem]
            font-bold
            leading-normal
            text-[#ECF3F2]
          "
        >
          {formatTime(remainingSeconds)}
        </p>

        <div className="mt-[0.75rem]">
          <div
            className="
              h-[0.25rem]
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
                transition-[width]
                duration-200
                ease-linear
              "
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="
              mt-[1rem]
              text-center
              font-sans
              text-[0.75rem]
              font-normal
              leading-[1.125rem]
              text-[#E5484D]
            "
          >
            {errorMessage}
          </p>
        )}

      </div>

      <div className="mt-auto pt-[2rem]">
        <p
          className="
            text-center
            font-sans
            text-[0.75rem]
            font-normal
            leading-normal
            text-[#8DA2A6]
          "
        >
          화면을 꺼도 오디오는 계속돼요
        </p>

        <button
          type="button"
          onClick={handlePlayToggle}
          className="
            mt-[1rem]
            flex
            h-[3.375rem]
            w-full
            items-center
            justify-center
            rounded-[0.875rem]
            bg-[#173832]
            font-sans
            text-[0.875rem]
            font-bold
            text-[#B9D6CE]
            transition-opacity
            active:opacity-70
          "
        >
          {isPlaying ? "일시정지" : "다시 재생"}
        </button>
      </div>
    </div>
  );
}

export default RelaxationSessionPage;
