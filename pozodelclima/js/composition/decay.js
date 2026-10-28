// Fermentación visual básica.
// Devuelve variables CSS por pieza: tinte, saturación, contraste, brillo, blur,
// opacidad, pixelado y deriva. No hay envejecimiento acumulativo ni estado guardado.

import { makeRng, range } from '../seed/prng.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function buildDecay(profile, placement, index, seed) {
  const rng = makeRng(`pozo-decay-${seed}-${placement.piece?.id ?? index}-${index}`);
  const hue = Number(profile?.hue ?? 200);
  const profileSaturation = Number(profile?.saturation ?? 0.4);
  const profileLightness = Number(profile?.lightness ?? 0.4);
  const decay = clamp(profile?.decay ?? 0.4, 0, 1);
  const turbulence = clamp(profile?.turbulence ?? 0.35, 0, 1);
  const night = Boolean(profile?.night);

  const tintHue = ((hue + range(rng, -16, 16)) + 360) % 360;
  const tintSaturation = clamp(profileSaturation * 0.9 + range(rng, -0.08, 0.08), 0.05, 0.95);
  const tintLightness = clamp(profileLightness + range(rng, -0.08, 0.08), 0.15, 0.8);
  const tintAlpha = clamp(0.015 + decay * 0.10 + turbulence * 0.035 + rng() * 0.025, 0.01, 0.18);

  const saturation = clamp(
    0.82 + (1 - decay) * 0.30 + profileSaturation * 0.08 - (night ? 0.16 : 0),
    0.5,
    1.32,
  );
  const contrast = clamp(1.0 + decay * 0.26 + turbulence * 0.06 + rng() * 0.05, 0.96, 1.36);
  const brightness = clamp(0.92 + (night ? -0.05 : 0.06) - decay * 0.05 + rng() * 0.04, 0.78, 1.08);
  const blur = clamp(turbulence * 1.7 + decay * 0.5 + rng() * 0.3, 0, 2.5);
  const opacity = clamp(0.74 - decay * 0.20 + (1 - turbulence) * 0.10 + rng() * 0.04, 0.48, 0.95);
  const pixel = Math.round(2 + decay * 4 + turbulence * 2 + rng());
  const pixelAlpha = clamp(0.05 + decay * 0.14 + turbulence * 0.04, 0.04, 0.26);
  const driftX = range(rng, -8, 8) * (0.4 + turbulence * 1.5);
  const driftY = range(rng, -10, 10) * (0.4 + turbulence * 1.5);

  return {
    tint: `hsla(${tintHue.toFixed(1)}, ${(tintSaturation * 100).toFixed(1)}%, ${(tintLightness * 100).toFixed(1)}%, ${tintAlpha.toFixed(3)})`,
    saturation: Number(saturation.toFixed(3)),
    contrast: Number(contrast.toFixed(3)),
    brightness: Number(brightness.toFixed(3)),
    blur: Number(blur.toFixed(2)),
    opacity: Number(opacity.toFixed(3)),
    pixel: clamp(pixel, 2, 9),
    pixelAlpha: Number(pixelAlpha.toFixed(3)),
    driftX: Number(driftX.toFixed(2)),
    driftY: Number(driftY.toFixed(2)),
  };
}
