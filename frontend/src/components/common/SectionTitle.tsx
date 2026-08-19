interface SectionTitleProps {
  title: string;
  description?: string;
  id?: string;
}

function SectionTitle({
  title,
  description,
  id,
}: SectionTitleProps) {
  return (
    <div>
      <h2
        id={id}
        className="
          font-sans
          text-[0.9375rem]
          font-bold
          leading-normal
          text-[#F0F7FA]
        "
      >
        {title}
      </h2>

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
