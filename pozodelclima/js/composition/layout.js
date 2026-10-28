// Dispersión del campo.
// Hue -> ángulo; brillo -> radio; energía/profundidad -> escala y z-index.
// El clima ajusta expansión y turbulencia. No hay motor de físicas: solo una
// relajación suave para que ninguna pieza quede completamente tapada.

import { makeRng, range } from '../seed/prng.js';

const TAU = Math.PI * 2;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function overlapArea(a, b) {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.left + a.width, b.left + b.width);
  const bottom = Math.min(a.top + a.height, b.top + b.height);

  if (right <= left || bottom <= top) return 0;
  return (right - left) * (bottom - top);
}

function relax(boxes, width, height) {
  for (let iteration = 0; iteration < 5; iteration += 1) {
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        const overlap = overlapArea(a, b);
        const smaller = Math.min(a.width * a.height, b.width * b.height);

        if (overlap < smaller * 0.78) continue;

        const aCenterX = a.left + a.width / 2;
        const aCenterY = a.top + a.height / 2;
        const bCenterX = b.left + b.width / 2;
        const bCenterY = b.top + b.height / 2;

        let dx = bCenterX - aCenterX;
        let dy = bCenterY - aCenterY;
        const length = Math.hypot(dx, dy);

        if (length < 1) {
          dx = Math.cos(a.angle + Math.PI / 2);
          dy = Math.sin(a.angle + Math.PI / 2);
        } else {
          dx /= length;
          dy /= length;
        }

        const push = (10 + Math.min(a.width, b.width) * 0.08) * (1 - iteration / 7);
        const mover = a.z <= b.z ? a : b;
        const direction = mover === a ? -1 : 1;

        mover.left += dx * push * direction;
        mover.top += dy * push * direction;

        // La misma sangría del 5% que en la posición inicial.
        const bleed = Math.min(width, height) * 0.05;
        mover.left = clamp(mover.left, -bleed, width - mover.width + bleed);
        mover.top = clamp(mover.top, -bleed, height - mover.height + bleed);
      }
    }
  }
}

export function layoutPieces(items, options = {}) {
  const profile = options.profile;
  const width = Math.max(1, options.width ?? window.innerWidth);
  const height = Math.max(1, options.height ?? window.innerHeight);
  const seed = options.seed ?? profile?.seedBase ?? 'pozo-layout';
  const mobile = width < 720;
  const minSide = Math.min(width, height);
  const turbulence = clamp(profile?.turbulence ?? 0.35, 0, 1);
  const density = clamp(profile?.density ?? 0.5, 0, 1);
  const expansion = clamp(profile?.expansion ?? 0.5, 0, 1);

  const boxes = items.map((item, index) => {
    const piece = item.piece;
    const features = piece?.features ?? {};
    const rng = makeRng(`pozo-layout-${seed}-${piece?.id ?? index}-${index}`);

    const brightness = clamp(features.brightness ?? 0.45, 0, 1);
    const saturation = clamp(features.saturation ?? 0.5, 0, 1);
    const hue = ((features.mean?.h ?? 200) + 360) % 360;
    const depth = clamp(0.28 + brightness * 0.50 + saturation * 0.22, 0, 1);

    // El tono propio de la pieza y el tono del perfil giran el campo.
    const angle = (hue / 360) * TAU
      + ((profile?.hue ?? 200) / 360) * 0.9
      + range(rng, -0.16, 0.16);

    // El alcance trabaja en proporción al ancho y al alto, no al lado menor:
    // así el campo ocupa también las esquinas en pantallas apaisadas.
    const reach = (0.82 + expansion * 0.36 + rng() * 0.16) * (mobile ? 0.9 : 1);
    const spreadX = width * (0.27 + brightness * 0.27) * reach;
    const spreadY = height * (0.23 + brightness * 0.25) * reach;
    const jitterX = turbulence * width * 0.035;
    const jitterY = turbulence * height * 0.045;

    const centerX = width * 0.5 + Math.cos(angle) * spreadX
      + range(rng, -jitterX, jitterX);
    const centerY = height * 0.5 + Math.sin(angle) * spreadY
      + range(rng, -jitterY, jitterY);

    const aspect = clamp((piece?.width || 1) / (piece?.height || 1), 0.55, 1.7);
    let pieceWidth = minSide
      * (0.175 + depth * 0.155)
      * (1 - density * 0.13)
      * (mobile ? 1.10 : 1)
      * (0.9 + rng() * 0.2);

    let pieceHeight = pieceWidth / aspect;

    const scale = Math.min(
      1,
      (width * 0.46) / pieceWidth,
      (height * 0.64) / pieceHeight,
    );
    pieceWidth *= scale;
    pieceHeight *= scale;

    let left = centerX - pieceWidth / 2;
    let top = centerY - pieceHeight / 2;
    const bleed = minSide * 0.05;
    left = clamp(left, -bleed, width - pieceWidth + bleed);
    top = clamp(top, -bleed, height - pieceHeight + bleed);

    return {
      item,
      piece,
      left,
      top,
      width: pieceWidth,
      height: pieceHeight,
      centerX,
      centerY,
      angle,
      radius: (spreadX + spreadY) / (2 * minSide),
      z: Math.round(10 + depth * 58 + turbulence * 16 + rng() * 9),
      rotation: Number((range(rng, -8.5, 8.5) + Math.sin(angle) * 1.6).toFixed(2)),
      clipIndex: Math.floor(rng() * 6),
      blendIndex: Math.floor(rng() * 6),
      driftX: range(rng, -5, 5) * (0.5 + turbulence * 1.6),
      driftY: range(rng, -7, 7) * (0.5 + turbulence * 1.6),
      depth,
      brightness,
      saturation,
      hue,
      aspect,
    };
  });

  relax(boxes, width, height);

  return boxes.map((box) => ({
    piece: box.piece,
    group: box.item.group,
    distance: box.item.distance,
    x: Number((box.left / width).toFixed(5)),
    y: Number((box.top / height).toFixed(5)),
    w: Number((box.width / width).toFixed(5)),
    h: Number((box.height / height).toFixed(5)),
    rotation: box.rotation,
    z: box.z,
    clipIndex: box.clipIndex,
    blendIndex: box.blendIndex,
    driftX: Number(box.driftX.toFixed(2)),
    driftY: Number(box.driftY.toFixed(2)),
    hue: Number(box.hue.toFixed(1)),
    brightness: Number(box.brightness.toFixed(3)),
    saturation: Number(box.saturation.toFixed(3)),
    depth: Number(box.depth.toFixed(3)),
    angle: Number(box.angle.toFixed(4)),
    radius: Number(box.radius.toFixed(4)),
  }));
}
