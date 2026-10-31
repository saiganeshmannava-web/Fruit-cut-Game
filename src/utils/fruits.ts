import { FruitConfig, FruitId, FlyingObject } from '../types/game';

export const FRUIT_CONFIGS: Record<FruitId, FruitConfig> = {
  watermelon: {
    id: 'watermelon',
    name: 'Neon Watermelon',
    points: 10,
    radius: 46,
    primaryColor: '#10b981',
    secondaryColor: '#f43f5e',
    juiceColor: '#ff2d55',
    glowColor: 'rgba(255, 45, 85, 0.7)',
  },
  orange: {
    id: 'orange',
    name: 'Plasma Orange',
    points: 10,
    radius: 38,
    primaryColor: '#f97316',
    secondaryColor: '#ffedd5',
    juiceColor: '#ff7a00',
    glowColor: 'rgba(249, 115, 22, 0.7)',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Cyber Berry',
    points: 15,
    radius: 34,
    primaryColor: '#e11d48',
    secondaryColor: '#fef08a',
    juiceColor: '#ff1493',
    glowColor: 'rgba(225, 29, 72, 0.7)',
  },
  pineapple: {
    id: 'pineapple',
    name: 'Matrix Pineapple',
    points: 20,
    radius: 48,
    primaryColor: '#eab308',
    secondaryColor: '#15803d',
    juiceColor: '#ffd700',
    glowColor: 'rgba(234, 179, 8, 0.7)',
  },
  banana: {
    id: 'banana',
    name: 'Vapor Banana',
    points: 15,
    radius: 40,
    primaryColor: '#facc15',
    secondaryColor: '#fef9c3',
    juiceColor: '#ffe600',
    glowColor: 'rgba(250, 204, 21, 0.7)',
  },
  dragonfruit: {
    id: 'dragonfruit',
    name: 'Hyper Dragonfruit',
    points: 25,
    radius: 44,
    primaryColor: '#ec4899',
    secondaryColor: '#f8fafc',
    juiceColor: '#ff2df7',
    glowColor: 'rgba(236, 72, 153, 0.8)',
  },
  kiwi: {
    id: 'kiwi',
    name: 'Quantum Kiwi',
    points: 15,
    radius: 35,
    primaryColor: '#84cc16',
    secondaryColor: '#3f6212',
    juiceColor: '#a3e635',
    glowColor: 'rgba(132, 204, 22, 0.7)',
  },
  coconut: {
    id: 'coconut',
    name: 'Titan Coconut',
    points: 20,
    radius: 42,
    primaryColor: '#78350f',
    secondaryColor: '#f8fafc',
    juiceColor: '#e0f2fe',
    glowColor: 'rgba(248, 250, 252, 0.7)',
  },
  frenzy_banana: {
    id: 'frenzy_banana',
    name: 'Frenzy Rush Banana',
    points: 30,
    radius: 42,
    primaryColor: '#38bdf8',
    secondaryColor: '#f43f5e',
    juiceColor: '#00f5ff',
    glowColor: 'rgba(56, 189, 248, 0.9)',
    isSpecial: true,
    specialType: 'frenzy',
  },
  golden_dragon: {
    id: 'golden_dragon',
    name: 'Golden Dragonfruit',
    points: 50,
    radius: 48,
    primaryColor: '#fbbf24',
    secondaryColor: '#fef08a',
    juiceColor: '#ffd700',
    glowColor: 'rgba(251, 191, 36, 0.95)',
    isSpecial: true,
    specialType: 'bonus',
  },
  bomb: {
    id: 'bomb',
    name: 'Cyber EMP Bomb',
    points: 0,
    radius: 42,
    primaryColor: '#18181b',
    secondaryColor: '#ef4444',
    juiceColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.9)',
    isSpecial: true,
    specialType: 'bomb',
  },
};

export const STANDARD_FRUIT_KEYS: FruitId[] = [
  'watermelon',
  'orange',
  'strawberry',
  'pineapple',
  'banana',
  'dragonfruit',
  'kiwi',
  'coconut',
];

/**
 * Spawns a new flying object (fruit or bomb) from below the screen with realistic arc trajectory
 */
