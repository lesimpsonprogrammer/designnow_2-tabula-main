import type { Obj } from '../../types';

// The canvas stores objects at fixed page-absolute coordinates, which is honest
// for a fixed-width preview but not shippable output (see handoff README,
// "Code drawer"). This module infers a responsive flex/grid layout from that
// geometry, one section at a time, so the exported page actually reflows.

export type Row = { objects: Obj[]; gap: number; equalWidth: boolean };

const WIDTH_TOLERANCE = 0.15; // objects within 15% of each other's width count as "equal"

// Groups objects into horizontal rows by merging overlapping vertical
// intervals [y, y+h). Two objects sharing any y-range are treated as
// side-by-side; a gap in y starts a new row.
export function inferRows(objects: Obj[]): Row[] {
  const sorted = [...objects].sort((a, b) => a.y - b.y);
  const rows: Obj[][] = [];
  let bottom = -Infinity;

  for (const o of sorted) {
    if (rows.length && o.y < bottom) {
      rows[rows.length - 1].push(o);
      bottom = Math.max(bottom, o.y + o.h);
    } else {
      rows.push([o]);
      bottom = o.y + o.h;
    }
  }

  return rows.map((row) => {
    const byX = [...row].sort((a, b) => a.x - b.x);
    return { objects: byX, gap: rowGap(byX), equalWidth: widthsMatch(byX) };
  });
}

function widthsMatch(row: Obj[]): boolean {
  if (row.length < 2) return false;
  const widths = row.map((o) => o.w);
  const avg = widths.reduce((a, b) => a + b, 0) / widths.length;
  return widths.every((w) => Math.abs(w - avg) / avg <= WIDTH_TOLERANCE);
}

function rowGap(row: Obj[]): number {
  if (row.length < 2) return 24;
  const gaps: number[] = [];
  for (let i = 1; i < row.length; i++) {
    gaps.push(Math.max(0, row[i].x - (row[i - 1].x + row[i - 1].w)));
  }
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

// Vertical gap between the bottom of one row and the top of the next —
// becomes the section's row-to-row gap.
export function columnGap(rows: Row[]): number {
  if (rows.length < 2) return 32;
  const gaps: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    const prevBottom = Math.max(...rows[i - 1].objects.map((o) => o.y + o.h));
    const nextTop = Math.min(...rows[i].objects.map((o) => o.y));
    gaps.push(Math.max(0, nextTop - prevBottom));
  }
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}
