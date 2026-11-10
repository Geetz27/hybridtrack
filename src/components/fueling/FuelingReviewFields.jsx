import { ChevronDown, Droplets } from 'lucide-react';

export default function FuelingReviewFields({ value, onChange }) {
  const update = (field, nextValue) => onChange({ ...value, [field]: nextValue });
  const fieldClass = 'mt-0.5 min-h-11 w-full rounded-lg border border-[#0F766E] bg-white px-2.5 py-2 text-sm text-[#0F172A] placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]';
  const labelClass = 'block min-w-0 text-xs font-semibold leading-4 text-[#334155]';

  return (
    <details className="group rounded-xl border border-[#99F6E4] bg-[#F0FDFA]">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-bold text-[#115E59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0F766E] [&::-webkit-details-marker]:hidden">
        <Droplets className="h-4 w-4" aria-hidden="true" />
        Review fueling <span className="font-normal text-[#475569]">(opsional)</span>
        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="grid grid-cols-2 gap-x-2 gap-y-2 border-t border-[#99F6E4] p-2.5 sm:gap-x-3">
        <label className={labelClass}>
          Jenis gel
          <input value={value.gelType} onChange={event => update('gelType', event.target.value)} className={fieldClass} maxLength={100} placeholder="Contoh: EJ Sport" />
        </label>
        <label className={labelClass}>
          Jumlah gel
          <input value={value.gelAmount} onChange={event => update('gelAmount', event.target.value)} className={fieldClass} maxLength={60} placeholder="Contoh: 1 sachet" />
        </label>
        <label className={labelClass}>
          Jenis sports drink
          <input value={value.sportsDrinkType} onChange={event => update('sportsDrinkType', event.target.value)} className={fieldClass} maxLength={100} placeholder="Contoh: Pocari Sweat" />
        </label>
        <label className={labelClass}>
          Sports drink (ml)
          <input type="number" min="0" step="10" value={value.sportsDrinkMl} onChange={event => update('sportsDrinkMl', event.target.value)} className={fieldClass} inputMode="numeric" />
        </label>
        <label className={labelClass}>
          Air (ml)
          <input type="number" min="0" step="10" value={value.waterMl} onChange={event => update('waterMl', event.target.value)} className={fieldClass} inputMode="numeric" />
        </label>
        <label className={labelClass}>
          Respons perut
          <select value={value.stomachResponse} onChange={event => update('stomachResponse', event.target.value)} className={fieldClass}>
            <option value="">Belum diisi</option>
            <option value="OK">OK</option>
            <option value="Discomfort">Tidak nyaman</option>
          </select>
        </label>
        <label className={labelClass}>
          Energi selama lari (1-5)
          <select value={value.energy} onChange={event => update('energy', event.target.value)} className={fieldClass}>
            <option value="">Belum diisi</option>
            {[1, 2, 3, 4, 5].map(score => <option key={score} value={score}>{score}</option>)}
          </select>
        </label>
        <label className={`${labelClass} col-span-2`}>
          Catatan fueling
          <textarea rows="2" value={value.notes} onChange={event => update('notes', event.target.value)} className={fieldClass} maxLength={1000} placeholder="Checkpoint, rasa, atau respons tubuh" />
        </label>
      </div>
    </details>
  );
}
