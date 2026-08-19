import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../../api/mypage";

import {
  getUserUuid,
} from "../../utils/userStorage";

type TimeTarget =
  | "checkin"
  | "result"
  | null;

type Period = "AM" | "PM";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
}

const ITEM_HEIGHT = 58;

const PERIOD_OPTIONS: Period[] = [
  "AM",
  "PM",
];

const HOUR_OPTIONS = Array.from(
  { length: 12 },
  (_, index) => index + 1,
);

const MINUTE_OPTIONS = Array.from(
  { length: 6 },
  (_, index) => index * 10,
);

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

function formatTime(
  time: string | null,
) {
  if (!time) {
    return null;
  }

  const [
    hourString,
    minuteString,
  ] = time.split(":");

  const hour24 =
    Number(hourString);

  const period =
    hour24 < 12
      ? "오전"
      : "오후";

  const hour12 =
    hour24 % 12 || 12;

  /*
   * 00분은 디자인상
   * "오전 9시"처럼 표시
   */
  if (minuteString === "00") {
    return `${period} ${hour12}시`;
  }

  return `${period} ${hour12}시 ${minuteString}분`;
}

function NotificationSettingsPage() {
  const [
    checkinEnabled,
    setCheckinEnabled,
  ] = useState(false);

  const [
    resultEnabled,
    setResultEnabled,
  ] = useState(false);

  const [
    timeTarget,
    setTimeTarget,
  ] = useState<TimeTarget>(
    null,
  );

  const [
    checkinTime,
    setCheckinTime,
  ] =
    useState<string | null>(
      null,
    );

  const [
    resultTime,
    setResultTime,
  ] =
    useState<string | null>(
      null,
    );

  /*
   * 현재 휠 피커 값
   */
  const [
    pickerPeriod,
    setPickerPeriod,
  ] =
    useState<Period>("PM");

  const [
    pickerHour,
    setPickerHour,
  ] =
    useState(11);

  const [
    pickerMinute,
    setPickerMinute,
  ] =
    useState(30);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  /*
   * 휠 스크롤 DOM
   */
  const periodRef =
    useRef<HTMLDivElement>(
      null,
    );

  const hourRef =
    useRef<HTMLDivElement>(
      null,
    );

  const minuteRef =
    useRef<HTMLDivElement>(
      null,
    );

  /*
   * 백엔드 설정 조회
   */
  useEffect(() => {
    const uuid =
      getUserUuid();

    if (!uuid) {
      return;
    }

    const loadSettings =
      async () => {
        try {
          const data =
            await getNotificationSettings(
              uuid,
            );

          setCheckinEnabled(
            data.checkin_reminder_enabled,
          );

          setResultEnabled(
            data.result_reminder_enabled,
          );

          setCheckinTime(
            data.checkin_reminder_time
              ? data.checkin_reminder_time.slice(
                  0,
                  5,
                )
              : null,
          );

          setResultTime(
            data.result_reminder_time
              ? data.result_reminder_time.slice(
                  0,
                  5,
                )
              : null,
          );
        } catch (error) {
          console.error(
            "알림 설정 조회 실패",
            error,
          );
        }
      };

    void loadSettings();
  }, []);

  /*
   * 피커가 열릴 때
   * 현재 선택값 위치로 스크롤
   */
  useEffect(() => {
    if (!timeTarget) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          const periodIndex =
            pickerPeriod === "AM"
              ? 0
              : 1;

          const hourIndex =
            HOUR_OPTIONS.indexOf(
              pickerHour,
            );

          const minuteIndex =
            MINUTE_OPTIONS.indexOf(
              pickerMinute,
            );

          periodRef.current?.scrollTo(
            {
              top:
                periodIndex *
                ITEM_HEIGHT,
            },
          );

          hourRef.current?.scrollTo(
            {
              top:
                hourIndex *
                ITEM_HEIGHT,
            },
          );

          minuteRef.current?.scrollTo(
            {
              top:
                minuteIndex *
                ITEM_HEIGHT,
            },
          );
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    timeTarget,
    pickerPeriod,
    pickerHour,
    pickerMinute,
  ]);

  /*
   * 시간 설정 화면 열기
   */
  const openTimePicker = (
    target:
      | "checkin"
      | "result",
  ) => {
    const currentTime =
      target === "checkin"
        ? checkinTime
        : resultTime;

    if (currentTime) {
      const [
        hourString,
        minuteString,
      ] =
        currentTime.split(
          ":",
        );

      const hour24 =
        Number(hourString);

      setPickerPeriod(
        hour24 < 12
          ? "AM"
          : "PM",
      );

      setPickerHour(
        hour24 % 12 ||
          12,
      );

      setPickerMinute(
        Number(
          minuteString,
        ),
      );
    } else {
      /*
       * 최초 기본값
       */
      if (
        target ===
        "checkin"
      ) {
        setPickerPeriod(
          "PM",
        );
        setPickerHour(11);
        setPickerMinute(
          30,
        );
      } else {
        setPickerPeriod(
          "AM",
        );
        setPickerHour(9);
        setPickerMinute(
          0,
        );
      }
    }

    setTimeTarget(target);
  };

  /*
   * 휠이 멈췄을 때
   * 가장 가까운 값으로 스냅
   */
  const handleWheelScroll = <
    T,
  >(
    element:
      HTMLDivElement,
    values: T[],
    setter: (
      value: T,
    ) => void,
  ) => {
    const index =
      Math.round(
        element.scrollTop /
          ITEM_HEIGHT,
      );

    const safeIndex =
      Math.max(
        0,
        Math.min(
          index,
          values.length - 1,
        ),
      );

    setter(
      values[safeIndex],
    );
  };

  /*
   * 피커 완료
   */
  const handleSaveTime =
    () => {
      let hour24 =
        pickerHour;

      if (
        pickerPeriod ===
          "AM" &&
        pickerHour === 12
      ) {
        hour24 = 0;
      }

      if (
        pickerPeriod ===
          "PM" &&
        pickerHour !== 12
      ) {
        hour24 =
          pickerHour + 12;
      }

      const value =
        `${String(
          hour24,
        ).padStart(
          2,
          "0",
        )}:` +
        `${String(
          pickerMinute,
        ).padStart(
          2,
          "0",
        )}`;

      if (
        timeTarget ===
        "checkin"
      ) {
        setCheckinTime(
          value,
        );
      }

      if (
        timeTarget ===
        "result"
      ) {
        setResultTime(
          value,
        );
      }

      setTimeTarget(null);
    };

  /*
   * 백엔드 저장
   */
  const handleSave =
    async () => {
      const uuid =
        getUserUuid();

      if (
        !uuid ||
        isSaving
      ) {
        return;
      }

      try {
        setIsSaving(true);

        await updateNotificationSettings(
          uuid,
          {
            checkin_reminder_enabled:
              checkinEnabled,

            checkin_reminder_time:
              checkinEnabled
                ? checkinTime
                : null,

            result_reminder_enabled:
              resultEnabled,

            result_reminder_time:
              resultEnabled
                ? resultTime
                : null,
          },
        );

        console.log(
          "알림 설정 저장 완료",
        );
      } catch (error) {
        console.error(
          "알림 설정 저장 실패",
          error,
        );
      } finally {
        setIsSaving(false);
      }
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
                bg-[#112126]
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
                  onChange={() => {
                    const next =
                      !checkinEnabled;

                    setCheckinEnabled(
                      next,
                    );

                    if (!next) {
                      setCheckinTime(
                        null,
                      );
                    }
                  }}
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
                  onChange={() => {
                    const next =
                      !resultEnabled;

                    setResultEnabled(
                      next,
                    );

                    if (!next) {
                      setResultTime(
                        null,
                      );
                    }
                  }}
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
                bg-[#112126]
                px-4
              "
            >
              {/* 체크인 알림 */}
              <button
                type="button"
                disabled={
                  !checkinEnabled
                }
                onClick={() =>
                  openTimePicker(
                    "checkin",
                  )
                }
                className={`
                  flex
                  w-full
                  items-center
                  justify-between
                  py-5
                  text-left
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

                  {checkinEnabled &&
                    checkinTime && (
                      <p className="mt-2 text-[12px] text-[#809EA8]">
                        {formatTime(
                          checkinTime,
                        )}
                      </p>
                    )}
                </div>

                <ChevronRight />
              </button>

              <div className="h-px bg-[#244D54]" />

              {/* 결과 기록 알림 */}
              <button
                type="button"
                disabled={
                  !resultEnabled
                }
                onClick={() =>
                  openTimePicker(
                    "result",
                  )
                }
                className={`
                  flex
                  w-full
                  items-center
                  justify-between
                  py-5
                  text-left
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

                  {resultEnabled &&
                    resultTime && (
                      <p className="mt-2 text-[12px] text-[#809EA8]">
                        {formatTime(
                          resultTime,
                        )}
                      </p>
                    )}
                </div>

                <ChevronRight />
              </button>
            </div>
          </section>

          <button
            type="button"
            onClick={
              handleSave
            }
            disabled={
              isSaving
            }
            className="
              mt-auto
              h-14
              w-full
              rounded-[12px]
              bg-[#60CEA7]
              text-[14px]
              font-bold
              text-[#07100D]
            "
          >
            {isSaving
              ? "저장 중..."
              : "저장하기"}
          </button>
        </main>
      </div>

      {/* 시간 선택 바텀시트 */}
      {timeTarget && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-end
            justify-center
            bg-black/60
          "
          onClick={() =>
            setTimeTarget(
              null,
            )
          }
        >
          <div
            className="
              w-full
              max-w-[480px]
              rounded-t-[24px]
              border-t
              border-[#244D54]
              bg-[#0D1719]
              px-5
              pb-8
              pt-5
            "
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between">
              <h3
                className="
                  font-sans
                  text-[17px]
                  font-bold
                  leading-normal
                  text-[#F0F7FA]
                "
              >
                알림 시간
              </h3>

              <button
                type="button"
                onClick={handleSaveTime}
                className="
                  font-sans
                  text-[13px]
                  font-bold
                  leading-normal
                  text-right
                  text-[#61DBB8]
                "
              >
                완료
              </button>
            </div>

            <p className="
                  mt-4
                  font-sans
                  text-[12px]
                  font-normal
                  leading-normal
                  text-[#809EA8]
                "
              >
              {timeTarget ===
              "checkin"
                ? "취침 전 체크인을 받을 시간을 정해주세요."
                : "결과 기록 알림을 받을 시간을 정해주세요."}
            </p>

            {/* 휠 피커 */}
            <div
              className="
                relative
                mt-7
                h-[174px]
              "
            >
              {/* 가운데 선택 영역 */}
              <div
                className="
                  pointer-events-none
                  absolute
                  left-0
                  right-0
                  top-[58px]
                  z-0
                  h-[58px]
                  rounded-[14px]
                  border
                  border-[#2B8E78]
                  bg-[#103D30]
                "
              />

              <div
                className="
                  relative
                  z-10
                  grid
                  h-full
                  grid-cols-3
                "
              >
                {/* 오전 / 오후 */}
                <div
                  ref={
                    periodRef
                  }
                  onScroll={(
                    event,
                  ) =>
                    handleWheelScroll(
                      event.currentTarget,
                      PERIOD_OPTIONS,
                      setPickerPeriod,
                    )
                  }
                  className="
                    hide-scrollbar
                    h-[174px]
                    snap-y
                    snap-mandatory
                    overflow-y-scroll
                    overscroll-contain
                    py-[58px]
                  "
                >
                  {PERIOD_OPTIONS.map(
                    (
                      period,
                    ) => (
                      <div
                        key={
                          period
                        }
                        className={`
                        flex
                        h-[58px]
                        w-full
                        snap-center
                        items-center
                        justify-center
                        text-center
                        font-sans
                        leading-normal
                        ${
                          pickerPeriod === period
                            ? `
                              text-[20px]
                              font-bold
                              text-[#F0F7FA]
                            `
                            : `
                              text-[16px]
                              font-medium
                              text-[rgba(128,158,168,0.55)]
                            `
                        }
                      `}
                      >
                        {period ===
                        "AM"
                          ? "오전"
                          : "오후"}
                      </div>
                    ),
                  )}
                </div>

                {/* 시 */}
                <div
                  ref={hourRef}
                  onScroll={(event) =>
                    handleWheelScroll(
                      event.currentTarget,
                      HOUR_OPTIONS,
                      setPickerHour,
                    )
                  }
                  className="
                    hide-scrollbar
                    h-[174px]
                    snap-y
                    snap-mandatory
                    overflow-y-scroll
                    overscroll-contain
                    py-[58px]
                  "
                >
                  {HOUR_OPTIONS.map((hour) => {
                    const isSelected =
                      pickerHour === hour;

                    return (
                      <div
                        key={hour}
                        className={`
                          relative
                          flex
                          h-[58px]
                          w-full
                          snap-center
                          items-center
                          justify-center
                          text-center
                          font-sans
                          leading-normal
                          ${
                            isSelected
                              ? `
                                text-[20px]
                                font-bold
                                text-[#F0F7FA]
                              `
                              : `
                                text-[16px]
                                font-medium
                                text-[rgba(128,158,168,0.55)]
                              `
                          }
                        `}
                      >
                        {/* 숫자는 항상 열 정중앙 */}
                        <span>
                          {hour}
                        </span>

                        {/* '시'는 숫자 중앙 정렬에 영향 주지 않게 absolute */}
                        {isSelected && (
                          <span
                            className="
                              absolute
                              left-[calc(50%+28px)]
                              font-sans
                              text-[12px]
                              font-medium
                              leading-normal
                              text-[#809EA8]
                            "
                          >
                            시
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 분 */}
                <div
                  ref={minuteRef}
                  onScroll={(event) =>
                    handleWheelScroll(
                      event.currentTarget,
                      MINUTE_OPTIONS,
                      setPickerMinute,
                    )
                  }
                  className="
                    hide-scrollbar
                    h-[174px]
                    snap-y
                    snap-mandatory
                    overflow-y-scroll
                    overscroll-contain
                    py-[58px]
                  "
                >
                  {MINUTE_OPTIONS.map((minute) => {
                    const isSelected =
                      pickerMinute === minute;

                    return (
                      <div
                        key={minute}
                        className={`
                          relative
                          flex
                          h-[58px]
                          w-full
                          snap-center
                          items-center
                          justify-center
                          text-center
                          font-sans
                          leading-normal
                          ${
                            isSelected
                              ? `
                                text-[20px]
                                font-bold
                                text-[#F0F7FA]
                              `
                              : `
                                text-[16px]
                                font-medium
                                text-[rgba(128,158,168,0.55)]
                              `
                          }
                        `}
                      >
                        {/* 숫자는 항상 열 정중앙 */}
                        <span>
                          {String(minute).padStart(
                            2,
                            "0",
                          )}
                        </span>

                        {/* '분'은 숫자 정렬에 영향 X */}
                        {isSelected && (
                          <span
                            className="
                              absolute
                              left-[calc(50%+28px)]
                              font-sans
                              text-[12px]
                              font-medium
                              leading-normal
                              text-[#809EA8]
                            "
                          >
                            분
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NotificationSettingsPage;