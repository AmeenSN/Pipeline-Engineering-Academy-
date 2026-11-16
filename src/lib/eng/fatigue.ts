import { STEEL } from './data';

// DNV-RP-C203 S-N curves in air (stress range in MPa). Illustrative; confirm with current edition.
export interface SnCurve { id: string; desc: string; m1: number; loga1: number; m2: number; loga2: number }
export const SN_CURVES: SnCurve[] = [
  { id: 'C1', desc: 'Ground-flush girth weld', m1: 3, loga1: 12.449, m2: 5, loga2: 16.081 },
  { id: 'D', desc: 'Good-quality girth weld', m1: 3, loga1: 12.164, m2: 5, loga2: 15.606 },
  { id: 'E', desc: 'Girth weld with misalignment', m1: 3, loga1: 12.01, m2: 5, loga2: 15.35 },
  { id: 'F1', desc: 'Weld on backing strip / fillet', m1: 3, loga1: 11.699, m2: 5, loga2: 14.832 },
];

/** Cycles to failure at a constant stress range (MPa). */
export function cyclesToFailure(c: SnCurve, range: number): number {
  if (range <= 0) return Infinity;
  const n1 = 10 ** (c.loga1 - c.m1 * Math.log10(range));
  return n1 <= 1e7 ? n1 : 10 ** (c.loga2 - c.m2 * Math.log10(range));
}

/** Miner's rule damage for blocks of [stress range, number of cycles]. */
export const minerDamage = (c: SnCurve, blocks: [number, number][]) =>
  blocks.reduce((d, [s, n]) => d + n / cyclesToFailure(c, s), 0);

/** External collapse pressures (MPa): elastic, plastic and combined (DNV-ST-F101 form). */
export function collapse(D: number, t: number, smys: number, ovality = 0.005) {
  const pel = (2 * STEEL.E * (t / D) ** 3) / (1 - STEEL.nu ** 2);
  const pp = (2 * smys * t) / D;
  const g = (pc: number) => (pc - pel) * (pc * pc - pp * pp) - pc * pel * pp * ovality * (D / t);
  let lo = 0, hi = Math.min(pel, pp);
  for (let k = 0; k < 80; k++) {
    const mid = (lo + hi) / 2;
    if (g(mid) > 0) lo = mid; else hi = mid;
  }
  return { pel, pp, pc: (lo + hi) / 2 };
}
