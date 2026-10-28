// Estado mínimo de la obra. Sin framework ni reactividad: el render se llama a mano.

export const state = {
  entered: false,
  ready: false,
  debug: false,
  pieces: [],
  seedPieces: [],
  sessionId: '',
  mock: null,
  profile: null,
  weatherSource: null,
  locationSource: null,
  compositionSeed: '',
  selected: [],
  selectionMeta: null,
  placements: [],
};
