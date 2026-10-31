import { BladeStyle } from '../types/game';

export const BLADE_STYLES: BladeStyle[] = [
  {
    id: 'cyber_katana',
    name: 'Cyber Katana',
    glowColor: '#06b6d4',
    coreColor: '#ffffff',
    particleColor: '#22d3ee',
    description: 'High-frequency ion blade tuned for razor-sharp edge precision.',
    unlockedAt: 0,
  },
  {
    id: 'plasma_saber',
    name: 'Plasma Saber',
    glowColor: '#f43f5e',
    coreColor: '#ffe4e6',
    particleColor: '#fb7185',
    description: 'Superheated plasma filament that cuts with scorching fury.',
    unlockedAt: 150,
  },
  {
    id: 'solar_flare',
    name: 'Solar Flare',
    glowColor: '#f59e0b',
    coreColor: '#fffbeb',
    particleColor: '#fbbf24',
    description: 'Radiant stellar flame leaving trails of shimmering solar dust.',
    unlockedAt: 300,
  },
  {
    id: 'toxic_venom',
    name: 'Toxic Venom',
    glowColor: '#22c55e',
    coreColor: '#dcfce7',
    particleColor: '#4ade80',
    description: 'Bio-luminescent acid blade that dissolves targets upon impact.',
    unlockedAt: 500,
  },
  {
    id: 'rainbow_prism',
    name: 'Rainbow Prism',
    glowColor: '#ec4899',
    coreColor: '#ffffff',
    particleColor: '#818cf8',
    description: 'Refractive photon ribbon shifting across the cyber spectrum.',
    unlockedAt: 800,
  },
];
