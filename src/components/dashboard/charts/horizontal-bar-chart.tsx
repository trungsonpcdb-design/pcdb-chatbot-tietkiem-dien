export interface HBarRow {
  label: string;
  value: number;
  color?: string;
}

export function HorizontalBarChart({
  rows,
  color = "#0066B3",
}: {
  rows: HBarRow[];
  color?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-1.5">
      {rows.map((r) => {
        const pct = (r.value / max) * 100;
        return (
          <div key={r.label}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-slate-700 truncate">{r.label}</span>
              <span className="text-slate-500 ml-2 shrink-0">{r.value}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{ width: `${pct}%`, background: r.color ?? color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
