export const EVENTS = {
  preWedding: {
    id: 'preWedding', slug: 'wedding-festivities', eyebrow: 'An evening of tradition', title: 'Wedding Festivities',
    date: 'Saturday, 10 October 2026', time: '11:00 AM', venue: 'Faiz-e-Qutbi Hall (Madanpura)',
    address: 'Mumbai', note: 'Mehendi · Katho · Mama Masalo', icon: '✦', theme: 'ivory'
  },
  reception: {
    id: 'reception', slug: 'wedding-reception', eyebrow: 'The main celebration', title: 'Wedding Reception',
    date: 'Sunday, 11 October 2026', time: '7:00 PM', venue: 'Taiyebi Hall (Sattar)',
    address: '133, Kazi Syed Street, Masjid Bandar West, Mumbai', note: 'Mustafa weds Arwa', icon: '☾', theme: 'rose'
  }
};

export const EVENT_SLUGS = Object.fromEntries(Object.values(EVENTS).map(event => [event.slug, event]));
