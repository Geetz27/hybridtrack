export default function VolumeTrendChart({ data, unit, title, color = '#3b82f6' }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-[#DCE3EA] bg-white p-4">
        <h3 className="mb-2 text-sm font-bold text-[#0F172A]">{title}</h3>
        <p className="text-xs text-[#64748B]">Belum ada data.</p>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const max = Math.max(...values, 1);
  const barWidth = Math.max(20, Math.min(40, 600 / data.length));

  return (
    <div className="rounded-2xl border border-[#DCE3EA] bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#0F172A]">{title}</h3>
        <span className="text-xs text-[#64748B]">
          Total {values.reduce((a, b) => a + b, 0).toLocaleString('id-ID')} {unit}
        </span>
      </div>

      {/* SVG Bar Chart */}
      <div className="relative" style={{ height: '120px' }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${data.length * (barWidth + 8) + 20} 120`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          <line x1="0" y1="20" x2={data.length * (barWidth + 8) + 20} y2="20" stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1="0" y1="70" x2={data.length * (barWidth + 8) + 20} y2="70" stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1="0" y1="115" x2={data.length * (barWidth + 8) + 20} y2="115" stroke="#e5e7eb" strokeWidth="0.5" />

          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = (d.value / max) * 90;
            const x = 10 + i * (barWidth + 8);
            const y = 115 - barHeight;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="3"
                  fill={color}
                  opacity="0.8"
                  className="hover:opacity-100 transition-opacity"
                >
                  <title>{d.label}: {d.value} {unit}</title>
                </rect>
                {/* Label */}
                <text
                  x={x + barWidth / 2}
                  y="118"
                  textAnchor="middle"
                  fontSize="8"
                  fill="#9ca3af"
                >
                  {d.label.length > 5 ? d.label.slice(0, 5) : d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Summary stats */}
      <div className="mt-2 flex justify-between border-t border-[#E2E8F0] pt-2 text-xs text-[#64748B]">
        <span>Rata-rata: {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)} {unit}</span>
        <span>Tertinggi: {max} {unit}</span>
        <span>Terbaru: {values[values.length - 1]} {unit}</span>
      </div>
    </div>
  );
}
