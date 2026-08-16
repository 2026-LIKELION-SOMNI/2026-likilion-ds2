import { useNavigate } from "react-router-dom";

function CheckIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="31"
        fill="#12382E"
        stroke="#2B8E78"
        strokeWidth="1"
      />

      <path
        d="M21 31.5L28.5 39L43 24.5"
        stroke="#61DBB8"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DataDeleteCompletePage() {
  const navigate = useNavigate();

  return (
    <div
      className="
        relative
        min-h-dvh
        w-full
        px-5
      "
    >
      {/* 상단 콘텐츠 */}
      <div
        className="
          flex
          flex-col
          items-center
          pt-[237px]
        "
      >
        <CheckIcon />

        <h1
          className="
            mt-[36px]
            text-center
            font-sans
            text-[24px]
            font-bold
            leading-normal
            text-[#F0F7FA]
          "
        >
          모든 기록을 삭제했어요.
        </h1>

        <p
          className="
            mt-[18px]
            text-center
            font-sans
            text-[13px]
            font-normal
            leading-[20px]
            text-[#809EA8]
          "
        >
          Somni가 처음 이용하는 상태로 돌아갔어요.
          <br />
          언제든 다시 설정을 시작할 수 있어요.
        </p>
      </div>

      {/* 화면 하단 고정 버튼 */}
    <div
    className="
        fixed
        bottom-0
        left-1/2
        w-full
        max-w-[480px]
        -translate-x-1/2
        px-5
        pb-[40px]
    "
    >
        <button
          type="button"
          onClick={() => navigate("/onboarding")}
          className="
            flex
            h-[54px]
            w-full
            items-center
            justify-center
            rounded-[14px]
            bg-[#61DBB8]
            font-sans
            text-[14px]
            font-bold
            text-[#07100D]
          "
        >
          처음부터 다시 설정하기
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="
            mt-[18px]
            w-full
            text-center
            font-sans
            text-[13px]
            font-medium
            leading-normal
            text-[#87CBE6]
          "
        >
          홈으로 이동
        </button>
      </div>
    </div>
  );
}

export default DataDeleteCompletePage;