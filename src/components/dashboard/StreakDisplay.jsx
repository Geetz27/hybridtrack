import React from 'react';

export default function StreakDisplay({ current, longest }) {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label="fire">
            {current >= 7 ? '🔥' : current >= 3 ? '💪' : '📅'}
          </span>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {current}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {current === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Current streak</p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-baseline gap-1 justify-end">
            <span className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              {longest}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">days</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Best streak</p>
        </div>
      </div>

      {/* Mini progress bar toward next milestone */}
      {current > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Next milestone</span>
            <span>{current >= 30 ? '🏆 Max!' : current >= 14 ? '30 days' : current >= 7 ? '14 days' : '7 days'}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-orange-500 dark:bg-orange-400 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${current >= 30 ? 100 : current >= 14 ? ((current - 14) / 16) * 100 : current >= 7 ? ((current - 7) / 7) * 100 : (current / 7) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
