import type { FrequencyOptionId } from "../../mock/frequencyData";

interface FrequencyCardProps {
    label: FrequencyOptionId;
    frequency: number;
    selected: boolean;
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
    onSelect,
    onPlay,
}: FrequencyCardProps) {
    return (
        <article
        className={`
            min-w-0 flex-1 rounded-[1rem] border p-3
            ${
            selected
                ? "border-primary bg-[#102821]"
                : "border-border bg-[#111d21]"
            }
        `}
        >
        <div className="flex items-center justify-between">
            <span
            className="
                flex size-6 items-center justify-center
                rounded-full bg-[#1a292d]
                text-[0.6875rem] font-medium text-text-secondary
            "
            >
            {label}
            </span>

            <span className="text-[0.75rem] font-semibold text-primary">
            {frequency.toLocaleString()}Hz
            </span>
        </div>

        <div
            className="
            mt-4 flex h-[6.5rem] items-center justify-center gap-[0.1875rem]
            rounded-[0.75rem] bg-[#16252a] px-3
            "
            aria-hidden="true"
        >
            {WAVE_HEIGHTS.map((height, index) => (
            <span
                key={`${label}-${index}`}
                className="w-[0.1875rem] rounded-full bg-primary"
                style={{ height: `${height}px` }}
            />
            ))}
        </div>

        <button
            type="button"
            onClick={onPlay}
            className="
            mt-2 flex w-full items-center justify-center gap-1
            py-1 text-[0.6875rem] text-text-secondary
            "
        >
            <span aria-hidden="true">▶</span>
            <span>들어보기</span>
        </button>

        <button
            type="button"
            onClick={onSelect}
            className={`
            mt-2 h-10 w-full rounded-[0.625rem] border
            text-[0.75rem] font-medium
            ${
                selected
                ? "border-[#195644] bg-[#17483b] text-primary"
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