import React from 'react';

export default function CompletionRate({ rate, completed, planned, message }) {
  const getColor = () => {
    if (rate === null) return 'bg-gray-300 dark:bg-gray-600';
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (rate === null) return 'text-gray-500 dark:text-gray-400';
    if (rate >= 80) return 'text-green-600 dark:text-green-400';
    if (rate >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Weekly Completion</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">This week</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Circular progress */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="6"
              className="dark:stroke-gray-600"
            />
            {rate !== null && (
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={`${(rate / 100) * 176} 176`}
                strokeLinecap="round"
                className={getTextColor()}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${getTextColor()}`}>
              {rate !== null ? `${rate}%` : '—'}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {message || 'No plan set'}
          </p>
          {planned > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getColor()}`}
                  style={{ width: `${rate || 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{completed} completed</span>
                <span>{planned} planned</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
