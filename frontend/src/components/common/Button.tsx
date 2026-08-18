import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "text";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "flex h-[3.375rem] w-full items-center justify-center rounded-[0.875rem] bg-[#61DBB8] pt-[0.9375rem] pb-[1rem] font-sans text-[14px] font-bold text-[#07100D] transition-colors disabled:bg-[#27423C] disabled:text-[#6B8580]",
  text: "w-full text-center font-sans text-[13px] font-medium leading-normal text-[#87CBE6] disabled:text-[#4C6068]",
};

function Button({
  variant = "primary",
  type = "button",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${VARIANT_STYLES[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
