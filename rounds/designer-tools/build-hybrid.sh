#!/bin/sh
# my content/game + the last QA-verified art files (render/ui are being edited in parallel)
cd "$(dirname "$0")/../.."; R=rounds/round-2-src
{ cat $R/head.html; echo '<script>'; cat $R/engine.js src/content.js src/game.js $R/render.js $R/apparitions.js $R/ui.js; echo '</script>'; } > rounds/designer-tools/hybrid.html
