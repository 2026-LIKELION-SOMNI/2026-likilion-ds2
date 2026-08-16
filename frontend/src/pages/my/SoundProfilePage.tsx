import {
  useNavigate,
} from "react-router-dom";

import soundProfileWave from "../../assets/icons/sound-profile-wave.svg";

function SoundProfilePage() {
  const navigate = useNavigate();

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
          내 사운드 취향을 찾았어요.
        </h2>

        <p
          className="
            mt-[2px]
            font-sans
            text-[13px]
            font-normal
            leading-normal
            text-[#809EA8]
          "
        >
          저장된 사운드 프로필은
          마이페이지에서도 확인할 수 있어요.
        </p>

        {/* 사운드 프로필 카드 */}
        <div
          className="
            mt-[40px]
            flex
            h-[125px]
            w-full
            items-start
            justify-between
            rounded-[20px]
            border
            border-[#2B8E78]
            bg-[#12382E]
            px-[16px]
            py-[16px]
          "
        >
          <div>
            <p
              className="
                font-sans
                text-[11px]
                font-bold
                leading-normal
                text-[#61DBB8]
              "
            >
              My Sound Profile
            </p>

            <p
              className="
                mt-[10px]
                font-sans
                text-[18px]
                font-bold
                leading-normal
                text-[#F0F7FA]
              "
            >
              부드러운 질감
            </p>

            <p
              className="
                mt-[8px]
                font-sans
                text-[18px]
                font-bold
                leading-normal
                text-[#F0F7FA]
              "
            >
              자연음 중심
            </p>
          </div>

          {/* 네가 새로 보낸 100×70 파형 SVG */}
          <img
            src={soundProfileWave}
            alt=""
            aria-hidden="true"
            className="
              mt-[19px]
              h-[70px]
              w-[100px]
              shrink-0
            "
          />
        </div>
      </section>

      <div className="mt-auto">
        <button
          type="button"
          onClick={() =>
            navigate("/my")
          }
          className="
            h-[54px]
            w-full
            rounded-[14px]
            bg-[#61DBB8]
            font-sans
            text-[14px]
            font-bold
            text-[#07100D]
          "
        >
          확인
        </button>

        <button
          type="button"
          className="
            mt-[20px]
            w-full
            text-center
            font-sans
            text-[13px]
            font-medium
            text-[#87CBE6]
          "
        >
          다시 측정하기
        </button>
      </div>
    </div>
  );
}

export default SoundProfilePage;