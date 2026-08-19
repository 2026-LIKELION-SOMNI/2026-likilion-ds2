interface NoteFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}

function NoteField({
  id,
  label,
  placeholder,
  value,
  onChange,
  maxLength,
}: NoteFieldProps) {
  return (
    <div
      className="
        w-full
        rounded-[1rem]
        border
        border-[#2D4548]
        bg-[#142025]
        px-[0.875rem]
        py-[0.875rem]
      "
    >
      <label
        htmlFor={id}
        className="
          font-sans
          text-[0.6875rem]
          font-medium
          leading-[1.0625rem]
          text-[#809EA8]
        "
      >
        {label}
      </label>

      <textarea
        id={id}
        rows={2}
        maxLength={maxLength}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="
          mt-[0.625rem]
          w-full
          resize-none
          bg-transparent
          font-sans
          text-[0.6875rem]
          font-normal
          leading-[1.0625rem]
          text-[#ECF3F2]
          outline-none
          placeholder:text-[#587176]
        "
      />

      <p
        className="
          text-right
          font-sans
          text-[0.625rem]
          font-normal
          leading-normal
          text-[#587176]
        "
      >
        {`${value.length} / ${maxLength}`}
      </p>
    </div>
  );
}

export default NoteField;
