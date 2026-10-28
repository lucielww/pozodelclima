// Open-Meteo: clima actual y geocodificación de ciudades.
// Sin clave, sin persistencia y sin mostrar el resultado en la interfaz.
// Una consulta por entrada; el resto de la visita trabaja con el perfil en memoria.

import { CONFIG } from '../config.js';

const WEATHER_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'is_day',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
].join(',');

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function toNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

async function fetchJson(url, { signal, timeoutMs = CONFIG.weather.timeoutMs } = {}) {
  const controller = new AbortController();
  let timedOut = false;

  const abortFromOutside = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', abortFromOutside, { once: true });
  }

  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo respondió ${response.status}.`);
    }

    return await response.json();
  } catch (error) {
    if (timedOut) throw new Error('Open-Meteo agotó el tiempo de espera.');
    throw error;
  } finally {
    window.clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', abortFromOutside);
  }
}

// Redondeo a dos decimales: la coordenada exacta no sale del navegador.
export function roundCoordinate(value) {
  return Math.round(value * 100) / 100;
}

export async function fetchWeather({ lat, lon, signal } = {}) {
  if (!isFiniteNumber(lat) || !isFiniteNumber(lon)) return null;

  const url = new URL(CONFIG.weather.endpoint);
  url.searchParams.set('latitude', roundCoordinate(lat).toFixed(2));
  url.searchParams.set('longitude', roundCoordinate(lon).toFixed(2));
  url.searchParams.set('current', WEATHER_FIELDS);
  url.searchParams.set('timezone', 'auto');

  try {
    const data = await fetchJson(url, { signal });
    const current = data?.current;
    if (!current) return null;

    const wind = toNumber(current.wind_speed_10m, 0);
    const temperature = toNumber(current.temperature_2m, 15);

    return {
      temperature,
      humidity: toNumber(current.relative_humidity_2m, 60),
      isDay: current.is_day !== 0,
      precipitation: toNumber(current.precipitation, 0),
      code: toNumber(current.weather_code, 3),
      cloud: toNumber(current.cloud_cover, 50),
      wind,
      gusts: toNumber(current.wind_gusts_10m, wind),
      windDirection: toNumber(current.wind_direction_10m, 0),
    };
  } catch (error) {
    if (signal?.aborted) return null;
    // El fallo se resuelve con un perfil neutro; no se escribe en consola.
    return null;
  }
}

export async function geocodeCity(query, { signal, limit = CONFIG.weather.geocodingCount } = {}) {
  const text = String(query ?? '').trim();
  if (text.length < 2) return [];

  const url = new URL(CONFIG.weather.geocodingEndpoint);
  url.searchParams.set('name', text);
  url.searchParams.set('count', String(limit));
  url.searchParams.set('language', CONFIG.weather.language);
  url.searchParams.set('format', 'json');

  try {
    const data = await fetchJson(url, {
      signal,
      timeoutMs: CONFIG.weather.geocodingTimeoutMs,
    });

    const results = Array.isArray(data?.results) ? data.results : [];

    return results
      .filter((item) => {
        return isFiniteNumber(item.latitude) && isFiniteNumber(item.longitude);
      })
      .map((item) => ({
        id: String(item.id ?? `${item.latitude},${item.longitude}`),
        name: String(item.name ?? ''),
        admin1: String(item.admin1 ?? ''),
        country: String(item.country ?? ''),
        lat: item.latitude,
        lon: item.longitude,
      }))
      .slice(0, limit);
  } catch (error) {
    if (signal?.aborted) return [];
    return [];
  }
}
