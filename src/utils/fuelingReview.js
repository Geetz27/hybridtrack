export const EMPTY_FUELING_REVIEW = Object.freeze({
  gelType: '',
  gelAmount: '',
  waterMl: '',
  sportsDrinkType: '',
  sportsDrinkMl: '',
  stomachResponse: '',
  energy: '',
  notes: '',
});

export function createFuelingReview(value = {}) {
  return {
    gelType: String(value.gelType || ''),
    gelAmount: String(value.gelAmount || ''),
    waterMl: value.waterMl === null || value.waterMl === undefined ? '' : String(value.waterMl),
    sportsDrinkType: String(value.sportsDrinkType || ''),
    sportsDrinkMl: value.sportsDrinkMl === null || value.sportsDrinkMl === undefined ? '' : String(value.sportsDrinkMl),
    stomachResponse: ['OK', 'Discomfort'].includes(value.stomachResponse) ? value.stomachResponse : '',
    energy: value.energy === null || value.energy === undefined ? '' : String(value.energy),
    notes: String(value.notes || ''),
  };
}
function optionalAmount(value) {
  if (value === '' || value === null || value === undefined) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : null;
}

export function sanitizeFuelingReview(value = {}) {
  const review = {
    gelType: String(value.gelType || '').trim(),
    gelAmount: String(value.gelAmount || '').trim(),
    waterMl: optionalAmount(value.waterMl),
    sportsDrinkType: String(value.sportsDrinkType || '').trim(),
    sportsDrinkMl: optionalAmount(value.sportsDrinkMl),
    stomachResponse: ['OK', 'Discomfort'].includes(value.stomachResponse) ? value.stomachResponse : '',
    energy: Number.isInteger(Number(value.energy)) && Number(value.energy) >= 1 && Number(value.energy) <= 5
      ? Number(value.energy)
      : null,
    notes: String(value.notes || '').trim(),
  };

  return Object.values(review).some(item => item !== '' && item !== null) ? review : null;
}
