# 怪談救援 — team brief for the three-role improvement rounds

## The game
Single-file browser horror game (Traditional Chinese UI). Built by `./build.sh [out.html]`, which concatenates
`src/head.html` + `<script>` + engine.js, content.js, game.js, render.js, apparitions.js, ui.js. Open the html file directly (file://).
Player = a truck driver rescuing 6 villagers in a blacked-out Taiwanese village (山腳村) before dawn (night = 420 game seconds).
Read README.md (what exists), docs/decisions.md (K1–K7), docs/art-bible.md (pixel-art rules) before changing anything.

## Product owner (Hunter) feedback that still drives the work
- Pixel art, 3/4 (45°) top-down view, faithful to Taiwanese/East-Asian folklore, readable faces and signature features; it must look polished, not AI-generic.
- Must be scary: heart-racing, sound you hear before you see, desire to play another round.
- Pacing: **only 20 seconds** of omens and sounds at the start, then first monster contact shortly after, then slow-to-fast escalation through the night; the frantic dash only in the final minute.
- Not every monster chases: rule apparitions (紅衣小女孩 freeze 3 s, 夜半送葬 crouch & don't look, 叫名字 don't turn/answer) — keep and deepen.
- No one-item-counters-one-monster. Items are general tools (noise, smell, smoke, fire, paper). Monsters are handled mainly through environment and rules.
- Every map prop must help, hurt or make noise.
- **Jumpscare on capture: no images.** The monster's own pixel character lunges at the camera: sprite scales up fast toward the screen using a dedicated big close-up frame set (face, mouth opening, claws), plus screen shake, flash and a sting. Keep a jumpscare on/off setting. Do not use any AI/HD images in the game.

## Hard rules
- Gameplay logic (engine/content/game) never draws; renderers (render.js, apparitions.js) only read `G`.
- Keep `window.KT` test hooks working; add hooks rather than remove them.
- Keep index.html a single file with no external assets except Google Fonts.
- Code comments in English, matching the surrounding style (dense one-liners). Player-facing text in Traditional Chinese, natural and concise.
- Do NOT git commit, push, publish, or delete files you did not create.
- Folklore claims you are not sure of: mark 待查證 in docs, don't state as fact.

## File ownership per round (to avoid overwriting each other)
- Game designer: src/content.js, src/game.js. Need UI/text/tutorial changes in ui.js? List them in your report; don't edit ui.js.
- Horror art & audio director: src/render.js, src/apparitions.js, src/head.html, src/ui.js, docs/art-bible.md.
- QA & tech lead: tests/ (owns them), may fix bugs in any file AFTER the other two finish the round, and reviews their changes.
- Build your own checks into your own file: `./build.sh rounds/tmp-<role>.html`. Only QA builds `index.html`.

## Tools
- Tests: `./tests/run_all.sh [html] [outdir]` (rules, tutorial, soak, full-night soak, desktop+mobile screenshots). Individual: `python3 tests/rules.py <abs html> tests/rules.js` etc.
- In page: `KT.manual=true` then `KT.step(frames)`; `KT.G` is the game state; `KT.startGame(seed[, 'tutorial'])`, `KT.spawnMonster(type,{x,y})`, `KT.startApparition(type)`, `KT.UI.closeMeet()`.
- Python Playwright + Chromium are installed (`python3 -c "import playwright"`). View screenshots with the Read tool (keep them ≤1280 wide).
- Design detector: `~/.claude/skills/impeccable/scripts/impeccable detect --json <file>`.

## Reporting
End every round with a short report (Traditional Chinese is fine): what you changed (files, behaviour), how you verified it, what is still open.
