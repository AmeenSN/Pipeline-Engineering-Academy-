import { STANDARD_WALLS, STEEL } from './data';

// Units: D, t in mm · P and stresses in MPa · forces in N · lengths in m where noted.

export interface WallInput { P: number; D: number; smys: number; F: number; E: number; T: number; ca: number }
export interface WallResult { tPressure: number; tRequired: number; tSelected: number | null; hoop: number; allowable: number; utilisation: number; dOverT: number }

/** Barlow-based pressure design thickness (ASME B31.4 §403.2.1 / B31.8 §841.1.1 form). */
export function wallThickness(i: WallInput): WallResult {
  const allowable = i.smys * i.F * i.E * i.T;
  const tPressure = (i.P * i.D) / (2 * allowable);
  const tRequired = tPressure + i.ca;
  const tSelected = selectStandardWall(tRequired);
  const tNet = (tSelected ?? tRequired) - i.ca;
  const hoop = hoopStress(i.P, i.D, tNet);
  return { tPressure, tRequired, tSelected, hoop, allowable, utilisation: hoop / allowable, dOverT: i.D / (tSelected ?? tRequired) };
}

export function selectStandardWall(tReq: number): number | null {
  return STANDARD_WALLS.find((w) => w >= tReq - 1e-9) ?? null;
}

/** Thin-wall (Barlow) hoop stress using outside diameter. */
export const hoopStress = (P: number, D: number, t: number) => (P * D) / (2 * t);

/** Longitudinal stress in a fully restrained (buried) straight pipe. ΔT = operating − installation. */
export const longRestrained = (sh: number, dT: number, m = STEEL) => m.nu * sh - m.E * m.alpha * dT;

/** Longitudinal pressure stress in an unrestrained pipe with end caps. */
export const longUnrestrained = (sh: number) => sh / 2;

export const vonMises = (sh: number, sl: number) => Math.sqrt(sh * sh - sh * sl + sl * sl);
export const tresca = (sh: number, sl: number) => Math.max(Math.abs(sh - sl), Math.abs(sh), Math.abs(sl));

/** Steel cross-section area (mm²), bore area (mm²) and second moment of area (mm⁴). */
export function section(D: number, t: number) {
  const d = D - 2 * t;
  return {
    As: (Math.PI / 4) * (D * D - d * d),
    Ai: (Math.PI / 4) * d * d,
    I: (Math.PI / 64) * (D ** 4 - d ** 4),
    d,
  };
}

/** Mass per metre of bare steel pipe (kg/m). */
export const steelMass = (D: number, t: number) => (section(D, t).As / 1e6) * STEEL.rho;

export interface AnchorInput { P: number; D: number; t: number; dT: number; cover: number; gammaSoil: number; mu: number; contentRho: number }
export interface AnchorResult { force: number; friction: number; anchorLength: number; endMovement: number; thermalPart: number; pressurePart: number }

/**
 * Force needed to fully restrain a pipeline end, soil friction per metre, the
 * resulting virtual anchor length and the free-end movement.
 * cover: depth to top of pipe (m) · gammaSoil in kN/m³ · contentRho kg/m³.
 */
export function anchor(i: AnchorInput): AnchorResult {
  const s = section(i.D, i.t);
  const sh = hoopStress(i.P, i.D, i.t);
  const thermalPart = s.As * STEEL.E * STEEL.alpha * i.dT; // N
  const pressurePart = i.P * s.Ai - STEEL.nu * sh * s.As; // N  (end-cap minus Poisson)
  const force = thermalPart + pressurePart;
  const Dm = i.D / 1000;
  const Wp = (steelMass(i.D, i.t) + (s.Ai / 1e6) * i.contentRho) * 9.81; // N/m
  const H = i.cover + Dm / 2; // to centreline
  const friction = i.mu * (2 * i.gammaSoil * 1000 * H * Dm + Wp); // N/m
  const anchorLength = Math.max(force, 0) / friction; // m
  const endMovement = (Math.max(force, 0) * anchorLength * 1000) / (2 * s.As * STEEL.E); // mm
  return { force, friction, anchorLength, endMovement, thermalPart, pressurePart };
}
