import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import ScaleSelector from "../../components/common/ScaleSelector";
import SelectChip from "../../components/common/SelectChip";
import { createCheckin } from "../../api/checkin";
import type { DailyFactor } from "../../api/checkin";
import { getUserUuid } from "../../utils/userStorage";

const FACTOR_OPTIONS: {
  value: DailyFactor;
  label: string;
}[] = [
  { value: "caffeine", label: "카페인" },
  { value: "stress", label: "스트레스" },
  { value: "fatigue", label: "피로" },
  { value: "noise_exposure", label: "소음 노출" },
];

const NOTE_MAX_LENGTH = 255;

function CheckInPage() {
  const navigate = useNavigate();

  const [discomfort, setDiscomfort] = useState<
    number | null
  >(null);
  const [tension, setTension] = useState<
    number | null
  >(null);
  const [factors, setFactors] = useState<
    DailyFactor[]
  >([]);
  const [hasNoFactor, setHasNoFactor] =
    useState(false);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const isComplete =
    discomfort !== null && tension !== null;

  const toggleFactor = (
    value: DailyFactor,
  ) => {
    setHasNoFactor(false);

    setFactors((previous) =>
      previous.includes(value)
        ? previous.filter(
            (factor) => factor !== value,
          )
        : [...previous, value],
    );
  };

  const selectNoFactor = () => {
    setFactors([]);
    setHasNoFactor(true);
  };

  const handleSubmit = async () => {
    if (!isComplete || isSaving) {
      return;
    }

    const uuid = getUserUuid();

    if (!uuid) {
      setErrorMessage(
        "사용자 정보를 찾을 수 없어요. 앱을 새로고침한 뒤 다시 시도해 주세요.",
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await createCheckin(uuid, {
        discomfort,
        tension,
        daily_factors: hasNoFactor
          ? []
          : factors,
        note: note.trim(),
      });

      navigate("/");
    } catch {
      setErrorMessage(
        "체크인 저장에 실패했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="
        flex
        min-h-full
        flex-col
        px-5
        pb-[2.5rem]
      "
    >
      <h1
        className="
          pt-[1.75rem]
          font-sans
          text-[1.25rem]
          font-bold
          leading-[1.875rem]
          text-[#F0F7F5]
        "
      >
        지금 이명은 얼마나
        <br />
        신경 쓰이나요?
      </h1>

      <div className="mt-[1.5rem] flex flex-col gap-[0.75rem]">
        <ScaleSelector
          label="이명 불편도"
          hint="1 편안함 · 5 매우 불편함"
          value={discomfort}
          onChange={setDiscomfort}
          hasError={errorMessage !== null}
        />

        <ScaleSelector
          label="불안 정도"
          hint="1 안정됨 · 5 매우 불안함"
          value={tension}
          onChange={setTension}
          hasError={errorMessage !== null}
        />
      </div>

      <section className="mt-[1.75rem]">
        <p
          className="
            font-sans
            text-[0.8125rem]
            font-bold
            leading-normal
            text-[#F0F7F5]
          "
        >
          오늘 하루는 어땠나요?
        </p>

        <div className="mt-[0.875rem] flex flex-wrap gap-[0.5rem]">
          {FACTOR_OPTIONS.map((option) => (
            <SelectChip
              key={option.value}
              label={option.label}
              isSelected={factors.includes(
                option.value,
              )}
              onClick={() =>
                toggleFactor(option.value)
              }
            />
          ))}

          <SelectChip
            label="특별한 요인 없음"
            isSelected={hasNoFactor}
            onClick={selectNoFactor}
          />
        </div>
      </section>

      <section
        className="
          mt-[1.75rem]
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
          htmlFor="checkin-note"
          className="
            font-sans
            text-[0.6875rem]
            font-medium
            leading-[1.0625rem]
            text-[#8DA2A6]
          "
        >
          한 줄 메모 (선택)
        </label>

        <textarea
          id="checkin-note"
          rows={2}
          maxLength={NOTE_MAX_LENGTH}
          value={note}
          onChange={(event) =>
            setNote(event.target.value)
          }
          placeholder="예) 커피를 늦게 마셨고, 잠들기 전 더 크게 들려요."
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
      </section>

      {errorMessage && (
        <p
          className="
            mt-[1rem]
            font-inter
            text-[0.75rem]
            font-normal
            leading-[145%]
            text-[#E5484D]
          "
        >
          {errorMessage}
        </p>
      )}

      <div className="mt-auto pt-[2rem]">
        <Button
          disabled={!isComplete || isSaving}
          onClick={handleSubmit}
        >
          {isSaving
            ? "저장 중..."
            : "체크인 저장하기"}
        </Button>
      </div>
    </div>
  );
}

export default CheckInPage;
