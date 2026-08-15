import { useState } from "react";

type TimeTarget =
  | "checkin"
  | "result"
  | null;

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
}

function Toggle({
  checked,
  onChange,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`
        relative
        h-[32px] w-[54px]
        shrink-0
        rounded-full
        transition-colors
        ${
          checked
            ? "bg-[#60CEA7]"
            : "bg-[#24464A]"
        }
      `}
    >
      <span
        className={`
          absolute
          top-[4px]
          size-[24px]
          rounded-full
          bg-[#07100D]
          transition-all
          ${
            checked
              ? "left-[26px]"
              : "left-[4px]"
          }
        `}
      />
    </button>
  );
}

function ChevronRight() {
  return (
    <svg
      width="22"
      height="22"
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

function NotificationSettingsPage() {
  const [
    checkinEnabled,
    setCheckinEnabled,
  ] = useState(true);

  const [
    resultEnabled,
    setResultEnabled,
  ] = useState(true);

  const [
    timeTarget,
    setTimeTarget,
  ] = useState<TimeTarget>(null);

  const [
    checkinTime,
    setCheckinTime,
  ] = useState("오후 11시 30분");

  const [
    resultTime,
    setResultTime,
  ] = useState("오전 9시");

  const handleSaveTime = () => {
    /*
     * 현재는 화면 확인용 임시 시간.
     * 추후 실제 time picker 값으로 교체.
     */
    if (timeTarget === "checkin") {
      setCheckinTime(
        "오후 10시 30분",
      );
    }

    if (timeTarget === "result") {
      setResultTime(
        "오전 9시",
      );
    }

    setTimeTarget(null);
  };

  return (
    <>
      <div className="flex min-h-full flex-col px-5 pb-6">
        <main className="flex flex-1 flex-col pt-12">
          <h2 className="text-[24px] font-bold leading-[34px] text-[#F0F7FA]">
            필요할 때 알려드릴게요.
          </h2>

          <p className="mt-3 text-[12px] text-[#809EA8]">
            알림을 꺼도 서비스의 기능은 그대로 사용할 수 있어요.
          </p>

          {/* 알림 설정 */}
          <section className="mt-8">
            <h3 className="text-[14px] font-bold text-[#F0F7FA]">
              알림 설정
            </h3>

            <div
              className="
                mt-5
                rounded-[18px]
                border border-[#244D54]
                bg-[#102326]
                px-4
              "
            >
              <div className="flex items-center justify-between py-5">
                <div>
                  <p className="text-[14px] font-semibold text-[#F0F7FA]">
                    취침 전 체크인 알림
                  </p>

                  <p className="mt-2 text-[11px] text-[#809EA8]">
                    예상 취침 시간 전에 오늘 상태 기록을 알려줘요.
                  </p>
                </div>

                <Toggle
                  checked={
                    checkinEnabled
                  }
                  onChange={() =>
                    setCheckinEnabled(
                      (prev) => !prev,
                    )
                  }
                />
              </div>

              <div className="h-px bg-[#244D54]" />

              <div className="flex items-center justify-between py-5">
                <div>
                  <p className="text-[14px] font-semibold text-[#F0F7FA]">
                    다음 날 결과 기록 알림
                  </p>

                  <p className="mt-2 text-[11px] text-[#809EA8]">
                    전날 루틴 평가가 남아 있을 때 알려줘요.
                  </p>
                </div>

                <Toggle
                  checked={
                    resultEnabled
                  }
                  onChange={() =>
                    setResultEnabled(
                      (prev) => !prev,
                    )
                  }
                />
              </div>
            </div>
          </section>

          {/* 시간 설정 */}
          <section className="mt-8">
            <h3 className="text-[14px] font-bold text-[#F0F7FA]">
              시간 설정
            </h3>

            <div
              className="
                mt-5
                rounded-[18px]
                border border-[#244D54]
                bg-[#102326]
                px-4
              "
            >
              <button
                type="button"
                disabled={
                  !checkinEnabled
                }
                onClick={() =>
                  setTimeTarget(
                    "checkin",
                  )
                }
                className={`
                  flex w-full
                  items-center
                  justify-between
                  py-5 text-left
                  ${
                    !checkinEnabled
                      ? "opacity-40"
                      : ""
                  }
                `}
              >
                <div>
                  <p className="text-[14px] font-semibold text-[#F0F7FA]">
                    체크인 알림
                  </p>

                  <p className="mt-2 text-[12px] text-[#809EA8]">
                    {checkinTime}
                  </p>
                </div>

                <ChevronRight />
              </button>

              <div className="h-px bg-[#244D54]" />

              <button
                type="button"
                disabled={
                  !resultEnabled
                }
                onClick={() =>
                  setTimeTarget(
                    "result",
                  )
                }
                className={`
                  flex w-full
                  items-center
                  justify-between
                  py-5 text-left
                  ${
                    !resultEnabled
                      ? "opacity-40"
                      : ""
                  }
                `}
              >
                <div>
                  <p className="text-[14px] font-semibold text-[#F0F7FA]">
                    결과 기록 알림
                  </p>

                  <p className="mt-2 text-[12px] text-[#809EA8]">
                    {resultTime}
                  </p>
                </div>

                <ChevronRight />
              </button>
            </div>
          </section>

          <button
            type="button"
            className="
              mt-auto
              h-14 w-full
              rounded-[12px]
              bg-[#60CEA7]
              text-[14px]
              font-bold
              text-[#07100D]
            "
          >
            저장하기
          </button>
        </main>
      </div>

      {/* 시간 선택 바텀시트 */}
      {timeTarget && (
        <div
          className="
            fixed inset-0 z-50
            flex items-end
            justify-center
            bg-black/60
          "
        >
          <div
            className="
              w-full max-w-[480px]
              rounded-t-[24px]
              border-x border-t
              border-[#244D54]
              bg-[#0D1719]
              px-5 pb-8 pt-5
            "
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#F0F7FA]">
                알림 시간
              </h3>

              <button
                type="button"
                onClick={
                  handleSaveTime
                }
                className="text-[14px] font-semibold text-[#60CEA7]"
              >
                완료
              </button>
            </div>

            <p className="mt-5 text-[12px] text-[#809EA8]">
              {timeTarget ===
              "checkin"
                ? "취침 전 체크인을 받을 시간을 정해주세요."
                : "결과 기록 알림을 받을 시간을 정해주세요."}
            </p>

            {/* 임시 Time Picker UI */}
            <div className="mt-8">
              <div className="flex justify-around text-[18px] text-[#526C72]">
                <span>오전</span>
                <span>9</span>
                <span>20</span>
              </div>

              <div
                className="
                  my-5
                  flex h-[58px]
                  items-center
                  justify-around
                  rounded-[14px]
                  border border-[#2B8E78]
                  bg-[#103D30]
                  text-[20px]
                  font-bold
                  text-[#F0F7FA]
                "
              >
                <span>오후</span>
                <span>10 시</span>
                <span>30 분</span>
              </div>

              <div className="flex justify-around text-[18px] text-[#526C72]">
                <span />
                <span>11</span>
                <span>40</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NotificationSettingsPage;