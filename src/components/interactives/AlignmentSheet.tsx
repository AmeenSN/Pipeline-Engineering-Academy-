import { useState } from 'react';
import { lin } from './pipe';

// A simplified 3 km alignment sheet. Segments are [fromKP, toKP, value].
type Seg = [number, number, string];
const BANDS: { id: string; label: string; help: string; segs: Seg[] }[] = [
  { id: 'class', label: 'Location class', help: 'Sets the design factor. A change of class usually means a change of wall thickness.', segs: [[0, 1.3, 'Class 1'], [1.3, 2.2, 'Class 2'], [2.2, 3, 'Class 1']] },
  { id: 'pipe', label: 'Pipe', help: 'Diameter, wall thickness and grade. Heavier wall is used at crossings and in higher location classes.', segs: [[0, 0.82, '24" × 9.5 X65'], [0.82, 0.98, '24" × 12.7 X65'], [0.98, 1.3, '24" × 9.5 X65'], [1.3, 2.2, '24" × 12.7 X65'], [2.2, 3, '24" × 9.5 X65']] },
  { id: 'coat', label: 'Coating', help: 'External coating system. Concrete weight coating is added where buoyancy or mechanical protection requires it.', segs: [[0, 1.7, '3LPE'], [1.7, 1.95, '3LPE + concrete'], [1.95, 3, '3LPE']] },
  { id: 'cover', label: 'Min. cover', help: 'Minimum depth of cover required over the pipe in each stretch.', segs: [[0, 0.82, '1.0 m'], [0.82, 0.98, '1.5 m'], [0.98, 1.7, '1.0 m'], [1.7, 1.95, '2.0 m below scour'], [1.95, 3, '1.0 m']] },
  { id: 'xing', label: 'Crossings', help: 'Every road, track, pipeline, cable and watercourse crossed, each with its own detail drawing number.', segs: [[0.82, 0.98, 'Asphalt road (bored)'], [1.7, 1.95, 'Wadi (open cut)'], [2.55, 2.62, 'Existing 16" pipeline']] },
  { id: 'bend', label: 'Bends', help: 'Location, type and angle of each bend: elastic, cold field or hot induction.', segs: [[0.45, 0.5, 'CB 12° L'], [1.62, 1.7, 'CB 8° sag'], [1.95, 2.03, 'CB 8° over'], [2.4, 2.44, 'IB 45° R']] },
];
const ground = (k: number) => 40 + 6 * Math.sin(k * 2.1) + (k > 1.68 && k < 1.97 ? -14 * Math.sin(((k - 1.68) / 0.29) * Math.PI) : 0) + k * 3;
const coverAt = (k: number) => (k > 0.8 && k < 1.0 ? 1.5 : k > 1.68 && k < 1.97 ? 3 : 1);

