export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  data,
  size = 180,
  thickness = 28,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = size / 2 - thickness / 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = data.map((d) => {
    const frac = total > 0 ? d.value / total : 0;
    const dash = frac * c;
    const arc = { color: d.color, dash, offset };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={a.color}
            strokeWidth={thickness}
            strokeDasharray={`${a.dash} ${c - a.dash}`}
            strokeDashoffset={-a.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="fill-slate-900 font-bold" style={{ fontSize: "20px" }}>
          {total}
        </text>
      </svg>
      <div className="text-sm space-y-1">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: d.color }} />
            <span className="text-slate-700">{d.label}</span>
            <span className="text-slate-500 ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
