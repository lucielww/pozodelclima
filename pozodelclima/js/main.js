// Punto de entrada del Paso 2.
// Flujo: seed -> portada -> ubicación -> clima -> selección -> dispersión -> lente.
// El clima es invisible: solo se lee en ?debug=1.

import { CONFIG } from './config.js';
import { createSeedImages } from './seed/images.js';
import { fetchWeather } from './weather/open-meteo.js';
import { neutralProfile, profileFromMock, profileFromWeather } from './weather/profile.js';
import { selectPieces } from './composition/select.js';
import { layoutPieces } from './composition/layout.js';
import { renderGallery } from './render/gallery.js';
import { initEntry } from './ui/entry.js';
import { initAbout } from './ui/about.js';
import { requestLocation } from './ui/location.js';
import { initLens } from './ui/lens.js';
import { initDebug } from './ui/debug.js';
import { state } from './state.js';

const params = new URLSearchParams(window.location.search);
const debug = CONFIG.debug || params.get('debug') === '1';
const mockProfile = profileFromMock(params.get('mock'));

state.debug = debug;

const stage = document.querySelector('#stage');
const status = document.querySelector('#entry-status');

if (!stage) {
  throw new Error('Falta el campo de fragmentos en el documento.');
}

function createSessionId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function localDateKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

const seedReady = createSeedImages()
  .then((pieces) => {
    state.seedPieces = pieces;
    state.pieces = pieces;
    state.ready = true;
    return pieces;
  })
  .catch((error) => {
    console.error('No se pudo generar el seed:', error);
    state.ready = true;
    return [];
  });

let compositionMeta = null;
const updateDebug = debug ? initDebug() : null;

initAbout();
initLens({ stage, getState: () => state });

function paint() {
  const placements = layoutPieces(state.selected, {
    width: window.innerWidth,
    height: window.innerHeight,
    profile: state.profile,
    seed: `${state.compositionSeed}|layout`,
  });

  state.placements = placements;

  renderGallery(stage, placements, {
    debug,
    profile: state.profile,
    seed: state.compositionSeed,
  });

  if (updateDebug) updateDebug(state, compositionMeta);
}

async function enterPozo() {
  let location = {
    lat: CONFIG.defaultCity.lat,
    lon: CONFIG.defaultCity.lon,
    source: 'default',
  };
  let weather = null;

  if (mockProfile) {
    state.weatherSource = 'mock';
    state.locationSource = 'mock';
  } else {
    location = await requestLocation();
    state.locationSource = location.source;
    state.weatherSource = 'consultando';

    if (status) status.textContent = 'eligiendo materia…';

    weather = await fetchWeather(location);
    state.weatherSource = weather ? 'open-meteo' : 'neutral';
  }

  state.mock = mockProfile?.mock ?? null;
  state.profile = mockProfile ?? (weather ? profileFromWeather(weather) : neutralProfile());
  state.sessionId = createSessionId();
  state.compositionSeed = `${state.profile.seedBase}|${localDateKey()}|${state.sessionId}`;

  const selection = selectPieces(state.pieces, state.profile, {
    seed: `${state.compositionSeed}|select`,
    mobile: window.innerWidth < 720,
  });

  state.selected = selection.items;
  state.selectionMeta = selection.meta;
  compositionMeta = selection.meta;
  state.entered = true;

  paint();
}

initEntry({
  stage,
  ready: seedReady,
  onEnter: enterPozo,
});

let resizeTimer = 0;

window.addEventListener('resize', () => {
  if (!state.entered) return;

  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    // Misma selección, nuevas posiciones. La composición no se rehace.
    paint();
  }, 180);
}, { passive: true });

// Si el seed tarda, la portada lo dice sin bloquear la lectura.
seedReady.then((pieces) => {
  if (!state.entered && status && pieces.length === 0) {
    status.textContent = 'la materia no cargó. igual podés entrar al pozo vacío.';
  }
});
