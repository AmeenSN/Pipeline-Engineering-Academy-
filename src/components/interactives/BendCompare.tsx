import { useState } from 'react';
import { coldBendMinRadius } from '@/lib/eng/bends';
import { Controls, Frame, Select, Slider, View, fmt, unitOf, useUnits } from './kit';
import { npsOptions, odOf } from './pipe';

export default function BendCompare() {
  const sys = useUnits();
  const [nps, setNps] = useState('24');
  const [angle, setAngle] = useState(30);
  const D = odOf(nps) / 1000, rad = (angle * Math.PI) / 180;
  const types = [
    { id: 'Elastic bend', n: 600, c: 'var(--ok)', made: 'In the trench: the pipe simply follows a gentle curve', px: 250 },
    { id: 'Cold field bend', n: Math.max(40, coldBendMinRadius(Number(nps))), c: 'var(--brand)', made: 'On the right of way with a bending machine', px: 120 },
    { id: 'Hot induction bend', n: 5, c: 'var(--accent)', made: 'In a factory, delivered as a fitting', px: 42 },
  ];
  const arc = (R: number) => {
    const x0 = 30, y0 = 235;
    const ex = x0 + 60 + R * Math.sin(rad), ey = y0 - R * (1 - Math.cos(rad));
    return `M${x0} ${y0}H${x0 + 60}A${R} ${R} 0 0 0 ${ex.toFixed(1)} ${ey.toFixed(1)}l${(60 * Math.cos(rad)).toFixed(1)} ${(-60 * Math.sin(rad)).toFixed(1)}`;
  };
  return (
    <Frame title="Three ways to turn a pipeline" foot="Typical radii: elastic about 600 D (depends on stress, see below), cold bend 40 D (1.5° per diameter), induction bend 5 D. The sketch is not to scale: the real difference is far larger.">
      <Controls>
        <Select label="Pipe size" value={nps} onChange={setNps} options={npsOptions} />
        <Slider label="Change of direction" value={angle} onChange={setAngle} min={2} max={90} step={1} dp={0} />
      </Controls>
      <View>
        <svg viewBox="0 0 560 260" role="img" aria-label="Plan view of the same turn made with three bend types" style={{ width: '100%' }}>
          {types.map((t) => <path key={t.id} d={arc(t.px)} fill="none" stroke={t.c} strokeWidth="6" strokeLinecap="round" opacity=".9" />)}
          <text x="30" y="254" className="svg-label">plan view · same {angle}° turn</text>
        </svg>
        <div className="grid sm:grid-cols-3 gap-3">
          {types.map((t) => {
            const R = t.n * D, L = R * rad;
            return (
              <div key={t.id} className="stat" style={{ borderTop: `3px solid ${t.c}` }}>
                <div style={{ fontWeight: 650, fontFamily: 'var(--font-display)' }}>{t.id}</div>
                <div className="stat-label" style={{ marginTop: '.5rem' }}>Radius ({t.n} D)</div>
                <div className="stat-value">{fmt('m', sys, R, R > 100 ? 0 : 1)}<span className="stat-unit">{unitOf('m', sys)}</span></div>
                <div className="stat-label" style={{ marginTop: '.4rem' }}>Length of curve</div>
                <div className="stat-value">{fmt('m', sys, L, L > 100 ? 0 : 1)}<span className="stat-unit">{unitOf('m', sys)}</span></div>
                <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '.5rem' }}>{t.made}</div>
              </div>
            );
          })}
        </div>
      </View>
    </Frame>
  );
}
