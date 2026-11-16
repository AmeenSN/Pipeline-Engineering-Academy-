import { STEEL } from './data';
import { section, steelMass } from './design';

export interface UhbInput {
  D: number; t: number;          // mm
  P: number; dT: number;         // MPa, °C
  delta: number;                 // imperfection (prop) height, m
  cover: number;                 // depth of cover to top of pipe, m
  gammaSoil: number;             // kN/m³ (use submerged weight below water table)
  f: number;                     // uplift coefficient (≈0.1 loose sand … 0.5–0.7 dense / rock backfill)
  contentRho: number;            // kg/m³
}
export interface UhbResult {
  axial: number; thermal: number; pressure: number;     // N (compression positive)
  pipeWeight: number; soilUplift: number; available: number; required: number; // N/m
  sf: number; requiredCover: number;                      // -, m
}

/** Effective compressive force in a fully restrained line: A·E·α·ΔT + (1−2ν)·p·Ai. */
export function effectiveAxialForce(D: number, t: number, P: number, dT: number) {
  const s = section(D, t);
  const thermal = s.As * STEEL.E * STEEL.alpha * dT;
  const pressure = (1 - 2 * STEEL.nu) * P * s.Ai;
  return { thermal, pressure, total: thermal + pressure };
}

/**
 * Required download per unit length to hold a pipe down over a prop imperfection.
 * Palmer, Ellinas, Richards & Guijt (OTC 6335, 1990) simplified design formula:
 *   w = [1.16 − 4.76·√(EI·w0/δ)/P] · P · √(δ·w0/EI)
 */
export function requiredDownload(P: number, EI: number, w0: number, delta: number): number {
  if (P <= 0 || delta <= 0) return 0;
  const w = (1.16 - (4.76 * Math.sqrt((EI * w0) / delta)) / P) * P * Math.sqrt((delta * w0) / EI);
  return Math.max(w, 0);
}

/** Uplift resistance of cohesionless backfill: q = γ·H·D·(1 + f·H/D)  (N/m). */
export const soilUplift = (gamma: number, H: number, Dm: number, f: number) => gamma * 1000 * H * Dm * (1 + (f * H) / Dm);

export function upheaval(i: UhbInput): UhbResult {
  const s = section(i.D, i.t);
  const Dm = i.D / 1000;
  const ax = effectiveAxialForce(i.D, i.t, i.P, i.dT);
  const EI = STEEL.E * 1e6 * (s.I / 1e12); // N·m²
  const pipeWeight = (steelMass(i.D, i.t) + (s.Ai / 1e6) * i.contentRho) * 9.81;
  const required = requiredDownload(ax.total, EI, pipeWeight, i.delta);
  const q = soilUplift(i.gammaSoil, i.cover, Dm, i.f);
  const available = pipeWeight + q;
  // Solve γ·D·H + γ·f·H² = required − pipeWeight for H.
  const need = required - pipeWeight;
  let requiredCover = 0;
  if (need > 0) {
    const g = i.gammaSoil * 1000;
    const a = g * i.f, b = g * Dm;
    requiredCover = a > 0 ? (-b + Math.sqrt(b * b + 4 * a * need)) / (2 * a) : need / b;
  }
  return {
    axial: ax.total, thermal: ax.thermal, pressure: ax.pressure,
    pipeWeight, soilUplift: q, available, required,
    sf: required > 0 ? available / required : Infinity, requiredCover,
  };
}
