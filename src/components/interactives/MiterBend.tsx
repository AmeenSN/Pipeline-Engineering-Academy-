import { useState, type ReactNode } from 'react';
import { miterRule } from '@/lib/eng/bends';
import { Controls, Frame, Segmented, Slider, Stat, Stats, Verdict, View } from './kit';

export default function MiterBend() {
  const [code, setCode] = useState<'B31.4' | 'B31.8'>('B31.8');
  const [hoop, setHoop] = useState(0.3);
  const [total, setTotal] = useState(30);
  const [cuts, setCuts] = useState(3);
  const per = total / cuts;
  const r = miterRule(code, hoop, per);
  const tone = r.verdict === 'allowed' ? 'ok' : r.verdict === 'limited' ? 'warn' : 'bad';
  const c = tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--yellow)' : 'var(--bad)';

  // segmented centreline: straight pieces joined at `cuts` miter joints
  const seg = Math.min(70, 300 / (cuts + 1)), w = 26;
  let x = 60, y = 215, th = 0;
  const pieces: ReactNode[] = [], joints: ReactNode[] = [];
  for (let i = 0; i <= cuts; i++) {
    const len = i === 0 || i === cuts ? seg * 1.3 : seg;
    const nx = x + len * Math.cos(th), ny = y - len * Math.sin(th);
    pieces.push(<line key={i} x1={x} y1={y} x2={nx} y2={ny} stroke="var(--steel)" strokeWidth={w} strokeLinecap="butt" />);
    x = nx; y = ny;
    if (i < cuts) {
      const b = th + (per * Math.PI) / 360 + Math.PI / 2;
      joints.push(<line key={i} x1={x - (w / 2 + 3) * Math.cos(b)} y1={y + (w / 2 + 3) * Math.sin(b)} x2={x + (w / 2 + 3) * Math.cos(b)} y2={y - (w / 2 + 3) * Math.sin(b)} stroke={c} strokeWidth="3" />);
      th += (per * Math.PI) / 180;
    }
  }

  return (
    <Frame title="Miter bend rule checker" foot="Limits paraphrased from ASME B31.4 and B31.8. Angle means the change of direction at one miter joint. Company standards are often stricter and may ban miters on pipelines altogether.">
      <Controls>
        <Segmented label="Design code" value={code} onChange={setCode} options={[{ value: 'B31.8', label: 'Gas · B31.8' }, { value: 'B31.4', label: 'Liquid · B31.4' }]} />
        <Slider label="Operating hoop stress ÷ SMYS" kind="pct" value={hoop} onChange={setHoop} min={0.02} max={0.8} step={0.01} dp={0} />
        <Slider label="Total change of direction (degrees)" value={total} onChange={setTotal} min={2} max={90} step={1} dp={0} />
        <Slider label="Number of miter joints" value={cuts} onChange={setCuts} min={1} max={8} step={1} dp={0} />
      </Controls>
      <View>
        <svg viewBox="0 0 560 250" role="img" aria-label={`Mitered bend with ${cuts} joints of ${per.toFixed(1)} degrees each`} style={{ width: '100%' }}>
          {pieces}{joints}
          <text x="548" y="22" textAnchor="end" className="svg-strong" style={{ fill: c }}>{per.toFixed(1)}° at each joint</text>
          <text x="548" y="40" textAnchor="end" className="svg-label">coloured lines are the miter welds</text>
        </svg>
        <Stats>
          <Stat label="Angle per joint" text={`${per.toFixed(1)}°`} tone={tone} />
          <Stat label="Limit at this stress" text={`${r.maxAngle}°`} />
          <Stat label="Hoop stress" kind="pct" value={hoop} dp={0} />
          <Stat label="Result" text={r.verdict === 'allowed' ? 'Permitted' : r.verdict === 'limited' ? 'Permitted with limits' : 'Not permitted'} tone={tone} />
        </Stats>
        <Verdict tone={tone}>{r.note}{r.verdict === 'prohibited' ? ' Use a cold field bend or an induction bend instead.' : ''}</Verdict>
      </View>
    </Frame>
  );
}
