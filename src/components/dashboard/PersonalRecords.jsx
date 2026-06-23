import React from 'react';

export default function PersonalRecords({ gymPRs, runningPBs }) {
  const hasGymData = gymPRs && gymPRs.length > 0;
  const hasRunningData = runningPBs && (runningPBs.best5K || runningPBs.longest || runningPBs.bestPace);

  if (!hasGymData && !hasRunningData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Personal Records</h3>
        <p className="text-xs text-gray-400">Log some workouts to see your PRs here!</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🏆 Personal Records</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gym PRs */}
        {hasGymData && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              🏋️ Gym
            </h4>
            <div className="space-y-2">
              {gymPRs.map((pr, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {pr.exercise}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {pr.date || '—'}
                    </p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {pr.weight}kg × {pr.reps}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {pr.volume} kg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Running PBs */}
        {hasRunningData && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              🏃 Running
            </h4>
            <div className="space-y-2">
              {runningPBs.best5K && (
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">5K Best</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{runningPBs.best5K.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                      {runningPBs.best5K.paceFormatted}
                    </p>
                  </div>
                </div>
              )}

              {runningPBs.bestPace && (
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Best Pace</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {runningPBs.bestPace.distance.toFixed(1)}km · {runningPBs.bestPace.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {runningPBs.bestPace.paceFormatted}
                    </p>
                  </div>
                </div>
              )}

              {runningPBs.longest && (
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Longest Run</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{runningPBs.longest.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {runningPBs.longest.distance.toFixed(1)} km
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
