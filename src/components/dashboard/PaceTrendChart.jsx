export default function PaceTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-[#DCE3EA] bg-white p-4">
        <h3 className="mb-2 text-sm font-bold text-[#0F172A]">Tren pace lari</h3>
        <p className="text-xs text-[#64748B]">Belum ada data lari.</p>
      </div>
    );
  }

  // Filter out entries without valid pace data to prevent null access crashes
  const validData = data.filter(d => d && d.pace != null && d.pace > 0);
  if (validData.length === 0) {
    return (
      <div className="rounded-2xl border border-[#DCE3EA] bg-white p-4">
        <h3 className="mb-2 text-sm font-bold text-[#0F172A]">Tren pace lari</h3>
        <p className="text-xs text-[#64748B]">Belum ada data pace yang valid.</p>
      </div>
    );
  }

  const paces = validData.map(d => d.pace);
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const range = maxPace - minPace || 1;

  // SVG dimensions
  const width = validData.length * 30 + 20;
  const height = 120;
  const padding = { top: 10, bottom: 25, left: 5, right: 5 };
  const chartHeight = height - padding.top - padding.bottom;

  // Generate path for the line
  const points = validData.map((d, i) => {
    const x = padding.left + i * 30 + 15;
    const y = padding.top + ((maxPace - d.pace) / range) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Area fill path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Determine trend direction
  const trend = validData.length >= 2
    ? (validData[validData.length - 1].pace < validData[0].pace ? 'improving' : 'declining')
    : 'neutral';

  return (
    <div className="rounded-2xl border border-[#DCE3EA] bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#0F172A]">Tren pace lari</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          trend === 'improving'
            ? 'bg-[#ECFDF5] text-[#047857]'
            : trend === 'declining'
            ? 'bg-[#FEF2F2] text-[#B91C1C]'
            : 'bg-[#F1F5F9] text-[#64748B]'
        }`}>
          {trend === 'improving' ? '↑ Lebih cepat' : trend === 'declining' ? '↓ Lebih lambat' : '—'}
        </span>
      </div>

      <div className="relative" style={{ height: `${height}px` }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1={padding.left} y1={padding.top + chartHeight / 2} x2={width - padding.right} y2={padding.top + chartHeight / 2} stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1={padding.left} y1={padding.top + chartHeight} x2={width - padding.right} y2={padding.top + chartHeight} stroke="#e5e7eb" strokeWidth="0.5" />

          {/* Area fill */}
          <path d={areaPath} fill="#0EA5E9" opacity="0.1" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="white"
              stroke="#0284C7"
              strokeWidth="2"
              className="hover:r-5 transition-all"
            >
              <title>{p.date}: {p.paceFormatted} /km ({p.distance}km)</title>
            </circle>
          ))}

          {/* X-axis labels (every 5th) */}
          {points.filter((_, i) => i % 5 === 0 || i === points.length - 1).map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={height - 5}
              textAnchor="middle"
              fontSize="8"
              fill="#9ca3af"
            >
              {p.date.slice(5)}
            </text>
          ))}
        </svg>
      </div>

      {/* Stats */}
      <div className="mt-2 flex justify-between border-t border-[#E2E8F0] pt-2 text-xs text-[#64748B]">
        <span>Terbaik: {validData.reduce((a, b) => a.pace < b.pace ? a : b).paceFormatted}</span>
        <span>Terbaru: {validData[validData.length - 1].paceFormatted}</span>
        <span>{validData.length} lari</span>
      </div>
    </div>
  );
}
