import { useLocation, useNavigate } from "react-router-dom";

interface HeaderInfo {
  title: string;
  showBackButton: boolean;
  showLaterButton?: boolean;
}

const HEADER_INFO: Record<string, HeaderInfo> = {
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
    showLaterButton: true,
  },
  "/check-in": {
    title: "오늘의 체크인",
    showBackButton: true,
  },
  "/sound": {
    title: "맞춤 수면 사운드",
    showBackButton: true,
  },
  "/sound-setup": {
    title: "음역 매칭",
    showBackButton: true,
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

  const headerInfo = HEADER_INFO[location.pathname] ?? {
    title: "Somni",
    showBackButton: true,
  };

  const handleBack = () => {
    // 음역 매칭 내부 단계 뒤로가기
    if (location.pathname === "/frequency") {
      window.dispatchEvent(new Event("frequency-back"));
      return;
    }

    // 자연음 선택 → 음역 매칭 결과(100%) 화면
    if (location.pathname === "/nature-sound") {
      navigate("/frequency", {
        state: { screen: "result" },
      });
      return;
    }

    // 사운드 준비 / 혼합점 내부 단계 뒤로가기
    if (location.pathname === "/sound-setup") {
      window.dispatchEvent(new Event("sound-setup-back"));
      return;
    }

    // 그 외 페이지
    navigate(-1);
  };

  const handleLater = () => {
    if (location.pathname === "/nature-sound") {
      navigate("/sound-setup");
    }
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
        {headerInfo.showBackButton && (
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

        {headerInfo.showBackButton ? (
          <h1
            className="
              absolute
              left-1/2
              -translate-x-1/2
              text-center
              font-sans
              text-[1.25rem]
              leading-[1.4375rem]
              font-bold
              text-[#ECF3F2]
              not-italic
            "
          >
            {headerInfo.title}
          </h1>
        ) : (
          <h1
            className="
              font-sans
              text-[1.125rem]
              leading-[1.6875rem]
              font-bold
              text-[#60CEA7]
              not-italic
            "
          >
            Somni
          </h1>
        )}

        {headerInfo.showLaterButton && (
          <button
            type="button"
            onClick={handleLater}
            className="
              absolute
              right-6
              font-sans
              text-[16px]
              leading-[18px]
              font-medium
              text-right
              text-[#87CBE6]
              transition-opacity
              active:opacity-60
            "
          >
            나중에
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;