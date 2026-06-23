import React from 'react';

export default function PaceTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Running Pace Trend</h3>
        <p className="text-xs text-gray-400">No running data yet</p>
      </div>
    );
  }

  const paces = data.map(d => d.pace);
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const range = maxPace - minPace || 1;

  // SVG dimensions
  const width = data.length * 30 + 20;
  const height = 120;
  const padding = { top: 10, bottom: 25, left: 5, right: 5 };
  const chartHeight = height - padding.top - padding.bottom;

  // Generate path for the line
  const points = data.map((d, i) => {
    const x = padding.left + i * 30 + 15;
    const y = padding.top + ((maxPace - d.pace) / range) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Area fill path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Determine trend direction
  const trend = data.length >= 2
    ? (data[data.length - 1].pace < data[0].pace ? 'improving' : 'declining')
    : 'neutral';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Running Pace Trend</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          trend === 'improving'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : trend === 'declining'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          {trend === 'improving' ? '↑ Faster' : trend === 'declining' ? '↓ Slower' : '—'}
        </span>
      </div>

      <div className="relative" style={{ height: `${height}px` }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1={padding.left} y1={padding.top + chartHeight / 2} x2={width - padding.right} y2={padding.top + chartHeight / 2} stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1={padding.left} y1={padding.top + chartHeight} x2={width - padding.right} y2={padding.top + chartHeight} stroke="#e5e7eb" strokeWidth="0.5" />

          {/* Area fill */}
          <path d={areaPath} fill="#3b82f6" opacity="0.1" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="white"
              stroke="#3b82f6"
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
      <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <span>Best: {data.reduce((a, b) => a.pace < b.pace ? a : b).paceFormatted}</span>
        <span>Latest: {data[data.length - 1].paceFormatted}</span>
        <span>{data.length} runs</span>
      </div>
    </div>
  );
}
