const BASE_PRE_RUN = Object.freeze({
  timing: 'Sekitar 05:00 untuk start 05:45-06:00',
  food: '1 pisang + 1 sdm madu',
  drink: '1 gelas air',
});

const BASE_POST_RUN = Object.freeze({
  food: 'Nasi + 2 telur. Tambah sumber protein bila perlu.',
  drink: 'Minum secukupnya untuk pemulihan.',
});

const DEFAULT_DURING_RUN = Object.freeze([
  'Simpan air di motor dan minum sesuai rasa haus.',
  'Gel hanya digunakan bila tercantum pada rencana tanggal tersebut.',
]);

export const BASE_ONE_FUELING = Object.freeze({
  '2026-11-21': {
    preview: '',
    during: [
      'Air saja, minum sesuai rasa haus.',
      'Gel tidak diperlukan.',
    ],
  },
  '2026-11-28': {
    preview: 'Fuel: EJ Sport @ menit 40-45 / KM 6',
    during: [
      'Tes pertama EJ Sport: 1 sachet penuh sekitar menit 40-45, kira-kira KM 6.',
      'Target 30 g karbohidrat, konfirmasi kembali pada kemasan.',
      'Minum dengan air. Jangan gabungkan dengan Pocari pada tes pertama.',
      'Hentikan bila perut terasa tidak nyaman.',
    ],
  },
  '2026-12-05': {
    preview: 'Fuel: Tes Pocari sesuai kemasan',
    during: [
      'Tes Pocari Sweat sachet 15 g, larutkan sesuai petunjuk kemasan.',
      'Minum bertahap sesuai kebutuhan. Tanpa EJ Sport pada tes ini.',
    ],
  },
  '2026-12-12': {
    preview: '',
    during: [
      'Minggu pemulihan. Air sesuai rasa haus.',
      'Gel tidak diperlukan.',
    ],
  },
  '2026-12-19': {
    preview: 'Fuel: EJ Sport @ menit 40-45',
    during: [
      'Ulangi EJ Sport sekitar menit 40-45 hanya bila tes pertama nyaman.',
      'Konsumsi dengan air dan hentikan bila perut tidak nyaman.',
    ],
  },
  '2026-12-26': {
    preview: 'Fuel: EJ + Pocari bila sudah toleran',
    during: [
      'Latih kombinasi EJ Sport + Pocari hanya bila keduanya sudah nyaman saat diuji terpisah.',
      'Siapkan akses air tambahan di motor dan minum sesuai rasa haus.',
    ],
  },
  '2027-01-02': {
    preview: 'Fuel: Ulangi strategi terbaik yang sudah diuji',
    during: [
      'Ulangi strategi fueling dan hidrasi yang paling nyaman dari tes sebelumnya.',
      'Minum sesuai rasa haus.',
    ],
  },
  '2027-01-09': {
    preview: '',
    during: [
      'Easy long run. Gunakan strategi yang sudah tervalidasi bila diperlukan.',
      'Minum sesuai rasa haus.',
    ],
  },
});

export function getFuelingPlan(dateKey, sessionType) {
  if (!['Run', 'Lari'].includes(sessionType)) return null;
  const scheduled = BASE_ONE_FUELING[dateKey];
  return {
    preRun: BASE_PRE_RUN,
    duringRun: scheduled?.during || DEFAULT_DURING_RUN,
    postRun: BASE_POST_RUN,
    preview: scheduled?.preview || '',
    isScheduledTest: Boolean(scheduled),
  };
}
