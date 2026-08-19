interface RelaxationActivityCardProps {
  eyebrow: string;
  title: string;
  description: string;
}

function RelaxationActivityCard({
  eyebrow,
  title,
  description,
}: RelaxationActivityCardProps) {
  return (
    <div
      className="
        w-full
        rounded-[1.25rem]
        bg-[#132322]
        px-[1.25rem]
        pt-[1.125rem]
        pb-[1.25rem]
      "
    >
      <p
        className="
          font-sans
          text-[0.75rem]
          font-medium
          leading-normal
          text-[#60CEA7]
        "
      >
        {eyebrow}
      </p>

      <h2
        className="
          mt-[0.5rem]
          font-sans
          text-[1.125rem]
          font-bold
          leading-normal
          text-[#ECF3F2]
        "
      >
        {title}
      </h2>

      <p
        className="
          mt-[0.375rem]
          font-sans
          text-[0.8125rem]
          font-normal
          leading-normal
          text-[#8DA2A6]
        "
      >
        {description}
      </p>
    </div>
  );
}

export default RelaxationActivityCard;
