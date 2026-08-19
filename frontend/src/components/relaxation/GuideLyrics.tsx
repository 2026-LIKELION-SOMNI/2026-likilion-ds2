import {
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import type { GuideLine } from "../../pages/relaxation/guideScript";

interface GuideLyricsProps {
  lines: GuideLine[];
  activeIndex: number;
}

function GuideLyrics({
  lines,
  activeIndex,
}: GuideLyricsProps) {
  const lineRefs = useRef<
    (HTMLParagraphElement | null)[]
  >([]);

  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    const activeLine =
      lineRefs.current[activeIndex];

    if (!activeLine) {
      return;
    }

    setOffset(activeLine.offsetTop);
  }, [activeIndex, lines]);

  return (
    <div
      className="
        relative
        h-[9.5rem]
        w-full
        overflow-hidden
      "
      style={{
        maskImage:
          "linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%)",
      }}
    >
      <div
        aria-live="polite"
        className="
          flex
          flex-col
          gap-[1.75rem]
          transition-transform
          duration-700
          ease-out
        "
        style={{
          transform: `translateY(-${offset}px)`,
        }}
      >
        {lines.map((line, index) => {
          const isActive =
            index === activeIndex;

          return (
            <p
              key={line.startAt}
              ref={(element) => {
                lineRefs.current[index] =
                  element;
              }}
              className={`
                whitespace-pre-line
                text-center
                font-sans
                leading-[1.5rem]
                transition-all
                duration-700
                ease-out
                ${
                  isActive
                    ? `
                      text-[0.9375rem]
                      font-medium
                      text-[#ECF3F2]
                      opacity-100
                    `
                    : `
                      text-[0.8125rem]
                      font-normal
                      text-[#7E9AA0]
                      opacity-45
                    `
                }
              `}
            >
              {line.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default GuideLyrics;
