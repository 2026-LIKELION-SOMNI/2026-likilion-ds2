import type { FrequencyOptionId } from "../../mock/frequencyData";

interface FrequencyCardProps {
  label: FrequencyOptionId;
  frequency: number;
  selected: boolean;
  playing: boolean;
  showError: boolean;
  onSelect: () => void;
  onPlay: () => void;
}

const WAVE_HEIGHTS = [
  28, 46, 60, 42, 54, 34, 48, 30, 44, 24, 38, 52, 32,
];

function FrequencyCard({
  label,
  frequency,
  selected,
  playing,
  showError,
  onSelect,
  onPlay,
}: FrequencyCardProps) {
  return (
    <article
      className={`
        min-w-0 flex-1 rounded-[1rem] border p-3
        bg-[#111d21]
        ${
          selected
            ? "border-[#60CEA7]"
            : "border-border"
        }
      `}
    >
      {/* A/B + 주파수 */}
      <div className="flex items-center justify-between">
        <span
          className="
            flex h-8 w-8 items-center justify-center
            rounded-full bg-[#16252a]
            text-[0.75rem] font-semibold text-text-secondary
          "
        >
          {label}
        </span>

        <span className="text-[0.75rem] font-semibold text-[#60CEA7]">
          {frequency.toLocaleString()}Hz
        </span>
      </div>

      {/* 파형 영역 */}
      <div
        className={`
          mt-4 flex h-[6.5rem] items-center justify-center
          gap-[0.1875rem] rounded-[0.75rem] px-3
          ${
            playing
              ? "bg-[#173A34]"
              : "bg-[#16252a]"
          }
        `}
        aria-hidden="true"
      >
        {WAVE_HEIGHTS.map((height, index) => (
          <span
            key={`${label}-${index}`}
            className="w-[0.1875rem] rounded-full bg-[#60CEA7]"
            style={{ height: `${height}px` }}
          />
        ))}
      </div>

      {/* 재생 버튼 */}
      <button
        type="button"
        onClick={onPlay}
        className={`
          mt-2 flex w-full items-center justify-center
          gap-1 py-1 text-[0.6875rem]
          ${
            playing
              ? "text-[#60CEA7]"
              : "text-text-secondary"
          }
        `}
      >
        <span aria-hidden="true">▶</span>
        <span>{playing ? "재생중" : "들어보기"}</span>
      </button>

      {/* 선택 버튼 */}
      <button
        type="button"
        onClick={onSelect}
        className={`
          mt-2 h-10 w-full rounded-[0.625rem]
          border text-[0.75rem] font-medium
          ${
            selected
              ? "border-[#2D4548] bg-[#173A34] text-[#60CEA7]"
              : showError
                ? "border-[#F09292] bg-transparent text-[#F09292]"
                : "border-border bg-transparent text-text-primary"
          }
        `}
      >
        {selected ? "선택됨" : "선택"}
      </button>
    </article>
  );
}

export default FrequencyCard;