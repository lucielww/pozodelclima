// Análisis de color en HSL.
// En el seed se usa para conocer la paleta de cada imagen.
// En el Paso 5 se reutiliza para analizar las imágenes donadas.

const SAMPLE_SIZE = 64;
const KMEANS_ITERATIONS = 7;

// r, g y b llegan en 0..1. Devuelve h en grados y s/l en 0..1.
export function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === r) {
      h = (g - b) / delta + (g < b ? 6 : 0);
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }

    h *= 60;
  }

  return { h, s, l };
}

export function hslToCss({ h, s, l }, alpha = 1) {
  const hue = ((h % 360) + 360) % 360;
  return `hsla(${hue.toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%, ${alpha})`;
}

// Analiza un canvas y devuelve media HSL, brillo, saturación y una paleta.
// La imagen se reduce a 64x64 para que el cálculo sea barato y estable.
export function analyzeCanvas(canvas, options = {}) {
  const k = Math.max(1, Math.min(5, options.k ?? 4));
  const size = options.size ?? SAMPLE_SIZE;

  const sample = document.createElement('canvas');
  sample.width = size;
  sample.height = size;

  const ctx = sample.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No se pudo crear el contexto de análisis.');

  // Fondo oscuro: si la imagen tiene transparencia, se compone sobre la materia.
  ctx.fillStyle = '#080807';
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(canvas, 0, 0, size, size);

  const { data } = ctx.getImageData(0, 0, size, size);
  const points = [];
  let sumL = 0;
  let sumS = 0;
  let hueX = 0;
  let hueY = 0;
  let hueWeight = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const hsl = rgbToHsl(r, g, b);

    points.push([r, g, b]);
    sumL += hsl.l;
    sumS += hsl.s;

    // Media circular del tono, ponderada por saturación y luz.
    // Así los grises no arrastran el tono hacia cualquier lado.
    const weight = hsl.s * (0.25 + hsl.l);
    hueX += Math.cos((hsl.h * Math.PI) / 180) * weight;
    hueY += Math.sin((hsl.h * Math.PI) / 180) * weight;
    hueWeight += weight;
  }

  const count = points.length;
  const meanL = sumL / count;
  const meanS = sumS / count;
  const meanH = hueWeight > 1e-9
    ? ((Math.atan2(hueY, hueX) * 180) / Math.PI + 360) % 360
    : 0;

  const centers = kmeansPlusPlus(points, Math.min(k, points.length), localRandom(0x9e3779b9));
  const clusters = kmeans(points, centers, KMEANS_ITERATIONS);
  const palette = clusters
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((cluster) => {
      const hsl = rgbToHsl(cluster.center[0], cluster.center[1], cluster.center[2]);
      return {
        h: hsl.h,
        s: hsl.s,
        l: hsl.l,
        weight: cluster.count / count,
        css: hslToCss(hsl),
      };
    });

  const fallback = { h: meanH, s: meanS, l: meanL, weight: 1, css: hslToCss({ h: meanH, s: meanS, l: meanL }) };

  return {
    mean: { h: meanH, s: meanS, l: meanL },
    brightness: meanL,
    saturation: meanS,
    palette: palette.length > 0 ? palette : [fallback],
    dominant: (palette[0] ?? fallback),
  };
}

function localRandom(seed) {
  let state = seed >>> 0;

  return function random() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function distanceSquared(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

// Inicialización k-means++ con PRNG local para que el resultado sea reproducible.
function kmeansPlusPlus(points, k, random) {
  if (points.length === 0) return [];

  const centers = [points[Math.floor(random() * points.length)]];
  const distances = new Float64Array(points.length).fill(Infinity);

  while (centers.length < k) {
    let total = 0;
    const last = centers[centers.length - 1];

    for (let i = 0; i < points.length; i += 1) {
      const d = distanceSquared(points[i], last);
      if (d < distances[i]) distances[i] = d;
      total += distances[i];
    }

    if (total <= 0) break;

    let target = random() * total;
    let index = points.length - 1;

    for (let i = 0; i < points.length; i += 1) {
      target -= distances[i];
      if (target <= 0) {
        index = i;
        break;
      }
    }

    centers.push(points[index]);
  }

  return centers.map((center) => center.slice());
}

function kmeans(points, initialCenters, iterations) {
  let centers = initialCenters.map((center) => center.slice());
  let counts = new Array(centers.length).fill(0);

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    counts = new Array(centers.length).fill(0);

    for (let p = 0; p < points.length; p += 1) {
      const point = points[p];
      let bestIndex = 0;
      let bestDistance = Infinity;

      for (let c = 0; c < centers.length; c += 1) {
        const d = distanceSquared(point, centers[c]);
        if (d < bestDistance) {
          bestDistance = d;
          bestIndex = c;
        }
      }

      sums[bestIndex][0] += point[0];
      sums[bestIndex][1] += point[1];
      sums[bestIndex][2] += point[2];
      sums[bestIndex][3] += 1;
      counts[bestIndex] += 1;
    }

    centers = centers.map((center, index) => {
      const total = sums[index][3];
      if (total === 0) return center;
      return [
        sums[index][0] / total,
        sums[index][1] / total,
        sums[index][2] / total,
      ];
    });
  }

  return centers.map((center, index) => ({ center, count: counts[index] }));
}
