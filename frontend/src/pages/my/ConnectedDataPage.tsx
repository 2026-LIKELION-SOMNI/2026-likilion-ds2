import Heartbeat from "../../assets/icons/Heartbeat.svg";
import Watch from "../../assets/icons/Watch.svg";
import Pencil from "../../assets/icons/Pencil.svg";

const DATA_OPTIONS = [
  {
    id: "health",
    title: "스마트폰 건강 앱",
    description:
      "수면 시간 · 활동 데이터",
    icon: Heartbeat,
  },
  {
    id: "watch",
    title: "스마트워치",
    description:
      "수면 시간 · 활동 데이터 · 심박",
    icon: Watch,
  },
  {
    id: "manual",
    title: "직접 기록",
    description:
      "웨어러블 없이 체크인으로 이용",
    icon: Pencil,
  },
];

function ConnectedDataPage() {
  return (
    <div
      className="
        flex
        h-full
        min-h-0
        flex-col
        px-5
        pb-6
      "
    >
      <section className="mt-[50px]">
        <h2
          className="
            font-sans
            text-[24px]
            font-bold
            leading-[36px]
            text-[#ECF3F2]
          "
        >
          더 정확한 패턴을 위해
          <br />
          사용 중인 데이터를 연결해요
        </h2>

        <p
          className="
            mt-[6px]
            font-sans
            text-[13px]
            font-normal
            leading-[20px]
            text-[#8DA2A6]
          "
        >
          연결하지 않아도 직접 기록으로
          시작할 수 있어요
        </p>

        <div
          className="
            mt-[30px]
            flex
            flex-col
            gap-[14px]
          "
        >
          {DATA_OPTIONS.map(
            (option) => (
              <button
                key={option.id}
                type="button"
                className="
                  flex
                  h-[92px]
                  w-full
                  items-center
                  rounded-[18px]
                  border
                  border-[#2D4548]
                  bg-[#142025]
                  px-[20px]
                  text-left
                "
              >
                <span
                  className="
                    flex
                    h-[52px]
                    w-[52px]
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-[#1C262B]
                  "
                >
                  <img
                    src={option.icon}
                    alt=""
                    aria-hidden="true"
                    className="
                      h-[24px]
                      w-[24px]
                    "
                  />
                </span>

                <span className="ml-[14px]">
                  <span
                    className="
                      block
                      font-sans
                      text-[15px]
                      font-bold
                      leading-[23px]
                      text-[#ECF3F2]
                    "
                  >
                    {option.title}
                  </span>

                  <span
                    className="
                      mt-[4px]
                      block
                      font-sans
                      text-[12px]
                      font-normal
                      leading-[18px]
                      text-[#8DA2A6]
                    "
                  >
                    {option.description}
                  </span>
                </span>
              </button>
            ),
          )}
        </div>

        <p
          className="
            mt-[14px]
            font-sans
            text-[12px]
            font-medium
            leading-[18px]
            text-[#809EA8]
          "
        >
          데이터는 패턴 분석과 개인화 추천에만 사용돼요.
          <br />
          언제든 연결을 해제할 수 있어요.
        </p>
      </section>

      {/* 아직 비활성 */}
      <button
        type="button"
        disabled
        className="
          mt-auto
          h-[54px]
          w-full
          rounded-[14px]
          bg-[#1F4047]
          font-sans
          text-[14px]
          font-bold
          text-[#07100D]
        "
      >
        저장하기
      </button>
    </div>
  );
}

export default ConnectedDataPage;