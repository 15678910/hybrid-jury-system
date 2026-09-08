#!/usr/bin/env bash
# 카드뉴스 HTML → PNG (1600×1200). 사용: bash scripts/render-cardnews.sh <html접두어> <docs폴더명> <카드이름접두어> <public slug> <장수>
# 예: bash scripts/render-cardnews.sh ocard 공소청직제안_7단계 공소청직제안 prosecution-office-org-2026 7
# 로컬 Chrome 헤드리스는 --window-size=1600,1200 으로 정확히 1600×1200 을 낸다(2026-09-08 확인).
set -e
PRE=$1; DOCDIR=$2; NAME=$3; SLUG=$4; N=$5
CH="C:/Program Files/Google/Chrome/Application/chrome.exe"
ROOT="$(cd "$(dirname "$0")/.." && pwd -W)"
mkdir -p "$ROOT/docs/cardnews/$DOCDIR" "$ROOT/public/cardnews/$SLUG"
for i in $(seq 1 "$N"); do
  OUTP="$ROOT/docs/cardnews/$DOCDIR/${NAME}_${i}단계.png"
  "$CH" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1600,1200 \
    --screenshot="$OUTP" "file:///$ROOT/scripts/${PRE}${i}.html" >/dev/null 2>&1
  cp "$OUTP" "$ROOT/public/cardnews/$SLUG/${i}.png"
  echo "$(basename "$OUTP")  $(python -c "from PIL import Image;print(Image.open(r'$OUTP').size)")"
done
