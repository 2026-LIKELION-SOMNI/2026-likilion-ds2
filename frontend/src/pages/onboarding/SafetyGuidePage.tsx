import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";

const TOGETHER_ITEMS = [
  "오늘의 불편도와 생활요인 기록",
  "개인화 사운드와 짧은 수면 준비 루틴",
  "반복 기록에서 나의 경향 확인",
];

function SafetyGuidePage() {
  const navigate = useNavigate();

  return (
    <div
      className="
        flex
        min-h-full
        flex-col
        px-6
        pb-[2.5rem]
      "
    >
      <header className="pt-[44px]">
        <p
          className="
            font-sans
            text-[17px]
            font-bold
            leading-normal
            text-[#61DBB8]
          "
        >
          Somni
        </p>
      </header>

      <section className="mt-[64px]">
        <h1
          className="
            font-sans
            text-[1.8125rem]
            font-bold
            leading-[2.75rem]
            text-[#ECF3F2]
          "
        >
          Somni는 의료 진단을
          <br />
          대신하지 않아요.
        </h1>

        <p
          className="
            mt-[20px]
            font-sans
            text-[0.875rem]
            font-normal
            leading-[1.3125rem]
            text-[#8DA2A6]
          "
        >
          일상에서 이명으로 잠들기 어려운 밤을
          <br />
          관리하도록 돕는 웰니스 서비스 입니다.
        </p>

        <div
          className="
            mt-[1.875rem]
            w-full
            rounded-[1.0625rem]
            border
            border-[#24464E]
            bg-[#112126]
            px-[1rem]
            py-[1.0625rem]
          "
        >
          <p
            className="
              font-sans
              text-[0.8125rem]
              font-bold
              leading-normal
              text-[#F0F7F5]
            "
          >
            Somni와 함께 하기
          </p>

          <ul className="mt-[0.75rem] flex flex-col gap-[0.375rem]">
            {TOGETHER_ITEMS.map((item) => (
              <li
                key={item}
                className="
                  flex
                  items-start
                  font-inter
                  text-[0.8125rem]
                  font-normal
                  leading-[145%]
                  text-[#9EB0AD]
                "
              >
                <span className="mr-[0.5rem] shrink-0">•</span>

                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="
            mt-[1rem]
            w-full
            rounded-[1.0625rem]
            border
            border-[#24464E]
            bg-[#112126]
            px-[1rem]
            py-[1.0625rem]
          "
        >
          <p
            className="
              font-sans
              text-[0.8125rem]
              font-bold
              leading-normal
              text-[#F0F7F5]
            "
          >
            의료기관 확인이 필요한 경우
          </p>

          <p
            className="
              mt-[0.75rem]
              font-inter
              text-[0.8125rem]
              font-normal
              leading-[145%]
              text-[#9EB0AD]
            "
          >
            갑작스러운 한쪽 청력 저하, 심한 어지러움, 귀 통증 등은
            앱 사용보다 진료가 우선일 수 있어요.
          </p>
        </div>
      </section>

      <div className="mt-auto">
        <Button onClick={() => navigate("/frequency")}>계속</Button>
      </div>
    </div>
  );
}

export default SafetyGuidePage;
