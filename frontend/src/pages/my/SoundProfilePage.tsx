import {
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
} from "react-router-dom";

import soundProfileWave from "../../assets/icons/sound-profile-wave.svg";

import {
  getMyPageProfileSummary,
  type MyPageProfileSummary,
} from "../../api/mypage";

import {
  getUserUuid,
} from "../../utils/userStorage";

const TEXTURE_LABEL: Record<
  string,
  string
> = {
  soft: "부드러운 질감",
  balanced: "균형 있는 질감",
  clear: "선명한 질감",
};

const LAYER_MIX_LABEL: Record<
  string,
  string
> = {
  low: "자연음 중심",
  medium: "균형",
  high: "노이즈 중심",
};

function SoundProfilePage() {
  const navigate = useNavigate();

  const [
    profileSummary,
    setProfileSummary,
  ] =
    useState<MyPageProfileSummary | null>(
      null,
    );

  useEffect(() => {
    const uuid = getUserUuid();

    if (!uuid) {
      return;
    }

    const loadProfile = async () => {
      try {
        const data =
          await getMyPageProfileSummary(
            uuid,
          );

        setProfileSummary(data);
      } catch (error) {
        console.error(
          "사운드 프로필 조회 실패",
          error,
        );
      }
    };

    void loadProfile();
  }, []);

  const textureLabel =
    profileSummary?.texture
      ? TEXTURE_LABEL[
          profileSummary.texture
        ] ?? "-"
      : "-";

  const layerMixLabel =
    profileSummary?.layer_mix
      ? LAYER_MIX_LABEL[
          profileSummary.layer_mix
        ] ?? "-"
      : "-";

  return (
    <div
      className="
        flex
        h-full
        min-h-0
        flex-col
        px-5
        pb-6
      "
    >
      <section className="mt-[50px]">
        <h2
          className="
            font-sans
            text-[24px]
            font-bold
            leading-[36px]
            text-[#ECF3F2]
          "
        >
          내 사운드 취향을 찾았어요.
        </h2>

        <p
          className="
            mt-[2px]
            font-sans
            text-[13px]
            font-normal
            leading-normal
            text-[#809EA8]
          "
        >
          저장된 사운드 프로필은
          마이페이지에서도 확인할 수 있어요.
        </p>

        <div
        className="
            relative
            mt-[40px]
            h-[125px]
            w-full
            rounded-[20px]
            border
            border-[#2B8E78]
            bg-[#12382E]
            px-[16px]
            pt-[16px]
        "
        >
          <div>
            <p
              className="
                font-sans
                text-[11px]
                font-bold
                leading-normal
                text-[#61DBB8]
              "
            >
              My Sound Profile
            </p>

            <p
              className="
                mt-[10px]
                font-sans
                text-[18px]
                font-bold
                leading-normal
                text-[#F0F7FA]
              "
            >
              {textureLabel}
            </p>

            <p
              className="
                mt-[8px]
                font-sans
                text-[18px]
                font-bold
                leading-normal
                text-[#F0F7FA]
              "
            >
              {layerMixLabel}
            </p>
          </div>

            <img
            src={soundProfileWave}
            alt=""
            aria-hidden="true"
            className="
                absolute
                right-[16px]
                top-[39px]
                h-[70px]
                w-[100px]
            "
            />
        </div>
      </section>

      <div className="mt-auto">
        <button
          type="button"
          onClick={() =>
            navigate("/my")
          }
          className="
            h-[54px]
            w-full
            rounded-[14px]
            bg-[#61DBB8]
            font-sans
            text-[14px]
            font-bold
            text-[#07100D]
          "
        >
          확인
        </button>

        <button
        type="button"
        onClick={() =>
            navigate("/sound-fit")
        }
        className="
            mt-[20px]
            w-full
            text-center
            font-sans
            text-[13px]
            font-medium
            text-[#87CBE6]
        "
        >
        다시 측정하기
        </button>
      </div>
    </div>
  );
}

export default SoundProfilePage;