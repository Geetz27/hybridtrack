import { Droplets } from 'lucide-react';
import { getFuelingPlan } from '../../data/fuelingPlan';

function PlanGroup({ title, children }) {
  return (
    <div className="border-t border-[#99F6E4] pt-3 first:border-t-0 first:pt-0 md:border-l md:border-t-0 md:pl-4 md:pt-0 md:first:border-l-0 md:first:pl-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#0F766E]">{title}</p>
      {children}
    </div>
  );
}

export default function FuelingPlanSection({ dateKey, sessionType }) {
  const plan = getFuelingPlan(dateKey, sessionType);
  if (!plan) return null;

  return (
    <section className="mt-4 rounded-xl border border-[#99F6E4] bg-[#F0FDFA] p-3" aria-label="Fueling dan hidrasi">
      <div className="flex items-center gap-2 text-[#115E59]">
        <Droplets className="h-4 w-4" aria-hidden="true" />
        <h4 className="text-[13px] font-black uppercase tracking-wide">Fueling & hidrasi</h4>
        {plan.isScheduledTest && (
          <span className="ml-auto rounded-md border border-[#5EEAD4] bg-white px-2 py-1 text-[11px] font-bold text-[#0F766E]">
            Sesi uji
          </span>
        )}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3 md:gap-4">
        <PlanGroup title="Pre-run">
          <ul className="mt-1 space-y-1 text-sm leading-6 text-[#334155]">
            <li><strong>Waktu:</strong> {plan.preRun.timing}</li>
            <li><strong>Makan:</strong> {plan.preRun.food}</li>
            <li><strong>Minum:</strong> {plan.preRun.drink}</li>
          </ul>
        </PlanGroup>
        <PlanGroup title="During run">
          <ul className="mt-1 space-y-1 text-sm leading-6 text-[#334155]">
            {plan.duringRun.map(item => <li key={item}>{item}</li>)}
          </ul>
        </PlanGroup>
        <PlanGroup title="Post-run">
          <ul className="mt-1 space-y-1 text-sm leading-6 text-[#334155]">
            <li><strong>Makan:</strong> {plan.postRun.food}</li>
            <li><strong>Minum:</strong> {plan.postRun.drink}</li>
          </ul>
        </PlanGroup>
      </div>
      <p className="mt-3 border-t border-[#99F6E4] pt-2 text-xs leading-5 text-[#475569]">
        Ini rencana uji, bukan kewajiban menghabiskan gel atau minuman. Keputusan hidrasi tidak hanya mengikuti estimasi sweat loss Garmin.
      </p>
    </section>
  );
}
