export interface DailyBar {
  date: string;
  count: number;
}

export function MonthlyBarChart({
  data,
  height = 140,
  color = "#0066B3",
}: {
  data: DailyBar[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d) => {
          const h = (d.count / max) * height;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t"
                style={{ height: Math.max(4, h), background: color, opacity: 0.85 }}
                title={`${d.date}: ${d.count} câu`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-2">
        {data.map((d) => (
          <div key={d.date} className="flex-1 text-center text-[10px] text-slate-500">
            {d.date.slice(5)}
          </div>
        ))}
      </div>
    </div>
  );
}
