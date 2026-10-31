# 怪談救援 — Design

## World: 農會月曆、白紙黑框訃聞、鐵窗花（2026-10-28，Hunter 選定方向 C）
The UI is the printed matter and hardware of a 1990s Taiwanese farming village, seen by fluorescent tube light at night:
- the 農會 tear-off wall calendar
- the black-framed white obituary
- the 鐵窗花 window grille
- the 光明燈 wall at the temple

Every key moment has its own real object. Nothing is "aged paper with grain."

| Moment | Object |
|---|---|
| Night card (before each night) | One page of the 農會 tear-off calendar: big red date numeral, real 宜／忌, perforated top edge |
| Villager list (HUD) | A row of 光明燈: lit = alive, bright = with you, out = lost |
| Death | 白紙黑框訃聞, grayscale pixel portrait, 「山腳村 慟啟」. No red anywhere |
| Dawn blessing | Three 籤詩 slips drawn at the temple, with cold morning light and grille shadows on the screen |
| Newspaper | Grey newsprint, dense 明體, vertical headline |
| 七夜錄 | The calendar's seven days |

## Tokens
- Night ground `#07090a`.
- Fluorescent white `#dcefea` for text on dark; secondary `#9fb3ae`. Both pass 4.5:1 on night.
- Paper `#f4f2ec` (calendar, obituary, slips); newsprint `#e3e0d6`; ink `#111111`, secondary ink `#4a4844`.
- Calendar red `#d7261e`: only for dates, 忌, danger. Headings are ink, not red.
- Iron-grille green `#2f5a4c` (宜, safe); terrazzo `#8d8a83`; lamp amber `#ffb347`.

## Type
- Display: **Noto Serif TC 900** (calendar numerals, headings, obituary).
- UI and body: **Noto Sans TC** 400/500/700.
- Handwriting (villager notes): **Iansui**.
- No italics (CJK has none); no brush or kai faces.
- Key hints use the UI face and are hidden on touch.

## Rules
- No grain textures, no tilted sheets, no seal-stamp buttons, no eyebrow labels over headings.
- One shadow for printed matter: `0 24px 60px #000c`. Square corners.
- One authored motion: the fluorescent flicker when a screen lights up.
- The HUD stays dimmer than the flashlight pool. The selected item glows like an ember; it is not a bright tile.
- Subtitles use 2 colors: white for the world, warm red for danger and loss.
