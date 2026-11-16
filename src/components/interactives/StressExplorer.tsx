import { useState } from 'react';
import { hoopStress, longRestrained, longUnrestrained, vonMises } from '@/lib/eng/design';
import { Controls, Defs, Frame, Meter, Segmented, Select, Slider, Stat, Stats, Verdict, View } from './kit';
import { clamp, gradeOf, gradeOptions, lin, usePipe } from './pipe';

export default function StressExplorer() {
  const pipe = usePipe(24, 12.7);
  const [P, setP] = useState(9.6);
  const [dT, setDT] = useState(45);
  const [grade, setGrade] = useState('X65');
  const [mode, setMode] = useState<'restrained' | 'unrestrained'>('restrained');
  const Y = gradeOf(grade).smys;

  const sh = hoopStress(P, pipe.D, pipe.t);
  const sl = mode === 'restrained' ? longRestrained(sh, dT) : longUnrestrained(sh);
  const seq = vonMises(sh, sl);
  const limit = 0.9 * Y;

  // Yield-envelope plot (σL horizontal, σh vertical).
  const W = 300, H = 300, lim = Y * 1.3;
  const x = lin(-lim, lim, 20, W - 20), y = lin(-lim, lim, H - 20, 20);
  const ellipse = (k: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 72; i++) {
      const th = (i / 72) * 2 * Math.PI;
      const a = Math.SQRT2 * k * Math.cos(th), b = Math.sqrt(2 / 3) * k * Math.sin(th);
      pts.push(`${x((a - b) / Math.SQRT2).toFixed(1)},${y((a + b) / Math.SQRT2).toFixed(1)}`);
    }
    return `M${pts.join('L')}Z`;
  };
  const px = clamp(x(sl), 8, W - 8), py = clamp(y(sh), 8, H - 8);

  // Stress element arrows.
  const len = (s: number) => clamp((Math.abs(s) / Y) * 62, 6, 70);
  const arrow = (dir: 'h' | 'v', s: number) => {
    const c = s >= 0 ? 'brand' : 'bad', L = len(s), g = 46;
    const ends = [1, -1].map((sg) => {
      const a = sg * g, b = sg * (g + L);
      const [from, to] = s >= 0 ? [a, b] : [b + sg * 4, a + sg * 4];
      return dir === 'h'
        ? <line key={sg} x1={from} y1={0} x2={to} y2={0} stroke={`var(--${c})`} strokeWidth="3" markerEnd={`url(#arr-${c})`} />
        : <line key={sg} x1={0} y1={-from} x2={0} y2={-to} stroke={`var(--${c})`} strokeWidth="3" markerEnd={`url(#arr-${c})`} />;
    });
    return <g>{ends}</g>;
  };
  const ok = seq <= limit;

  return (
    <Frame title="Stress state explorer" foot="Blue arrows are tension, red arrows are compression. Bending and external-load stresses are not included.">
      <Controls>
        <Segmented label="Pipe condition" value={mode} onChange={setMode} options={[{ value: 'restrained', label: 'Buried (restrained)' }, { value: 'unrestrained', label: 'Free to move' }]} />
        {pipe.pickers}
        <Select label="Material grade" value={grade} onChange={setGrade} options={gradeOptions} />
        <Slider label="Internal pressure" kind="pressure" value={P} onChange={setP} min={0} max={25} step={0.1} />
        <Slider label="Temperature rise ΔT (operating − tie-in)" kind="dT" value={dT} onChange={setDT} min={-30} max={110} step={1} />
      </Controls>
      <View>
        <div className="grid sm:grid-cols-2 gap-3">
          <figure>
            <svg viewBox="-135 -135 270 270" role="img" aria-label="Stress element showing hoop and longitudinal stress directions" style={{ width: '100%', maxHeight: 280 }}>
              <Defs />
              <rect x="-40" y="-40" width="80" height="80" rx="4" fill="url(#hatch)" stroke="var(--text)" strokeWidth="1.5" />
              {arrow('v', sh)}
              {arrow('h', sl)}
              <text x="0" y="-122" textAnchor="middle" className="svg-strong">σh hoop</text>
              <text x="128" y="-10" textAnchor="end" className="svg-strong">σL axial</text>
              <text x="0" y="130" textAnchor="middle" className="svg-label">element of pipe wall · pipe axis →</text>
            </svg>
          </figure>
          <figure>
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Von Mises yield envelope with the current stress point" style={{ width: '100%', maxHeight: 280 }}>
              <path d={ellipse(Y)} fill="none" stroke="var(--muted)" strokeDasharray="4 4" />
              <path d={ellipse(limit)} fill="color-mix(in srgb, var(--ok) 10%, transparent)" stroke="var(--ok)" strokeWidth="1.5" />
              <line x1={x(-lim)} x2={x(lim)} y1={y(0)} y2={y(0)} stroke="var(--line)" />
              <line y1={y(-lim)} y2={y(lim)} x1={x(0)} x2={x(0)} stroke="var(--line)" />
              <line x1={x(0)} y1={y(0)} x2={px} y2={py} stroke={ok ? 'var(--brand)' : 'var(--bad)'} strokeWidth="1.5" />
              <circle cx={px} cy={py} r="6" fill={ok ? 'var(--brand)' : 'var(--bad)'} stroke="var(--surface)" strokeWidth="2" />
              <text x={W - 22} y={y(0) - 6} textAnchor="end" className="svg-label">σL (tension →)</text>
              <text x={x(0) + 6} y={30} className="svg-label">σh</text>
              <text x={x(0) - 6} y={y(Y) - 6} textAnchor="end" className="svg-label">SMYS</text>
              <text x={x(-limit * 0.5)} y={y(-limit * 0.45)} textAnchor="middle" className="svg-label" style={{ fill: 'var(--ok)' }}>0.9 SMYS limit</text>
            </svg>
          </figure>
        </div>
        <Stats>
          <Stat label="Hoop stress σh" kind="stress" value={sh} />
          <Stat label="Longitudinal stress σL" kind="stress" value={sl} tone={sl < 0 ? 'bad' : 'brand'} />
          <Stat label="Von Mises equivalent" kind="stress" value={seq} tone={ok ? 'ok' : 'bad'} />
          <Stat label="Hoop ÷ SMYS" kind="pct" value={sh / Y} dp={0} />
        </Stats>
        <Meter label="Equivalent stress ÷ 0.9 SMYS" ratio={seq / limit} />
        {ok
          ? <Verdict tone="ok">Inside the 0.9 SMYS envelope. {sl < 0 && mode === 'restrained' ? 'Note the axial stress is compressive: heating a restrained line pushes the point left, toward the envelope.' : ''}</Verdict>
          : <Verdict tone="bad">Outside the 0.9 SMYS envelope. Reduce ΔT (hotter tie-in), add wall thickness or use a higher grade.</Verdict>}
      </View>
    </Frame>
  );
}
