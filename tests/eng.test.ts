import { describe, expect, it } from 'vitest';
import { wallThickness, hoopStress, longRestrained, vonMises, section, anchor, steelMass } from '../src/lib/eng/design';
import { upheaval, requiredDownload } from '../src/lib/eng/upheaval';
import { buoyancy, wheelPressure, ovalisation } from '../src/lib/eng/loads';
import { freeSpan } from '../src/lib/eng/span';
import { SN_CURVES, cyclesToFailure, collapse } from '../src/lib/eng/fatigue';
import { tempDerating } from '../src/lib/eng/data';

describe('wall thickness', () => {
  it('matches a hand calculation: 24in X65, 10 MPa, F=0.72', () => {
    const r = wallThickness({ P: 10, D: 610, smys: 450, F: 0.72, E: 1, T: 1, ca: 0 });
    expect(r.tPressure).toBeCloseTo(9.414, 2);
    expect(r.tSelected).toBe(9.5);
    expect(r.utilisation).toBeLessThanOrEqual(1);
  });
  it('adds corrosion allowance before selecting a wall', () => {
    const r = wallThickness({ P: 10, D: 610, smys: 450, F: 0.72, E: 1, T: 1, ca: 3 });
    expect(r.tRequired).toBeCloseTo(12.414, 2);
    expect(r.tSelected).toBe(12.7);
  });
  it('derates above 121°C', () => {
    expect(tempDerating(100)).toBe(1);
    expect(tempDerating(149)).toBeCloseTo(0.967, 3);
  });
});

describe('stresses', () => {
  it('hoop and restrained longitudinal', () => {
    const sh = hoopStress(10, 610, 12.7);
    expect(sh).toBeCloseTo(240.16, 1);
    const sl = longRestrained(sh, 50);
    expect(sl).toBeCloseTo(0.3 * 240.16 - 207000 * 11.7e-6 * 50, 1); // ≈ −49 MPa
    expect(vonMises(sh, sl)).toBeCloseTo(Math.sqrt(sh * sh - sh * sl + sl * sl), 6);
  });
  it('section properties', () => {
    const s = section(610, 12.7);
    expect(s.As).toBeCloseTo(23831, -1);
    expect(steelMass(610, 12.7)).toBeCloseTo(187.1, 0);
  });
  it('anchor force is thermal + pressure parts', () => {
    const a = anchor({ P: 10, D: 610, t: 12.7, dT: 50, cover: 1, gammaSoil: 18, mu: 0.5, contentRho: 0 });
    expect(a.thermalPart / 1000).toBeCloseTo(2886, -1);
    expect(a.force).toBeCloseTo(a.thermalPart + a.pressurePart, 6);
    expect(a.anchorLength).toBeGreaterThan(50);
  });
});

describe('upheaval buckling', () => {
  it('needs no download without compressive force', () => {
    expect(requiredDownload(0, 1e8, 1000, 0.3)).toBe(0);
  });
  it('more cover raises the safety factor; hotter line lowers it', () => {
    const base = { D: 323.9, t: 9.5, P: 10, dT: 80, delta: 0.4, cover: 0.3, gammaSoil: 17, f: 0.4, contentRho: 800 };
    const a = upheaval(base), b = upheaval({ ...base, cover: 1.5 }), c = upheaval({ ...base, dT: 90 });
    expect(b.sf).toBeGreaterThan(a.sf);
    expect(c.sf).toBeLessThan(a.sf);
    const atReq = upheaval({ ...base, cover: a.requiredCover });
    if (a.requiredCover > 0) expect(atReq.sf).toBeCloseTo(1, 3);
  });
});

describe('external loads', () => {
  it('empty 24in pipe floats in water without concrete', () => {
    const b = buoyancy({ D: 610, t: 9.5, coatT: 3, coatRho: 950, concT: 0, concRho: 3040, fluidRho: 1000, contentRho: 0 });
    expect(b.sf).toBeLessThan(1);
    expect(buoyancy({ D: 610, t: 9.5, coatT: 3, coatRho: 950, concT: 80, concRho: 3040, fluidRho: 1000, contentRho: 0 }).sf).toBeGreaterThan(1.1);
  });
  it('wheel pressure decays with depth squared', () => {
    expect(wheelPressure(70, 2, 1) * 4).toBeCloseTo(wheelPressure(70, 1, 1), 6);
  });
  it('ovalisation is small for a stiff pipe', () => {
    expect(ovalisation({ D: 610, t: 12.7, pressure: 50, Eprime: 7 }).ratio).toBeLessThan(0.03);
  });
});

describe('spans and fatigue', () => {
  it('frequency falls with span length squared', () => {
    const i = { D: 610, t: 12.7, ends: 'pinned' as const, contentRho: 800, fluidRho: 1025, U: 0.5 };
    expect(freeSpan({ ...i, L: 20 }).fn / freeSpan({ ...i, L: 40 }).fn).toBeCloseTo(4, 3);
  });
  it('D curve: 100 MPa range gives ~1.46e6 cycles', () => {
    expect(cyclesToFailure(SN_CURVES[1], 100)).toBeCloseTo(10 ** 6.164, -3);
  });
  it('collapse pressure lies below both elastic and plastic limits', () => {
    const c = collapse(610, 12.7, 450);
    expect(c.pc).toBeLessThan(Math.min(c.pel, c.pp));
    expect(c.pc).toBeGreaterThan(0);
  });
});
