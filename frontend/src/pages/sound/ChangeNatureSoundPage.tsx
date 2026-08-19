import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import NatureSoundCard from "../../components/nature-sound/NatureSoundCard";

import { natureSoundCategories, natureSounds, type NatureSoundCategory,} from "../../mock/natureSoundData";
import { playNatureAudio, stopNatureAudio,} from "../../audio/natureAudio";

import { getSoundSession, updateSoundBackground, } from "../../api/sound";
import { getUserUuid, } from "../../utils/userStorage";

function ChangeNatureSoundPage() {
  const navigate = useNavigate();
  useEffect(() => {
    return () => {
      stopNatureAudio();
    };
  }, []);

  const [selectedCategory, setSelectedCategory] =
    useState<NatureSoundCategory>("추천");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [selectedSoundId, setSelectedSoundId] =
    useState<number | null>(null);

  const [playingSoundId, setPlayingSoundId] =
    useState<number | null>(null);

  const filteredSounds = useMemo(() => {
    const trimmedQuery =
      searchQuery.trim().toLowerCase();

    return natureSounds.filter((sound) => {
      const matchesCategory =
        selectedCategory === "추천"
          ? sound.recommended
          : sound.category === selectedCategory;

      const matchesSearch =
        trimmedQuery.length === 0 ||
        sound.title
          .toLowerCase()
          .includes(trimmedQuery) ||
        sound.description
          .toLowerCase()
          .includes(trimmedQuery) ||
        sound.keywords.some((keyword) =>
          keyword
            .toLowerCase()
            .includes(trimmedQuery),
        );

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

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

  const handleConfirm = async () => {
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

    const uuid = getUserUuid();

    const sessionId =
      sessionStorage.getItem(
        "somni-current-sound-session-id",
      );

    if (!uuid || !sessionId) {
      console.error(
        "현재 사운드 세션 정보를 찾을 수 없습니다.",
      );
      return;
    }

    const labelMap: Record<
      string,
      string
    > = {
      rain: "잔잔한 빗소리",
      stream: "시냇물 소리",
      ocean: "파도 소리",
      air: "팬·공기음",
    };

    try {
      /*
      * 변경 전 현재 자연음 조회
      */
      const currentSession =
        await getSoundSession(
          uuid,
          sessionId,
        );

      const currentParams =
        currentSession.final_params ??
        currentSession.generated_params;

      const currentBackground =
        currentParams?.sources?.find(
          (source) =>
            source.role === "ambient" ||
            source.type === "background",
        );

      const previousValue =
        currentBackground?.asset_tag;

      /*
      * 이전 자연음 이름 저장
      */
      if (previousValue) {
        sessionStorage.setItem(
          "somni-previous-nature-sound-label",
          labelMap[previousValue] ??
            previousValue,
        );
      }

      /*
      * 새 자연음으로 백엔드 변경
      */
      const updatedSession =
        await updateSoundBackground(
          uuid,
          sessionId,
          selectedSound.backendValue,
        );

      console.log(
        "자연음 변경 결과:",
        updatedSession,
      );

      /*
      * 새 자연음 값 + 표시 이름 저장
      */
      sessionStorage.setItem(
        "somni-selected-nature-sound",
        selectedSound.backendValue,
      );

      sessionStorage.setItem(
        "somni-selected-nature-sound-label",
        labelMap[
          selectedSound.backendValue
        ] ?? selectedSound.title,
      );

      stopNatureAudio();

      /*
      * 바로 Sound 화면으로 가지 않고
      * Sound Fit 안내 화면으로 이동
      */
      navigate(
        "/sound-fit/nature-changed",
      );
    } catch (error) {
      console.error(
        "자연음 변경 실패",
        error,
      );
    }
  };

  return (
    <div className="flex min-h-full flex-col px-4 pb-6">
      {/* 문구 */}
      <section className="pt-8">
        <h1
          className="
            text-[24px]
            leading-[30px]
            font-bold
            text-text-primary
          "
        >
          배경 자연음만 바꿔요.
        </h1>

        <p className="mt-2 text-[12px] text-text-secondary">
          노치 대역과 자동 믹싱 규칙은 그대로 유지됩니다.
        </p>

        {/* 검색 */}
        <div
          className="
            mt-10 flex h-10
            items-center
            rounded-[10px]
            border border-[#24464A]
            bg-[#102126]
            px-3
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
              text-[12px]
              text-text-primary
              outline-none
              placeholder:text-[#65797C]
            "
          />
        </div>

        {/* 카테고리 */}
        <div className="mt-4 flex gap-2">
          {natureSoundCategories.map(
            (category) => {
              const active =
                selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(category)
                  }
                  className={`
                    h-8 rounded-full
                    border px-4
                    text-[11px]
                    font-medium
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
            },
          )}
        </div>
      </section>

      {/* 목록 */}
      <section className="mt-12">
        {filteredSounds.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredSounds.map((sound) => (
              <NatureSoundCard
                key={sound.id}
                sound={sound}
                selected={
                  selectedSoundId === sound.id
                }
                playing={
                  playingSoundId === sound.id
                }
                onSelect={() =>
                  setSelectedSoundId(sound.id)
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
              flex min-h-[330px]
              flex-col items-center
              justify-center
            "
          >
            <div
              className="
                relative flex
                h-[150px] w-[150px]
                items-center
                justify-center
                rounded-full
                border border-[#183C3A]
              "
            >
              <div
                className="
                  flex h-[120px]
                  w-[120px]
                  items-center
                  justify-center
                  rounded-full
                  border border-[#1D5149]
                "
              >
                <div
                  className="
                    flex h-[88px]
                    w-[88px]
                    items-center
                    justify-center
                    rounded-full
                    border border-[#28705F]
                  "
                >
                  <div
                    className="
                      flex h-[56px]
                      w-[56px]
                      items-center
                      justify-center
                      rounded-full
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

      {/* 적용 */}
      <div className="mt-auto pt-8">
        <button
          type="button"
          disabled={!selectedSoundId}
          onClick={handleConfirm}
            className={`
            h-14 w-full
            rounded-[12px]
            text-[14px]
            font-bold
            ${
              selectedSoundId
                ? "bg-[#60CEA7] text-[#07100D]"
                : "bg-[#214750] text-[#0D1719]"
            }
          `}
        >
          적용
        </button>
      </div>
    </div>
  );
}

export default ChangeNatureSoundPage;