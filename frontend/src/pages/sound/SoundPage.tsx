import { useState } from "react";
import { useNavigate } from "react-router-dom";

import BottomNav from "../../components/navigation/BottomNav";

import playIcon from "../../assets/icons/Play.svg";
import pauseIcon from "../../assets/icons/Pause.svg";

const PREVIEW_SOUNDS = [
  {
    id: 1,
    title: "비",
    heights: [17, 22, 24, 22, 19, 16, 14, 13],
  },
  {
    id: 2,
    title: "시냇물",
    heights: [23, 20, 18, 16, 15, 14, 13, 12],
  },
  {
    id: 3,
    title: "파도",
    heights: [23, 20, 17, 15, 14, 15, 17, 20],
  },
  {
    id: 4,
    title: "공기음",
    heights: [17, 15, 14, 15, 17, 20, 22, 24],
  },
];

const MAIN_WAVE_HEIGHTS = [
  48, 44, 36, 28, 22, 20, 24, 32, 42, 48,
  44, 34, 26, 20, 22, 30, 40, 48, 46, 36,
  28, 22, 20, 24, 34, 44, 48, 42, 32, 24,
  20, 22, 30, 40, 48,
];

function SoundPage() {
  const navigate = useNavigate();

  // 상단 개인화 사운드 재생 상태
  const [playing, setPlaying] = useState(false);

  // 다른 소리 들어보기
  // 처음에는 아무것도 선택되지 않음
  const [previewPlayingId, setPreviewPlayingId] =
    useState<number | null>(null);

  const handlePlayToggle = () => {
    // TODO:
    // 실제 사운드 파일 연결 후 audio.play() / pause() 추가
    setPlaying((previous) => !previous);
  };

  const handlePreviewPlay = (soundId: number) => {
    setPreviewPlayingId((previous) =>
      previous === soundId ? null : soundId,
    );

    // TODO:
    // soundId에 맞는 실제 자연음 재생
  };

  return (
    <div className="flex min-h-full flex-col px-5 pb-[96px]">
      <main className="pt-10">
        <h1 className="text-[28px] font-bold text-text-primary">
          사운드
        </h1>

        {/* 개인화 사운드 */}
        <div
          className="
            mt-10 w-full rounded-[20px]
            border border-[#2B8E78]
            bg-[#103D30]
            px-4 py-5
          "
        >
          {/* 이 영역은 상세 화면 이동 */}
          <button
            type="button"
            onClick={() => navigate("/sound/my-sound")}
            className="block w-full text-left"
          >
            <div className="flex items-center gap-1 text-[11px] font-sans text-[11px]
            text-[#60CEA7] font-bold leading-normal">
              <span>개인화 사운드</span>

              <span
                className="
                  flex h-[14px] w-[14px]
                  items-center justify-center
                  rounded-full
                  border border-[#60CEA7]
                  text-[9px]
                "
              >
                i
              </span>
            </div>

            <p className="mt-4 text-[22px] font-bold text-text-primary">
              잔잔한 빗소리
            </p>

            <p className="mt-1 text-[14px] text-[#87A3A7]">
              + 노치 핑크노이즈
            </p>
          </button>

          <div className="mt-6 flex items-center gap-4">
            {/* 파형 클릭 → 상세 이동 */}
            <button
              type="button"
              onClick={() => navigate("/sound/my-sound")}
              className="
                flex h-[58px]
                min-w-0 flex-1
                items-center gap-[3px]
              "
              aria-label="나만의 사운드 정보 보기"
            >
              {MAIN_WAVE_HEIGHTS.map((height, index) => (
                <span
                  key={index}
                  className="
                    min-w-[3px]
                    flex-1
                    rounded-full
                    bg-[#60CEA7]
                  "
                  style={{
                    height: `${height}px`,
                  }}
                />
              ))}
            </button>

            {/* 재생 버튼은 페이지 이동 X */}
            <button
              type="button"
              onClick={handlePlayToggle}
              aria-label={playing ? "일시정지" : "재생"}
              className="
                flex h-11 w-11
                shrink-0
                items-center justify-center
                rounded-full
                bg-[#60CEA7]
              "
            >
              <img
                src={playing ? pauseIcon : playIcon}
                alt=""
                aria-hidden="true"
                className="h-[20px] w-[20px]"
              />
            </button>
          </div>
        </div>

        {/* 다른 소리 들어보기 */}
        <section className="mt-9">
          <h2 className="text-[16px] font-bold text-text-primary">
            다른 소리 들어보기
          </h2>

        <div className="mt-4 flex justify-between gap-2">
        {PREVIEW_SOUNDS.map((sound) => {
            const isPlaying =
            previewPlayingId === sound.id;

            return (
            <button
                key={sound.id}
                type="button"
                onClick={() =>
                handlePreviewPlay(sound.id)
                }
                className={`
                relative
                h-[86px] w-[82px]
                shrink-0
                rounded-[16px]
                border
                transition-colors
                ${
                    isPlaying
                    ? "border-[#2B8E78] bg-[#12382E]"
                    : "border-[#24464A] bg-[#102126]"
                }
                `}
            >
                {/* 파형: 카드 위에서 15px */}
                <div
                className="
                    absolute
                    left-1/2
                    top-[15px]
                    flex h-[24px]
                    -translate-x-1/2
                    items-center
                    justify-center
                    gap-[3px]
                "
                aria-hidden="true"
                >
                {sound.heights.map(
                    (height, waveIndex) => (
                    <span
                        key={waveIndex}
                        className="
                        w-[3px]
                        shrink-0
                        rounded-full
                        bg-[#61DBB8]
                        "
                        style={{
                        height: `${height}px`,
                        }}
                    />
                    ),
                )}
                </div>

                {/* 자연음 이름
                    파형 24px 끝:
                    15 + 24 = 39
                    파형 ↔ 글씨 = 11px
                    → top 50px
                */}
                <span
                className="
                    absolute
                    left-0
                    top-[50px]
                    w-full
                    text-center
                    font-sans
                    text-[11px]
                    font-bold
                    leading-[13px]
                    text-[#F0F7FA]
                "
                >
                {sound.title}
                </span>

                {/* 자연음 ↔ 재생중 = 4px */}
                {isPlaying && (
                <span
                    className="
                    absolute
                    left-0
                    top-[67px]
                    w-full
                    text-center
                    font-sans
                    text-[9px]
                    font-medium
                    leading-[11px]
                    text-[#61DBB8]
                    "
                >
                    재생중
                </span>
                )}
            </button>
            );
        })}
        </div>

        </section>

        {/* 사운드 설정 */}
        <section className="mt-9">
          <h2 className="text-[16px] font-bold text-text-primary">
            사운드 설정
          </h2>

          <button
            type="button"
            onClick={() =>
              navigate("/sound/change-nature")
            }
            className="
              mt-4 flex w-full items-center
              justify-between rounded-[14px]
              border border-[#24464A]
              bg-[#102126]
              px-4 py-5 text-left
            "
          >
            <div>
              <p className="text-[14px] font-semibold text-text-primary">
                자연음 바꾸기
              </p>

              <p className="mt-2 text-[11px] text-text-secondary">
                비 · 시냇물 · 파도 · 공기음
              </p>
            </div>

            <span className="text-[24px] font-light text-text-primary">
              ›
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/frequency")}
            className="
              mt-3 flex w-full items-center
              justify-between rounded-[14px]
              border border-[#24464A]
              bg-[#102126]
              px-4 py-5 text-left
            "
          >
            <div>
              <p className="text-[14px] font-semibold text-text-primary">
                음역대 다시 측정하기
              </p>

              <p className="mt-2 text-[11px] text-text-secondary">
                음역 매칭 · 볼륨 조절
              </p>
            </div>

            <span className="text-[24px] font-light text-text-primary">
              ›
            </span>
          </button>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

export default SoundPage;