import { useState } from 'react';
import { GRADES, PIPE_SIZES, STANDARD_WALLS } from '@/lib/eng/data';
import { fmt, unitOf, useUnits } from '@/lib/units';
import { Select } from './kit';

export const npsOptions = PIPE_SIZES.map((p) => ({ value: String(p.nps), label: `NPS ${p.nps}  (${p.od} mm)` }));
export const gradeOptions = GRADES.map((g) => ({ value: g.id, label: `API 5L ${g.id}  ·  SMYS ${g.smys} MPa` }));
export const odOf = (nps: string) => PIPE_SIZES.find((p) => String(p.nps) === nps)!.od;
export const gradeOf = (id: string) => GRADES.find((g) => g.id === id)!;

/** Pipe size + standard wall pickers, with state. */
export function usePipe(nps0: number, wall0: number) {
  const [nps, setNps] = useState(String(nps0));
  const [wi, setWi] = useState(Math.max(STANDARD_WALLS.indexOf(wall0), 0));
  const D = odOf(nps), t = STANDARD_WALLS[wi];
  // The wall slider steps through standard walls by index.
  const wallSlider = (
    <label className="fld block">
      <span className="fld-label"><span>Wall thickness</span><WallValue t={t} /></span>
      <input type="range" min={0} max={STANDARD_WALLS.length - 1} step={1} value={wi} onChange={(e) => setWi(Number(e.target.value))} />
    </label>
  );
  return {
    D, t,
    pickers: (
      <>
        <Select label="Pipe size" value={nps} onChange={setNps} options={npsOptions} />
        {wallSlider}
      </>
    ),
  };
}

function WallValue({ t }: { t: number }) {
  const sys = useUnits();
  return <span className="fld-val">{fmt('wall', sys, t)}</span>;
}

/** Linear scale helper for SVG charts. */
export const lin = (d0: number, d1: number, r0: number, r1: number) => (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
export const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
