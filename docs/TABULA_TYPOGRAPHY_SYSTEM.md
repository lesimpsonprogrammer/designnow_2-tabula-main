# Tabula Typography System v1.0
Draft implementation for brand-book production. The app interface continues to use **DM Sans** everywhere (including login, welcome and tutorial) and **JetBrains Mono** for code.

## Simple workflow
1. Open **Typography** in the right rail.
2. Choose **Global** to pick a brand pairing for the entire design, or **Selected** to change one text element.
3. Review the live preview and adjust size, alignment, spacing and color.

## Brand pairings
| Brand | Heading | Body | Direction |
| --- | --- | --- | --- |
| Momentum Data Solutions | DM Sans | DM Sans | Corporate, restrained |
| Data Preview | Space Grotesk | DM Sans | Precision, modern |
| GLASS | Archivo | DM Sans | Authority, security |
| Alba Reset | Instrument Serif | DM Sans | Human, welcoming |
| Momentum Script beta | Custom connected cursive pending | DM Sans | Casual, light monoline |

Other Momentum properties may use these as starting points; the corporate book governs family consistency. These are **proposed** pairings, not approval of logo or brand redesigns.

## Hierarchy
Caption 12px; label 14px; body 16px; H3 24px; H2 32px; H1 40px; hero 56px. Default comfortable reading line height: 1.5–1.6; heading line height: 1.1–1.25. Keep body copy at or above 16px where practical. Validate responsive scaling and WCAG 2.2 AA in actual use.

## Momentum Script – beta acceptance
The earlier approved direction is **light, relaxed, closely spaced, connected handwritten cursive**. Do not misrepresent fallback fonts as the finished custom font. Before releasing: validate the real font files and redistribution rights; refine glyph joins and kerning; inspect uppercase/lowercase, numerals and punctuation; export WOFF2 plus source/installable formats; load with @font-face; compare across browsers; and test for legibility. The current typography option explicitly says preview fallback until these steps are done.

## Implementation notes
Styles are registered in `src/index.css`; curated pairings and type scale live in `src/lib/fonts.ts`. The existing `TypographyPanel` already provides Selected/Global scope, font pairings, and live previews. No production deployment or merge is implied by this branch.
