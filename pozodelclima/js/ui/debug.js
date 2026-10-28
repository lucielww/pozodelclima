// Panel de desarrollo para ?debug=1.
// Muestra el perfil, la fuente y la selección. Nunca aparece sin el parámetro.

function fixed(value, digits = 2) {
  return Number(value ?? 0).toFixed(digits);
}

export function initDebug() {
  const panel = document.createElement('aside');
  panel.className = 'debug-panel';
  panel.setAttribute('aria-label', 'datos de desarrollo');
  panel.hidden = true;

  const title = document.createElement('p');
  title.className = 'debug-panel__title';
  title.textContent = 'debug · clima interno';

  const body = document.createElement('pre');
  body.className = 'debug-panel__body';

  panel.append(title, body);
  document.body.append(panel);

  return function updateDebug(state, meta) {
    const profile = state.profile;
    if (!profile) return;

    panel.hidden = false;

    const lines = [
      `estado      ${profile.state}`,
      `fuente      ${[state.weatherSource, state.locationSource].filter(Boolean).filter((value, index, all) => all.indexOf(value) === index).join(' · ') || '—'}`,
      `perfil      H ${fixed(profile.hue, 1)} · S ${fixed(profile.saturation)} · L ${fixed(profile.lightness)}`,
      `            dens ${fixed(profile.density)} · turb ${fixed(profile.turbulence)} · decay ${fixed(profile.decay)}`,
      `            heat ${fixed(profile.heat)} · night ${profile.night ? 'sí' : 'no'}`,
      `selección   ${meta?.count ?? state.selected.length}/${meta?.desired ?? '—'} · afinidad ${meta?.affinityCount ?? '—'} · contraste ${meta?.contrastCount ?? '—'}`,
      `campo       ${window.innerWidth}×${window.innerHeight} · ${window.innerWidth < 720 ? 'móvil' : 'desktop'}`,
      `sesión      ${state.sessionId}`,
      '',
      'piezas',
    ];

    for (const item of state.selected) {
      const features = item.piece.features ?? {};
      lines.push(
        `${item.piece.id.padEnd(16)} d ${fixed(item.distance, 3)}  ${item.group.slice(0, 4).padEnd(4)}  H ${fixed(features.mean?.h, 0)}  B ${fixed(features.brightness)}  S ${fixed(features.saturation)}`,
      );
    }

    body.textContent = lines.join('\n');
  };
}
