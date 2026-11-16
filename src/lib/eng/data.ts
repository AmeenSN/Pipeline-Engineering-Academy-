// Reference data. Values are widely published nominal figures; always confirm
// against the current edition of the governing specification.

export interface Grade { id: string; smys: number; smts: number } // MPa
export const GRADES: Grade[] = [
  { id: 'B', smys: 245, smts: 415 },
  { id: 'X42', smys: 290, smts: 415 },
  { id: 'X46', smys: 320, smts: 435 },
  { id: 'X52', smys: 360, smts: 460 },
  { id: 'X56', smys: 390, smts: 490 },
  { id: 'X60', smys: 415, smts: 520 },
  { id: 'X65', smys: 450, smts: 535 },
  { id: 'X70', smys: 485, smts: 570 },
  { id: 'X80', smys: 555, smts: 625 },
];

export interface PipeSize { nps: number; od: number } // od in mm
export const PIPE_SIZES: PipeSize[] = [
  { nps: 4, od: 114.3 }, { nps: 6, od: 168.3 }, { nps: 8, od: 219.1 },
  { nps: 10, od: 273.1 }, { nps: 12, od: 323.9 }, { nps: 14, od: 355.6 },
  { nps: 16, od: 406.4 }, { nps: 18, od: 457 }, { nps: 20, od: 508 },
  { nps: 24, od: 610 }, { nps: 30, od: 762 }, { nps: 36, od: 914 },
  { nps: 40, od: 1016 }, { nps: 42, od: 1067 }, { nps: 48, od: 1219 },
  { nps: 56, od: 1422 },
];

// Common line-pipe wall thicknesses (mm) per ASME B36.10M / API 5L tables.
export const STANDARD_WALLS = [
  4.8, 5.6, 6.4, 7.1, 7.9, 8.7, 9.5, 10.3, 11.1, 11.9, 12.7, 14.3, 15.9,
  17.5, 19.1, 20.6, 22.2, 23.8, 25.4, 27.0, 28.6, 30.2, 31.8, 34.9, 38.1,
];

export interface DesignFactorOption { id: string; label: string; F: number; note: string }
export const GAS_CLASSES: DesignFactorOption[] = [
  { id: '1', label: 'Class 1', F: 0.72, note: 'Sparsely populated: desert, farmland, wasteland' },
  { id: '2', label: 'Class 2', F: 0.6, note: 'Fringe areas around towns, industrial areas' },
  { id: '3', label: 'Class 3', F: 0.5, note: 'Suburban housing, shopping areas' },
  { id: '4', label: 'Class 4', F: 0.4, note: 'Multi-storey buildings, dense traffic' },
];
export const LIQUID_FACTOR = 0.72;

// ASME B31.8 temperature derating factor T for steel pipe (°C breakpoints).
const T_TABLE: [number, number][] = [[121, 1.0], [149, 0.967], [177, 0.933], [204, 0.9], [232, 0.867]];
export function tempDerating(tC: number): number {
  if (tC <= T_TABLE[0][0]) return 1;
  for (let i = 1; i < T_TABLE.length; i++) {
    const [t1, f1] = T_TABLE[i - 1], [t2, f2] = T_TABLE[i];
    if (tC <= t2) return f1 + ((tC - t1) / (t2 - t1)) * (f2 - f1);
  }
  return T_TABLE[T_TABLE.length - 1][1];
}

export const STEEL = { E: 207000, nu: 0.3, alpha: 11.7e-6, rho: 7850 }; // MPa, -, 1/°C, kg/m3
export const G = 9.81;

// Nominal inch values of the standard walls above (ASME B36.10M), in the same order.
export const STANDARD_WALLS_IN = [
  0.188, 0.219, 0.25, 0.281, 0.312, 0.344, 0.375, 0.406, 0.438, 0.469, 0.5, 0.562, 0.625,
  0.688, 0.75, 0.812, 0.875, 0.938, 1.0, 1.062, 1.125, 1.188, 1.25, 1.375, 1.5,
];
/** Wall thickness in inches: the nominal value for a standard wall, otherwise a straight conversion. */
export function wallInches(mm: number): number {
  const i = STANDARD_WALLS.findIndex((w) => Math.abs(w - mm) < 0.011);
  return i >= 0 ? STANDARD_WALLS_IN[i] : mm / 25.4;
}
