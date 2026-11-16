import { useSyncExternalStore } from 'react';

export type UnitSystem = 'si' | 'us';
export type Kind =
  | 'pressure' | 'stress' | 'kpa' | 'mm' | 'm' | 'dT' | 'temp' | 'force' | 'lineload'
  | 'density' | 'gamma' | 'velocity' | 'hz' | 'none' | 'years' | 'pct';

interface Def { si: [string, number, number]; us: [string, number, number]; offset?: number }
// [unit label, multiplier from base, default decimals]. Base units: MPa, mm, m, °C, N, N/m, kPa, kg/m³, kN/m³, m/s.
const DEFS: Record<Kind, Def> = {
  pressure: { si: ['bar', 10, 0], us: ['psi', 145.038, 0] },
  stress: { si: ['MPa', 1, 0], us: ['ksi', 0.145038, 1] },
  kpa: { si: ['kPa', 1, 1], us: ['psi', 0.145038, 2] },
  mm: { si: ['mm', 1, 1], us: ['in', 1 / 25.4, 3] },
  m: { si: ['m', 1, 2], us: ['ft', 3.28084, 1] },
  dT: { si: ['°C', 1, 0], us: ['°F', 1.8, 0] },
  temp: { si: ['°C', 1, 0], us: ['°F', 1.8, 0], offset: 32 },
  force: { si: ['kN', 1e-3, 0], us: ['kip', 1 / 4448.22, 0] },
  lineload: { si: ['kN/m', 1e-3, 2], us: ['lbf/ft', 0.0685218, 0] },
  density: { si: ['kg/m³', 1, 0], us: ['lb/ft³', 0.062428, 1] },
  gamma: { si: ['kN/m³', 1, 1], us: ['lbf/ft³', 6.3659, 0] },
  velocity: { si: ['m/s', 1, 2], us: ['ft/s', 3.28084, 2] },
  hz: { si: ['Hz', 1, 2], us: ['Hz', 1, 2] },
  years: { si: ['yr', 1, 0], us: ['yr', 1, 0] },
  pct: { si: ['%', 100, 1], us: ['%', 100, 1] },
  none: { si: ['', 1, 2], us: ['', 1, 2] },
};

export function unitOf(kind: Kind, sys: UnitSystem) { return DEFS[kind][sys][0]; }
export function toDisplay(kind: Kind, sys: UnitSystem, v: number) {
  const d = DEFS[kind];
  return v * d[sys][1] + (sys === 'us' ? d.offset ?? 0 : 0);
}
export function fmt(kind: Kind, sys: UnitSystem, v: number, dp?: number) {
  if (!Number.isFinite(v)) return '∞';
  const x = toDisplay(kind, sys, v);
  const n = dp ?? DEFS[kind][sys][2];
  return x.toLocaleString('en-US', { minimumFractionDigits: n, maximumFractionDigits: n });
}

const KEY = 'pea:units';
const listeners = new Set<() => void>();
export function getUnits(): UnitSystem {
  if (typeof localStorage === 'undefined') return 'si';
  return localStorage.getItem(KEY) === 'us' ? 'us' : 'si';
}
export function setUnits(s: UnitSystem) {
  localStorage.setItem(KEY, s);
  window.dispatchEvent(new CustomEvent('pea:units'));
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('pea:units', cb);
  window.addEventListener('storage', cb);
  return () => { listeners.delete(cb); window.removeEventListener('pea:units', cb); window.removeEventListener('storage', cb); };
}
export function useUnits(): UnitSystem {
  return useSyncExternalStore(subscribe, getUnits, () => 'si');
}
