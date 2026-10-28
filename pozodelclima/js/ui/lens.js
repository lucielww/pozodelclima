// Lente: abre una pieza en su versión compostada.
// No reordena el campo ni cambia la selección. Esc cierra y el foco vuelve.

import { buildDecay } from '../composition/decay.js';

export function initLens({ stage, getState }) {
  const lens = document.createElement('section');
  lens.className = 'lens';
  lens.hidden = true;
  lens.setAttribute('role', 'dialog');
  lens.setAttribute('aria-modal', 'true');
  lens.setAttribute('aria-label', 'fragmento ampliado');
  lens.setAttribute('aria-hidden', 'true');

  lens.innerHTML = `
    <div class="lens__backdrop" data-lens-close></div>
    <div class="lens__panel">
      <button class="lens__close" type="button" data-lens-close aria-label="cerrar fragmento">×</button>
      <div class="lens__frame">
        <img class="lens__image" alt="" decoding="sync" draggable="false">
      </div>
    </div>
  `;

  document.body.append(lens);

  const panel = lens.querySelector('.lens__panel');
  const frame = lens.querySelector('.lens__frame');
  const image = lens.querySelector('.lens__image');
  const closeButton = lens.querySelector('.lens__close');
  let lastFocus = null;

  function close() {
    if (lens.hidden) return;

    lens.hidden = true;
    lens.setAttribute('aria-hidden', 'true');
    stage.inert = false;

    if (lastFocus instanceof HTMLElement) {
      lastFocus.focus({ preventScroll: true });
    }
  }

  function open(pieceId) {
    const state = getState();
    const index = state.placements.findIndex((placement) => placement.piece.id === pieceId);
    if (index < 0) return;

    const placement = state.placements[index];
    const piece = placement.piece;
    const decay = buildDecay(state.profile, placement, index, state.compositionSeed);

    lastFocus = document.activeElement;

    image.src = piece.src;
    image.width = piece.width;
    image.height = piece.height;

    frame.style.setProperty('--sat', String(decay.saturation));
    frame.style.setProperty('--con', String(decay.contrast));
    frame.style.setProperty('--bright', String(decay.brightness));
    frame.style.setProperty('--blur', `${decay.blur}px`);
    frame.style.setProperty('--tint', decay.tint);
    frame.style.setProperty('--pixel', `${decay.pixel}px`);
    frame.style.setProperty('--pixel-alpha', String(decay.pixelAlpha));
    frame.style.setProperty('--piece-hue', String(placement.hue));

    lens.hidden = false;
    lens.setAttribute('aria-hidden', 'false');
    stage.inert = true;
    closeButton.focus({ preventScroll: true });
  }

  stage.addEventListener('click', (event) => {
    const piece = event.target.closest('.piece');
    if (!piece) return;
    open(piece.dataset.id);
  });

  stage.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const piece = event.target.closest('.piece');
    if (!piece) return;

    event.preventDefault();
    open(piece.dataset.id);
  });

  lens.addEventListener('click', (event) => {
    if (event.target.closest('[data-lens-close]')) close();
  });

  document.addEventListener('keydown', (event) => {
    if (lens.hidden) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      closeButton.focus();
    }
  });

  return { open, close };
}
