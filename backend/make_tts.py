import os
from pathlib import Path

FFMPEG_BIN = (
    r"C:\Users\user\Downloads\ffmpeg-9.0.1-essentials_build"
    r"\ffmpeg-9.0.1-essentials_build\bin"
)

os.environ["PATH"] = (
    FFMPEG_BIN
    + os.pathsep
    + os.environ.get("PATH", "")
)

from dotenv import load_dotenv
from openai import OpenAI
from pydub import AudioSegment


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

client = OpenAI()

OUTPUT_DIR = (
    BASE_DIR.parent
    / "frontend"
    / "public"
    / "audio"
    / "relaxation"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

TEMP_DIR = BASE_DIR / "tts_temp"
TEMP_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


GUIDES = {
    "tension_release": {
        "duration": 36,
        "lines": [
            (
                0,
                "턱에 힘이 들어가 있다면 가볍게 힘을 풀어주세요.",
            ),
            (
                10,
                "어깨를 귀 쪽으로 살짝 올렸다가 천천히 내려놓아요.",
            ),
            (
                20,
                "손에 힘을 살짝 주었다가 편하게 펴주세요.",
            ),
            (
                30,
                "이제 몸에 힘을 더 주지 않아도 괜찮아요.",
            ),
        ],
    },

    "attention_shift": {
        "duration": 63,
        "lines": [
            (
                0,
                (
                    "지금 이명이 들린다면 없애려고 하지 말고 "
                    "잠깐 존재만 알아차려보세요."
                ),
            ),
            (
                15,
                (
                    "이번에는 지금 들리는 자연음으로 "
                    "주의를 천천히 옮겨볼게요. "
                    "소리 안에서 하나의 작은 소리를 찾아보세요."
                ),
            ),
            (
                30,
                (
                    "이제 숨이 들어오고 나가는 느낌을 "
                    "가볍게 느껴보세요."
                ),
            ),
            (
                45,
                (
                    "마지막으로 몸이 침대와 베개에 닿아 있는 "
                    "감각을 느껴보세요."
                ),
            ),
            (
                56,
                "이명 말고도 주의를 둘 수 있는 곳은 있어요.",
            ),
        ],
    },
}


def create_tts(
    text: str,
    output_path: Path,
):
    with client.audio.speech.with_streaming_response.create(
        model="gpt-4o-mini-tts",
        voice="cedar",
        input=text,
        instructions=(
            "한국어로 말하세요. "
            "잠들기 전 듣는 수면 이완 가이드입니다. "
            "차분하고 부드럽고 편안하게 말하세요. "
            "말하는 속도는 천천히 유지하세요. "
            "목소리는 안정적이고 따뜻하게 유지하세요. "
            "문장을 서두르지 마세요. "
            "과장된 감정이나 광고 같은 억양은 피하세요. "
            "ASMR처럼 편안한 느낌을 주되 "
            "지나치게 속삭이지는 마세요."
        ),
    ) as response:
        response.stream_to_file(output_path)


for guide_name, guide_data in GUIDES.items():

    print()
    print(f"=== {guide_name} 생성 시작 ===")

    clips = []

    for index, (start_at, text) in enumerate(
        guide_data["lines"]
    ):
        temp_path = (
            TEMP_DIR
            / f"{guide_name}_{index + 1}.mp3"
        )

        print(
            f"{index + 1}번 문장 생성 중..."
        )

        create_tts(
            text,
            temp_path,
        )

        audio = AudioSegment.from_mp3(
            temp_path
        )

        clips.append(
            (
                start_at * 1000,
                audio,
            )
        )

    final_audio = AudioSegment.silent(
        duration=guide_data["duration"] * 1000
    )

    for start_ms, audio in clips:
        final_audio = final_audio.overlay(
            audio,
            position=start_ms,
        )

    output_path = (
        OUTPUT_DIR
        / f"{guide_name}.mp3"
    )

    final_audio.export(
        output_path,
        format="mp3",
    )

    print(
        f"완료: {output_path}"
    )


print()
print("모든 음성 생성 완료!")