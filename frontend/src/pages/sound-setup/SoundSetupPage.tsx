import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type SoundSetupScreen = "ready" | "mixing";

const WAVE_HEIGHTS = [
  36, 42, 44, 46, 44, 40, 36, 32,
  30, 34, 40, 44, 48, 50, 46, 42,
  38, 36, 40, 44, 48, 52, 50, 46,
  42, 40, 44, 48, 50,
];

function SoundSetupPage() {
  const navigate = useNavigate();

  const [screen, setScreen] =
    useState<SoundSetupScreen>("ready");

  const [volume, setVolume] = useState(22);

  const handleNext = () => {
    setScreen("mixing");
  };

  const handleVolumeDown = () => {
    setVolume((previous) =>
      Math.max(0, previous - 1),
    );
  };

  const handleVolumeUp = () => {
    setVolume((previous) =>
      Math.min(100, previous + 1),
    );
  };

    const handleStart = () => {
        // TODO: 다음 페이지 확정 후 연결
    };

    const handlePreviousScreen = useCallback(() => {
    // 혼합점 화면 → 바로 직전 노이즈 준비 화면
    if (screen === "mixing") {
        setScreen("ready");
        return;
    }

    // 노이즈 준비 화면 → 자연음 선택 화면
    if (screen === "ready") {
        navigate("/nature-sound");
    }
    }, [screen, navigate]);

    useEffect(() => {
    window.addEventListener(
        "sound-setup-back",
        handlePreviousScreen,
    );

    return () => {
        window.removeEventListener(
        "sound-setup-back",
        handlePreviousScreen,
        );
    };
    }, [handlePreviousScreen]);

  /*
    첫 번째 화면
    사운드 준비
  */
  if (screen === "ready") {
    return (
      <div className="flex min-h-full flex-col px-5 pb-6">
        <section className="pt-8">
          <h1
            className="
              text-[1.25rem]
              leading-[1.75rem]
              font-bold
              text-text-primary
            "
          >
            이명 대역을 참고하여
            <br />
            노이즈를 준비했어요.
          </h1>

          <div
            className="
              mt-10 rounded-[1rem]
              border border-[#236653]
              bg-[#103329]
              px-4 py-7
            "
          >
            <div className="flex h-[72px] items-center justify-center gap-[3px]">
              {WAVE_HEIGHTS.map((height, index) => (
                <span
                  key={index}
                  className={`
                    w-[3px] rounded-full
                    ${
                      index >= 13 && index <= 16
                        ? "bg-[#A58D51]"
                        : "bg-[#60CEA7]"
                    }
                  `}
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>

            <div
              className="
                mt-2 flex justify-center
                gap-5
                text-[0.6875rem]
                text-text-secondary
              "
            >
              <span>842Hz</span>
              <span>863Hz</span>
            </div>
          </div>

          {/*
            TODO:
            75% / 25%는 이후 기획 수정 예정.
            일단 Figma 그대로 구현.
          */}
          <div
            className="
              mt-5 rounded-[0.875rem]
              border border-[#24464A]
              bg-[#102126]
              p-4
            "
          >
            <h2 className="text-[0.875rem] font-bold text-text-primary">
              이번 사운드 구성
            </h2>

            <div className="mt-3 h-px bg-[#294A4F]" />

            <div className="mt-5 flex justify-between">
              <span className="text-[0.75rem] text-text-secondary">
                원본 자연음
              </span>

              <span className="text-[0.75rem] font-semibold text-text-primary">
                잔잔한 빗소리
              </span>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-[0.75rem] text-text-secondary">
                맞춤 노이즈
              </span>

              <span className="text-[0.75rem] font-semibold text-text-primary">
                핑크노이즈
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2">
            <span className="text-[0.75rem] text-[#87A3A7]">
              ⓘ
            </span>

            <div className="text-[0.6875rem] leading-5 text-text-secondary">
              <p>맞춤 노이즈는 어떻게 만들어지나요?</p>

              <p className="mt-2">
                이명 음역을 기준으로 해당 음역대가 줄어들도록
                소리를 조정해요.
                <br />
                이러한 방식을 노치 사운드(Notched Sound)라고 해요.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-auto pt-10">
          <button
            type="button"
            onClick={handleNext}
            className="
              h-14 w-full rounded-[0.75rem]
              bg-[#60CEA7]
              text-[0.875rem]
              font-bold
              text-[#07100d]
            "
          >
            다음
          </button>
        </div>
      </div>
    );
  }

  /*
    두 번째 화면
    혼합점 / 볼륨 조절
  */
  return (
    <div className="flex min-h-full flex-col px-5 pb-6">
      <section className="pt-16">
        <h1
          className="
            text-[1.25rem]
            leading-[1.75rem]
            font-bold
            text-text-primary
          "
        >
          이명이 완전히 사라지지 않는
          <br />
          지점을 찾아볼게요.
        </h1>

        <div
          className="
            mt-10 rounded-[1rem]
            border border-[#236653]
            bg-[#103329]
            p-5
          "
        >
          <p className="text-[0.6875rem] font-semibold text-[#60CEA7]">
            현재 볼륨
          </p>

          <p className="mt-2 text-[2rem] font-bold text-text-primary">
            {volume}%
          </p>

          <div className="mt-3 flex h-[64px] items-center gap-[3px]">
            {WAVE_HEIGHTS.map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-full bg-[#60CEA7]"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
        </div>

        <div className="mt-7 flex items-center gap-4">
          <button
            type="button"
            onClick={handleVolumeDown}
            aria-label="볼륨 낮추기"
            className="
              flex size-10 shrink-0
              items-center justify-center
              rounded-full
              border border-[#38A887]
              text-[1.5rem]
              text-text-primary
            "
          >
            −
          </button>

          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(event) =>
              setVolume(Number(event.target.value))
            }
            aria-label="볼륨 조절"
            className="
              min-w-0 flex-1
              accent-[#60CEA7]
            "
          />

          <button
            type="button"
            onClick={handleVolumeUp}
            aria-label="볼륨 높이기"
            className="
              flex size-10 shrink-0
              items-center justify-center
              rounded-full
              border border-[#38A887]
              text-[1.5rem]
              text-text-primary
            "
          >
            +
          </button>
        </div>

        <div className="mt-10">
          <p className="text-[0.75rem] font-semibold text-[#D7AD55]">
            완전히 덮이는 느낌이라면 볼륨을 조금 낮춰주세요.
          </p>

          <p className="mt-2 text-[0.6875rem] text-text-secondary">
            이명이 이 노이즈랑 자연스럽게 어울리는 지점을 찾아보세요.
          </p>
        </div>
      </section>

      <div className="mt-auto pt-10">
        <button
          type="button"
          onClick={handleStart}
          className="
            h-14 w-full rounded-[0.75rem]
            bg-[#60CEA7]
            text-[0.875rem]
            font-bold
            text-[#07100d]
          "
        >
          시작하기
        </button>
      </div>
    </div>
  );
}

export default SoundSetupPage;