export default function AlignmentSheet() {
  const [kp, setKp] = useState(0.9);
  const [band, setBand] = useState('pipe');
  const W = 620, x = lin(0, 3, 96, W - 10);
  const pts = Array.from({ length: 121 }, (_, i) => i * 0.025);
  const gy = (k: number) => 250 - ground(k) * 1.6, py = (k: number) => gy(k) + coverAt(k) * 9 + 4;
  const at = (segs: Seg[]) => segs.find(([a, b]) => kp >= a && kp <= b)?.[2] ?? '—';
  const info = BANDS.find((b) => b.id === band)!;
  const planY = (k: number) => 62 + (k < 0.47 ? 0 : k < 2.42 ? -(k - 0.47) * 9 : -(2.42 - 0.47) * 9 + (k - 2.42) * 26);

  return (
    <section className="ix not-prose" aria-label="Interactive alignment sheet">
      <div className="ix-head"><div className="ix-title">Read an alignment sheet</div><span className="ix-tag">Interactive</span></div>
      <div style={{ padding: '1.1rem', display: 'grid', gap: '.9rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${W} 430`} role="img" aria-label="Alignment sheet with plan, profile and data bands" style={{ width: '100%', minWidth: 560, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10 }}>
            {/* plan */}
            <text x="8" y="20" className="svg-strong">PLAN</text>
            <rect x={x(0.82)} y="10" width={x(0.98) - x(0.82)} height="100" fill="var(--text)" opacity=".18" />
            <path d={`M${x(1.7)} 10 Q${x(1.9)} 60 ${x(1.78)} 110 L${x(1.98)} 110 Q${x(2.08)} 60 ${x(1.92)} 10Z`} fill="var(--brand)" opacity=".15" />
            <line x1={x(2.5)} y1="10" x2={x(2.66)} y2="110" stroke="var(--muted)" strokeDasharray="6 3" strokeWidth="2" />
            {[[1.5, 30], [1.62, 22], [1.45, 96], [2.0, 92], [2.12, 30], [1.36, 24]].map(([k, yy], i) => <rect key={i} x={x(k)} y={yy} width="7" height="7" fill="var(--yellow)" />)}
            <path d={'M' + pts.map((k) => `${x(k).toFixed(1)},${planY(k).toFixed(1)}`).join('L')} fill="none" stroke="var(--accent)" strokeWidth="3" />
            <text x={x(0.83)} y="106" className="svg-label">road</text><text x={x(1.8)} y="106" className="svg-label">wadi</text><text x={x(1.36)} y="46" className="svg-label">buildings</text>
            {/* profile */}
            <line x1="0" x2={W} y1="118" y2="118" stroke="var(--line)" />
            <text x="8" y="136" className="svg-strong">PROFILE</text>
            <path d={'M' + pts.map((k) => `${x(k).toFixed(1)},${gy(k).toFixed(1)}`).join('L') + `L${x(3)},262L${x(0)},262Z`} fill="var(--yellow)" opacity=".1" />
            <path d={'M' + pts.map((k) => `${x(k).toFixed(1)},${gy(k).toFixed(1)}`).join('L')} fill="none" stroke="var(--text)" strokeWidth="1.5" />
            <path d={'M' + pts.map((k) => `${x(k).toFixed(1)},${py(k).toFixed(1)}`).join('L')} fill="none" stroke="var(--accent)" strokeWidth="3" />
            <text x={x(2.98)} y={gy(3) - 6} textAnchor="end" className="svg-label">ground</text><text x={x(2.98)} y={py(3) + 14} textAnchor="end" className="svg-label" style={{ fill: 'var(--accent)' }}>top of pipe</text>
            {/* bands */}
            {BANDS.map((b, i) => {
              const y = 268 + i * 24, on = b.id === band;
              return (
                <g key={b.id} onClick={() => setBand(b.id)} style={{ cursor: 'pointer' }}>
                  <rect x="0" y={y} width={W} height="24" fill={on ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent'} stroke="var(--line)" />
                  <text x="8" y={y + 16} className={on ? 'svg-strong' : 'svg-label'}>{b.label}</text>
                  {b.segs.map(([a, c, v], n) => (
                    <g key={n}>
                      <rect x={x(a)} y={y + 3} width={Math.max(x(c) - x(a), 3)} height="18" rx="2" fill={`var(--${['brand', 'ok', 'yellow', 'steel'][n % 4]})`} opacity=".3" />
                      {x(c) - x(a) > v.length * 5.6 && <text x={(x(a) + x(c)) / 2} y={y + 16} textAnchor="middle" className="svg-label" style={{ fill: 'var(--text)', fontSize: 10 }}>{v}</text>}
                    </g>
                  ))}
                </g>
              );
            })}
            {[0, 0.5, 1, 1.5, 2, 2.5, 3].map((k) => <text key={k} x={x(k)} y="426" textAnchor="middle" className="svg-label">KP {k.toFixed(1)}</text>)}
            <line x1={x(kp)} x2={x(kp)} y1="6" y2="414" stroke="var(--bad)" strokeWidth="1.5" />
            <rect x={x(kp) - 26} y="0" width="52" height="14" rx="3" fill="var(--bad)" /><text x={x(kp)} y="11" textAnchor="middle" style={{ fontSize: 10, fill: '#fff', fontFamily: 'var(--font-mono)' }}>KP {kp.toFixed(2)}</text>
          </svg>
        </div>
        <label className="fld block">
          <span className="fld-label"><span>Move along the pipeline</span><span className="fld-val">KP {kp.toFixed(2)}</span></span>
          <input type="range" min={0} max={3} step={0.01} value={kp} onChange={(e) => setKp(Number(e.target.value))} />
        </label>
        <div className="stats">
          {BANDS.map((b) => <div key={b.id} className="stat"><div className="stat-label">{b.label}</div><div style={{ fontWeight: 600, fontSize: '.88rem' }}>{at(b.segs)}</div></div>)}
          <div className="stat"><div className="stat-label">Actual cover</div><div style={{ fontWeight: 600, fontSize: '.88rem' }}>{coverAt(kp).toFixed(1)} m</div></div>
        </div>
        <div className="verdict ok" style={{ fontWeight: 500 }}><span><strong>{info.label} band.</strong> {info.help} Click any band on the sheet to learn what it records.</span></div>
      </div>
      <div className="ix-foot">A simplified, fictional sheet. Real alignment sheets carry many more bands (land ownership, soil type, cathodic protection, hydrotest sections, as-built weld numbers) and a title block with revision history.</div>
    </section>
  );
}
