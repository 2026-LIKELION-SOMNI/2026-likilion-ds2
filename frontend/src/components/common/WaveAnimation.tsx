import { useMemo } from "react";

interface WaveAnimationProps {
  barCount?: number;
  isActive?: boolean;
  showRings?: boolean;
  className?: string;
}

interface WaveBar {
  height: number;
  color: string;
  delay: number;
  duration: number;
  minScale: number;
}

const MIN_BAR_HEIGHT = 1.25;
const MAX_BAR_HEIGHT = 4.4;
const BAR_COLOR_SOFT = "#389E82";
const BAR_COLOR_STRONG = "#63E0B2";
const STRONG_LEVEL = 0.82;

function noise(index: number, seed: number): number {
  const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;

  return value - Math.floor(value);
}

function createBars(barCount: number): WaveBar[] {
  return Array.from({ length: barCount }, (_, index) => {
    const ratio = barCount === 1 ? 0.5 : index / (barCount - 1);
    const envelope = Math.min(1, Math.sin(Math.PI * ratio) * 2.6);
    const level = envelope * (0.16 + 0.84 * noise(index, 1));

    return {
      height: Number(
        (
          MIN_BAR_HEIGHT +
          (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) * level
        ).toFixed(4),
      ),
      color:
        level > STRONG_LEVEL ? BAR_COLOR_STRONG : BAR_COLOR_SOFT,
      delay: Number((noise(index, 2) * 1.2).toFixed(2)),
      duration: Number((1.1 + noise(index, 3) * 0.9).toFixed(2)),
      minScale: Number((0.42 + 0.2 * noise(index, 4)).toFixed(3)),
    };
  });
}

function WaveAnimation({
  barCount = 38,
  isActive = true,
  showRings = true,
  className = "",
}: WaveAnimationProps) {
  const bars = useMemo(() => createBars(barCount), [barCount]);

  return (
    <div
      className={`
        relative
        flex
        h-[14.75rem]
        w-full
        items-center
        justify-center
        overflow-hidden
        rounded-[1.75rem]
        border
        border-[#1F3D45]
        bg-[#091B1D]
        ${className}
      `}
    >
      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          flex
          items-center
          justify-between
          px-[1.5rem]
        "
      >
        {bars.map((bar, index) => (
          <span
            key={index}
            className={`w-[0.25rem] shrink-0 rounded-[0.125rem] ${
              isActive ? "somni-wave-bar" : ""
            }`}
            style={{
              height: `${bar.height}rem`,
              backgroundColor: bar.color,
              animationDelay: `${bar.delay}s`,
              animationDuration: `${bar.duration}s`,
              ["--somni-wave-min" as string]: bar.minScale,
            }}
          />
        ))}
      </div>

      {showRings && (
        <>
          <span
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              h-[11.375rem]
              w-[11.375rem]
              rounded-full
              border
              border-[#2E8C73]
            "
          />

          <span
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              h-[8.25rem]
              w-[8.25rem]
              rounded-full
              border
              border-[#2E8C73]
            "
          />
        </>
      )}
    </div>
  );
}

export default WaveAnimation;
