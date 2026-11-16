import { useState } from 'react';
import { ceIIW, cePcm, type Chemistry } from '@/lib/eng/materials';
import { Controls, Frame, Meter, Select, Stat, Stats, Verdict, View } from './kit';

const PRESETS: Record<string, { label: string; c: Chemistry }> = {
  x65: { label: 'Modern X65 (TMCP plate)', c: { C: 0.06, Si: 0.25, Mn: 1.55, Cr: 0.05, Mo: 0.05, V: 0.03, Ni: 0.15, Cu: 0.1, B: 0 } },
  x70: { label: 'Modern X70 (TMCP plate)', c: { C: 0.06, Si: 0.25, Mn: 1.7, Cr: 0.1, Mo: 0.15, V: 0.04, Ni: 0.2, Cu: 0.15, B: 0 } },
  x52n: { label: 'X52 normalised', c: { C: 0.16, Si: 0.3, Mn: 1.3, Cr: 0.05, Mo: 0.02, V: 0.03, Ni: 0.05, Cu: 0.05, B: 0 } },
  old: { label: '1960s X52 (high carbon)', c: { C: 0.26, Si: 0.3, Mn: 1.2, Cr: 0.05, Mo: 0.02, V: 0, Ni: 0.05, Cu: 0.05, B: 0 } },
  sour: { label: 'Sour-service X60', c: { C: 0.04, Si: 0.25, Mn: 1.2, Cr: 0.2, Mo: 0.05, V: 0.03, Ni: 0.15, Cu: 0.1, B: 0 } },
};
const ELEMENTS: [keyof Chemistry, string, number, number][] = [
  ['C', 'Carbon', 0.3, 0.01], ['Mn', 'Manganese', 2, 0.05], ['Si', 'Silicon', 0.6, 0.05], ['Cr', 'Chromium', 0.5, 0.05],
  ['Mo', 'Molybdenum', 0.5, 0.01], ['V', 'Vanadium', 0.1, 0.01], ['Ni', 'Nickel', 0.5, 0.05], ['Cu', 'Copper', 0.5, 0.05],
];

export default function CarbonEquivalent() {
  const [preset, setPreset] = useState('x65');
  const [c, setC] = useState<Chemistry>(PRESETS.x65.c);
  const pick = (k: string) => { setPreset(k); setC(PRESETS[k].c); };
  const iiw = ceIIW(c), pcm = cePcm(c);
  const usePcm = c.C <= 0.12;
  const value = usePcm ? pcm : iiw, limit = usePcm ? 0.25 : 0.43;
  const ok = value <= limit;
  const terms: [string, number][] = usePcm
    ? [['C', c.C], ['Si/30', c.Si / 30], ['(Mn+Cu+Cr)/20', (c.Mn + c.Cu + c.Cr) / 20], ['Ni/60', c.Ni / 60], ['Mo/15', c.Mo / 15], ['V/10', c.V / 10]]
    : [['C', c.C], ['Mn/6', c.Mn / 6], ['(Cr+Mo+V)/5', (c.Cr + c.Mo + c.V) / 5], ['(Ni+Cu)/15', (c.Ni + c.Cu) / 15]];
  const colors = ['var(--text)', 'var(--brand)', 'var(--accent)', 'var(--yellow)', 'var(--ok)', 'var(--steel)'];
  const W = 560, scale = (W - 20) / Math.max(limit * 1.4, value * 1.05);
  let run = 10;

  return (
    <Frame title="Carbon equivalent and weldability" foot="API 5L PSL2 limits for welded pipe: CE(Pcm) 0.25 when carbon is 0.12 % or less, otherwise CE(IIW) 0.43. Preset chemistries are typical values for illustration.">
      <Controls>
        <Select label="Start from a typical chemistry" value={preset} onChange={pick} options={Object.entries(PRESETS).map(([k, v]) => ({ value: k, label: v.label }))} />
        {ELEMENTS.map(([k, name, max, step]) => (
          <label key={k} className="fld block">
            <span className="fld-label"><span>{name} ({k})</span><span className="fld-val">{c[k].toFixed(2)} %</span></span>
            <input type="range" min={0} max={max} step={step} value={c[k]} onChange={(e) => setC({ ...c, [k]: Number(e.target.value) })} />
          </label>
        ))}
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} 120`} role="img" aria-label="Contribution of each element to the carbon equivalent" style={{ width: '100%' }}>
          <text x="10" y="14" className="svg-label">what makes up the {usePcm ? 'Pcm' : 'IIW carbon equivalent'}</text>
          {terms.map(([name, v], i) => {
            const w = v * scale, x = run; run += w;
            return (
              <g key={name}>
                <rect x={x} y="26" width={Math.max(w, 0)} height="34" fill={colors[i]} opacity=".85" />
                {w > 34 && <text x={x + w / 2} y="80" textAnchor="middle" className="svg-label">{name}</text>}
              </g>
            );
          })}
          <line x1={10 + limit * scale} x2={10 + limit * scale} y1="18" y2="68" stroke="var(--bad)" strokeWidth="2" strokeDasharray="4 3" />
          <text x={10 + limit * scale} y="104" textAnchor="middle" className="svg-label" style={{ fill: 'var(--bad)' }}>limit {limit}</text>
        </svg>
        <Stats>
          <Stat label="CE (IIW)" value={iiw} dp={3} tone={!usePcm ? (ok ? 'ok' : 'bad') : undefined} />
          <Stat label="CE (Pcm)" value={pcm} dp={3} tone={usePcm ? (ok ? 'ok' : 'bad') : undefined} />
          <Stat label="Governing formula" text={usePcm ? 'Pcm' : 'IIW'} />
          <Stat label="Limit" value={limit} dp={2} />
        </Stats>
        <Meter label="Carbon equivalent ÷ limit" ratio={value / limit} />
        {ok ? <Verdict tone="ok">Readily weldable in the field. Low risk of hard, crack-prone heat-affected zones with normal procedures.</Verdict>
          : <Verdict tone="bad">Above the limit. Expect hard heat-affected zones: preheat, low-hydrogen consumables and slower cooling would be needed, and sour service is ruled out.</Verdict>}
      </View>
    </Frame>
  );
}
