import React from 'react';

export default function VolumeTrendChart({ data, unit, title, color = '#3b82f6' }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
        <p className="text-xs text-gray-400">No data yet</p>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const max = Math.max(...values, 1);
  const barWidth = Math.max(20, Math.min(40, 600 / data.length));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Total: {values.reduce((a, b) => a + b, 0).toLocaleString()} {unit}
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
      <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <span>Avg: {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)} {unit}</span>
        <span>Peak: {max} {unit}</span>
        <span>Latest: {values[values.length - 1]} {unit}</span>
      </div>
    </div>
  );
}
