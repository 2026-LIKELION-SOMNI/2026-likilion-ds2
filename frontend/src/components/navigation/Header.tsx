import {
  useEffect,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

interface HeaderInfo {
  title: string;
  showBackButton: boolean;
}

interface RecoveryHeaderState {
  title: string;
  showBackButton: boolean;
  showStopButton: boolean;
}

const HEADER_INFO: Record<
  string,
  HeaderInfo
> = {
  "/": {
    title: "Somni",
    showBackButton: false,
  },

  "/onboarding": {
    title: "시작하기",
    showBackButton: true,
  },

  "/frequency": {
    title: "음역 매칭",
    showBackButton: true,
  },

  "/nature-sound": {
    title: "자연음 선택",
    showBackButton: true,
  },

  "/check-in": {
    title: "오늘의 체크인",
    showBackButton: true,
  },

  "/sound": {
    title: "맞춤 수면 사운드",
    showBackButton: true,
  },

  "/sound/my-sound": {
    title: "나만의 사운드",
    showBackButton: true,
  },

  "/sound/change-nature": {
    title: "자연음 선택",
    showBackButton: true,
  },

  "/sound-setup": {
    title: "음역 매칭",
    showBackButton: true,
  },
  "/my/notifications": {
    title: "알림 설정",
    showBackButton: true,
  },


  "/recovery-session": {
    title: "회복 세션",
    showBackButton: false,
  },
};

function BackIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  /*
   * 음역 매칭 내부 화면 제목
   */
  const [
    frequencyTitle,
    setFrequencyTitle,
  ] = useState("음역 매칭");

  /*
   * 회복 세션 내부 화면 헤더 상태
   *
   * session
   * → 회복 세션 / 중단
   *
   * end-confirm
   * → 뒤로가기 / 종료
   *
   * end-complete
   * → 종료
   */
  const [
    recoveryHeader,
    setRecoveryHeader,
  ] = useState<RecoveryHeaderState>({
    title: "회복 세션",
    showBackButton: false,
    showStopButton: true,
  });

  const headerInfo =
    HEADER_INFO[
      location.pathname
    ] ?? {
      title: "Somni",
      showBackButton: true,
    };

  /*
   * FrequencyPage가 보내는
   * 제목 변경 이벤트
   */
  useEffect(() => {
    const handleFrequencyTitle = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<string>;

      setFrequencyTitle(
        customEvent.detail,
      );
    };

    window.addEventListener(
      "frequency-title",
      handleFrequencyTitle,
    );

    return () => {
      window.removeEventListener(
        "frequency-title",
        handleFrequencyTitle,
      );
    };
  }, []);

  /*
   * RecoverySessionPage가 보내는
   * 헤더 상태 변경 이벤트
   */
  useEffect(() => {
    const handleRecoveryHeader = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<RecoveryHeaderState>;

      setRecoveryHeader(
        customEvent.detail,
      );
    };

    window.addEventListener(
      "recovery-header",
      handleRecoveryHeader,
    );

    return () => {
      window.removeEventListener(
        "recovery-header",
        handleRecoveryHeader,
      );
    };
  }, []);

  const isRecoverySession =
    location.pathname ===
    "/recovery-session";

  /*
   * 실제 표시할 제목
   */
  const title =
    location.pathname ===
    "/frequency"
      ? frequencyTitle
      : isRecoverySession
        ? recoveryHeader.title
        : headerInfo.title;

  /*
   * 실제 표시할 뒤로가기 버튼
   */
  const showBackButton =
    isRecoverySession
      ? recoveryHeader.showBackButton
      : headerInfo.showBackButton;

  /*
   * 뒤로가기
   */
  const handleBack = () => {
    /*
     * 음역 매칭 내부 단계
     */
    if (
      location.pathname ===
      "/frequency"
    ) {
      window.dispatchEvent(
        new Event(
          "frequency-back",
        ),
      );

      return;
    }

    /*
     * 자연음 선택
     * → 음역 매칭 결과
     */
    if (
      location.pathname ===
      "/nature-sound"
    ) {
      navigate(
        "/frequency",
        {
          state: {
            screen: "result",
          },
        },
      );

      return;
    }

    /*
     * 사운드 준비 / 혼합점
     */
    if (
      location.pathname ===
      "/sound-setup"
    ) {
      navigate("/nature-sound");
      return;
    }

    /*
     * 회복 세션 내부 화면
     */
    if (isRecoverySession) {
      window.dispatchEvent(
        new Event(
          "recovery-back",
        ),
      );

      return;
    }

    navigate(-1);
  };


  /*
   * 회복 세션 - 중단
   */
  const handleRecoveryStop =
    () => {
      window.dispatchEvent(
        new Event(
          "recovery-stop",
        ),
      );
    };

  return (
    <header className="safe-area-top shrink-0">
      <div
        className="
          relative
          flex
          h-16
          items-center
          justify-center
          px-3
        "
      >
        {/* 뒤로가기 */}
        {showBackButton && (
          <button
            type="button"
            aria-label="이전 화면으로 이동"
            onClick={handleBack}
            className="
              absolute
              left-3
              flex
              size-10
              items-center
              justify-center
              rounded-full
              text-[#ECF3F2]
              transition-opacity
              active:opacity-60
            "
          >
            <BackIcon />
          </button>
        )}

        {/* 제목 */}
        <h1
          className={`
            font-sans
            font-bold
            not-italic
            ${
              location.pathname === "/"
                ? `
                  text-[1.125rem]
                  leading-[1.6875rem]
                  text-[#60CEA7]
                `
                : `
                  absolute
                  left-1/2
                  -translate-x-1/2
                  text-center
                  text-[1.25rem]
                  leading-[1.4375rem]
                  text-[#ECF3F2]
                `
            }
          `}
        >
          {title}
        </h1>


        {/* 회복 세션 - 중단 */}
        {isRecoverySession &&
          recoveryHeader.showStopButton && (
            <button
              type="button"
              onClick={
                handleRecoveryStop
              }
              className="
                absolute
                right-6
                font-sans
                text-[16px]
                leading-[18px]
                font-medium
                text-[#87CBE6]
                transition-opacity
                active:opacity-60
              "
            >
              중단
            </button>
          )}
      </div>
    </header>
  );
}

export default Header;