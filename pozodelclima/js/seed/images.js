// Material precargado: ocho imágenes abstractas de data decay.
// Se generan en el navegador, sin archivos binarios ni dependencias.
// Cada imagen tiene una semilla fija para que el seed sea siempre el mismo.

import { analyzeCanvas } from '../analysis/color.js';
import { CONFIG } from '../config.js';
import { int, makeRng, pick, range } from './prng.js';

const HUES = [12, 38, 82, 158, 188, 214, 286, 326];
const RATIOS = [
  [4, 5],
  [1, 1],
  [3, 4],
  [16, 9],
  [5, 4],
  [1, 1],
  [4, 3],
  [3, 4],
];

export async function createSeedImages() {
  const pieces = [];
  const count = CONFIG.seed.imageCount;

  for (let index = 0; index < count; index += 1) {
    const rng = makeRng(`pozo-seed-${index}`);
    const [ratioW, ratioH] = RATIOS[index % RATIOS.length];
    const longSide = 1000;
    const width = ratioW >= ratioH
      ? longSide
      : Math.round((longSide * ratioW) / ratioH);
    const height = ratioH >= ratioW
      ? longSide
      : Math.round((longSide * ratioH) / ratioW);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo crear el canvas del seed.');

    const colors = makePalette(rng, HUES[index % HUES.length]);
    drawCompostImage(ctx, width, height, rng, colors);

    const features = analyzeCanvas(canvas, { k: 4 });
    const src = canvas.toDataURL('image/webp', 0.92);

    pieces.push({
      id: `seed-img-${index + 1}`,
      kind: 'image',
      source: 'seed',
      src,
      width,
      height,
      features,
    });
  }

  return pieces;
}

// Paleta de cuatro colores: un tono base y tres acentos.
function makePalette(rng, baseHue) {
  const offsets = [0, 140, 205, 45];

  return offsets.map((offset, index) => {
    const h = (baseHue + offset + range(rng, -18, 18) + 360) % 360;
    const s = range(rng, 0.45, 0.95);
    const l = index === 0
      ? range(rng, 0.55, 0.78)
      : range(rng, 0.30, 0.62);

    return { h, s, l };
  });
}

function colorCss(color, alpha = 1) {
  return `hsla(${color.h.toFixed(1)}, ${(color.s * 100).toFixed(1)}%, ${(color.l * 100).toFixed(1)}%, ${alpha})`;
}

function drawCompostImage(ctx, width, height, rng, colors) {
  const dark = { h: colors[0].h, s: 0.28, l: 0.045 };

  // Base con dos tonos de la paleta: asegura materia visible bajo los efectos.
  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, colorCss({ ...colors[1], l: 0.15 }));
  base.addColorStop(0.48, colorCss(dark));
  base.addColorStop(1, colorCss({ ...colors[2], l: 0.12 }));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  drawColorFields(ctx, width, height, rng, colors);
  drawTiles(ctx, width, height, rng, colors);
  drawDataLines(ctx, width, height, rng, colors);
  drawNoise(ctx, width, height, rng);
  drawGlitch(ctx, width, height, rng);
  drawBitRot(ctx, width, height, rng, colors, dark);
  drawScanlines(ctx, width, height);
  drawVignette(ctx, width, height);
}

// Manchas grandes de color, como materia extendida.
function drawColorFields(ctx, width, height, rng, colors) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (let i = 0; i < 6; i += 1) {
    const color = colors[i % colors.length];
    const cx = range(rng, -0.1, 1.1) * width;
    const cy = range(rng, -0.1, 1.1) * height;
    const radius = range(rng, 0.3, 0.95) * Math.max(width, height);

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, colorCss(color, range(rng, 0.55, 0.9)));
    gradient.addColorStop(0.55, colorCss(color, 0.18));
    gradient.addColorStop(1, colorCss(color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

// Mosaico irregular: bloques de archivo pegados sin orden.
function drawTiles(ctx, width, height, rng, colors) {
  ctx.save();

  const cols = int(rng, 6, 14);
  const rows = int(rng, 6, 14);
  const cellW = width / cols;
  const cellH = height / rows;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (rng() < 0.52) continue;

      const color = pick(rng, colors);
      const pad = range(rng, 0, 0.18);
      ctx.globalAlpha = range(rng, 0.1, 0.42);
      ctx.fillStyle = colorCss(color);
      ctx.fillRect(
        x * cellW + pad * cellW,
        y * cellH + pad * cellH,
        cellW * (1 - pad * 1.5),
        cellH * (1 - pad * 1.5),
      );
    }
  }

  ctx.restore();
}

// Líneas finas: pulsos, cables o restos de un escaneo.
function drawDataLines(ctx, width, height, rng, colors) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (let i = 0; i < 18; i += 1) {
    const color = pick(rng, colors);
    const y = rng() * height;

    ctx.strokeStyle = colorCss(color, range(rng, 0.12, 0.5));
    ctx.lineWidth = range(rng, 0.5, 2.5);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + range(rng, -0.12, 0.12) * height);
    ctx.stroke();
  }

  ctx.restore();
}

function drawNoise(ctx, width, height, rng) {
  const noise = document.createElement('canvas');
  noise.width = 160;
  noise.height = 160;

  const noiseCtx = noise.getContext('2d');
  if (!noiseCtx) return;

  const image = noiseCtx.createImageData(noise.width, noise.height);

  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.floor(rng() * 255);
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 30 + Math.floor(rng() * 90);
  }

  noiseCtx.putImageData(image, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.12;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(noise, 0, 0, width, height);
  ctx.restore();
}

// Cortes horizontales desplazados: el archivo se rompe y se vuelve a pegar mal.
function drawGlitch(ctx, width, height, rng) {
  const copy = document.createElement('canvas');
  copy.width = width;
  copy.height = height;

  const copyCtx = copy.getContext('2d');
  if (!copyCtx) return;

  copyCtx.drawImage(ctx.canvas, 0, 0);

  ctx.save();

  const slices = int(rng, 5, 12);

  for (let i = 0; i < slices; i += 1) {
    const sy = rng() * height;
    const sh = range(rng, 2, Math.max(4, height * 0.06));
    const dx = range(rng, -0.12, 0.12) * width;

    ctx.globalAlpha = range(rng, 0.35, 0.85);
    ctx.drawImage(copy, 0, sy, width, sh, dx, sy, width, sh);
  }

  ctx.restore();
}

function drawBitRot(ctx, width, height, rng, colors, dark) {
  ctx.save();

  for (let i = 0; i < 10; i += 1) {
    const color = pick(rng, colors);
    ctx.fillStyle = rng() < 0.45 ? colorCss(dark) : colorCss(color, 0.9);
    ctx.globalAlpha = range(rng, 0.35, 0.8);
    ctx.fillRect(
      rng() * width,
      rng() * height,
      range(rng, 3, width * 0.09),
      range(rng, 2, height * 0.035),
    );
  }

  ctx.restore();
}

function drawScanlines(ctx, width, height) {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#000';

  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }

  ctx.restore();
}

function drawVignette(ctx, width, height) {
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.2,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75,
  );

  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}
