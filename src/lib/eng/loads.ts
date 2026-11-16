import { STEEL } from './data';
import { section, steelMass } from './design';

/** Soil prism pressure at the pipe crown (kPa). gamma in kN/m³, H in m. */
export const soilPressure = (gamma: number, H: number) => gamma * H;

/** Impact factor on surface wheel loads, reducing with depth (ALA 2001, highway). */
export function impactFactor(H: number): number {
  if (H < 0.3) return 1.5;
  if (H < 0.6) return 1.35;
  if (H < 0.9) return 1.15;
  return 1.0;
}

/** Pressure at depth H directly below a surface point load Pw (kN), Boussinesq (kPa). */
export const wheelPressure = (Pw: number, H: number, impact = impactFactor(H)) =>
  (3 * Pw * impact) / (2 * Math.PI * H * H);

export interface OvalInput { D: number; t: number; pressure: number; Eprime: number; lag?: number; K?: number }
/**
 * Modified Iowa formula. pressure in kPa, E' (modulus of soil reaction) in MPa.
 * Returns ovality Δy/D (fraction) and through-wall bending stress (MPa).
 */
export function ovalisation(i: OvalInput) {
  const DL = i.lag ?? 1.0, K = i.K ?? 0.1;
  const R = (i.D - i.t) / 2; // mm
  const ringStiff = (STEEL.E * (i.t ** 3 / 12)) / R ** 3; // MPa
  const ratio = (DL * K * (i.pressure / 1000)) / (ringStiff + 0.061 * i.Eprime);
  const bending = 4 * STEEL.E * ratio * (i.t / i.D);
  return { ratio, bending };
}

export interface BuoyInput { D: number; t: number; coatT: number; coatRho: number; concT: number; concRho: number; fluidRho: number; contentRho: number }
/** Buoyancy check per metre of pipe. Thicknesses in mm, densities kg/m³. Returns N/m. */
export function buoyancy(i: BuoyInput) {
  const s = section(i.D, i.t);
  const d1 = i.D + 2 * i.coatT, d2 = d1 + 2 * i.concT;
  const ring = (a: number, b: number) => (Math.PI / 4) * (b * b - a * a) / 1e6; // m²
  const weight = (steelMass(i.D, i.t) + ring(i.D, d1) * i.coatRho + ring(d1, d2) * i.concRho + (s.Ai / 1e6) * i.contentRho) * 9.81;
  const uplift = ((Math.PI / 4) * d2 * d2) / 1e6 * i.fluidRho * 9.81;
  return { weight, uplift, sf: weight / uplift, net: weight - uplift, outerD: d2 };
}

/** Smallest concrete thickness (mm) that reaches the target safety factor; null if > 300 mm. */
export function requiredConcrete(i: Omit<BuoyInput, 'concT'>, target = 1.1): number | null {
  for (let c = 0; c <= 300; c += 1) if (buoyancy({ ...i, concT: c }).sf >= target) return c;
  return null;
}