export function spawnFlyingObject(
  canvasWidth: number,
  canvasHeight: number,
  includeBomb: boolean,
  bombProbability = 0.18,
  speedMultiplier = 1.0
): FlyingObject {
  let type: FruitId;

  if (includeBomb && Math.random() < bombProbability) {
    type = 'bomb';
  } else {
    // 5% chance for special bonus fruits
    const specialRoll = Math.random();
    if (specialRoll < 0.04) {
      type = 'frenzy_banana';
    } else if (specialRoll < 0.08) {
      type = 'golden_dragon';
    } else {
      const idx = Math.floor(Math.random() * STANDARD_FRUIT_KEYS.length);
      type = STANDARD_FRUIT_KEYS[idx];
    }
  }

  const config = FRUIT_CONFIGS[type];
  const radius = config.radius;

  // Launch from lower bounds
  const margin = Math.min(canvasWidth * 0.15, 120);
  const x = margin + Math.random() * (canvasWidth - margin * 2);
  const y = canvasHeight + radius + 10;

  // Calculate velocity to reach between 20% and 55% of canvas height
  const targetApexY = canvasHeight * (0.18 + Math.random() * 0.35);
  const gravity = 800; // px/sec^2
  const heightDelta = y - targetApexY;
  // vy = -sqrt(2 * g * h)
  const vy = -Math.sqrt(2 * gravity * heightDelta) * (0.95 + Math.random() * 0.1) * speedMultiplier;

  // Horizontal velocity directed slightly towards center
  const centerDelta = (canvasWidth / 2) - x;
  const vx = (centerDelta * (0.6 + Math.random() * 0.8) / 1.5) * speedMultiplier;

  // Rotational velocity in radians per second
  const vRot = (Math.random() * 4 - 2);

  return {
    id: `obj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    x,
    y,
    vx,
    vy,
    rotation: Math.random() * Math.PI * 2,
    vRot,
    radius,
    isCut: false,
  };
}

/**
 * Draw fruit or bomb on canvas with neon styling and crisp geometry
 */
export function drawFruit(
  ctx: CanvasRenderingContext2D,
  obj: FlyingObject,
  currentTime: number
) {
  const config = FRUIT_CONFIGS[obj.type];
  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.rotate(obj.rotation);

  if (obj.type === 'bomb') {
    drawCyberBomb(ctx, obj.radius, currentTime);
  } else {
    drawFruitWhole(ctx, obj.type, obj.radius, currentTime);
  }

  ctx.restore();
}

/**
 * Draw a sliced half of a fruit with rotation, momentum, and inner cross-section
 */
export function drawFruitHalf(
  ctx: CanvasRenderingContext2D,
  type: FruitId,
  radius: number,
  side: 1 | -1,
  cutAngle: number,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

  // Rotate to align cut plane along horizontal
  ctx.rotate(cutAngle);

  // Clip to the upper or lower half depending on side
  ctx.beginPath();
  if (side === 1) {
    ctx.rect(-radius * 1.5, -radius * 1.5, radius * 3, radius * 1.5);
  } else {
    ctx.rect(-radius * 1.5, 0, radius * 3, radius * 1.5);
  }
  ctx.clip();

  // Draw the full fruit inside the clipped half
  drawFruitWhole(ctx, type, radius, 0);

  // Draw bright neon slice cut edge
  ctx.beginPath();
  ctx.moveTo(-radius, 0);
  ctx.lineTo(radius, 0);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.shadowColor = FRUIT_CONFIGS[type].glowColor;
  ctx.shadowBlur = 10;
  ctx.stroke();

  ctx.restore();
}

/**
 * Render individual whole fruit graphics
 */
function drawFruitWhole(
  ctx: CanvasRenderingContext2D,
  type: FruitId,
  radius: number,
  time: number
) {
  const config = FRUIT_CONFIGS[type];

  // Neon halo glow
  ctx.shadowColor = config.glowColor;
  ctx.shadowBlur = config.isSpecial ? 22 : 12;

  switch (type) {
    case 'watermelon': {
      // Outer green rind
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#065f46';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#10b981';
      ctx.stroke();

      // Inner white/pale green layer
      ctx.beginPath();
      ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
      ctx.fillStyle = '#d1fae5';
      ctx.fill();

      // Juicy Red Core
      ctx.beginPath();
      ctx.arc(0, 0, radius - 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ff1744';
      ctx.fill();

      // Seeds
      ctx.fillStyle = '#0f172a';
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 + 0.3;
        const dist = radius * 0.52;
        ctx.beginPath();
        ctx.ellipse(Math.cos(ang) * dist, Math.sin(ang) * dist, 2.5, 4.5, ang, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'orange': {
      // Outer orange peel
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ea580c';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fb923c';
      ctx.stroke();

      // Inner pith
      ctx.beginPath();
      ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffedd5';
      ctx.fill();

      // Citrus segments
      const segments = 8;
      for (let i = 0; i < segments; i++) {
        const startAng = (i / segments) * Math.PI * 2 + 0.08;
        const endAng = ((i + 1) / segments) * Math.PI * 2 - 0.08;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius - 7, startAng, endAng);
        ctx.closePath();
        ctx.fillStyle = '#ff7a00';
        ctx.fill();
      }

      // Center star
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff7ed';
      ctx.fill();
      break;
    }

    case 'strawberry': {
      // Heart/Berry shape
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.9);
      ctx.bezierCurveTo(radius, -radius * 0.9, radius, radius * 0.3, 0, radius * 1.05);
      ctx.bezierCurveTo(-radius, radius * 0.3, -radius, -radius * 0.9, 0, -radius * 0.9);
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fb7185';
      ctx.stroke();

      // Yellow seed spots
      ctx.fillStyle = '#fef08a';
      const seedCoords = [
        [-10, -10], [10, -10], [0, -16],
        [-15, 6], [0, 2], [15, 6],
        [-8, 18], [8, 18], [0, 26]
      ];
      seedCoords.forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.ellipse(sx, sy, 1.8, 3, 0.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Green leafy calyx cap
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(-16, -radius * 0.85);
      ctx.lineTo(0, -radius * 1.15);
      ctx.lineTo(16, -radius * 0.85);
      ctx.lineTo(6, -radius * 0.7);
      ctx.lineTo(0, -radius * 0.6);
      ctx.lineTo(-6, -radius * 0.7);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'pineapple': {
      // Pineapple oval body
      ctx.beginPath();
      ctx.ellipse(0, radius * 0.12, radius * 0.72, radius * 0.9, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ca8a04';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#facc15';
      ctx.stroke();

      // Diamond scale lines
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(-radius * 0.5, i * 14 - 10);
        ctx.lineTo(radius * 0.5, i * 14 + 10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-radius * 0.5, i * 14 + 10);
        ctx.lineTo(radius * 0.5, i * 14 - 10);
        ctx.stroke();
      }

      // Spiky green crown leaves on top
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(0, -radius * 1.25);
      ctx.lineTo(10, -radius * 0.7);
      ctx.lineTo(20, -radius * 1.05);
      ctx.lineTo(12, -radius * 0.55);
      ctx.lineTo(0, -radius * 0.4);
      ctx.lineTo(-12, -radius * 0.55);
      ctx.lineTo(-20, -radius * 1.05);
      ctx.lineTo(-10, -radius * 0.7);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'banana': {
      // Curved crescent banana
      ctx.beginPath();
      ctx.arc(-radius * 0.4, 0, radius * 1.1, -0.9, 0.9);
      ctx.arc(-radius * 0.7, 0, radius * 0.95, 0.9, -0.9, true);
      ctx.closePath();
      ctx.fillStyle = '#facc15';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#eab308';
      ctx.stroke();

      // Banana tips
      ctx.fillStyle = '#713f12';
      ctx.beginPath();
      ctx.arc(radius * 0.42, -radius * 0.8, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(radius * 0.42, radius * 0.8, 3.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'dragonfruit': {
      // Outer bright magenta skin
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.85, radius, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#db2777';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#f472b6';
      ctx.stroke();

      // Green tipped scales
      const scales = 6;
      for (let i = 0; i < scales; i++) {
        const ang = (i / scales) * Math.PI * 2;
        const sx = Math.cos(ang) * radius * 0.82;
        const sy = Math.sin(ang) * radius * 0.92;
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 5, 8, ang, 0, Math.PI * 2);
        ctx.fill();
      }

      // White seeded core
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.62, radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Tiny black seeds
      ctx.fillStyle = '#0f172a';
      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2 + (i % 2) * 0.2;
        const r = (radius * 0.35) * (0.4 + (i % 3) * 0.25);
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * r, Math.sin(ang) * r, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'kiwi': {
      // Fuzzy brown skin
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#573318';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#78350f';
      ctx.stroke();

      // Bright green pulp
      ctx.beginPath();
      ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
      ctx.fillStyle = '#84cc16';
      ctx.fill();

      // Creamy center
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();

      // Ring of black seeds with radial rays
      ctx.fillStyle = '#020617';
      const seedCount = 14;
      for (let i = 0; i < seedCount; i++) {
        const ang = (i / seedCount) * Math.PI * 2;
        const d = radius * 0.52;
        ctx.beginPath();
        ctx.ellipse(Math.cos(ang) * d, Math.sin(ang) * d, 1.6, 3, ang, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'coconut': {
      // Brown husk
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#451a03';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#78350f';
      ctx.stroke();

      // Pure white coconut flesh
      ctx.beginPath();
      ctx.arc(0, 0, radius - 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();

      // Water hollow center
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#bae6fd';
      ctx.fill();
      break;
    }

    case 'frenzy_banana': {
      // Pulsing rainbow aura
      const pulse = Math.sin(time * 0.008) * 0.3 + 0.7;
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 24 * pulse;

      // Cyan-Electric Banana
      ctx.beginPath();
      ctx.arc(-radius * 0.4, 0, radius * 1.1, -0.9, 0.9);
      ctx.arc(-radius * 0.7, 0, radius * 0.95, 0.9, -0.9, true);
      ctx.closePath();
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Neon stripes
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-radius * 0.4, 0, radius * 1.05, -0.6, 0.6);
      ctx.stroke();
      break;
    }

    case 'golden_dragon': {
      // Radiant golden glow
      const pulse = Math.sin(time * 0.01) * 0.2 + 0.8;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 30 * pulse;

      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.85, radius, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Golden core
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.62, radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();

      // Sparkle star in center
      ctx.fillStyle = '#ffffff';
      drawSparkle(ctx, 0, 0, 10);
      break;
    }
  }
}

/**
 * Render Cyber EMP Bomb with glowing hazard markings, flashing red LED, and burning spark fuse
 */
function drawCyberBomb(ctx: CanvasRenderingContext2D, radius: number, time: number) {
  // Bomb main body (matte cyber titanium)
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 18;

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
  ctx.fillStyle = '#18181b';
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#ef4444';
  ctx.stroke();

  // Top neck collar
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(-radius * 0.24, -radius * 1.08, radius * 0.48, radius * 0.25);

  // Fuse curve
  ctx.beginPath();
  ctx.moveTo(0, -radius * 1.08);
  ctx.quadraticCurveTo(radius * 0.4, -radius * 1.35, radius * 0.2, -radius * 1.55);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#e4e4e7';
  ctx.stroke();

  // Fuse spark tip (crackling particle burst)
  const sparkX = radius * 0.2;
  const sparkY = -radius * 1.55;
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, 4 + Math.random() * 3, 0, Math.PI * 2);
  ctx.fill();

  // Mini sparks flying off fuse
  ctx.fillStyle = '#f97316';
  for (let i = 0; i < 3; i++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 6 + Math.random() * 10;
    ctx.beginPath();
    ctx.arc(sparkX + Math.cos(ang) * dist, sparkY + Math.sin(ang) * dist, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pulsing center EMP core (Hazard warning symbol)
  const flash = Math.sin(time * 0.015) > 0;
  ctx.fillStyle = flash ? '#ef4444' : '#7f1d1d';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = flash ? 16 : 4;

  // Center skull/hazard triangle
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.42);
  ctx.lineTo(radius * 0.38, radius * 0.28);
  ctx.lineTo(-radius * 0.38, radius * 0.28);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.closePath();
  ctx.fill();
}
