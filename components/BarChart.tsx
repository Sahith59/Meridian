import type { ChartPoint } from "@/lib/chart";
import type { CSSProperties } from "react";

export default function BarChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const peak = data.reduce((winner, d) => (d.value > winner.value ? d : winner), data[0]);
  const points = data
    .map((d, index) => {
      const x = data.length === 1 ? 50 : 8 + (index / (data.length - 1)) * 84;
      const y = 86 - (d.value / max) * 58;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  if (data.length === 0) {
    return <p className="hint">No orders yet to chart.</p>;
  }

  return (
    <div className="chart-panel">
      <div className="chart-summary">
        <div>
          <span>Volume</span>
          <strong>{total}</strong>
        </div>
        <div>
          <span>Peak week</span>
          <strong>{peak?.label ?? "None"}</strong>
        </div>
        <div>
          <span>Signal</span>
          <strong>{data.length > 2 ? "Stable" : "Sparse"}</strong>
        </div>
      </div>

      <div className="bar-chart">
        <div className="chart-grid-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <svg className="trend-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={points} />
        </svg>

        {data.map((d, index) => {
          const height = Math.max(14, (d.value / max) * 100);
          return (
            <div className="bar-chart-col" key={d.label} style={{ "--bar-index": index } as CSSProperties}>
              <div className="bar-chart-value">{d.value}</div>
              <div className="bar-chart-track">
                <div className="bar-chart-bar" style={{ height: `${height}%` }}>
                  <span />
                </div>
              </div>
              <div className="bar-chart-label">{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
