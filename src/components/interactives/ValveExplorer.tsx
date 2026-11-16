import { useState } from 'react';
import { Defs, Segmented } from './kit';

const VALVES = {
  ball: { label: 'Ball', title: 'Trunnion-mounted ball valve', pig: 'Yes, when full bore', turn: 'Quarter turn', use: 'Mainline block valves, station isolation, emergency shutdown.', note: 'Fast to operate and tight shut-off. Must stay fully open or fully closed: throttling erodes the seats.' },
  gate: { label: 'Gate', title: 'Through-conduit slab gate valve', pig: 'Yes', turn: 'Multi-turn (rising stem)', use: 'Mainline block valves on liquid lines, scraper trap isolation.', note: 'A flat slab with a full-bore hole slides across the flow. Slow to operate but simple and robust.' },
  check: { label: 'Check', title: 'Swing check valve', pig: 'Only full-opening piggable designs', turn: 'Automatic', use: 'Pump and compressor discharge, river crossings, preventing backflow.', note: 'Opens with forward flow and closes by itself when flow reverses. Fast closure can cause pressure surge.' },
  globe: { label: 'Globe', title: 'Globe (control) valve', pig: 'No', turn: 'Multi-turn or actuator stroke', use: 'Flow and pressure control at stations, bypass and pressurising lines.', note: 'The flow turns through the seat, giving fine control at the cost of pressure drop. Never on the piggable mainline.' },
} as const;
type V = keyof typeof VALVES;

export default function ValveExplorer() {
  const [v, setV] = useState<V>('ball');
  const [open, setOpen] = useState(1);
  const d = VALVES[v];
  const flowing = open > 0.05;
  const body = { fill: 'var(--steel)', stroke: 'var(--text)', strokeWidth: 1.5 };

  return (
    <section className="ix not-prose" aria-label="Pipeline valve types">
      <div className="ix-head"><div className="ix-title">Pipeline valve types</div><span className="ix-tag">Interactive</span></div>
      <div style={{ padding: '1.1rem', display: 'grid', gap: '1rem' }}>
        <Segmented value={v} onChange={setV} options={Object.entries(VALVES).map(([k, x]) => ({ value: k as V, label: x.label }))} />
        <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4 items-center">
          <svg viewBox="-200 -130 400 240" role="img" aria-label={`${d.title}, ${Math.round(open * 100)} percent open`} style={{ width: '100%', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--line)' }}>
            <Defs />
            <rect x="-200" y="-28" width="400" height="56" fill="var(--surface)" stroke="var(--text)" />
            {v === 'ball' && <g>
              <circle r="62" {...body} opacity=".5" />
              <g transform={`rotate(${(1 - open) * 90})`} style={{ transition: 'transform .15s' }}>
                <circle r="50" fill="var(--steel)" stroke="var(--text)" strokeWidth="1.5" />
                <rect x="-51" y="-27" width="102" height="54" fill="var(--surface)" />
                <line x1="-50" x2="50" y1="-27" y2="-27" stroke="var(--text)" /><line x1="-50" x2="50" y1="27" y2="27" stroke="var(--text)" />
              </g>
              <rect x="-7" y="-110" width="14" height="50" {...body} />
            </g>}
            {v === 'gate' && <g>
              <rect x="-34" y="-120" width="68" height="225" rx="6" {...body} opacity=".45" />
              <g transform={`translate(0 ${(1 - open) * 62})`} style={{ transition: 'transform .15s' }}>
                <rect x="-12" y="-96" width="24" height="130" rx="3" fill="var(--steel)" stroke="var(--text)" strokeWidth="1.5" />
                <rect x="-13" y="-28" width="26" height="56" fill="var(--surface)" stroke="var(--text)" />
                <rect x="-4" y="-150" width="8" height="56" {...body} />
              </g>
            </g>}
            {v === 'check' && <g>
              <path d="M-70 -28Q0 -110 70 -28" {...body} opacity=".45" />
              <line x1="-22" y1="-28" x2="-22" y2="28" stroke="var(--text)" strokeWidth="3" opacity=".35" />
              <g transform={`translate(-18 -34) rotate(${-open * 68})`} style={{ transition: 'transform .15s' }}>
                <rect x="-4" y="0" width="8" height="64" rx="3" fill="var(--accent)" stroke="var(--text)" />
              </g>
              <circle cx="-18" cy="-34" r="5" fill="var(--text)" />
            </g>}
            {v === 'globe' && <g>
              <ellipse rx="78" ry="62" {...body} opacity=".45" />
              <path d="M-80 28 L-30 28 L-30 6 L30 6 L30 -28 L80 -28" fill="none" stroke="var(--text)" strokeWidth="3" />
              <g transform={`translate(0 ${-open * 30})`} style={{ transition: 'transform .15s' }}>
                <rect x="-26" y="-6" width="52" height="12" rx="3" fill="var(--accent)" stroke="var(--text)" />
                <rect x="-4" y="-118" width="8" height="114" {...body} />
              </g>
            </g>}
            {flowing && [-150, 120].map((xx) => <line key={xx} x1={xx} x2={xx + 34} y1="0" y2="0" stroke="var(--brand)" strokeWidth={1 + open * 3} markerEnd="url(#arr-brand)" />)}
            {!flowing && <text x="-150" y="5" className="svg-strong" style={{ fill: 'var(--bad)' }}>closed</text>}
          </svg>
          <div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 650 }}>{d.title}</h4>
            <p style={{ color: 'var(--muted)', fontSize: '.93rem', marginTop: '.4rem' }}>{d.note}</p>
            <label className="fld block" style={{ marginTop: '.9rem' }}>
              <span className="fld-label"><span>{v === 'check' ? 'Forward flow' : 'Valve position'}</span><span className="fld-val">{Math.round(open * 100)} % {v === 'check' ? '' : 'open'}</span></span>
              <input type="range" min={0} max={1} step={0.01} value={open} onChange={(e) => setOpen(Number(e.target.value))} />
            </label>
            <dl style={{ display: 'grid', gap: '.4rem', marginTop: '.8rem', fontSize: '.88rem' }}>
              {[['Piggable', d.pig], ['Operation', d.turn], ['Used for', d.use]].map(([k, val]) => (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '5.5rem 1fr', gap: '.6rem' }}>
                  <dt className="num" style={{ color: 'var(--muted)', fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.06em', paddingTop: '.15rem' }}>{k}</dt><dd>{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      <div className="ix-foot">Schematic cross-sections. Pipeline valves are specified to API 6D; drag the slider to operate the valve.</div>
    </section>
  );
}
