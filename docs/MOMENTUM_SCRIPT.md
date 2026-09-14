# Momentum Script — Design Brief

Momentum Script is Tabula Design Now's custom casual cursive display typeface.

## Personality

- Lazy, casual, warm cursive
- Familiar personal-note / planner-writing feel
- Friendly rather than formal or calligraphic
- Natural and slightly imperfect rather than polished or ornamental

## Letterforms

- Mostly connected lowercase letters
- Close letter spacing so words feel compact and continuous
- Rounded, soft forms
- Soft right slant
- Simple capitals with only light flourishes
- Avoid exaggerated loops and formal wedding-script styling

## Stroke & Rhythm

- Rounded monoline stroke
- Loose handwritten rhythm
- Slightly irregular baseline
- Compact internal letter rhythm with more relaxed spacing between words
- Regular visual weight; avoid artificial bolding

## Tabula Rendering Target

Until the final font file is installed, Tabula uses a cursive fallback stack and applies:

- Letter spacing: approximately `-0.035em`
- Line height: approximately `1.12`
- Font weight: `400`
- Fallback order: Segoe Script, Apple Chancery, Brush Script MT, cursive

## Final Font File

When the custom `.woff2` font is ready, its native kerning and glyph joins should reproduce the compact spacing without relying on aggressive CSS tracking. Tabula should then load the font as `Momentum Script` through `@font-face` while retaining the fallback stack for resilience.
