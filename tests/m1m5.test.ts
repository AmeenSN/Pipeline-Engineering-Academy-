import { describe, expect, it } from 'vitest';
import { ceIIW, cePcm, deWaardRate, flangeRating, requiredClass, wallLoss } from '../src/lib/eng/materials';
import { coldBendMinRadius, degPerDiameter, elasticBendCheck, elasticBendStress, inductionBend, maxAnglePerJoint, minElasticRadius, miterRule, motherPipeWall } from '../src/lib/eng/bends';

describe('materials', () => {
  const chem = { C: 0.08, Si: 0.25, Mn: 1.5, Cr: 0.05, Mo: 0.02, V: 0.04, Ni: 0.1, Cu: 0.1, B: 0 };
  it('carbon equivalents', () => {
    expect(ceIIW(chem)).toBeCloseTo(0.08 + 0.25 + 0.022 + 0.01333, 3);
    expect(cePcm(chem)).toBeCloseTo(0.08 + 0.00833 + 0.0825 + 0.00167 + 0.00133 + 0.004, 3);
  });
  it('de Waard-Milliams at 60 °C and 2 bar CO2 is about 7.4 mm/yr', () => {
    expect(deWaardRate(60, 2)).toBeCloseTo(7.4, 0);
    expect(wallLoss(7.4, 0.1, 0.95, 25).loss).toBeCloseTo(11.6, 0);
  });
  it('flange ratings', () => {
    expect(flangeRating(600, 38)).toBe(102.1);
    expect(flangeRating(600, 75)).toBeCloseTo(96.7, 1);
    expect(requiredClass(96, 60)).toBe(600);
    expect(requiredClass(96, 100)).toBe(900);
    expect(requiredClass(500, 38)).toBeNull();
  });
});

describe('bends', () => {
  it('elastic bend stress and minimum radius', () => {
    expect(elasticBendStress(610, 320)).toBeCloseTo(197.3, 0);
    const i = { D: 610, t: 12.7, smys: 450, P: 9.6, dT: 45 };
    const R = minElasticRadius(i)!;
    expect(R).toBeGreaterThan(300);
    expect(R).toBeLessThan(340);
    expect(elasticBendCheck(i, R).ratio).toBeCloseTo(1, 3);
  });
  it('cold bend limits', () => {
    expect(coldBendMinRadius(12)).toBe(18);
    expect(coldBendMinRadius(24)).toBe(30);
    expect(degPerDiameter(30)).toBeCloseTo(1.91, 2);
    expect(maxAnglePerJoint({ jointLength: 12, tangent: 2, D: 610, degPerD: 1.5 }).angle).toBeCloseTo(19.7, 1);
  });
  it('induction bend thinning', () => {
    expect(inductionBend(5).thinning).toBeCloseTo(0.0909, 3);
    expect(inductionBend(3).thinning).toBeCloseTo(0.1429, 3);
    expect(inductionBend(5).intrados).toBeCloseTo(1.0556, 3);
    expect(motherPipeWall(12.7, 5)).toBeGreaterThan(12.7);
  });
  it('miter rules', () => {
    expect(miterRule('B31.8', 0.6, 10).verdict).toBe('prohibited');
    expect(miterRule('B31.8', 0.3, 10).verdict).toBe('limited');
    expect(miterRule('B31.4', 0.3, 10).verdict).toBe('prohibited');
    expect(miterRule('B31.4', 0.05, 30).verdict).toBe('allowed');
    expect(miterRule('B31.8', 0.6, 2).verdict).toBe('allowed');
  });
});
