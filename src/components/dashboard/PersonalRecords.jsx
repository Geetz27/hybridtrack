import { Activity, Dumbbell, Trophy } from 'lucide-react';

export default function PersonalRecords({ gymPRs, runningPBs }) {
  const hasGymData = gymPRs && gymPRs.length > 0;
  const hasRunningData = runningPBs && (runningPBs.best5K || runningPBs.longest || runningPBs.bestPace);

  if (!hasGymData && !hasRunningData) {
    return (
      <div className="rounded-2xl border border-[#DCE3EA] bg-white p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0F172A]">
          <Trophy className="h-4 w-4 text-[#D97706]" /> Rekor pribadi
        </h3>
        <p className="text-xs text-[#64748B]">Catat latihan untuk mulai melihat rekor pribadimu.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#DCE3EA] bg-white p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0F172A]">
        <Trophy className="h-4 w-4 text-[#D97706]" /> Rekor pribadi
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gym PRs */}
        {hasGymData && (
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#7C3AED]">
              <Dumbbell className="h-3.5 w-3.5" /> Gym
            </h4>
            <div className="space-y-2">
              {gymPRs.map((pr, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-t border-[#E2E8F0] px-1 py-2.5 first:border-t-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#0F172A]">
                      {pr.exercise}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {pr.date || '—'}
                    </p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-sm font-bold text-[#7C3AED]">
                      {pr.weight}kg × {pr.reps}
                    </p>
                    <p className="text-xs text-[#64748B]">
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
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#0369A1]">
              <Activity className="h-3.5 w-3.5" /> Lari
            </h4>
            <div className="space-y-2">
              {runningPBs.best5K && (
                <div className="flex items-center justify-between border-t border-[#E2E8F0] px-1 py-2.5 first:border-t-0">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">5K terbaik</p>
                    <p className="text-xs text-[#64748B]">{runningPBs.best5K.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#0369A1]">
                      {runningPBs.best5K.paceFormatted}
                    </p>
                  </div>
                </div>
              )}

              {runningPBs.bestPace && (
                <div className="flex items-center justify-between border-t border-[#E2E8F0] px-1 py-2.5 first:border-t-0">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">Pace terbaik</p>
                    <p className="text-xs text-[#64748B]">
                      {runningPBs.bestPace.distance.toFixed(1)}km · {runningPBs.bestPace.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#0369A1]">
                      {runningPBs.bestPace.paceFormatted}
                    </p>
                  </div>
                </div>
              )}

              {runningPBs.longest && (
                <div className="flex items-center justify-between border-t border-[#E2E8F0] px-1 py-2.5 first:border-t-0">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">Lari terjauh</p>
                    <p className="text-xs text-[#64748B]">{runningPBs.longest.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#0369A1]">
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
