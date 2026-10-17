"""MolB 저장소에서 사이트가 쓸 것을 옮겨 온다.

    python3 scripts/import_assets.py ../../MolB

앱이 정본이다 — 그림 · 글꼴 · 지문 · 사전은 손으로 고치지 말고 MolB에서 고친 뒤 이 스크립트를 다시 돌린다.
웹에 맞게 줄이는 것만 여기서 한다(스토어 사진 1~2MB → 폭 540px webp, 사전은 배열로 눌러 담기).
"""

import json
import shutil
import sys
from pathlib import Path

from PIL import Image

SITE = Path(__file__).resolve().parent.parent
PUBLIC = SITE / "public"

# 찍먹 지문 셋 — 쉬움 · 보통 · 조금 어려움. 앱의 번들 글(assets/reading/text) 그대로다.
PASSAGES = ["refresh_0", "refresh_2", "refresh_14"]

# 월드 구경에 쓰는 에뮬레이터 사진(광고 13판의 원본). 이름은 사이트에서 부르는 이름.
SHOTS = {
    "13-room-stage1.png": "room-stage1",
    "13-room-stage3.png": "room-stage3",
    "13-room-front.png": "room-front",
    "13-box-place.png": "box-place",
    "13-door-threshold.png": "door-threshold",
    "13-reader.png": "reader-nine",
    "11-garden-dusk.png": "garden-dusk",
    "11-room-english.png": "room-english",
    "11-room-night.png": "room-night",
    "11-kupeng.png": "kupeng",
    "11-dex.png": "dex",
    "10-chat.png": "chat",
}

# 앱의 그림 아이콘(하단바 · 메인의 길) — 사이트의 흐름 · 블랭크북 카드에 쓴다.
ICONS = ["book_open", "new_words", "review_quiz", "tree_medium", "notebook", "acorn", "sprout", "diary"]

# 다섯 캐릭터의 몸짓 — 사이트에서 고른 캐릭터가 히어로 · 찍먹 반응 · 블랭크북에 선다.
POSES = ["smiling", "reading", "observing", "dance", "writing"]
SQUIRREL = {
    "smiling": "Smiling_DramG.webp",
    "reading": "Reading_DramG.webp",
    "observing": "Observing_DramG.webp",
    "dance": "DanceA_DramG.webp",
    "writing": "WritingLap_DramG.webp",
}
OTHERS = {"smiling": "smiling", "reading": "reading", "observing": "observing", "dance": "danceA", "writing": "writing"}


def character_src(molb: Path, who: str, pose: str) -> Path:
    if who == "squirrel":
        return molb / "assets/DramGImage" / SQUIRREL[pose]
    return molb / "assets/characters/v1" / who / f"{OTHERS[pose]}.webp"


def webp(src: Path, dst: Path, width: int, quality: int = 80) -> None:
    img = Image.open(src)
    img = img.convert("RGBA" if img.mode in ("RGBA", "LA", "P") else "RGB")
    if img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, "WEBP", quality=quality, method=6)


def main(molb: Path) -> None:
    # 지문 — 글 파일은 그대로, 그림은 폭 900.
    texts = SITE / "src" / "content" / "passages"
    texts.mkdir(parents=True, exist_ok=True)
    for name in PASSAGES:
        src = molb / "assets/reading/text" / f"{name}.txt"
        shutil.copyfile(src, texts / f"{name}.txt")
        image = src.read_text(encoding="utf-8").splitlines()[0].split(":", 1)[1].split("|")[0].strip()
        webp(molb / "assets/reading" / image, PUBLIC / "img/passages" / image, 900)

    for src_name, out in SHOTS.items():
        webp(molb / "광고/원본/앱화면" / src_name, PUBLIC / "img/world" / f"{out}.webp", 540, 78)

    # 피처 그래픽은 공유 미리보기(og:image)라 jpg로 — 메신저 몇은 webp를 안 그린다.
    feature = Image.open(molb / "광고/13-0_플레이_피처그래픽_방_1024x500.png").convert("RGB")
    feature.save(PUBLIC / "img/og.jpg", "JPEG", quality=84, optimize=True)

    for who in ["squirrel", "frog", "hedgehog", "owl", "penguin"]:
        for pose in POSES:
            webp(character_src(molb, who, pose), PUBLIC / "img/characters" / f"{who}-{pose}.webp", 320, 85)

    for name in ICONS:
        webp(molb / "assets/icons" / f"{name}.png", PUBLIC / "img/icons" / f"{name}.webp", 160, 85)

    # 파비콘 — 다람쥐 얼굴.
    icon = Image.open(character_src(molb, "squirrel", "smiling")).convert("RGBA")
    icon.resize((180, 180), Image.LANCZOS).save(PUBLIC / "apple-touch-icon.png")
    icon.resize((64, 64), Image.LANCZOS).save(PUBLIC / "favicon.png")

    fonts = PUBLIC / "fonts"
    fonts.mkdir(parents=True, exist_ok=True)
    for f in ["Literata-Regular.ttf", "Literata-Italic.ttf", "OFL.txt"]:
        shutil.copyfile(molb / "assets/fonts/literata" / f, fonts / f)

    # 사전 — [낱말, 뜻, 품사, 발음, 등급]의 배열로 눌러 담는다(블랭크북이 처음 열 때 한 번 받는다).
    entries = json.loads((molb / "assets/dictionary/en_ko_dictionary.json").read_text(encoding="utf-8"))
    levels = json.loads((molb / "assets/dictionary/word_levels.json").read_text(encoding="utf-8"))["levels"]
    level_of = {}
    for band, words in levels.items():
        for w in words:
            level_of.setdefault(w.lower(), band)
    rows = [
        [e["en"], e["ko"], e.get("pos", ""), e.get("ipa", ""), level_of.get(e["en"].lower(), "")]
        for e in entries
        if e.get("en") and e.get("ko")
    ]
    # 사전에 뜻이 없어도 등급은 아는 낱말 — 블랭크북이 '이 낱말은 A1'까지는 말해 준다.
    known = {r[0].lower() for r in rows}
    rows += [[w, "", "", "", band] for w, band in level_of.items() if w not in known]
    dict_dir = PUBLIC / "dict"
    dict_dir.mkdir(parents=True, exist_ok=True)
    (dict_dir / "en_ko.json").write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"passages {len(PASSAGES)} · shots {len(SHOTS)} · dictionary {len(rows)} rows")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python3 scripts/import_assets.py <path to MolB checkout>")
    main(Path(sys.argv[1]).resolve())
