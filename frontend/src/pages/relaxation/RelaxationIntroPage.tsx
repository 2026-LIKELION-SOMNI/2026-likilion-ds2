import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import BreathingRings from "../../components/relaxation/BreathingRings";
import RelaxationActivityCard from "../../components/relaxation/RelaxationActivityCard";
import { toErrorMessage } from "../../api/client";
import {
  createRelaxationRecommendation,
  skipRelaxationSession,
  startRelaxationSession,
} from "../../api/relaxation";
import type { RelaxationSession } from "../../api/relaxation";
import { getRelaxationGuide } from "./guideScript";
import { primeSpeech } from "../../audio/guideSpeech";
import { getUserUuid } from "../../utils/userStorage";

const NEXT_PATH = "/mixing-point";

interface RelaxationIntroLocationState {
  session?: RelaxationSession;
}

let pendingRecommendation: {
  uuid: string;
  promise: Promise<RelaxationSession>;
} | null = null;

function requestRecommendationOnce(
  uuid: string,
) {
  if (pendingRecommendation?.uuid === uuid) {
    return pendingRecommendation.promise;
  }

  const promise =
    createRelaxationRecommendation(uuid);

  pendingRecommendation = { uuid, promise };

  promise
    .catch(() => {})
    .finally(() => {
      if (
        pendingRecommendation?.promise ===
        promise
      ) {
        pendingRecommendation = null;
      }
    });

  return promise;
}

function RelaxationIntroPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [uuid] = useState(
    () => getUserUuid(),
  );

  const preloadedSession = (
    location.state as
      | RelaxationIntroLocationState
      | null
  )?.session;

  const [session, setSession] = useState<
    RelaxationSession | null
  >(preloadedSession ?? null);

  const [isLoading, setIsLoading] =
    useState(
      !preloadedSession &&
        uuid !== null,
    );

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(
      uuid
        ? null
        : "사용자 정보를 찾을 수 없어요. 앱을 새로고침한 뒤 다시 시도해 주세요.",
    );

  const guide = session
    ? getRelaxationGuide(session.activity_type)
    : null;

  useEffect(() => {
    if (
      preloadedSession ||
      !uuid
    ) {
      return;
    }

    let isMounted = true;

    const loadSession =
      async () => {
        try {
          const created =
            await requestRecommendationOnce(
              uuid,
            );

          if (!isMounted) {
            return;
          }

          setSession(created);
        } catch (error) {
          if (!isMounted) {
            return;
          }

          setErrorMessage(
            toErrorMessage(
              error,
              "오늘의 수면 준비를 불러오지 못했어요.",
            ),
          );
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, [
    preloadedSession,
    uuid,
  ]);
  useEffect(() => {
    if (!session) {
      return;
    }

    if (!guide) {
      navigate(NEXT_PATH, { replace: true });
      return;
    }

    if (session.status === "in_progress") {
      navigate("/relaxation/session", {
        replace: true,
        state: { session },
      });

      return;
    }

    if (session.status !== "recommended") {
      navigate(NEXT_PATH, { replace: true });
    }
  }, [guide, navigate, session]);

  const handleSkip = useCallback(async () => {
    const uuid = getUserUuid();

    if (!uuid || !session || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await skipRelaxationSession(
        uuid,
        session.id,
      );

      navigate(NEXT_PATH, { replace: true });
    } catch (error) {
      setErrorMessage(
        toErrorMessage(
          error,
          "건너뛰기에 실패했어요. 잠시 후 다시 시도해 주세요.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, navigate, session]);

  const handleStart = async () => {
    const uuid = getUserUuid();

    if (!uuid || !session || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    primeSpeech();

    try {
      const started =
        await startRelaxationSession(
          uuid,
          session.id,
        );

      navigate("/relaxation/session", {
        replace: true,
        state: { session: started },
      });
    } catch (error) {
      setErrorMessage(
        toErrorMessage(
          error,
          "세션을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.",
        ),
      );

      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("relaxation-header", {
        detail: {
          title: "오늘의 수면 준비",
          showBackButton: true,
          actionLabel: guide
            ? "건너뛰기"
            : null,
        },
      }),
    );
  }, [guide]);

  useEffect(() => {
    const handleBack = () => {
      navigate(-1);
    };

    window.addEventListener(
      "relaxation-back",
      handleBack,
    );

    window.addEventListener(
      "relaxation-action",
      handleSkip,
    );

    return () => {
      window.removeEventListener(
        "relaxation-back",
        handleBack,
      );

      window.removeEventListener(
        "relaxation-action",
        handleSkip,
      );
    };
  }, [handleSkip, navigate]);

  if (isLoading) {
    return (
      <div
        className="
          flex
          min-h-full
          items-center
          justify-center
          px-5
        "
      >
        <p
          className="
            font-sans
            text-[0.8125rem]
            font-normal
            text-[#8DA2A6]
          "
        >
          오늘의 수면 준비를 불러오는 중이에요...
        </p>
      </div>
    );
  }

  if (!guide) {
    return (
      <div
        className="
          flex
          min-h-full
          flex-col
          items-center
          justify-center
          gap-[1.25rem]
          px-5
        "
      >
        <p
          role="alert"
          className="
            text-center
            font-sans
            text-[0.8125rem]
            font-normal
            leading-[1.25rem]
            text-[#8DA2A6]
          "
        >
          {errorMessage ??
            "오늘은 따로 준비할 루틴이 없어요."}
        </p>

        <div className="w-full">
          <Button
            onClick={() =>
              navigate(NEXT_PATH, {
                replace: true,
              })
            }
          >
            사운드로 넘어가기
          </Button>
        </div>
      </div>
    );
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
      <div
        className="
          flex
          justify-center
          pt-[1.5rem]
        "
      >
        <BreathingRings />
      </div>

      <h1
        className="
          mt-[1.75rem]
          whitespace-pre-line
          text-center
          font-sans
          text-[1.5rem]
          font-bold
          leading-[2rem]
          text-[#F0F7FA]
        "
      >
        {guide.introTitle}
      </h1>

      <p
        className="
          mt-[1rem]
          whitespace-pre-line
          text-center
          font-sans
          text-[0.8125rem]
          font-normal
          leading-[1.25rem]
          text-[#8DA2A6]
        "
      >
        {guide.introDescription}
      </p>

      <div className="mt-[1.75rem]">
        <RelaxationActivityCard
          eyebrow={guide.cardEyebrow}
          title={guide.cardTitle}
          description={guide.cardDescription}
        />
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

      {errorMessage && (
        <div className="mt-[0.875rem]">
          <Button
            variant="text"
            onClick={() =>
              navigate(NEXT_PATH, {
                replace: true,
              })
            }
          >
            사운드로 넘어가기
          </Button>
        </div>
      )}

      <div className="mt-auto pt-[2rem]">
        <p
          className="
            text-center
            font-sans
            text-[0.8125rem]
            font-normal
            leading-normal
            text-[#8DA2A6]
          "
        >
          편하게 누운 뒤 휴대폰을 내려놓아 주세요.
        </p>

        <div className="mt-[1.5rem]">
          <Button
            disabled={isSubmitting}
            onClick={handleStart}
          >
            {isSubmitting
              ? "시작하는 중..."
              : "화면 내려놓고 시작하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RelaxationIntroPage;
