interface SectionTitleProps {
  title: string;
  description?: string;
}

function SectionTitle({
  title,
  description,
}: SectionTitleProps) {
  return (
    <div>
      <p
        className="
          font-sans
          text-[0.9375rem]
          font-bold
          leading-normal
          text-[#F0F7FA]
        "
      >
        {title}
      </p>

      {description && (
        <p
          className="
            mt-[0.25rem]
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
    </div>
  );
}

export default SectionTitle;
