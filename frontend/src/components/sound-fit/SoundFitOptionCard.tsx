interface SoundFitOptionCardProps {
  label: "A" | "B";
  description: string;

  selected: boolean;
  playing: boolean;

  onSelect: () => void;
  onPlay: () => void;
}

function SoundFitOptionCard({
  label,
  description,
  selected,
  playing,
  onSelect,
  onPlay,
}: SoundFitOptionCardProps) {
  return (
    <article
    className={`
    flex
    min-w-0
    flex-1
    flex-col
    rounded-[18px]
    border
    bg-[#102126]
    p-[14px]
    ${
        selected
        ? "border-[#61DBB8]"
        : "border-[#24464E]"
    }
    `}
    >
      <div className="flex items-center justify-between">
        <span
          className="
            flex
            h-[32px]
            w-[32px]
            items-center
            justify-center
            rounded-full
            bg-[#192B2F]
            text-[12px]
            font-bold
            text-[#809EA8]
          "
        >
          {label}
        </span>

        <span className="ml-2 text-right text-[11px] text-[#809EA8]">
          {description}
        </span>
      </div>

      <div
        className="
          mt-[16px]
          flex
          h-[128px]
          flex-col
          items-center
          justify-center
          rounded-[12px]
          bg-[#17272B]
        "
      >
        <div className="flex h-[60px] items-center gap-[3px]">
          {[
            28, 38, 42, 32,
            26, 36, 24, 30,
            38, 28, 22, 30,
          ].map(
            (height, index) => (
              <span
                key={index}
                className="
                  w-[4px]
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

        <button
          type="button"
          onClick={onPlay}
          className={`
            mt-[14px]
            text-[11px]
            ${
              playing
                ? "text-[#61DBB8]"
                : "text-[#809EA8]"
            }
          `}
        >
          ▶{" "}
          {playing
            ? "재생 중"
            : "들어보기"}
        </button>
      </div>

      <button
        type="button"
        onClick={onSelect}
        className={`
          mt-[14px]
          h-[46px]
          rounded-[12px]
          border
          text-[12px]
          font-bold
          ${
            selected
              ? "border-[#236653] bg-[#174638] text-[#61DBB8]"
              : "border-[#24464E] text-[#E8F5F2]"
          }
        `}
      >
        {selected
          ? "선택됨"
          : "선택"}
      </button>
    </article>
  );
}

export default SoundFitOptionCard;