// Materials helpers: weldability indices, CO2 corrosion rate, flange ratings.

export interface Chemistry { C: number; Si: number; Mn: number; Cr: number; Mo: number; V: number; Ni: number; Cu: number; B: number }

/** Carbon equivalent, IIW formula (used by API 5L when C > 0.12 %). */
export const ceIIW = (c: Chemistry) => c.C + c.Mn / 6 + (c.Cr + c.Mo + c.V) / 5 + (c.Ni + c.Cu) / 15;

/** Carbon equivalent, Ito-Bessyo Pcm (used by API 5L when C ≤ 0.12 %). */
export const cePcm = (c: Chemistry) => c.C + c.Si / 30 + (c.Mn + c.Cu + c.Cr) / 20 + c.Ni / 60 + c.Mo / 15 + c.V / 10 + 5 * c.B;

/** de Waard-Milliams CO2 corrosion rate of bare carbon steel (mm/yr). tC in °C, pCO2 in bar. */
export function deWaardRate(tC: number, pCO2: number): number {
  if (pCO2 <= 0) return 0;
  return 10 ** (5.8 - 1710 / (tC + 273.15) + 0.67 * Math.log10(pCO2));
}

/** Wall loss over the design life with an inhibitor that works for a fraction of the time. */
export function wallLoss(rate: number, inhibitedRate: number, availability: number, years: number) {
  const effective = availability * Math.min(inhibitedRate, rate) + (1 - availability) * rate;
  return { effective, loss: effective * years };
}

/** NACE MR0175 / ISO 15156 sour-service threshold: H2S partial pressure of 0.3 kPa (0.05 psi). */
export const SOUR_LIMIT_KPA = 0.3;

// ASME B16.5 pressure-temperature ratings, material group 1.1 (e.g. A105, A350 LF2). bar gauge.
export const FLANGE_TEMPS = [38, 50, 100, 150, 200, 250, 300];
export const FLANGE_RATINGS: Record<number, number[]> = {
  150: [19.6, 19.2, 17.7, 15.8, 13.8, 12.1, 10.2],
  300: [51.1, 50.1, 46.6, 45.1, 43.8, 41.9, 39.8],
  600: [102.1, 100.2, 93.2, 90.2, 87.6, 83.9, 79.6],
  900: [153.2, 150.4, 139.8, 135.2, 131.4, 125.8, 119.5],
  1500: [255.3, 250.6, 233.0, 225.4, 219.0, 209.7, 199.1],
  2500: [425.5, 417.7, 388.3, 375.6, 365.0, 349.5, 331.8],
};
export const FLANGE_CLASSES = [150, 300, 600, 900, 1500, 2500];

/** Rated pressure (bar) of a class at a temperature (°C), linearly interpolated. */
export function flangeRating(cls: number, tC: number): number {
  const r = FLANGE_RATINGS[cls], T = FLANGE_TEMPS;
  if (tC <= T[0]) return r[0];
  for (let i = 1; i < T.length; i++) {
    if (tC <= T[i]) return r[i - 1] + ((tC - T[i - 1]) / (T[i] - T[i - 1])) * (r[i] - r[i - 1]);
  }
  return r[r.length - 1];
}

/** Lowest class whose rating meets the design pressure (bar) at temperature; null if none. */
export const requiredClass = (pBar: number, tC: number) => FLANGE_CLASSES.find((c) => flangeRating(c, tC) >= pBar) ?? null;
