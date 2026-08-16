import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import NatureSoundCard from "../../components/nature-sound/NatureSoundCard";
import { natureSoundCategories, natureSounds, type NatureSoundCategory,} from "../../mock/natureSoundData";

import { playNatureAudio, stopNatureAudio,} from "../../audio/natureAudio";


function NatureSoundPage() {
  const navigate = useNavigate();
  useEffect(() => {
    const setupCompleted =
      sessionStorage.getItem(
        "somni-sound-setup-completed",
      );

    if (setupCompleted === "true") {
      navigate(
        "/recovery-session",
        {
          replace: true,
        },
      );
    }
  }, [navigate]);

  useEffect(() => {
    return () => {
      stopNatureAudio();
    };
  }, []);
  const [selectedCategory, setSelectedCategory] =
    useState<NatureSoundCategory>("추천");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSoundId, setSelectedSoundId] =
    useState<number | null>(null);
  const [playingSoundId, setPlayingSoundId] =
    useState<number | null>(null);

  const filteredSounds = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();

    return natureSounds.filter((sound) => {
      const matchesCategory =
        selectedCategory === "추천"
          ? sound.recommended
          : sound.category === selectedCategory;

      const matchesSearch =
        trimmedQuery.length === 0 ||
        sound.title.toLowerCase().includes(trimmedQuery) ||
        sound.description.toLowerCase().includes(trimmedQuery) ||
        sound.keywords.some((keyword) =>
          keyword.toLowerCase().includes(trimmedQuery),
        );

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleCategoryClick = (
    category: NatureSoundCategory,
  ) => {
    setSelectedCategory(category);
  };

  const handleSoundSelect = (soundId: number) => {
    setSelectedSoundId(soundId);
  };

  const handleSoundPlay = async (
    soundId: number,
  ) => {
    const sound = natureSounds.find(
      (item) => item.id === soundId,
    );

    if (!sound) {
      return;
    }

    if (playingSoundId === soundId) {
      stopNatureAudio();
      setPlayingSoundId(null);
      return;
    }

    try {
      await playNatureAudio(sound.audio);
      setPlayingSoundId(soundId);
    } catch (error) {
      console.error(
        "자연음 재생 실패",
        error,
      );
    }
  };

  const handleConfirm = () => {
    if (!selectedSoundId) {
      return;
    }

    const selectedSound =
      natureSounds.find(
        (sound) =>
          sound.id === selectedSoundId,
      );

    if (!selectedSound) {
      return;
    }

    /*
    * AI Sound Fit 등에서
    * 현재 선택한 자연음을 사용할 수 있도록 저장
    */
    sessionStorage.setItem(
      "somni-selected-nature-sound",
      selectedSound.backendValue,
    );

    stopNatureAudio();

    navigate("/sound-setup");
  };


  return (
    <div className="flex min-h-full flex-col px-4 pb-6">

      {/* 질문 */}
      <section className="pt-8">
        <h1
          className="
            font-sans
            text-[24px]
            font-bold
            leading-[36px]
            text-[#ECF3F2]
          "
        >
          어떤 배경 소리가
          <br />
          가장 편안한가요?
        </h1>

        {/* 검색 */}
        <div
          className="
            mt-10 flex h-10 items-center
            rounded-[10px] border border-[#24464A]
            bg-[#102126] px-3
          "
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0 text-[#87A3A7]"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="1.7"
            />

            <path
              d="M16.5 16.5L21 21"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>

          <input
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="자연음 검색"
            className="
              ml-2 min-w-0 flex-1
              bg-transparent
              text-[12px] text-text-primary
              outline-none
              placeholder:text-[#65797C]
            "
          />
        </div>

        {/* 카테고리 */}
        <div className="mt-4 flex gap-2">
          {natureSoundCategories.map((category) => {
            const active = selectedCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  handleCategoryClick(category)
                }
                className={`
                  h-8 rounded-full border px-4
                  text-[11px] font-medium
                  ${
                    active
                      ? "border-[#38A887] bg-[#154638] text-[#60CEA7]"
                      : "border-[#294A4F] bg-[#102126] text-text-secondary"
                  }
                `}
              >
                {category}
              </button>
            );
          })}
        </div>
      </section>

      {/* 목록 / 검색 결과 없음 */}
      <section className="mt-12">
        {filteredSounds.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredSounds.map((sound) => (
              <NatureSoundCard
                key={sound.id}
                sound={sound}
                selected={selectedSoundId === sound.id}
                playing={playingSoundId === sound.id}
                onSelect={() =>
                  handleSoundSelect(sound.id)
                }
                onPlay={() =>
                  handleSoundPlay(sound.id)
                }
              />
            ))}
          </div>
        ) : (
          <div
            className="
              flex min-h-[330px] flex-col
              items-center justify-center
            "
          >
            {/* 검색 결과 없음 원형 그래픽 */}
            <div
              className="
                relative flex h-[150px] w-[150px]
                items-center justify-center rounded-full
                border border-[#183C3A]
              "
            >
              <div
                className="
                  flex h-[120px] w-[120px]
                  items-center justify-center rounded-full
                  border border-[#1D5149]
                "
              >
                <div
                  className="
                    flex h-[88px] w-[88px]
                    items-center justify-center rounded-full
                    border border-[#28705F]
                  "
                >
                  <div
                    className="
                      flex h-[56px] w-[56px]
                      items-center justify-center rounded-full
                      border border-[#3A9D80]
                    "
                  >
                    <div className="flex gap-1">
                      <span className="h-[6px] w-[6px] rounded-full bg-[#60CEA7]" />
                      <span className="h-[6px] w-[6px] rounded-full bg-[#60CEA7]" />
                      <span className="h-[6px] w-[6px] rounded-full bg-[#60CEA7]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="mt-8 text-[18px] font-bold text-text-primary">
              검색 결과가 없습니다.
            </h2>

            <p className="mt-3 text-[11px] text-text-secondary">
              검색어를 확인해 주세요.
            </p>
          </div>
        )}
      </section>

      {/* 하단 선택 */}
      <div className="mt-auto pt-8">
        <button
          type="button"
          disabled={!selectedSoundId}
          onClick={handleConfirm}
          className={`
            h-14 w-full rounded-[12px]
            text-[14px] font-bold
            ${
              selectedSoundId
                ? "bg-[#60CEA7] text-[#07100d]"
                : "bg-[#214750] text-[#0d1719]"
            }
          `}
        >
          선택
        </button>
      </div>
    </div>
  );
}

export default NatureSoundPage;