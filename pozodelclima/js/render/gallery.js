// Render del campo de fragmentos.
// Las posiciones ya vienen calculadas por composition/layout.js.
// El render solo aplica geometría, fermentación y datos de debug.

import { buildDecay } from '../composition/decay.js';
import { makeRng, range } from '../seed/prng.js';

const BLEND_MODES = ['normal', 'screen', 'normal', 'hard-light', 'normal', 'lighten'];

// Recortes irregulares: ningún fragmento es un rectángulo limpio.
const CLIP_SHAPES = [
  'polygon(4% 0%, 100% 6%, 94% 100%, 0% 92%)',
  'polygon(0% 8%, 92% 0%, 100% 88%, 8% 100%)',
  'polygon(6% 0%, 100% 0%, 88% 94%, 0% 100%)',
  'polygon(0% 0%, 94% 4%, 100% 100%, 10% 96%)',
  'polygon(10% 0%, 100% 10%, 90% 100%, 0% 90%)',
  'polygon(0% 4%, 100% 0%, 96% 96%, 4% 100%)',
];

export function renderGallery(stage, placements, options = {}) {
  const profile = options.profile;
  const seed = options.seed ?? profile?.seedBase ?? 'pozo';
  const debug = Boolean(options.debug);

  stage.replaceChildren();
  stage.dataset.debug = debug ? '1' : '0';
  stage.dataset.pieces = String(placements.length);

  if (placements.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'stage__empty';
    empty.textContent = 'el pozo está quieto';
    stage.append(empty);
    return;
  }

  placements.forEach((placement, index) => {
    const piece = placement.piece;
    const decay = buildDecay(profile, placement, index, seed);
    const rng = makeRng(`pozo-piece-${seed}-${piece.id}-${index}`);

    const figure = document.createElement('figure');
    figure.className = 'piece';
    figure.dataset.id = piece.id;
    figure.dataset.kind = piece.kind ?? 'image';
    figure.dataset.group = placement.group ?? 'afinidad';
    figure.dataset.distance = String(placement.distance ?? 0);
    figure.tabIndex = 0;
    figure.setAttribute('role', 'button');
    figure.setAttribute('aria-label', 'abrir fragmento');
    figure.setAttribute('aria-haspopup', 'dialog');

    const frame = document.createElement('div');
    frame.className = 'piece__frame';

    const image = document.createElement('img');
    image.className = 'piece__image';
    image.src = piece.src;
    image.width = piece.width;
    image.height = piece.height;
    image.alt = '';
    image.decoding = 'sync';
    image.draggable = false;

    frame.append(image);
    figure.append(frame);

    if (debug) {
      const features = piece.features ?? {};
      const readout = document.createElement('span');
      readout.className = 'piece__debug';
      readout.textContent = `${piece.id} · d ${Number(placement.distance ?? 0).toFixed(3)} · ${placement.group ?? '—'} · H ${Math.round(features.mean?.h ?? 0)}`;
      figure.append(readout);
    }

    setPieceStyle(figure, {
      placement,
      decay,
      index,
      rng,
    });

    stage.append(figure);
  });
}

function setPieceStyle(element, { placement, decay, index, rng }) {
  element.style.setProperty('--x', `${(placement.x * 100).toFixed(3)}%`);
  element.style.setProperty('--y', `${(placement.y * 100).toFixed(3)}%`);
  element.style.setProperty('--w', `${(placement.w * 100).toFixed(3)}%`);
  element.style.setProperty('--h', `${(placement.h * 100).toFixed(3)}%`);
  element.style.setProperty('--rot', `${placement.rotation}deg`);
  element.style.setProperty('--clip', CLIP_SHAPES[placement.clipIndex % CLIP_SHAPES.length]);
  element.style.setProperty('--blend', BLEND_MODES[placement.blendIndex % BLEND_MODES.length]);
  element.style.setProperty('--opacity', String(decay.opacity));
  element.style.setProperty('--sat', String(decay.saturation));
  element.style.setProperty('--con', String(decay.contrast));
  element.style.setProperty('--bright', String(decay.brightness));
  element.style.setProperty('--blur', `${decay.blur}px`);
  element.style.setProperty('--tint', decay.tint);
  element.style.setProperty('--pixel', `${decay.pixel}px`);
  element.style.setProperty('--pixel-alpha', String(decay.pixelAlpha));
  element.style.setProperty('--piece-hue', String(placement.hue));
  element.style.setProperty('--delay', `${range(rng, -8, 0).toFixed(2)}s`);
  element.style.setProperty('--duration', `${range(rng, 18, 34).toFixed(2)}s`);
  element.style.setProperty('--drift-x', `${placement.driftX}px`);
  element.style.setProperty('--drift-y', `${placement.driftY}px`);
  element.style.zIndex = String(placement.z ?? index + 1);
}
