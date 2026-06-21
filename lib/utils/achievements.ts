import { COUNTRIES } from '@/lib/data/countries'

export const TOTAL_COUNTRIES = COUNTRIES.length

export const ACHIEVEMENTS = [
  { id: 'first',        label: 'First Stamp',      description: 'Visited 1 country',                     threshold: 1,              icon: '🛂' },
  { id: 'explorer',     label: 'Explorer',          description: 'Visited 10 countries',                  threshold: 10,             icon: '🧭' },
  { id: 'globetrotter', label: 'Globetrotter',      description: 'Visited 25 countries',                  threshold: 25,             icon: '🌍' },
  { id: 'centurion',    label: 'Centurion',         description: 'Visited 50 countries',                  threshold: 50,             icon: '🏅' },
  { id: 'legend',       label: 'World Traveler',    description: 'Visited 100 countries',                 threshold: 100,            icon: '🌐' },
  { id: 'ultimate',     label: 'Ultimate Explorer', description: `Visited all ${TOTAL_COUNTRIES} countries`, threshold: TOTAL_COUNTRIES, icon: '👑' },
] as const
