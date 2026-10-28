// PRNG determinista: el material precargado debe verse igual en cada visita.
// No se usa para criptografía, solo para composición y dibujo.

// xmur3: convierte un texto en una semilla numérica estable.
export function hashString(text) {
  let h = 1779033703 ^ text.length;

  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return function nextSeed() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

// mulberry32: generador rápido y suficiente para esta obra.
export function mulberry32(seed) {
  let a = seed >>> 0;

  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Crea un generador a partir de un texto legible.
export function makeRng(seedText) {
  const nextSeed = hashString(String(seedText));
  return mulberry32(nextSeed());
}

export function range(rng, min, max) {
  return min + rng() * (max - min);
}

export function int(rng, min, max) {
  return Math.floor(range(rng, min, max + 1));
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}
