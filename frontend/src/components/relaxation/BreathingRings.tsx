interface BreathingRingsProps {
  className?: string;
}

const RING_SIZES = [
  { size: 15.5, opacity: 0.24 },
  { size: 13.0, opacity: 0.36 },
  { size: 10.6, opacity: 0.5 },
  { size: 8.4, opacity: 0.66 },
  { size: 6.4, opacity: 0.82 },
];

function BreathingRings({
  className = "",
}: BreathingRingsProps) {
  return (
    <div
      aria-hidden="true"
      className={`
        relative
        flex
        h-[15.5rem]
        w-[15.5rem]
        shrink-0
        items-center
        justify-center
        ${className}
      `}
    >
      {RING_SIZES.map((ring) => (
        <span
          key={ring.size}
          className="
            pointer-events-none
            absolute
            rounded-full
            border
            border-[#2A5C55]
          "
          style={{
            height: `${ring.size}rem`,
            width: `${ring.size}rem`,
            opacity: ring.opacity,
          }}
        />
      ))}

      <span
        className="
          h-[5rem]
          w-[5rem]
          animate-pulse
          rounded-full
          bg-[#14403A]
          shadow-[0_0_60px_rgba(96,206,167,0.18)]
        "
        style={{
          animationDuration: "4s",
        }}
      />
    </div>
  );
}

export default BreathingRings;
