import { useState } from 'react';
import { VALVE_SPACING, sectionInventory } from '@/lib/eng/ops';
import { Controls, Frame, Segmented, Slider, Stat, Stats, Verdict, View } from './kit';
import { usePipe } from './pipe';

export default function ValveSpacing() {
  const pipe = usePipe(36, 15.9);
  const [cls, setCls] = useState('1');
  const [fluid, setFluid] = useState<'gas' | 'liquid'>('gas');
  const [P, setP] = useState(9.6);
  const [sp, setSp] = useState(30);
  const max = VALVE_SPACING[Number(cls)];
  const inv = sectionInventory(pipe.D, pipe.t, sp, P);
  const ok = fluid === 'liquid' || sp <= max;
  const total = 120, n = Math.floor(total / sp) + 1, W = 560, sx = (W - 40) / total;

  return (
    <Frame title="Sectionalizing valve spacing" foot="ASME B31.8 maximum spacing for gas transmission: 32, 24, 16 and 8 km (20, 15, 10 and 5 miles) for Class 1 to 4. ASME B31.4 sets no fixed spacing for most liquid lines: valves are placed by risk, terrain and at major water crossings. Gas volume at standard conditions with a compressibility of about 0.9.">
      <Controls>
        <Segmented label="Fluid" value={fluid} onChange={setFluid} options={[{ value: 'gas', label: 'Gas · B31.8' }, { value: 'liquid', label: 'Liquid · B31.4' }]} />
        {fluid === 'gas' && <Segmented label="Location class" value={cls} onChange={setCls} options={['1', '2', '3', '4'].map((c) => ({ value: c, label: `Class ${c}` }))} />}
        {pipe.pickers}
        <Slider label="Operating pressure" kind="pressure" value={P} onChange={setP} min={1} max={15} step={0.1} />
        <Slider label="Valve spacing (km)" value={sp} onChange={setSp} min={2} max={60} step={1} dp={0} />
      </Controls>
      <View>
        <svg viewBox={`0 0 ${W} 120`} role="img" aria-label={`Valves every ${sp} kilometres along 120 kilometres of pipeline`} style={{ width: '100%' }}>
          <rect x={20} y="56" width={W - 40} height="10" fill="var(--steel)" />
          <rect x={20 + sp * sx * Math.min(1, Math.max(n - 2, 0))} y="54" width={Math.min(sp * sx, W - 40)} height="14" fill="var(--bad)" opacity=".45" />
          {Array.from({ length: n }, (_, i) => {
            const x = 20 + i * sp * sx;
            return <g key={i} transform={`translate(${x} 61)`}><path d="M-8 -8L8 8V-8L-8 8Z" fill={ok ? 'var(--ok)' : 'var(--bad)'} stroke="var(--text)" /><line y1="-8" y2="-22" stroke="var(--text)" strokeWidth="2" /><line x1="-7" x2="7" y1="-22" y2="-22" stroke="var(--text)" strokeWidth="2" /></g>;
          })}
          <text x="20" y="100" className="svg-label">120 km of pipeline · {n} valve stations · shaded: the volume lost if that section fails</text>
          <text x="20" y="22" className="svg-strong">{fluid === 'gas' ? `Class ${cls}: maximum ${max} km between valves` : 'Liquid line: spacing by engineering assessment'}</text>
        </svg>
        <Stats>
          {fluid === 'gas' && <Stat label="Code maximum spacing" text={`${max} km`} />}
          <Stat label="Pipe volume per section" text={`${inv.vol.toLocaleString('en-US', { maximumFractionDigits: 0 })} m³`} />
          {fluid === 'gas'
            ? <Stat label="Gas in one section" text={`${(inv.gasStd / 1e6).toFixed(2)} million Sm³`} tone="brand" />
            : <Stat label="Liquid in one section" text={`${(inv.vol * 6.29).toLocaleString('en-US', { maximumFractionDigits: 0 })} bbl`} tone="brand" />}
          <Stat label="Farthest point from a valve" text={`${(sp / 2).toFixed(1)} km`} />
        </Stats>
        {!ok ? <Verdict tone="bad">Spacing exceeds the {max} km limit for Class {cls}. Add valve stations.</Verdict>
          : fluid === 'liquid' ? <Verdict tone="warn">For liquids, what drains out depends on the terrain between valves, not just the spacing. Place valves either side of major rivers and populated or sensitive areas, with check valves on uphill sections.</Verdict>
          : <Verdict tone="ok">Within the code limit. The shaded section shows the gas that would be released if a rupture were isolated by the nearest valve on each side.</Verdict>}
      </View>
    </Frame>
  );
}
