// The DETECTA team. Avatars are generated from initials with a stable brand color.
export const TEAM = [
  { name: 'Raed Ward', role: 'Founder & Product' },
  { name: 'Mahmoud Aboelnagah', role: 'Engineering Lead' },
  { name: 'Jana Rafat', role: 'Design & UX' },
  { name: 'Renad Elsaqa', role: 'Content & Localization' },
  { name: 'Toka Mousa', role: 'Research & Data' },
]

export const CONTACT = {
  email: 'hellobrther2423@gmail.com',
  location: 'Egypt',
}

// Deterministic gradient per name so avatars are colorful but stable.
const GRADIENTS = [
  'linear-gradient(135deg, #0e9aa7, #4a90c2)',
  'linear-gradient(135deg, #17b3c1, #2f9e6f)',
  'linear-gradient(135deg, #4a90c2, #6a5acd)',
  'linear-gradient(135deg, #0b7d88, #17b3c1)',
  'linear-gradient(135deg, #2f9e6f, #0e9aa7)',
]

export function avatarGradient(index) {
  return GRADIENTS[index % GRADIENTS.length]
}

export function initials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}
