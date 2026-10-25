# Style — PDF to Quiz

> Decision: when asked to choose, the human answered "pick the best". The direction
> whose ancestor best matches the product domain was chosen and the other two recorded
> below as REJECTED, per the `distinctive-visual-style` skill.

ANCESTOR: **the printed exam booklet** — a stapled A4 paper exam: warm paper, indigo
ink, lettered A–D answer rows, mono question numbers, hairlines between sections.
A quiz *is* a digital exam paper, so every token below is derivable from that object.

PALETTE (light):
- `--paper #F7F5EF` — exam booklet paper (R1 cream shifted warmer; not the example #F5F3EE verbatim)
- `--raised #FCFBF7` — raised sheet for inputs / selected rows
- `--ink #1C1933` — deep indigo ink, not neutral black (exam ink, shifted to the indigo family the human requested)
- `--mute #6E6A82` — indigo-grey for secondary text and labels
- `--rule #DED9CE` — hairline between exam rows; `--rule-soft #ECE8DE`
- `--accent #4F46E5` — exam violet/indigo. Jobs: primary button, selected option, focus ring, progress fill, exam score numeral. Nothing else.
- `--accent-deep #3730A3` — pressed/hover state of accent
- `--accent-tint #ECE9FD` — selected answer wash (light)
- severity only: `--success #2F6B45`, `--danger #C4340B`, `--warning #A9701A`

PALETTE (dark):
- `--paper #13101F` (indigo-black, not generic #111), `--raised #1B1730`, `--ink #ECE9F5`,
  `--mute #9A94B5`, `--rule #2B2540`, accent lightened to `#8B80F9` for 4.5:1 contrast,
  tint `#262049`. Same structure and type as light mode.

TYPE:
- display = **Fraunces** 400 (serif with character; large type stays light weight)
- working = **Inter** 17/1.65 (neutral on purpose)
- labels/data = system mono, 11px, uppercase, 0.14em tracking — used for exam numbers
  ("QUESTION 03 / 10"), scores and tabular data, never as decoration
- scale: 64 / 34 / 21 / 17 / 11 (ratio ≥ 1.5 between levels; hierarchy survives greyscale)

LAYOUT:
- mobile-first: single column at 320px, `min-width` enhancements only, no fixed widths
- content max-width 64rem (sheet), reading measure 44rem; asymmetric landing hero (left rail)
- hairline-separated rows instead of identical rounded cards; 12-col grid on desktop

RADIUS: 3px default, 6px maximum on panels. Never pill-shaped, never 12–16px.
SHADOW: none on flat surfaces. Elevation = 1px border + hairline. `shadow-float` only
for genuinely floating things: modal, dropdown menu, toast.
SIGNATURE: the **exam sheet** — questions numbered in mono like a real exam, lettered
A–D answer rows separated by hairlines, tabular-nums score sheets, and a dense
spec-table on the landing page listing exactly what the product does.

BANNED:
gradient text · radial glows · emoji as icons (lucide-react only) · centered body copy ·
radius > 6px · glow shadows on flat surfaces · fake browser/terminal chrome ·
accent on more than ~5% of the surface · two neutral sans-serifs · mock/demo data.

REJECTED:
1. **Swiss Study (R2 brutalist)** — hard 0px corners, 900-weight grotesk, electric
   violet on pure white, oversized numerals. Rejected: its confidence fits infra/security
   tools, not students reading exam questions; the loud poster voice raises fatigue on
   10-question screens and conflicts with the warm-paper ancestor.
2. **Soft Notebook (R3 warm analog)** — cream/lavender paper, Fraunces soft, 8px
   rounded flashcards, organic rules. Rejected: friendliest but most generic
   consumer-flashcard look; loses the exam-sheet signature and the hairline discipline,
   and would feel closer to a generic template than an exam booklet.

DARK MODE: class strategy via next-themes, no-flash inline script, tokens above.

CRAFT CHECKLIST (from distinctive-visual-style / frontend-craft / accessibility skills):
tabular-nums on every number · focus-visible ring on every interactive element ·
44px minimum tap targets · 4.5:1 text contrast · real favicon · designed 404/error/empty
states · `::selection` in accent tint · no layout shift (skeletons reserve space) ·
aria-live announcements for quiz progress and toasts.
