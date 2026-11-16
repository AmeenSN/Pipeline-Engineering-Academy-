// Corrosion protection, hydrotest, integrity, operations, above-ground and offshore helpers.
import { STEEL } from './data';
import { section, steelMass } from './design';

/* ---------- Cathodic protection ---------- */
/** CP current demand (A). Area from D (mm) and L (km); density mA/m² of bare steel; breakdown = coating damage fraction. */
export function cpCurrent(D: number, Lkm: number, density: number, breakdown: number) {
  const area = Math.PI * (D / 1000) * Lkm * 1000;
  return { area, current: (area * breakdown * density) / 1000 };
}
export const ANODES = {
  mg: { label: 'Magnesium', capacity: 1230, efficiency: 0.5, potential: -1.55 },
  zn: { label: 'Zinc', capacity: 780, efficiency: 0.9, potential: -1.1 },
} as const;
/** Galvanic anode mass (kg) to deliver current I (A) for a number of years, with utilisation factor 0.85. */
export const anodeMass = (I: number, years: number, a: { capacity: number; efficiency: number }) =>
  (I * years * 8760) / (a.capacity * a.efficiency * 0.85);
/** Dwight resistance (ohm) of one vertical rod anode of length L and diameter d (m) in soil of resistivity rho (ohm·m). */
export const dwight = (rho: number, L: number, d: number) => (rho / (2 * Math.PI * L)) * (Math.log((8 * L) / d) - 1);
/** AC current density (A/m²) at a circular holiday of 1 cm² for an induced AC voltage (V) and soil resistivity (ohm·m). */
export const acDensity = (vac: number, rho: number, d = 0.0113) => (8 * vac) / (rho * Math.PI * d);

/* ---------- Hydrostatic testing ---------- */
const BETA: [number, number][] = [[4, 0], [10, 0.88e-4], [15, 1.51e-4], [20, 2.07e-4], [25, 2.57e-4], [30, 3.03e-4], [40, 3.85e-4], [50, 4.57e-4]];
/** Volumetric thermal expansion coefficient of water (1/°C). */
export function waterBeta(tC: number): number {
  if (tC <= BETA[0][0]) return 0;
  for (let i = 1; i < BETA.length; i++) if (tC <= BETA[i][0]) { const [t1, b1] = BETA[i - 1], [t2, b2] = BETA[i]; return b1 + ((tC - t1) / (t2 - t1)) * (b2 - b1); }
  return BETA[BETA.length - 1][1];
}
const WATER_C = 4.6e-10; // compressibility 1/Pa
/** Combined compliance of pipe and water (1/Pa) for a restrained line. D, t in mm. */
export const testCompliance = (D: number, t: number) => ((D / t) * (1 - STEEL.nu ** 2)) / (STEEL.E * 1e6) + WATER_C;
/** Pressure change (MPa) per °C temperature change of a closed, water-filled, restrained test section. */
export const pressurePerDegree = (D: number, t: number, tC: number) => (waterBeta(tC) - 2 * STEEL.alpha) / testCompliance(D, t) / 1e6;
/** Water volume (m³) that must be pumped in to raise pressure by dP (MPa). Lkm in km. */
export function pressuriseVolume(D: number, t: number, Lkm: number, dP: number) {
  const fill = (section(D, t).Ai / 1e6) * Lkm * 1000;
  return { fill, added: fill * testCompliance(D, t) * dP * 1e6 };
}
export interface TestInput { D: number; t: number; smys: number; design: number; factor: number; limit: number; rho?: number }
/** Test pressure window and the elevation difference it allows within one test section. Pressures MPa. */
export function testWindow(i: TestInput) {
  const pMin = i.factor * i.design;                 // needed at the highest point
  const pMax = (2 * i.limit * i.smys * i.t) / i.D;  // allowed at the lowest point
  const head = ((pMax - pMin) * 1e6) / ((i.rho ?? 1000) * 9.81);
  return { pMin, pMax, head, hoopAtMin: (pMin * i.D) / (2 * i.t) / i.smys };
}

/* ---------- Defect assessment ---------- */
export interface DefectInput { D: number; t: number; smys: number; depth: number; length: number }
/** Modified B31G (0.85 dL) failure pressure of a corrosion defect. Dimensions mm, pressure MPa. */
export function modifiedB31G(i: DefectInput) {
  const z = (i.length * i.length) / (i.D * i.t);
  const M = z <= 50 ? Math.sqrt(1 + 0.6275 * z - 0.003375 * z * z) : 0.032 * z + 3.3;
  const flow = i.smys + 69, r = i.depth / i.t;
  const sf = (flow * (1 - 0.85 * r)) / (1 - (0.85 * r) / M);
  const intact = (2 * flow * i.t) / i.D;
  return { z, M, flow, failure: (2 * sf * i.t) / i.D, intact, ratio: r };
}

/* ---------- Operations ---------- */
/** ASME B31.8 maximum sectionalizing valve spacing by location class (km). */
export const VALVE_SPACING: Record<number, number> = { 1: 32, 2: 24, 3: 16, 4: 8 };
/** Contents of an isolated section. Gas: standard m³ (Z≈0.9). Liquid: m³. P in MPa gauge. */
export function sectionInventory(D: number, t: number, Lkm: number, P: number) {
  const vol = (section(D, t).Ai / 1e6) * Lkm * 1000;
  return { vol, gasStd: (vol * (P + 0.1013)) / 0.1013 / 0.9 };
}
/** Leak position from the upstream end (m) from pressure-wave arrival times (s) at each end. */
export const leakPosition = (L: number, a: number, tUp: number, tDown: number) => (L + a * (tUp - tDown)) / 2;

/* ---------- Above-ground ---------- */
/** Thermal growth (mm) of a free pipe of length L (m). */
export const thermalGrowth = (L: number, dT: number) => STEEL.alpha * dT * L * 1000;
/** Guided-cantilever leg length (m) needed to absorb a movement delta (mm) at allowable stress range SA (MPa). D mm. */
export const offsetLeg = (D: number, delta: number, SA: number) => Math.sqrt((3 * STEEL.E * D * delta) / SA) / 1000;
/** Longest support span (m) that keeps bending stress under `limit` MPa (continuous beam, M = wL²/10). */
export function supportSpan(D: number, t: number, contentRho: number, limit: number) {
  const s = section(D, t), w = (steelMass(D, t) + (s.Ai / 1e6) * contentRho) * 9.81; // N/m
  const Z = s.I / (D / 2) / 1e9; // m³
  return { w, span: Math.sqrt((10 * limit * 1e6 * Z) / w) };
}

/* ---------- Offshore on-bottom stability (simplified static check) ---------- */
/** Horizontal and lift force per metre (N/m) on a pipe of outer diameter Do (m) in steady flow U (m/s). */
export function hydroForces(Do: number, U: number, rho = 1025, CD = 0.7, CL = 0.9) {
  return { drag: 0.5 * rho * CD * Do * U * U, lift: 0.5 * rho * CL * Do * U * U };
}
/** Submerged weight (N/m) needed for lateral stability: SF·(drag/μ + lift). */
export const requiredSubmergedWeight = (drag: number, lift: number, mu: number, sf = 1.1) => sf * (drag / mu + lift);
