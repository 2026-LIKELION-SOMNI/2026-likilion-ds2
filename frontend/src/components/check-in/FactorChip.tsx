interface FactorChipProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

function FactorChip({
  label,
  isSelected,
  onClick,
}: FactorChipProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={`
        inline-flex
        items-center
        justify-center
        gap-[0.625rem]
        rounded-[6.1875rem]
        border
        px-[1.25rem]
        py-[0.625rem]
        text-center
        font-sans
        text-[0.75rem]
        font-medium
        leading-normal
        transition-colors
        ${
          isSelected
            ? "border-[#2B8E78] bg-[#12382E] text-[#61DBB8]"
            : "border-[#2D4548] bg-[#142025] text-[#809EA8]"
        }
      `}
    >
      {label}
    </button>
  );
}

export default FactorChip;
