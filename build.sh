#!/bin/sh
# 把 src/ 串成單一檔案（audio/ 的音效和 fonts/ 的像素字型會轉成 base64 嵌進去，見 tools/）。預設輸出 index.html；可指定其他輸出檔：./build.sh 輸出檔.html
cd "$(dirname "$0")"
OUT="${1:-index.html}"
{ cat src/head.html; echo '<script>'; python3 tools/embed_font.py; cat src/engine.js src/content.js src/game.js src/render.js src/apparitions.js src/yelu_rules.js src/yelu_art.js src/yelu.js src/yelu_run.js src/run.js; python3 tools/embed_audio.py; cat src/ui.js; echo '</script>'; } > "$OUT"
echo "$OUT $(wc -c < "$OUT") bytes"
