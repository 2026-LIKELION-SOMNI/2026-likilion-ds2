import type { ReactNode } from "react";

interface ScaleSelectorProps {
  label: string;
  hint: string;
  description?: string;
  value: number | null;
  onChange: (value: number) => void;
  hasError?: boolean;
  footer?: ReactNode;
}

const SCALE_VALUES = [1, 2, 3, 4, 5];

function ScaleSelector({
  label,
  hint,
  description,
  value,
  onChange,
  hasError = false,
  footer,
}: ScaleSelectorProps) {
  return (
    <div
      aria-invalid={hasError || undefined}
      className={`
        w-full
        rounded-[1.125rem]
        border
        bg-[#142025]
        px-[0.875rem]
        py-[0.875rem]
        ${hasError ? "border-[#E5484D]" : "border-[#2D4548]"}
      `}
    >
      <div className="flex items-center justify-between gap-[0.5rem]">
        <span
          className="
            font-sans
            text-[0.8125rem]
            font-bold
            leading-normal
            text-[#F0F7FA]
          "
        >
          {label}
        </span>

        <span
          className="
            shrink-0
            font-sans
            text-[0.625rem]
            font-normal
            leading-normal
            text-[#809EA8]
          "
        >
          {hint}
        </span>
      </div>

      {description && (
        <p
          className="
            mt-[0.375rem]
            font-sans
            text-[0.6875rem]
            font-normal
            leading-normal
            text-[#809EA8]
          "
        >
          {description}
        </p>
      )}

      <div
        role="radiogroup"
        aria-label={label}
        className="mt-[0.75rem] flex items-center justify-between gap-[0.5rem]"
      >
        {SCALE_VALUES.map((scaleValue) => {
          const isSelected = value === scaleValue;

          return (
            <button
              key={scaleValue}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${label} ${scaleValue}점`}
              onClick={() => onChange(scaleValue)}
              className={`
                flex
                h-[2.875rem]
                max-w-[3.25rem]
                flex-1
                items-center
                justify-center
                rounded-[0.875rem]
                border
                text-center
                font-sans
                text-[0.875rem]
                font-bold
                leading-[1.3125rem]
                transition-colors
                ${
                  isSelected
                    ? "border-transparent bg-[#60CEA7] text-[#07100D]"
                    : "border-[#2D4548] bg-[#1C262B] text-[#ECF3F2]"
                }
              `}
            >
              {scaleValue}
            </button>
          );
        })}
      </div>

      {footer && (
        <div className="mt-[0.625rem] flex justify-end">
          {footer}
        </div>
      )}
    </div>
  );
}

export default ScaleSelector;
