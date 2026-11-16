import { STEEL } from './data';
import { section, steelMass } from './design';

export type EndCondition = 'pinned' | 'fixed-pinned' | 'fixed';
const C: Record<EndCondition, number> = { pinned: 9.87, 'fixed-pinned': 15.4, fixed: 22.4 };
const MOMENT: Record<EndCondition, number> = { pinned: 8, 'fixed-pinned': 8, fixed: 12 };

export interface SpanInput { D: number; t: number; L: number; ends: EndCondition; contentRho: number; fluidRho: number; U: number; Ca?: number }
export function freeSpan(i: SpanInput) {
  const s = section(i.D, i.t);
  const Dm = i.D / 1000;
  const EI = STEEL.E * 1e6 * (s.I / 1e12);
  const mDry = steelMass(i.D, i.t) + (s.Ai / 1e6) * i.contentRho;
  const displaced = (Math.PI / 4) * Dm * Dm * i.fluidRho;
  const me = mDry + (i.Ca ?? 1.0) * displaced; // effective mass incl. added mass
  const fn = (C[i.ends] / (2 * Math.PI)) * Math.sqrt(EI / (me * i.L ** 4));
  const Vr = i.U / (fn * Dm);
  const fs = (0.2 * i.U) / Dm; // Strouhal ≈ 0.2
  const w = Math.max(mDry - displaced, 0.05 * mDry) * 9.81; // submerged weight N/m
  const M = (w * i.L * i.L) / MOMENT[i.ends];
  const bending = (M * (Dm / 2)) / (s.I / 1e12) / 1e6; // MPa
  return { fn, fs, Vr, bending, me, w };
}

/** Longest span (m) keeping reduced velocity below the given onset value. */
export function maxSpanForVr(i: Omit<SpanInput, 'L'>, vrLimit: number): number {
  let lo = 1, hi = 300;
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (freeSpan({ ...i, L: mid }).Vr < vrLimit) lo = mid; else hi = mid;
  }
  return lo;
}
