import { useMemo } from "react";

interface WaveAnimationProps {
  barCount?: number;
  isActive?: boolean;
  showRings?: boolean;
  className?: string;
}

interface WaveBar {
  height: number;
  opacity: number;
  delay: number;
  duration: number;
  minScale: number;
}

const MAX_BAR_HEIGHT = 152;

function createBars(barCount: number): WaveBar[] {
  return Array.from({ length: barCount }, (_, index) => {
    const ratio = barCount === 1 ? 0.5 : index / (barCount - 1);
    const envelope = Math.pow(Math.sin(Math.PI * ratio), 0.55);
    const texture =
      0.5 +
      0.5 *
        Math.abs(
          Math.sin(index * 1.73) * 0.62 +
            Math.cos(index * 0.91) * 0.38,
        );
    const height = Math.max(0.08, envelope * texture);

    return {
      height: Math.round(height * MAX_BAR_HEIGHT),
      opacity: Number((0.28 + 0.72 * envelope).toFixed(3)),
      delay: Number((((index * 37) % 11) * 0.09).toFixed(2)),
      duration: Number((1.05 + ((index * 13) % 5) * 0.14).toFixed(2)),
      minScale: Number((0.32 + 0.24 * (1 - envelope)).toFixed(3)),
    };
  });
}

function WaveAnimation({
  barCount = 54,
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
        h-[13rem]
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
          px-[18px]
        "
      >
        {bars.map((bar, index) => (
          <span
            key={index}
            className={`w-[2px] shrink-0 rounded-full bg-[#61DBB8] ${
              isActive ? "somni-wave-bar" : ""
            }`}
            style={{
              height: `${bar.height}px`,
              opacity: bar.opacity,
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
