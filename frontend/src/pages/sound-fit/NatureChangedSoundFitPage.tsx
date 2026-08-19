import {
  useNavigate,
} from "react-router-dom";

import infoIcon from "../../assets/icons/Info.svg";

function NatureChangedSoundFitPage() {
  const navigate =
    useNavigate();

  const previousNature =
    sessionStorage.getItem(
      "somni-previous-nature-sound-label",
    ) ?? "-";

  const newNature =
    sessionStorage.getItem(
      "somni-selected-nature-sound-label",
    ) ?? "-";

  return (
    <div
      className="
        flex
        h-full
        min-h-0
        flex-col
        px-5
        pb-[40px]
      "
    >
      <main
        className="
          flex
          flex-1
          flex-col
        "
      >
        {/* 상단 내용 */}
        <section className="pt-[58px]">
          <h1
            className="
              font-sans
              text-[24px]
              font-bold
              leading-[36px]
              text-[#ECF3F2]
            "
          >
            새 자연음에 맞춰
            <br />
            취향을 다시 확인할게요
          </h1>

          {/* 자연음 비교 박스 */}
            <div
            className="
                mt-[40px]
                w-full
                rounded-[17px]
                border
                border-[#24464E]
                bg-[#112126]
                px-[16px]
                pt-[17px]
            "
            >
            {/* 이전 자연음 */}
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <span
                className="
                  font-sans
                  text-[11px]
                  font-normal
                  leading-normal
                  text-[#809EA8]
                "
              >
                이전 자연음
              </span>

              <span
                className="
                  font-sans
                  text-[12px]
                  font-bold
                  leading-normal
                  text-[#ECF3F2]
                "
              >
                {previousNature}
              </span>
            </div>

            {/* 경계선 */}
            <div
              className="
                mt-[16px]
                h-px
                w-full
                bg-[#24464E]
              "
            />

            {/* 새 자연음 */}
            <div
            className="
                mt-[14px]
                flex
                items-center
                justify-between
                pb-[18px]
            "
            >
            <span
                className="
                font-sans
                text-[11px]
                font-normal
                leading-normal
                text-[#809EA8]
                "
            >
                새 자연음
            </span>

            <span
                className="
                font-sans
                text-[12px]
                font-bold
                leading-normal
                text-[#61DBB8]
                "
            >
                {newNature}
            </span>
            </div>
          </div>

          {/* 왜 다시 하나요 */}
          <div
            className="
              mt-[50px]
              flex
              items-start
            "
          >
            <img
              src={infoIcon}
              alt=""
              aria-hidden="true"
              className="
                mt-[1px]
                h-[16px]
                w-[16px]
                shrink-0
              "
            />

            <div className="ml-[11px]">
              <p
                className="
                  font-sans
                  text-[12px]
                  font-normal
                  leading-normal
                  text-[#809EA8]
                "
              >
                왜 다시 하나요?
              </p>

              <p
                className="
                  mt-[8px]
                  font-sans
                  text-[11px]
                  font-normal
                  leading-[18px]
                  text-[#809EA8]
                "
              >
                자연음이 달라지면 같은 사운드 질감도
                다르게 느껴질 수 있어서
                <br />
                새로운 기본 프로필을 설정하는 게 좋아요.
              </p>
            </div>
          </div>
        </section>

        {/* 하단 버튼 */}
        <div className="mt-auto">
          <button
            type="button"
            onClick={() =>
              navigate("/sound-fit")
            }
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
            시작하기
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/sound")
            }
            className="
              mt-[20px]
              w-full
              text-center
              font-sans
              text-[13px]
              font-medium
              leading-normal
              text-[#87CBE6]
            "
          >
            새 자연음에 기존 설정 적용하기
          </button>
        </div>
      </main>
    </div>
  );
}

export default NatureChangedSoundFitPage;