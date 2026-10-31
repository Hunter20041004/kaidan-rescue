#!/bin/sh
# 全套測試：./tests/run_all.sh [要測的 html，預設 index.html] [截圖輸出資料夾，預設 tests/out]
cd "$(dirname "$0")/.."
HTML="$(pwd)/${1:-index.html}"; OUT="${2:-tests/out}"; mkdir -p "$OUT"
echo "== rules ==";      python3 tests/rules.py "$HTML" tests/rules.js | tee "$OUT/rules.txt" | grep -v '^PASS'; echo "PASS: $(grep -c '^PASS' "$OUT/rules.txt")  FAIL: $(grep -c '^FAIL' "$OUT/rules.txt")"
echo "== 七夜 ==";     python3 tests/run.py "$HTML" | grep -v '^PASS '
echo "== 躲藏 ==";     python3 tests/hide.py "$HTML" "$OUT" | grep -v '^PASS '
echo "== 音效 ==";     python3 tests/audio.py "$HTML"
echo "== 外殼 ==";     python3 tests/shell.py "$HTML" "$OUT" | grep -v '^PASS '
echo "== reload ==";     python3 tests/reload.py "$HTML"
echo "== tutorial ==";   python3 tests/tutorial.py "$HTML" "$OUT" | tail -6
echo "== soak ==";       python3 tests/soak.py "$HTML" 30 7 | tail -1
echo "== full nights =="; python3 tests/soak_fullnight.py "$HTML" 20 7.5 | tail -1
echo "== screens ==";    python3 tests/screens.py "$HTML" "$OUT"
echo "== perf ==";       python3 tests/perf.py "$HTML"
