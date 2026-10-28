// Panel de ubicación.
// Se pide una sola vez por entrada. La coordenada se redondea y no se guarda.
// Si la persona no comparte ubicación, se usa la ciudad por defecto de CONFIG.

import { CONFIG } from '../config.js';
import { geocodeCity } from '../weather/open-meteo.js';

const FOCUSABLE = 'button, input, [tabindex]:not([tabindex="-1"])';

function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}

function resultLabel(result) {
  return [result.name, result.admin1, result.country]
    .filter(Boolean)
    .join(' · ');
}

export function requestLocation() {
  const overlay = document.querySelector('#location');
  const share = document.querySelector('#location-share');
  const skip = document.querySelector('#location-skip');
  const city = document.querySelector('#location-city');
  const searchWrap = document.querySelector('#location-search-wrap');
  const query = document.querySelector('#location-query');
  const search = document.querySelector('#location-search');
  const results = document.querySelector('#location-results');
  const status = document.querySelector('#location-status');

  if (!overlay || !share || !skip || !city || !searchWrap || !query || !search || !results || !status) {
    return Promise.resolve({
      lat: CONFIG.defaultCity.lat,
      lon: CONFIG.defaultCity.lon,
      source: 'default',
    });
  }

  return new Promise((resolve) => {
    let done = false;
    let controller = null;

    function setStatus(message) {
      status.textContent = message;
    }

    function clearResults() {
      results.replaceChildren();
    }

    function settle(location) {
      if (done) return;

      done = true;
      if (controller) controller.abort();
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
      query.value = '';
      clearResults();
      resolve(location);
    }

    function useDefault() {
      settle({
        lat: CONFIG.defaultCity.lat,
        lon: CONFIG.defaultCity.lon,
        source: 'default',
      });
    }

    function usePosition(position) {
      if (done) return;

      const lat = Number(position?.coords?.latitude);
      const lon = Number(position?.coords?.longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        share.disabled = false;
        setStatus('no pudimos leer la ubicación. probá buscando una ciudad.');
        return;
      }

      settle({
        lat: round2(lat),
        lon: round2(lon),
        source: 'geo',
      });
    }

    function revealCitySearch() {
      searchWrap.hidden = false;
      city.setAttribute('aria-expanded', 'true');
    }

    function geoError(error) {
      if (done) return;

      share.disabled = false;
      revealCitySearch();
      query.focus({ preventScroll: true });

      if (error?.code === 1) {
        setStatus('no nos diste permiso. podés buscar una ciudad o seguir sin ubicación.');
      } else if (error?.code === 3) {
        setStatus('la ubicación tardó demasiado. probá de nuevo o buscá una ciudad.');
      } else {
        setStatus('no pudimos ubicarte. probá de nuevo o buscá una ciudad.');
      }
    }

    async function runSearch() {
      const text = query.value.trim();

      if (text.length < 2) {
        setStatus('escribí al menos dos letras.');
        query.focus();
        return;
      }

      if (controller) controller.abort();
      const request = new AbortController();
      controller = request;

      results.replaceChildren();
      search.disabled = true;
      setStatus('buscando…');

      const found = await geocodeCity(text, { signal: request.signal });

      if (done || controller !== request) return;

      search.disabled = false;

      if (found.length === 0) {
        setStatus('no encontramos esa ciudad. probá con otro nombre.');
        return;
      }

      setStatus('elegí una coincidencia.');

      for (const result of found) {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'location__result';
        button.textContent = resultLabel(result);
        button.addEventListener('click', () => {
          settle({
            lat: round2(result.lat),
            lon: round2(result.lon),
            source: 'city',
          });
        });
        item.append(button);
        results.append(item);
      }
    }

    share.addEventListener('click', () => {
      if (!navigator.geolocation) {
        setStatus('este navegador no puede ubicarte. buscá una ciudad o seguí sin ubicación.');
        return;
      }

      share.disabled = true;
      setStatus('pidiendo permiso…');
      navigator.geolocation.getCurrentPosition(usePosition, geoError, {
        enableHighAccuracy: false,
        maximumAge: 300000,
        timeout: 8000,
      });
    });

    skip.addEventListener('click', useDefault);
    search.addEventListener('click', runSearch);

    city.addEventListener('click', () => {
      revealCitySearch();
      query.focus({ preventScroll: true });
    });

    query.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        runSearch();
      }
    });

    // El peor caso de una búsqueda vacía es volver al pozo por defecto.
    document.addEventListener('keydown', (event) => {
      if (done || overlay.hidden) return;

      if (event.key === 'Escape') {
        useDefault();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(overlay.querySelectorAll(FOCUSABLE)).filter((node) => {
        return node.offsetParent !== null && !node.disabled;
      });

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    share.focus({ preventScroll: true });
  });
}
