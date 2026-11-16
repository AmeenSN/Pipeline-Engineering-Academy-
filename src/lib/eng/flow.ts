// Hydraulics, surge, consequence radius, crossings geometry and scour.
import { STEEL } from './data';

/** Darcy friction factor: laminar 64/Re, otherwise Swamee-Jain. rough and D in the same units. */
export function frictionFactor(Re: number, rough: number, D: number): number {
  if (Re <= 0) return 0;
  if (Re < 2300) return 64 / Re;
  return 0.25 / Math.log10(rough / (3.7 * D) + 5.74 / Re ** 0.9) ** 2;
}

export interface FlowInput { Q: number; Di: number; L: number; rho: number; mu: number; rough?: number }
/** Liquid pressure drop. Q m³/h, Di mm, L km, rho kg/m³, mu cP, rough mm. Returns v (m/s), Re, f, dP (MPa), gradient (bar/km). */
export function pressureDrop(i: FlowInput) {
  const D = i.Di / 1000, A = (Math.PI / 4) * D * D, v = i.Q / 3600 / A;
  const Re = (i.rho * v * D) / (i.mu / 1000);
  const f = frictionFactor(Re, (i.rough ?? 0.045) / 1000, D);
  const dPperM = (f / D) * (i.rho * v * v) / 2; // Pa/m
  return { v, Re, f, dP: (dPperM * i.L * 1000) / 1e6, gradient: (dPperM * 1000) / 1e5 };
}

/** Pressure wave speed (m/s) in a liquid-filled elastic pipe. K = fluid bulk modulus (Pa). D, t in mm. */
export const waveSpeed = (K: number, rho: number, D: number, t: number) =>
  Math.sqrt(K / rho / (1 + (K / (STEEL.E * 1e6)) * (D / t)));

/** Joukowsky surge pressure rise (MPa) for an instantaneous velocity change dv (m/s). */
export const joukowsky = (rho: number, a: number, dv: number) => (rho * a * dv) / 1e6;

/** Potential impact radius of a natural gas pipeline rupture (m), ASME B31.8S: r = 0.69·d·√p (ft, in, psi). */
export const impactRadius = (Dmm: number, pMPa: number) => 0.3048 * 0.69 * (Dmm / 25.4) * Math.sqrt(pMPa * 145.038);

/** ASME B31.8 location class from the number of buildings in the 1 mile × ¼ mile sliding zone. */
export function classFromBuildings(n: number, multiStorey = false): 1 | 2 | 3 | 4 {
  if (multiStorey) return 4;
  if (n <= 10) return 1;
  if (n <= 45) return 2;
  return 3;
}

export interface HddInput { L: number; depth: number; entryDeg: number; exitDeg: number; D: number; radiusFactor?: number }
/**
 * HDD profile: entry tangent, arc to horizontal, straight bottom, arc up, exit tangent.
 * L = entry-to-exit horizontal distance (m), depth = depth of the bottom tangent below entry level (m), D in mm.
 */
export function hddProfile(i: HddInput) {
  const R = ((i.radiusFactor ?? 1200) * i.D) / 1000;
  const a = (i.entryDeg * Math.PI) / 180, b = (i.exitDeg * Math.PI) / 180;
  const side = (ang: number) => {
    const arcDrop = R * (1 - Math.cos(ang)), arcRun = R * Math.sin(ang);
    const tanDrop = i.depth - arcDrop, tanRun = tanDrop / Math.tan(ang);
    return { arcDrop, arcRun, tanDrop, tanRun, tanLen: tanDrop / Math.sin(ang), arcLen: R * ang };
  };
  const en = side(a), ex = side(b);
  const bottom = i.L - en.arcRun - en.tanRun - ex.arcRun - ex.tanRun;
  const feasible = en.tanDrop >= 0 && ex.tanDrop >= 0 && bottom >= 0;
  const drillLength = en.tanLen + en.arcLen + Math.max(bottom, 0) + ex.arcLen + ex.tanLen;
  const minLength = en.arcRun + Math.max(en.tanRun, 0) + ex.arcRun + Math.max(ex.tanRun, 0);
  return { R, en, ex, bottom, feasible, drillLength, minLength, bendStress: (STEEL.E * (i.D / 1000)) / (2 * R) };
}

/** Lacey regime scour: silt factor from median grain size (mm) and normal scour depth below flood level (m). */
export const laceySiltFactor = (d50: number) => 1.76 * Math.sqrt(d50);
export const laceyScour = (Q: number, f: number) => 0.473 * (Q / f) ** (1 / 3);

export interface TrenchInput { D: number; cover: number; clearance: number; bedding: number; slope: number }
/** Trench geometry. D mm; cover, clearance (each side), bedding in m; slope = horizontal run per unit depth. */
export function trench(i: TrenchInput) {
  const Dm = i.D / 1000, depth = i.cover + Dm + i.bedding, bottom = Dm + 2 * i.clearance;
  const top = bottom + 2 * i.slope * depth, area = ((bottom + top) / 2) * depth;
  return { depth, bottom, top, area, pipeArea: (Math.PI / 4) * Dm * Dm, backfill: area - (Math.PI / 4) * Dm * Dm };
}

/** Construction right-of-way width estimate (m) built up from its parts. */
export function rowWidth(t: ReturnType<typeof trench>, Dmm: number, opts: { topsoil: boolean; passing: boolean }) {
  const spoilVol = t.area * 1.25; // bulking
  const spoil = 2 * Math.sqrt(spoilVol / Math.tan((35 * Math.PI) / 180));
  const parts = [
    { name: 'Boundary offset', w: 1 },
    ...(opts.topsoil ? [{ name: 'Topsoil stockpile', w: 3 }] : []),
    { name: 'Trench spoil', w: spoil },
    { name: 'Clearance', w: 1 },
    { name: 'Trench', w: t.top },
    { name: 'Clearance', w: 1.5 },
    { name: 'Pipe string', w: Dmm / 1000 + 1 },
    { name: 'Sideboom and welding lane', w: Dmm >= 762 ? 8 : 6 },
    ...(opts.passing ? [{ name: 'Travel / passing lane', w: 5 }] : []),
    { name: 'Boundary offset', w: 1 },
  ];
  return { parts, total: parts.reduce((s, p) => s + p.w, 0) };
}
