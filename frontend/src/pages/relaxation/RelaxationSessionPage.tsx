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
import {
  isSpeechSupported,
  speakGuideLine,
  stopSpeech,
} from "../../audio/guideSpeech";
import airAudio from "../../assets/audio/nature/air.mp3";
import oceanAudio from "../../assets/audio/nature/ocean.mp3";
import rainAudio from "../../assets/audio/nature/rain.mp3";
import streamAudio from "../../assets/audio/nature/stream.mp3";
import { getUserUuid } from "../../utils/userStorage";

const NEXT_PATH = "/mixing-point";

const TICK_MS = 200;

const NATURE_AUDIO_SOURCES: Record<
  string,
  string
> = {
  rain: rainAudio,
  stream: streamAudio,
  ocean: oceanAudio,
  air: airAudio,
};

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

function resolveNatureAudioSource() {
  const selected = sessionStorage.getItem(
    "somni-selected-nature-sound",
  );

  return (
    NATURE_AUDIO_SOURCES[selected ?? ""] ??
    rainAudio
  );
}

function getElapsedFromStartedAt(
  startedAt: string | null | undefined,
) {
  if (!startedAt) {
    return 0;
  }

  const startedTime = new Date(
    startedAt,
  ).getTime();

  if (Number.isNaN(startedTime)) {
    return 0;
  }

  return Math.max(
    0,
    (Date.now() - startedTime) / 1000,
  );
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

  const totalSeconds =
    guide?.durationSeconds ?? 0;

  const audioRef = useRef<HTMLAudioElement | null>(
    null,
  );

  const isFinishingRef = useRef(false);

  const spokenIndexRef = useRef(-1);

  const [hasGuideAudio, setHasGuideAudio] =
    useState<boolean | null>(null);

  const [isPlaying, setIsPlaying] =
    useState(true);

  const [elapsedSeconds, setElapsedSeconds] =
    useState(() =>
      Math.min(
        getElapsedFromStartedAt(
          session?.started_at,
        ),
        guide?.durationSeconds ?? 0,
      ),
    );

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const elapsedRef = useRef(elapsedSeconds);

  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

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

  const usesSpeech =
    hasGuideAudio === false &&
    isSpeechSupported();

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
    audio.currentTime = elapsedRef.current;
    audioRef.current = audio;

    const handleCanPlay = () => {
      setHasGuideAudio(true);
    };

    const handleAudioError = () => {
      setHasGuideAudio(false);
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
      setHasGuideAudio((previous) =>
        previous === true ? previous : false,
      );
    });

    if (guide.withNatureSound) {
      playNatureAudio(
        resolveNatureAudioSource(),
      ).catch(() => {});
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

      stopSpeech();
      stopNatureAudio();
    };
  }, [guide]);

  useEffect(() => {
    if (!isPlaying || totalSeconds <= 0) {
      return;
    }

    const startedAt = Date.now();
    const baseSeconds = elapsedRef.current;

    const tick = () => {
      setElapsedSeconds(() =>
        Math.min(
          baseSeconds +
            (Date.now() - startedAt) / 1000,
          totalSeconds,
        ),
      );
    };

    const timer = window.setInterval(
      tick,
      TICK_MS,
    );

    document.addEventListener(
      "visibilitychange",
      tick,
    );

    return () => {
      window.clearInterval(timer);

      document.removeEventListener(
        "visibilitychange",
        tick,
      );
    };
  }, [isPlaying, totalSeconds]);

  useEffect(() => {
    if (
      !guide ||
      !usesSpeech ||
      !isPlaying ||
      spokenIndexRef.current === activeIndex
    ) {
      return;
    }

    spokenIndexRef.current = activeIndex;

    speakGuideLine(
      guide.lines[activeIndex].text,
    );
  }, [activeIndex, guide, isPlaying, usesSpeech]);

  const leaveToNextStep = useCallback(() => {
    navigate(NEXT_PATH, { replace: true });
  }, [navigate]);

  const handleCancel = useCallback(async () => {
    if (isFinishingRef.current) {
      return;
    }

    isFinishingRef.current = true;

    audioRef.current?.pause();
    stopSpeech();
    stopNatureAudio();
    setIsPlaying(false);

    const uuid = getUserUuid();

    if (!uuid || !session) {
      leaveToNextStep();
      return;
    }

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
      leaveToNextStep();
    }
  }, [leaveToNextStep, session]);

  useEffect(() => {
    if (
      totalSeconds <= 0 ||
      elapsedSeconds < totalSeconds
    ) {
      return;
    }

    if (isFinishingRef.current) {
      return;
    }

    isFinishingRef.current = true;

    const uuid = getUserUuid();

    if (!uuid || !session) {
      navigate(NEXT_PATH, {
        replace: true,
      });
      return;
    }

    let cancelled = false;

    const completeSession =
      async () => {
        try {
          await completeRelaxationSession(
            uuid,
            session.id,
          );
        } catch (error) {
          if (cancelled) {
            return;
          }

          console.error(
            "세션 완료 기록 실패",
            error,
          );
        } finally {
          if (!cancelled) {
            navigate(NEXT_PATH, {
              replace: true,
            });
          }
        }
      };

    void completeSession();

    return () => {
      cancelled = true;
    };
  }, [
    elapsedSeconds,
    navigate,
    session,
    totalSeconds,
  ]);

  const handlePlayToggle = () => {
    const audio = audioRef.current;
    const next = !isPlaying;

    setIsPlaying(next);

    if (next) {
      if (audio) {
        audio.currentTime = Math.min(
          elapsedRef.current,
          totalSeconds,
        );

        audio.play().catch(() => {});
      }

      if (guide?.withNatureSound) {
        playNatureAudio(
          resolveNatureAudioSource(),
        ).catch(() => {});
      }

      spokenIndexRef.current = -1;

      return;
    }

    audio?.pause();
    stopSpeech();
    stopNatureAudio();
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

    window.addEventListener(
      "relaxation-back",
      handleCancel,
    );

    return () => {
      window.removeEventListener(
        "relaxation-action",
        handleCancel,
      );

      window.removeEventListener(
        "relaxation-back",
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
        <button
          type="button"
          onClick={handlePlayToggle}
          className="
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
