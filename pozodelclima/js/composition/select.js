// Selección 80/20.
// La mayoría de las piezas se acerca al perfil climático; una minoría lo contradice.
// El azar está sembrado por clima, fecha y sesión, así que cada entrada varía.

import { CONFIG } from '../config.js';
import { makeRng } from '../seed/prng.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hueDistance(a, b) {
  const delta = Math.abs(((a - b) % 360 + 360) % 360);
  return Math.min(delta, 360 - delta) / 180;
}

function colorDistance(color, target) {
  if (!color || !target) return 0.5;

  const dh = hueDistance(Number(color.h ?? 0), Number(target.h ?? 0));
  const ds = Math.abs(Number(color.s ?? 0.5) - Number(target.s ?? 0.5));
  const dl = Math.abs(Number(color.l ?? 0.5) - Number(target.l ?? 0.5));

  return Math.sqrt(dh * dh * 1.7 + ds * ds * 1.15 + dl * dl * 1.1);
}

export function distanceToProfile(piece, profile) {
  const features = piece?.features ?? {};
  const target = {
    h: profile.hue,
    s: profile.saturation,
    l: profile.lightness,
  };

  const palette = Array.isArray(features.palette) ? features.palette : [];
  const paletteDistance = palette.length > 0
    ? Math.min(...palette.map((color) => colorDistance(color, target)))
    : 0.5;

  const meanDistance = colorDistance(features.mean, target);
  const brightnessDistance = Math.abs((features.brightness ?? 0.45) - profile.brightness);
  const saturationDistance = Math.abs((features.saturation ?? 0.5) - profile.saturation);

  return clamp(
    paletteDistance * 0.56
      + meanDistance * 0.24
      + brightnessDistance * 0.12
      + saturationDistance * 0.08,
    0,
    1,
  );
}

function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function selectPieces(pool, profile, options = {}) {
  const seed = options.seed ?? `${profile.seedBase}-selection`;
  const rng = makeRng(`pozo-select-${seed}`);
  const mobile = Boolean(options.mobile);
  const exclude = new Set(options.excludeIds ?? []);

  const available = (pool ?? []).filter((piece) => {
    return piece && piece.kind === 'image' && !exclude.has(piece.id);
  });

  const maxCount = Math.min(
    options.maxCount ?? CONFIG.composition.maxCount,
    CONFIG.composition.hardCap,
    available.length,
  );

  if (maxCount === 0) {
    return {
      items: [],
      meta: {
        count: 0,
        desired: 0,
        affinityCount: 0,
        contrastCount: 0,
        poolSize: 0,
        mobile,
        seed,
      },
    };
  }

  let desired = Math.round(
    CONFIG.composition.minCount
      + profile.density * (CONFIG.composition.maxCount - CONFIG.composition.minCount),
  );

  if (mobile) {
    desired = Math.round(desired * CONFIG.composition.mobileFactor);
    // Aun con el mismo pool, el móvil debe mostrar menos materia que el escritorio.
    desired = clamp(desired, 4, Math.max(4, maxCount - 1));
  }

  const count = Math.min(maxCount, desired);
  const ranked = available
    .map((piece) => ({
      piece,
      distance: distanceToProfile(piece, profile),
    }))
    .sort((a, b) => a.distance - b.distance);

  const affinityCount = Math.min(
    count,
    Math.max(1, Math.round(count * CONFIG.composition.affinityRatio)),
  );
  const contrastCount = count - affinityCount;

  const selected = [];
  const selectedIds = new Set();

  // Afinidad: se elige dentro del grupo más cercano, no siempre los primeros.
  const affinitySpan = Math.max(affinityCount, Math.ceil(ranked.length * 0.55));
  const affinityPool = shuffle(ranked.slice(0, affinitySpan), rng);

  for (const item of affinityPool) {
    if (selected.length >= affinityCount) break;
    if (selectedIds.has(item.piece.id)) continue;
    selected.push({ ...item, group: 'afinidad' });
    selectedIds.add(item.piece.id);
  }

  // Contraste: se elige dentro del extremo más lejano que quede disponible.
  if (contrastCount > 0) {
    const remaining = ranked.filter((item) => !selectedIds.has(item.piece.id));
    const contrastSpan = Math.max(contrastCount, Math.ceil(remaining.length * 0.55));
    const contrastPool = shuffle(remaining.slice(-contrastSpan), rng);

    for (const item of contrastPool) {
      if (selected.length >= count) break;
      if (selectedIds.has(item.piece.id)) continue;
      selected.push({ ...item, group: 'contraste' });
      selectedIds.add(item.piece.id);
    }
  }

  // Relleno de seguridad si los grupos no alcanzaron.
  for (const item of ranked) {
    if (selected.length >= count) break;
    if (selectedIds.has(item.piece.id)) continue;
    selected.push({ ...item, group: 'afinidad' });
    selectedIds.add(item.piece.id);
  }

  const items = shuffle(selected, rng).map((item) => ({
    ...item,
    distance: Number(item.distance.toFixed(4)),
  }));

  return {
    items,
    meta: {
      count: items.length,
      desired,
      affinityCount: items.filter((item) => item.group === 'afinidad').length,
      contrastCount: items.filter((item) => item.group === 'contraste').length,
      poolSize: available.length,
      mobile,
      seed,
    },
  };
}
