import { useState } from 'react';
import { selectStandardWall } from '@/lib/eng/design';
import { inductionBend, motherPipeWall } from '@/lib/eng/bends';
import { Controls, Frame, Slider, Stat, Stats, Verdict, View, fmt, unitOf, useUnits } from './kit';
import { usePipe } from './pipe';

export default function InductionBend() {
  const sys = useUnits();
  const pipe = usePipe(24, 12.7);
  const [n, setN] = useState(5);
  const [angle, setAngle] = useState(45);
  const b = inductionBend(n), Dm = pipe.D / 1000, R = n * Dm, a = (angle * Math.PI) / 180;
  const mother = motherPipeWall(pipe.t, n), std = selectStandardWall(mother);
  const pig = n >= 3 ? 'ok' : n >= 1.5 ? 'warn' : 'bad';

  // plan view: pipe drawn with a fixed width, radius scaled to that width
  const w = 38, Rp = n * w, ox = 70, oy = 218, tan = 46;
  const P = (r: number, th: number) => [ox + r * Math.sin(th), oy - Rp + r * Math.cos(th) - 0];
  const cxy = [ox, oy - Rp];
  const pt = (r: number, th: number) => `${(cxy[0] + r * Math.sin(th)).toFixed(1)} ${(cxy[1] + r * Math.cos(th)).toFixed(1)}`;
  void P;
  const band = (r: number, c: string, sw: number) => <path d={`M${pt(r, 0)}A${r} ${r} 0 0 0 ${pt(r, a)}`} fill="none" stroke={c} strokeWidth={sw} />;
  const scale = Math.min(1, 205 / (Rp * (1 - Math.cos(a)) + tan + w), 430 / (Rp * Math.sin(a) + 2 * tan + w));
  const tIn = 5 * (1 + b.thickening), tEx = 5 * (1 - b.thinning);
  const dir = [Math.cos(a), -Math.sin(a)];
  const endC = [cxy[0] + Rp * Math.sin(a), cxy[1] + Rp * Math.cos(a)];

  return (
    <Frame title="Hot induction bend designer" foot="Thin-wall estimates: extrados thinning 1/(2n+1), intrados thickening 1/(2n−1), intrados hoop stress factor (4n−1)/(4n−2), where n is the radius in pipe diameters. Wall changes are exaggerated in the sketch. Actual thinning is measured during bend qualification.">
      <Controls>
        {pipe.pickers}
        <Slider label="Bend radius (× D)" value={n} onChange={setN} min={1.5} max={10} step={0.5} dp={1} />
        <Slider label="Bend angle (degrees)" value={angle} onChange={setAngle} min={5} max={90} step={1} dp={0} />
      </Controls>
      <View>
        <svg viewBox="0 0 560 250" role="img" aria-label="Plan view of an induction bend showing thin extrados and thick intrados" style={{ width: '100%' }}>
          <g transform={`translate(${40 * (1 - scale)} ${oy * (1 - scale)}) scale(${scale})`}>
            <rect x={ox - tan} y={oy - w / 2} width={tan} height={w} fill="var(--steel)" opacity=".6" />
            <rect x={-tan} y={-w / 2} width={tan} height={w} fill="var(--steel)" opacity=".6" transform={`translate(${endC[0] + dir[0] * tan} ${endC[1] + dir[1] * tan}) rotate(${-angle})`} />
            {band(Rp, 'color-mix(in srgb, var(--steel) 35%, transparent)', w)}
            {band(Rp + w / 2 - tEx / 2, 'var(--bad)', tEx)}
            {band(Rp - w / 2 + tIn / 2, 'var(--brand)', tIn)}
            <line x1={cxy[0]} y1={cxy[1]} x2={ox} y2={oy} stroke="var(--muted)" strokeDasharray="3 4" />
            <line x1={cxy[0]} y1={cxy[1]} x2={endC[0]} y2={endC[1]} stroke="var(--muted)" strokeDasharray="3 4" />
            <circle cx={cxy[0]} cy={cxy[1]} r="3" fill="var(--muted)" />
          </g>
          <text x="548" y="20" textAnchor="end" className="svg-label" style={{ fill: 'var(--bad)' }}>extrados (outside): wall thins {(b.thinning * 100).toFixed(1)} %</text>
          <text x="548" y="38" textAnchor="end" className="svg-label" style={{ fill: 'var(--brand)' }}>intrados (inside): wall thickens {(b.thickening * 100).toFixed(1)} %</text>
          <text x="548" y="56" textAnchor="end" className="svg-label">R = {n} D = {fmt('m', sys, R, 2)} {unitOf('m', sys)}</text>
        </svg>
        <Stats>
          <Stat label="Extrados wall after bending" kind="wall" value={pipe.t * (1 - b.thinning)} tone="bad" />
          <Stat label="Intrados hoop stress factor" value={b.intrados} dp={3} />
          <Stat label="Mother pipe wall needed" kind="wall" value={mother} />
          <Stat label="Next standard wall" kind="wall" value={std ?? 0} tone="brand" text={std ? undefined : 'none'} />
          <Stat label="Arc length" kind="m" value={R * a} dp={2} />
        </Stats>
        {pig === 'ok' ? <Verdict tone="ok">{n >= 5 ? 'A 5 D or larger bend passes all standard cleaning and inspection pigs.' : 'A 3 D bend passes most modern inspection tools. Confirm with the ILI vendor.'} Order the mother pipe one wall heavier than the line pipe.</Verdict>
          : pig === 'warn' ? <Verdict tone="warn">Below 3 D most intelligent pigs cannot pass. Use only on non-piggable station piping.</Verdict>
          : <Verdict tone="bad">Too tight for an induction bend.</Verdict>}
      </View>
    </Frame>
  );
}
