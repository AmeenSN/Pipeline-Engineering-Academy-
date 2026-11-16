import { STEEL } from './data';
import { hoopStress, longRestrained, vonMises } from './design';

/** Bending stress (MPa) in a pipe of outside diameter D (mm) curved elastically to radius R (m). */
export const elasticBendStress = (D: number, R: number) => (STEEL.E * (D / 1000)) / (2 * R);

export interface ElasticInput { D: number; t: number; smys: number; P: number; dT: number }
/** Worst equivalent stress in a restrained pipe with an elastic bend of radius R (m). */
export function elasticBendCheck(i: ElasticInput, R: number) {
  const sh = hoopStress(i.P, i.D, i.t);
  const sl0 = longRestrained(sh, i.dT);
  const sb = elasticBendStress(i.D, R);
  const seq = Math.max(vonMises(sh, sl0 + sb), vonMises(sh, sl0 - sb));
  return { sh, sl0, sb, seq, limit: 0.9 * i.smys, ratio: seq / (0.9 * i.smys) };
}
/** Smallest elastic bend radius (m) that keeps equivalent stress within 0.9 SMYS; null if no radius works. */
export function minElasticRadius(i: ElasticInput): number | null {
  if (elasticBendCheck(i, 1e7).ratio > 1) return null;
  let lo = 1, hi = 1e7;
  for (let k = 0; k < 80; k++) {
    const mid = Math.sqrt(lo * hi);
    if (elasticBendCheck(i, mid).ratio > 1) lo = mid; else hi = mid;
  }
  return hi;
}

/** Minimum cold field bend radius as a multiple of D (ASME B31.4 / B31.8 tables), by NPS. */
export function coldBendMinRadius(nps: number): number {
  if (nps <= 12) return 18;
  if (nps <= 14) return 21;
  if (nps <= 16) return 24;
  if (nps <= 18) return 27;
  return 30;
}
/** Degrees of bend per pipe-diameter of arc length for a radius of n·D. */
export const degPerDiameter = (n: number) => 180 / (Math.PI * n);

export interface ColdJoint { jointLength: number; tangent: number; D: number; degPerD: number }
/** Largest bend angle (degrees) that fits in one pipe joint, leaving a straight tangent at each end. Lengths in m, D in mm. */
export function maxAnglePerJoint(j: ColdJoint) {
  const usable = Math.max(j.jointLength - 2 * j.tangent, 0);
  return { usable, angle: (usable / (j.D / 1000)) * j.degPerD };
}

/** Induction bend of radius n·D: wall change and hoop stress factors (thin-wall torus). */
export function inductionBend(n: number) {
  return {
    thinning: 1 / (2 * n + 1),          // extrados wall reduction (fraction)
    thickening: 1 / (2 * n - 1),        // intrados wall increase (fraction)
    intrados: (4 * n - 1) / (4 * n - 2), // hoop stress ÷ straight-pipe hoop stress
    extrados: (4 * n + 1) / (4 * n + 2),
  };
}
/** Mother-pipe wall needed so the finished bend still meets a required wall on extrados and intrados. */
export function motherPipeWall(tReq: number, n: number) {
  const b = inductionBend(n);
  const forExtrados = (tReq * b.extrados) / (1 - b.thinning);
  const forIntrados = (tReq * b.intrados) / (1 + b.thickening);
  return Math.max(forExtrados, forIntrados, tReq);
}

export type MiterVerdict = 'allowed' | 'limited' | 'prohibited';
/**
 * Miter bend rules. hoopRatio = hoop stress ÷ SMYS; angle = deflection at one miter joint (degrees).
 * Deflections of 3° or less from misalignment are not treated as miters.
 */
export function miterRule(code: 'B31.4' | 'B31.8', hoopRatio: number, angle: number): { verdict: MiterVerdict; maxAngle: number; note: string } {
  if (angle <= 3) return { verdict: 'allowed', maxAngle: 3, note: 'Deflections of 3° or less are treated as misalignment, not as a miter.' };
  const upper = code === 'B31.8' ? 0.4 : 0.2;
  if (hoopRatio > upper) return { verdict: 'prohibited', maxAngle: 3, note: `Miters are not permitted above ${upper * 100} % SMYS hoop stress.` };
  if (hoopRatio > 0.1) {
    return angle <= 12.5
      ? { verdict: 'limited', maxAngle: 12.5, note: 'Permitted up to 12.5° per joint, with at least one pipe diameter between miters.' }
      : { verdict: 'prohibited', maxAngle: 12.5, note: 'Each miter is limited to 12.5° at this stress level.' };
  }
  const max = code === 'B31.8' ? 90 : 90;
  return { verdict: angle <= max ? 'allowed' : 'prohibited', maxAngle: max, note: 'Below 10 % SMYS the 12.5° limit does not apply.' };
}
