// Central configuration. Replace placeholders only when institute-approved details are supplied.
export const SITE = {
  name: 'Al-Maʿhad An-Nuʿmānī',
  apiUrl: 'https://script.google.com/macros/s/AKfycbxMHi3E0iZojFEtzQWlAClegEcP3rXriBQbNR41jRInw96q7pjJiBEfITesfrVYbrU8jw/exec',
  colors: { navy: '#002353', gold: '#B9873F' },
  contact: { email: '', whatsapp: '', telegram: '', instagram: '' },
  documents: { terms: '', privacy: '', conduct: '' },
  developerCredit: 'shabkah.dev'
};
export const AUDIENCES = [
  { label: 'Children (6–15)', value: 'Children', path: '/courses/children' },
  { label: 'Students and Adults', value: 'Students and Adults', path: '/courses/students-adults' },
  { label: 'Ālimiyah', value: 'Alimiyah', path: '/courses/alimiyah' }
];
