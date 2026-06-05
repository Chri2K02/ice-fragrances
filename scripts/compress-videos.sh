#!/usr/bin/env bash
set -euo pipefail

# Locate ffmpeg: prefer PATH, else the winget (Gyan.FFmpeg) user-scope install.
if ! command -v ffmpeg >/dev/null 2>&1; then
  FFBIN="$(ls -d "$HOME"/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg*/ffmpeg-*-full_build/bin 2>/dev/null | head -1 || true)"
  if [ -n "${FFBIN:-}" ]; then
    export PATH="$FFBIN:$PATH"
  else
    echo "ERROR: ffmpeg not found on PATH or in WinGet packages." >&2
    exit 1
  fi
fi
echo "Using ffmpeg: $(command -v ffmpeg)"

SRC="$HOME/Downloads/icefrag"
OUT="public/media"
mkdir -p "$OUT"

# args: <src-mp4> <out-name>
compress() {
  echo ">> $2"
  ffmpeg -y -loglevel error -i "$1" -vf "scale='min(1080,iw)':-2" \
    -c:v libx264 -preset slow -crf 28 -movflags +faststart \
    -c:a aac -b:a 96k "$OUT/$2.mp4"
}

compress "$SRC/Cloudnine/CloudNine.mp4" "cloudnine"
compress "$SRC/Frost/FrostMind.mp4" "frost-mind"
compress "$SRC/Glacier/GlacierHours.mp4" "glacier-hours"
compress "$SRC/Hailstone/HailstoneWildflowerFinal.mp4" "hailstone-wildflower"
compress "$SRC/Iceberg/IcebergEmbrace.mp4" "iceberg-embrace"
compress "$SRC/Humidifer/HumidiferAdFinal.mp4" "humidifier"

# Posters (copy provided thumbnails; CloudNine poster grabbed from its video)
cp "$SRC/Frost/FrostThumbnail.jpg" "$OUT/frost-mind.jpg"
cp "$SRC/Glacier/GlacierThumbnail.jpg" "$OUT/glacier-hours.jpg"
cp "$SRC/Hailstone/HailstoneThumbnail.jpg" "$OUT/hailstone-wildflower.jpg"
cp "$SRC/Iceberg/IcebergThumbnail.jpg" "$OUT/iceberg-embrace.jpg"
cp "$SRC/Humidifer/Edit1.jpg" "$OUT/humidifier.jpg"
ffmpeg -y -loglevel error -i "$SRC/Cloudnine/CloudNine.mp4" -vframes 1 -q:v 3 "$OUT/cloudnine.jpg"

# Logos
cp "$SRC/BlackLettersWhiteBackground.png" "public/logo-light.png"
cp "$SRC/WhiteLettersTransparentBackground.png" "public/logo-dark.png"

echo "Done. Output sizes:"
ls -lh "$OUT"
