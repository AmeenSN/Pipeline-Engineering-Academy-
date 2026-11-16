import { describe, expect, it } from 'vitest';
import { classFromBuildings, frictionFactor, hddProfile, impactRadius, joukowsky, laceyScour, laceySiltFactor, pressureDrop, rowWidth, trench, waveSpeed } from '../src/lib/eng/flow';
import { ANODES, acDensity, anodeMass, cpCurrent, dwight, leakPosition, modifiedB31G, offsetLeg, pressurePerDegree, pressuriseVolume, requiredSubmergedWeight, hydroForces, sectionInventory, supportSpan, testWindow, thermalGrowth, waterBeta } from '../src/lib/eng/ops';

describe('flow', () => {
  it('friction factor', () => {
    expect(frictionFactor(1000, 0.045, 500)).toBeCloseTo(0.064, 3);
    expect(frictionFactor(1e6, 0.045, 500)).toBeCloseTo(0.0131, 3);
  });
  it('pressure drop of 2000 m3/h crude in NPS 24', () => {
    const r = pressureDrop({ Q: 2000, Di: 584.6, L: 100, rho: 850, mu: 8 });
    expect(r.v).toBeCloseTo(2.07, 2);
    expect(r.Re).toBeGreaterThan(1e5);
    expect(r.dP).toBeGreaterThan(3);
    expect(r.dP).toBeLessThan(6);
  });
  it('surge', () => {
    const a = waveSpeed(1.5e9, 850, 610, 12.7);
    expect(a).toBeGreaterThan(1000);
    expect(a).toBeLessThan(1330);
    expect(joukowsky(850, 1100, 2)).toBeCloseTo(1.87, 2);
  });
  it('impact radius: 30 in at 1000 psi is 655 ft', () => {
    expect(impactRadius(762, 6.895)).toBeCloseTo(655 * 0.3048, 0);
  });
  it('location class', () => {
    expect(classFromBuildings(10)).toBe(1);
    expect(classFromBuildings(11)).toBe(2);
    expect(classFromBuildings(46)).toBe(3);
    expect(classFromBuildings(5, true)).toBe(4);
  });
  it('HDD geometry', () => {
    const h = hddProfile({ L: 600, depth: 15, entryDeg: 10, exitDeg: 8, D: 610 });
    expect(h.R).toBeCloseTo(732, 0);
    expect(h.feasible).toBe(true);
    expect(h.drillLength).toBeGreaterThan(600);
    expect(hddProfile({ L: 150, depth: 15, entryDeg: 10, exitDeg: 8, D: 610 }).feasible).toBe(false);
  });
  it('scour and trench', () => {
    expect(laceySiltFactor(1)).toBeCloseTo(1.76, 2);
    expect(laceyScour(500, 1.76)).toBeCloseTo(3.11, 1);
    const t = trench({ D: 610, cover: 1, clearance: 0.3, bedding: 0.15, slope: 0.5 });
    expect(t.depth).toBeCloseTo(1.76, 2);
    expect(t.bottom).toBeCloseTo(1.21, 2);
    expect(rowWidth(t, 610, { topsoil: false, passing: true }).total).toBeGreaterThan(18);
  });
});

describe('ops', () => {
  it('cathodic protection', () => {
    const c = cpCurrent(610, 50, 20, 0.03);
    expect(c.area).toBeCloseTo(95819, -1);
    expect(c.current).toBeCloseTo(57.5, 0);
    expect(anodeMass(1, 20, ANODES.mg)).toBeCloseTo(335, -1);
    expect(dwight(50, 2, 0.1)).toBeCloseTo(16.2, 0);
    expect(acDensity(10, 50)).toBeCloseTo(45, 0);
  });
  it('hydrotest', () => {
    expect(waterBeta(20)).toBeCloseTo(2.07e-4, 6);
    const k = pressurePerDegree(610, 12.7, 20);
    expect(k).toBeGreaterThan(0.2);
    expect(k).toBeLessThan(0.4);
    expect(pressuriseVolume(610, 12.7, 10, 12).added).toBeGreaterThan(15);
    const w = testWindow({ D: 610, t: 12.7, smys: 450, design: 9.6, factor: 1.25, limit: 1 });
    expect(w.pMin).toBeCloseTo(12, 5);
    expect(w.pMax).toBeCloseTo(18.74, 1);
    expect(w.head).toBeCloseTo(687, -1);
  });
  it('modified B31G', () => {
    const none = modifiedB31G({ D: 610, t: 12.7, smys: 450, depth: 0, length: 200 });
    expect(none.failure).toBeCloseTo(none.intact, 6);
    const d = modifiedB31G({ D: 610, t: 12.7, smys: 450, depth: 6.35, length: 200 });
    expect(d.failure).toBeLessThan(none.intact);
    expect(d.failure).toBeGreaterThan(none.intact * 0.6);
  });
  it('operations', () => {
    expect(sectionInventory(610, 12.7, 32, 9.6).vol).toBeCloseTo(8589, -1);
    expect(leakPosition(50000, 1000, 20, 30)).toBe(20000);
  });
  it('above-ground and offshore', () => {
    expect(thermalGrowth(100, 50)).toBeCloseTo(58.5, 1);
    expect(offsetLeg(610, 58.5, 324)).toBeCloseTo(8.27, 1);
    expect(supportSpan(610, 12.7, 850, 50).span).toBeGreaterThan(15);
    const f = hydroForces(0.8, 1);
    expect(f.drag).toBeCloseTo(287, 0);
    expect(requiredSubmergedWeight(f.drag, f.lift, 0.6)).toBeCloseTo(1.1 * (287 / 0.6 + 369), 0);
  });
});
