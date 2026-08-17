import {
  useEffect,
  useState,
} from "react";

import playIcon from "../../assets/icons/my-sound-play.svg";
import pauseIcon from "../../assets/icons/my-sound-pause.svg";
import emptyIcon from "../../assets/icons/my-sound-empty.svg";

import {
  comfortableSounds,
} from "../../mock/comfortableSoundData";

function MySoundsPage() {
  const [
    playingSoundId,
    setPlayingSoundId,
  ] = useState<number | null>(
    null,
  );

  const hasSounds =
    comfortableSounds.length > 0;

  /*
   * 페이지 이탈 시 재생 상태 초기화
   *
   * 실제 오디오 API 연결 후에는
   * 여기서 오디오 stop도 같이 호출
   */
  useEffect(() => {
    return () => {
      setPlayingSoundId(null);
    };
  }, []);

  const handlePlayToggle = (
    soundId: number,
  ) => {
    setPlayingSoundId(
      (current) =>
        current === soundId
          ? null
          : soundId,
    );

    /*
     * TODO:
     * 백엔드에서 이전 SoundSession의
     * 실제 재생 파라미터를 내려주면
     * 여기서 playRecoveryAudio 연결.
     */
  };

  /*
   * =========================
   * 저장된 사운드 없음
   * =========================
   */
  if (!hasSounds) {
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
        {/*
          Header:
          h-16 = 64px

          헤더 제목은 20px / line-height 23px이고
          64px 안에서 중앙 정렬됨.

          제목 bottom ≈ 43.5px
          제목 아래 199px에서 이미지 시작
          → main 기준 약 179.5px

          따라서 180px 사용.
        */}
        <div
          className="
            pt-[180px]
            flex
            justify-center
          "
        >
          <img
            src={emptyIcon}
            alt=""
            aria-hidden="true"
            className="
              h-[120px]
              w-[120px]
              shrink-0
            "
          />
        </div>

        <div
          className="
            mt-[38px]
            text-center
          "
        >
          <h2
            className="
              font-sans
              text-[24px]
              font-bold
              leading-normal
              text-[#F0F7FA]
            "
          >
            아직 저장된 사운드가 없어요.
          </h2>

          <p
            className="
              mt-[15px]
              text-center
              font-sans
              text-[14px]
              font-normal
              leading-normal
              text-[#809EA8]
            "
          >
            편안하게 들은 사운드를
            <br />
            여기에 자동으로 모아둘게요.
          </p>
        </div>
      </div>
    );
  }

  /*
   * =========================
   * 저장된 사운드 있음
   * =========================
   */
  return (
    <div
      className="
        flex
        h-full
        min-h-0
        flex-col
        px-5
      "
    >
      <section
        className="
          flex
          min-h-0
          flex-1
          flex-col
          pt-[41px]
        "
      >
        <p
          className="
            shrink-0
            font-sans
            text-[14px]
            font-normal
            leading-normal
            text-[#809EA8]
          "
        >
          편안하게 들은 사운드를 다시 들어볼 수 있어요.
        </p>

        <div
          className="
            hide-scrollbar
            mt-[20px]
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-y-contain
            pb-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-[14px]
            "
          >
            {comfortableSounds.map(
              (sound) => {
                const isPlaying =
                  playingSoundId ===
                  sound.id;

                return (
                    <article
                    key={sound.id}
                    className="
                        w-full
                        shrink-0
                        rounded-[18px]
                        border
                        border-[#24464E]
                        bg-[#112126]
                        px-[14px]
                        pb-[14px]
                        pt-[14px]
                    "
                    >
                    <div>
                      <p
                        className="
                          font-sans
                          text-[11px]
                          font-medium
                          leading-normal
                          text-[#61DBB8]
                        "
                      >
                        {sound.date}
                      </p>

                      <p
                        className="
                          mt-[12px]
                          font-sans
                          text-[15px]
                          font-bold
                          leading-normal
                          text-[#F0F7FA]
                        "
                      >
                        {sound.title}
                      </p>
                    </div>

                    <div
                      className="
                        mt-[21px]
                        flex
                        w-full
                        items-center
                        gap-[8px]
                      "
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handlePlayToggle(
                            sound.id,
                          )
                        }
                        className={`
                          flex
                          h-[30px]
                          min-w-0
                          flex-1
                          items-center
                          justify-center
                          rounded-[10px]
                          font-sans
                          text-[11px]
                          font-medium
                          leading-normal
                          ${
                            isPlaying
                              ? `
                                bg-[#61DBB8]
                                text-[#0D1417]
                              `
                              : `
                                border
                                border-[#24464E]
                                bg-[#112126]
                                text-[#ECF3F2]
                              `
                          }
                        `}
                      >
                        <img
                          src={
                            isPlaying
                              ? pauseIcon
                              : playIcon
                          }
                          alt=""
                          aria-hidden="true"
                          className="
                            h-[12px]
                            w-[12px]
                            shrink-0
                          "
                        />

                        <span className="ml-[4px]">
                          {isPlaying
                            ? "재생중"
                            : "들어보기"}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="
                          flex
                          h-[30px]
                          min-w-0
                          flex-1
                          items-center
                          justify-center
                          rounded-[10px]
                          border
                          border-[#24464E]
                          bg-[#112126]
                          text-center
                          font-sans
                          text-[11px]
                          font-medium
                          leading-normal
                          text-[#ECF3F2]
                        "
                      >
                        회복 세션에 사용
                      </button>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default MySoundsPage;