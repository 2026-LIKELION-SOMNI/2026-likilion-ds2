import { useNavigate } from "react-router-dom";
import {
  getPitchMatchSession,
} from "../../utils/pitchMatchStorage";

const WAVE_HEIGHTS = [
  28, 30, 26, 22, 20, 22, 26, 30, 32, 30,
  26, 22, 20, 22, 26, 30, 32, 30, 26, 22,
  20, 22, 26, 30, 32, 30, 26, 22, 20, 22,
  26, 30, 32, 30, 26, 22, 20, 22, 26, 30,
];

function MySoundPage() {
  const navigate = useNavigate();
  
  const pitchMatchSession =
    getPitchMatchSession();

  const centerFrequency =
    Math.round(
      pitchMatchSession
        ?.center_frequency ?? 0,
    );

  const lowerBound =
    Math.round(
      pitchMatchSession?.lower_bound ??
        0,
    );

  const upperBound =
    Math.round(
      pitchMatchSession?.upper_bound ??
        0,
    );

  if (!pitchMatchSession) {
    return (
      <div className="flex min-h-full items-center justify-center px-5">
        <p className="text-[13px] text-text-secondary">
          음역 매칭 결과를 찾지 못했어요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-5 pb-6">

      <main className="flex flex-1 flex-col pt-12">
        <h2
          className="
            text-[24px] leading-[32px]
            font-bold text-text-primary
          "
        >
          자연음과 노치 노이즈가
          <br />
          자동으로 섞였어요.
        </h2>

        <p className="mt-3 text-[12px] leading-5 text-text-secondary">
          자연음은 그대로 두고
          <br />
          핑크노이즈에서 내 이명 대역만 낮춘 뒤 함께 재생해요.
        </p>

        {/* 사운드 정보 */}
        <section
          className="
            mt-8 rounded-[18px]
            border border-[#2B8E78]
            bg-[#103D30]
            p-4
          "
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-text-secondary">
              자연음
            </span>

            <strong className="text-[15px] text-text-primary">
              잔잔한 빗소리
            </strong>
          </div>

          <div className="my-4 h-px bg-[#29554D]" />

          <div className="flex items-center justify-between">
            <span className="text-[12px] text-text-secondary">
              노치 핑크노이즈
            </span>

            <strong className="text-[15px] text-text-primary">
              {centerFrequency}Hz 중심 대역 감소
            </strong>
          </div>

          <div className="mt-7 flex h-[42px] items-center gap-[3px]">
            {WAVE_HEIGHTS.map((height, index) => (
              <span
                key={index}
                className="
                  min-w-[3px] flex-1
                  rounded-full bg-[#60CEA7]
                "
                style={{
                  height: `${height}px`,
                }}
              />
            ))}
          </div>
        </section>

        {/* 노치 범위 */}
        <section
          className="
            mt-4 rounded-[16px]
            border border-[#24464A]
            bg-[#102126]
            p-4
          "
        >
          <p className="text-[13px] font-semibold text-text-primary">
            노치 적용 범위
          </p>

          <p className="mt-4 text-[24px] font-bold text-[#60CEA7]">
              {lowerBound.toLocaleString()} -{" "}
              {upperBound.toLocaleString()} Hz
          </p>
        </section>

        <button
          type="button"
          onClick={() => navigate("/sound")}
          className="
            mt-auto h-14 w-full
            rounded-[12px]
            bg-[#60CEA7]
            text-[14px] font-bold
            text-[#07100D]
          "
        >
          확인
        </button>
      </main>
    </div>
  );
}

export default MySoundPage;