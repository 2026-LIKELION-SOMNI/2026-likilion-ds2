import { useLocation, useNavigate } from "react-router-dom";

interface HeaderInfo {
  title: string;
  showBackButton: boolean;
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
  "/check-in": {
    title: "오늘의 체크인",
    showBackButton: true,
  },

  "/sound": {
    title: "맞춤 수면 사운드",
    showBackButton: true,
  },
};

function BackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="size-6"
    >
      <path
        d="M15 19.5L7.5 12L15 4.5"
        stroke="#ECF3F2"
        strokeWidth="2"
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

  return (
    <header className="safe-area-top shrink-0 bg-app-background">
      <div className="relative flex h-14 items-center px-6 pt-[1.91rem]">
        {headerInfo.showBackButton && (
          <button
            type="button"
            aria-label="이전 화면으로 이동"
            onClick={() => navigate(-1)}
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
      </div>
    </header>
  );
}

export default Header;
