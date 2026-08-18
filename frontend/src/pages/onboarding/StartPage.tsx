import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import WaveAnimation from "../../components/common/WaveAnimation";

function StartPage() {
  const navigate = useNavigate();

  return (
    <div
      className="
        flex
        h-full
        min-h-0
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
          오늘 밤도,
          <br />
          편안하게 잠들 수 있도록
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
          이명이 커지는 밤의 상태를 기록하고
          <br />
          나에게 맞는 사운드와 회복 루틴을 찾아요.
        </p>

        <WaveAnimation className="mt-[30px]" />
      </section>

      <div className="mt-auto">
        <p
          className="
            text-center
            font-sans
            text-[0.6875rem]
            font-normal
            leading-[1.0625rem]
            text-[#587176]
          "
        >
          의료 진단이 아닌 일상 관리를 돕는 웰니스 서비스예요.
        </p>

        <Button
          className="mt-[3.94rem]"
          onClick={() => navigate("/onboarding/safety")}
        >
          나의 밤 이해하기
        </Button>
      </div>
    </div>
  );
}

export default StartPage;
