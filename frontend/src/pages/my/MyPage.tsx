import { useEffect, useState } from "react";
import { useLocation, useNavigate, } from "react-router-dom";
import BottomNav from "../../components/navigation/BottomNav";
import ExclamationMark from "../../assets/icons/ExclamationMark.svg";

import { getMyPageProfileSummary, type MyPageProfileSummary, } from "../../api/mypage";

import { getUserUuid } from "../../utils/userStorage";
import { deleteAllUserData, } from "../../api/data";

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

  const location = useLocation();
  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const isDataDeleted =
    localStorage.getItem("somni-data-deleted") === "true";

  const [
    profileSummary,
    setProfileSummary,
  ] = useState<MyPageProfileSummary | null>(
    null,
  );

  const TONE_TYPE_LABEL: Record<
    string,
    string
  > = {
    high: "삐- 소리",
    low: "윙- 소리",
    wide: "쉬익- 소리",
    multiple: "여러 소리",
  };

  useEffect(() => {
    const uuid = getUserUuid();

    if (!uuid) {
      return;
    }

    const loadProfileSummary = async () => {
      try {
        const data =
          await getMyPageProfileSummary(
            uuid,
          );

        setProfileSummary(data);
      } catch (error) {
        console.error(
          "마이페이지 프로필 조회 실패",
          error,
        );
      }
    };

    void loadProfileSummary();
  }, [location.key]);
  
  const handleDeleteAllData =
    async () => {
      const uuid =
        getUserUuid();

      if (
        !uuid ||
        isDeleting
      ) {
        return;
      }

      try {
        setIsDeleting(true);

        const result =
          await deleteAllUserData(
            uuid,
          );

        console.log(
          "전체 데이터 삭제 완료:",
          result,
        );

        /*
        * 프론트 화면 상태용
        */
        localStorage.setItem(
          "somni-data-deleted",
          "true",
        );

        /*
        * 기존 세션 관련 임시값 제거
        */
        sessionStorage.removeItem(
          "somni-current-sound-session-id",
        );

        sessionStorage.removeItem(
          "somni-selected-nature-sound",
        );

        sessionStorage.removeItem(
          "somni-selected-nature-sound-label",
        );

        sessionStorage.removeItem(
          "somni-previous-nature-sound-label",
        );

        sessionStorage.removeItem(
          "somni-sound-setup-completed",
        );

        setShowDeleteModal(
          false,
        );

        navigate(
          "/my/delete-complete",
        );
      } catch (error) {
        console.error(
          "전체 데이터 삭제 실패",
          error,
        );
      } finally {
        setIsDeleting(false);
      }
    };

  return (
    <div className="flex min-h-full flex-col px-5 pb-[94px]">      {/* 마이 */}
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

      {/* 내 이명 프로필 / 데이터 삭제 후 재설정 */}
      {isDataDeleted ? (
        <section
          className="
            mt-10
            rounded-[20px]
            border
            border-[#24464E]
            bg-[#112126]
            p-[16px]
          "
        >
          <p
            className="
              font-sans
              text-[15px]
              font-medium
              leading-normal
              text-[#E8F5F2]
            "
          >
            설정이 초기화 되었어요.
          </p>

          <h2
            className="
              mt-[8px]
              font-sans
              text-[20px]
              font-bold
              leading-normal
              text-[#E8F5F2]
            "
          >
            다시 나만의 사운드를 만들어볼까요?
          </h2>

          <p
            className="
              mt-[8px]
              font-sans
              text-[11px]
              font-normal
              leading-normal
              text-[#759CA3]
            "
          >
            약 5분 · 이명 음역을 측정하고 나에게 딱 맞는 소리를 찾을 수 있어요
          </p>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(
                "somni-data-deleted",
              );

              navigate("/frequency");
            }}
            className="
              mt-[30px]
              flex
              w-full
              items-center
              justify-center
              rounded-[12px]
              bg-[#61DBB8]
              pb-[11px]
              pt-[9px]
              font-sans
              text-[12px]
              font-bold
              leading-normal
              text-[#0D1417]
              active:opacity-60
            "
          >
            개인화 다시 시작하기
          </button>
        </section>
      ) : (
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
            {profileSummary?.tone_type
              ? TONE_TYPE_LABEL[
                  profileSummary.tone_type
                ] ?? "-"
              : "-"}
          </p>

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
              {profileSummary?.center_frequency != null
                ? `${Math.round(
                    profileSummary.center_frequency,
                  )}Hz`
                : "-"}
            </strong>
          </div>

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
              {profileSummary?.lower_bound != null &&
              profileSummary?.upper_bound != null
                ? `${Math.round(
                    profileSummary.lower_bound,
                  )}–${Math.round(
                    profileSummary.upper_bound,
                  )}Hz`
                : "-"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(
                "somni-current-sound-session-id",
              );

              sessionStorage.removeItem(
                "somni-sound-setup-completed",
              );

              sessionStorage.removeItem(
                "somni-pitch-match-session",
              );

              sessionStorage.removeItem(
                "somni-selected-nature-sound",
              );

              sessionStorage.removeItem(
                "somni-selected-nature-sound-label",
              );

              sessionStorage.removeItem(
                "somni-previous-nature-sound-label",
              );

              navigate("/frequency");
            }}
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
      )}


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
            relative
            mt-[14px]
            w-full
            overflow-hidden
            rounded-[18px]
            border
            border-[#1F3D45]
            bg-[#0E1D21]
            px-[17px]
          "
        >
          {/* 사운드 프로필 */}
          <button
            type="button"
            onClick={() =>
              navigate("/my/sound-profile")
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
                사운드 프로필
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
                AI Sound Fit으로 만든 기본 소리 취향
              </p>
            </div>

            <span className="text-[#E8F5F2]">
              <ChevronRight />
            </span>
          </button>

          <div className="h-px w-full bg-[#1F3D45]" />

          {/* 알림 설정 */}
          <button
            type="button"
            onClick={() =>
              navigate("/my/notifications")
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
                navigate("/my/sounds")
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

          {isDataDeleted && (
            <div
              className="
                absolute
                inset-0
                z-10
                rounded-[18px]
                bg-[rgba(0,0,0,0.58)]
              "
              aria-hidden="true"
            />
          )}
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
            w-full
            rounded-[18px]
            border
            border-[#1F3D45]
            bg-[#0E1D21]
            px-[17px]
          "
        >
          {/* 연결된 데이터 */}
          <button
            type="button"
            onClick={() => navigate("/my/connected-data")}
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

          <div className="h-px w-full bg-[#1F3D45]" />

          <button
            type="button"
            onClick={() =>
              setShowDeleteModal(true)
            }
            className="
              flex
              w-full
              items-center
              py-[14px]
              text-left
              font-sans
              text-[11px]
              font-normal
              leading-normal
              text-[#F09292]
            "
          >
            저장된 데이터 모두 삭제
          </button>

        </div>
      </section>

      {/* 마지막 카드 ↔ 고정 네비 공간 */}
      <BottomNav />
      {showDeleteModal && (
        <>
          {/* 뒤 배경 */}
          <button
            type="button"
            aria-label="삭제 확인 창 닫기"
            onClick={() =>
              setShowDeleteModal(false)
            }
            className="
              fixed
              bottom-0
              left-1/2
              top-0
              z-[60]
              w-full
              max-w-[480px]
              -translate-x-1/2
              bg-black/70
            "
          />

          {/* 모달 */}
          <section
            className="
              fixed
              bottom-0
              left-1/2
              z-[70]
              flex
              min-h-[422px]
              w-full
              max-w-[480px]
              -translate-x-1/2
              flex-col
              items-center
              rounded-t-[24px]
              border
              border-[#24464E]
              bg-[#0D1417]
              px-[30px]
              pb-[24px]
              pt-[30px]
            "
          >
            {/* 느낌표 원 */}
            <div
              className="
                flex
                h-[48px]
                w-[48px]
                shrink-0
                items-center
                justify-center
                rounded-full
                border
                border-[#6B3D43]
                bg-[#2E2324]
              "
            >
              <img
                src={ExclamationMark}
                alt=""
                aria-hidden="true"
                className="h-[20px] w-[20px]"
              />
            </div>

            <h2
              className="
                mt-[20px]
                text-center
                font-sans
                text-[22px]
                font-bold
                leading-normal
                text-[#F0F7FA]
              "
            >
              모든 데이터를 삭제할까요?
            </h2>

            <p
              className="
                mt-[10px]
                text-center
                font-sans
                text-[12px]
                font-medium
                leading-normal
                text-[#F09292]
              "
            >
              삭제하면 되돌릴 수 없어요.
            </p>

            <div
              className="
                mt-[26px]
                flex
                w-full
                flex-col
                items-start
                justify-center
                gap-[14px]
                rounded-[16px]
                border
                border-[#6B3D43]
                bg-[#2E2324]
                px-[14px]
                py-[14px]
              "
            >
              <p
                className="
                  font-sans
                  text-[12px]
                  font-bold
                  leading-normal
                  text-[#F09292]
                "
              >
                삭제되는 데이터
              </p>

              <p
                className="
                  font-sans
                  text-[12px]
                  font-normal
                  leading-normal
                  text-[#F0F7FA]
                "
              >
                · 이명 프로필, 음역 매칭, Sound Profile
                <br />
                · 체크인, 메모, 루틴/사운드 사용 기록
                <br />
                · 다음 날 평가, 개인화 학습 기록, 연결된 데이터
              </p>
            </div>

            {/* 실제 삭제 */}
            <div className="mt-[36px] w-full">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  void handleDeleteAllData();
                }}
                className="
                  flex
                  h-[54px]
                  w-full
                  items-center
                  justify-center
                  rounded-[16px]
                  bg-[#B85C64]
                  font-sans
                  text-[14px]
                  font-bold
                  text-[#F0F7FA]
                "
              >
                {isDeleting
                  ? "삭제 중..."
                  : "모든 데이터 삭제"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowDeleteModal(false)
                }
                className="
                  mt-[14px]
                  w-full
                  text-center
                  font-sans
                  text-[13px]
                  font-medium
                  leading-normal
                  text-[#F0F7FA]
                "
              >
                취소
              </button>
            </div>
          </section>
        </>
      )}

    </div>
  );
}

export default MyPage;