import { useNavigate } from "react-router-dom";

import BottomNav from "../../components/navigation/BottomNav";

function ChevronRight() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MyPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-full flex-col px-5 pb-[120px]">
      {/* 마이 */}
      <h1
        className="
          pt-8
          font-sans
          text-[27px]
          font-bold
          leading-normal
          text-[#F0F7FA]
        "
      >
        마이
      </h1>

    {/* 내 이명 프로필 */}
    <section
    className="
        relative
        mt-10
        h-[167px]
        shrink-0
        rounded-[20px]
        border
        border-[#24464E]
        bg-[#112126]
    "
    >
    {/* 내 이명 프로필 */}
    <h2
        className="
        absolute
        left-[17px]
        top-[18px]
        font-sans
        text-[15px]
        font-bold
        leading-normal
        text-[#E8F5F2]
        "
    >
        내 이명 프로필
    </h2>

    {/* 삐- 소리 */}
    <p
        className="
        absolute
        left-[17px]
        top-[60px]
        font-sans
        text-[17px]
        font-bold
        leading-normal
        text-[#E8F5F2]
        "
    >
        삐- 소리
    </p>

    {/* 대표 음역 */}
    <div
        className="
        absolute
        left-[137px]
        top-[59px]
        flex
        items-center
        "
    >
        <span
        className="
            font-sans
            text-[11px]
            font-normal
            leading-normal
            text-[#759CA3]
        "
        >
        대표 음역
        </span>

        <strong
        className="
            ml-[10px]
            font-sans
            text-[18px]
            font-bold
            leading-normal
            text-[#E8F5F2]
        "
        >
        853Hz
        </strong>
    </div>

    {/* 추정 범위 */}
    <div
        className="
        absolute
        left-[137px]
        top-[88px]
        flex
        items-center
        "
    >
        <span
        className="
            font-sans
            text-[11px]
            font-medium
            leading-normal
            text-[#759CA3]
        "
        >
        추정 범위
        </span>

        <span
        className="
            ml-[10px]
            font-sans
            text-[11px]
            font-medium
            leading-normal
            text-[#759CA3]
        "
        >
        842–863Hz
        </span>
    </div>

    {/* 유형 · 음역 다시 설정 */}
    <button
    type="button"
    onClick={() => navigate("/frequency")}
    className="
        absolute
        bottom-[10px]
        left-[17px]
        right-[17px]
        flex
        items-center
        justify-center
        rounded-[12px]
        border
        border-[#1F3D45]
        bg-[#0E1D21]
        pb-[11px]
        pt-[9px]
        font-sans
        text-[12px]
        font-medium
        leading-normal
        text-[#E8F5F2]
        active:opacity-60
    "
    >
    유형 · 음역 다시 설정
    </button>
    </section>


      {/* 개인화 설정 */}
      <section className="mt-[30px]">
        <h2
          className="
            font-sans
            text-[15px]
            font-bold
            leading-normal
            text-[#E8F5F2]
          "
        >
          개인화 설정
        </h2>

        <div
          className="
            mt-[14px]
            w-full
            rounded-[18px]
            border
            border-[#1F3D45]
            bg-[#0E1D21]
            px-[17px]
          "
        >


          {/* 알림 설정 */}
          <button
            type="button"
            onClick={() =>
              navigate(
                "/my/notifications",
              )
            }
            className="
              flex
              w-full
              items-center
              justify-between
              pb-[18px]
              pt-[18px]
              text-left
            "
          >
            <div>
              <p
                className="
                  font-sans
                  text-[14px]
                  font-medium
                  leading-normal
                  text-[#E8F5F2]
                "
              >
                알림 설정
              </p>

              <p
                className="
                  mt-2
                  font-sans
                  text-[11px]
                  font-normal
                  leading-normal
                  text-[#759CA3]
                "
              >
                취침 전 체크인 · 다음 날 결과 기록
              </p>
            </div>

            <span className="text-[#E8F5F2]">
              <ChevronRight />
            </span>
          </button>

          <div className="h-px w-full bg-[#1F3D45]" />

          {/* 나의 사운드 */}
          <button
            type="button"
            onClick={() =>
              navigate(
                "/sound/my-sound",
              )
            }
            className="
              flex
              w-full
              items-center
              justify-between
              pb-[18px]
              pt-[13px]
              text-left
            "
          >
            <div>
              <p
                className="
                  font-sans
                  text-[14px]
                  font-medium
                  leading-normal
                  text-[#E8F5F2]
                "
              >
                나의 사운드
              </p>

              <p
                className="
                  mt-2
                  font-sans
                  text-[11px]
                  font-normal
                  leading-normal
                  text-[#759CA3]
                "
              >
                도움되었던 소리를 자동으로 모아봐요
              </p>
            </div>

            <span className="text-[#E8F5F2]">
              <ChevronRight />
            </span>
          </button>
        </div>
      </section>

      {/* 이용 설정 */}
      <section className="mt-[30px]">
        <h2
          className="
            font-sans
            text-[15px]
            font-bold
            leading-normal
            text-[#E8F5F2]
          "
        >
          이용 설정
        </h2>

        <div
          className="
            mt-[14px]
            h-[148px]
            w-full
            rounded-[18px]
            border
            border-[#1F3D45]
            bg-[#0E1D21]
            px-[17px]
          "
        >
          {/* 연결된 데이터 - 아직 이동 X */}
          <button
            type="button"
            className="
              flex
              w-full
              items-center
              justify-between
              pb-[18px]
              pt-[18px]
              text-left
            "
          >
            <div>
              <p
                className="
                  font-sans
                  text-[14px]
                  font-medium
                  leading-normal
                  text-[#E8F5F2]
                "
              >
                연결된 데이터
              </p>

              <p
                className="
                  mt-2
                  font-sans
                  text-[11px]
                  font-normal
                  leading-normal
                  text-[#759CA3]
                "
              >
                스마트폰 건강 앱
              </p>
            </div>

            <span className="text-[#E8F5F2]">
              <ChevronRight />
            </span>
          </button>

          <div className="h-px w-full bg-[#1F3D45]" />

          {/* 서비스 안내·안전 - 아직 이동 X */}
          <button
            type="button"
            className="
              flex
              w-full
              items-center
              justify-between
              pb-[18px]
              pt-[13px]
              text-left
            "
          >
            <div>
              <p
                className="
                  font-sans
                  text-[14px]
                  font-medium
                  leading-normal
                  text-[#E8F5F2]
                "
              >
                서비스 안내·안전
              </p>

              <p
                className="
                  mt-2
                  font-sans
                  text-[11px]
                  font-normal
                  leading-normal
                  text-[#759CA3]
                "
              >
                Somni 이용 범위와 주의사항
              </p>
            </div>

            <span className="text-[#E8F5F2]">
              <ChevronRight />
            </span>
          </button>
        </div>
      </section>

      {/* 마지막 카드 ↔ 고정 네비 공간 */}
      <div className="h-10 shrink-0" />

      <BottomNav />
    </div>
  );
}

export default MyPage;