import type { NatureSound } from "../../mock/natureSoundData";

interface NatureSoundCardProps {
  sound: NatureSound;
  selected: boolean;
  playing: boolean;
  onSelect: () => void;
  onPlay: () => void;
}

const WAVE_HEIGHTS = [18, 28, 24, 34, 22, 30, 18];

function NatureSoundCard({
  sound,
  selected,
  playing,
  onSelect,
  onPlay,
}: NatureSoundCardProps) {
  return (
    <div
      className={`
        flex h-[76px] w-full items-center
        rounded-[12px] border px-3
        transition-colors
        ${
          selected
            ? "border-[#38A887] bg-[#173A34]"
            : "border-[#24464A] bg-[#102126]"
        }
      `}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center text-left"
      >
        <div
          className="
            flex h-[52px] w-[52px] shrink-0
            items-center justify-center
            rounded-[10px] bg-[#07171B]
          "
          aria-hidden="true"
        >
          <div className="flex items-center gap-[3px]">
            {WAVE_HEIGHTS.map((height, index) => (
              <span
                key={`${sound.id}-${index}`}
                className="w-[3px] rounded-full bg-[#60CEA7]"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
        </div>

        <div className="ml-3 min-w-0">
          <p className="truncate text-[13px] font-semibold text-text-primary">
            {sound.title}
          </p>

          <p className="mt-1 truncate text-[10px] text-text-secondary">
            {sound.description}
          </p>
        </div>
      </button>

      <button
        type="button"
        aria-label={`${sound.title} ${playing ? "재생 중지" : "재생"}`}
        onClick={onPlay}
        className={`
          ml-3 flex h-8 w-8 shrink-0
          items-center justify-center rounded-full
          ${
            playing || selected
              ? "bg-[#60CEA7] text-[#08201A]"
              : "bg-[#0A4939] text-[#071B16]"
          }
        `}
      >
        {playing ? (
          <span className="text-[11px] font-bold">Ⅱ</span>
        ) : (
          <span className="ml-[2px] text-[12px]">▶</span>
        )}
      </button>
    </div>
  );
}

export default NatureSoundCard;