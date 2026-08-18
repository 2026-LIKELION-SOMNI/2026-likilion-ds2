import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import NoteField from "../../components/common/NoteField";
import ScaleSelector from "../../components/common/ScaleSelector";
import SectionTitle from "../../components/common/SectionTitle";
import SelectChip from "../../components/common/SelectChip";
import {
  CHECKIN_NOTE_MAX_LENGTH,
  createCheckin,
} from "../../api/checkin";
import type { DailyFactor } from "../../api/checkin";
import { toErrorMessage } from "../../api/client";
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

  const toggleNoFactor = () => {
    setFactors([]);
    setHasNoFactor((previous) => !previous);
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
        daily_factors: factors,
        note: note.trim(),
      });

      navigate("/");
    } catch (error) {
      setErrorMessage(
        toErrorMessage(
          error,
          "체크인 저장에 실패했어요. 잠시 후 다시 시도해 주세요.",
        ),
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
          text-[1.75rem]
          font-bold
          leading-normal
          text-[#F0F7FA]
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
        />

        <ScaleSelector
          label="불안 정도"
          hint="1 안정됨 · 5 매우 불안함"
          value={tension}
          onChange={setTension}
        />
      </div>

      <section className="mt-[1.75rem]">
        <SectionTitle title="오늘 하루는 어땠나요?" />

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
            onClick={toggleNoFactor}
          />
        </div>
      </section>

      <div className="mt-[1.75rem]">
        <NoteField
          id="checkin-note"
          label="한 줄 메모 (선택)"
          placeholder="예) 커피를 늦게 마셨고, 잠들기 전 더 크게 들려요."
          value={note}
          onChange={setNote}
          maxLength={CHECKIN_NOTE_MAX_LENGTH}
        />
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="
            mt-[1rem]
            font-sans
            text-[0.75rem]
            font-normal
            leading-[1.125rem]
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
