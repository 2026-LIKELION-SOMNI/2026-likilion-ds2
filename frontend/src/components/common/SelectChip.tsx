interface SelectChipProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  singleSelect?: boolean;
}

function SelectChip({
  label,
  isSelected,
  onClick,
  singleSelect = false,
}: SelectChipProps) {
  return (
    <button
      type="button"
      role={singleSelect ? "radio" : undefined}
      aria-checked={singleSelect ? isSelected : undefined}
      aria-pressed={singleSelect ? undefined : isSelected}
      onClick={onClick}
      className={`
        inline-flex
        min-h-[2.75rem]
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
            : "border-[#24464E] bg-[#112126] text-[#809EA8]"
        }
      `}
    >
      {label}
    </button>
  );
}

export default SelectChip;
