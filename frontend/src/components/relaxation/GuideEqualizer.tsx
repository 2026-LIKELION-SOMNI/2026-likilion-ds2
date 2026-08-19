interface GuideEqualizerProps {
  isActive?: boolean;
}

const BARS = [
  { height: 0.75, delay: 0, duration: 1.1 },
  { height: 1.25, delay: 0.18, duration: 1.4 },
  { height: 1.75, delay: 0.06, duration: 1.2 },
  { height: 1.25, delay: 0.3, duration: 1.5 },
  { height: 0.75, delay: 0.12, duration: 1.3 },
];

function GuideEqualizer({
  isActive = true,
}: GuideEqualizerProps) {
  return (
    <div
      aria-hidden="true"
      className="
        flex
        h-[1.75rem]
        items-center
        justify-center
        gap-[0.1875rem]
      "
    >
      {BARS.map((bar, index) => (
        <span
          key={index}
          className={`
            w-[0.1875rem]
            shrink-0
            rounded-full
            bg-[#60CEA7]
            ${isActive ? "somni-wave-bar" : ""}
          `}
          style={{
            height: `${bar.height}rem`,
            animationDelay: `${bar.delay}s`,
            animationDuration: `${bar.duration}s`,
            ["--somni-wave-min" as string]: 0.4,
          }}
        />
      ))}
    </div>
  );
}

export default GuideEqualizer;
