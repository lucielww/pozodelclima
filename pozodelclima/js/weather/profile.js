// Perfil climático interno.
// Traduce Open-Meteo a números y colores que solo usan la composición y el debug.
// Ningún nombre de clima se muestra en la obra.

// Códigos WMO agrupados en estados internos.
const WMO_STATES = new Map([
  [0, 'clear'],
  [1, 'partly'],
  [2, 'partly'],
  [3, 'cloudy'],
  [45, 'fog'],
  [48, 'fog'],
  [51, 'drizzle'],
  [53, 'drizzle'],
  [55, 'drizzle'],
  [56, 'drizzle'],
  [57, 'drizzle'],
  [61, 'rain'],
  [63, 'rain'],
  [65, 'rain'],
  [66, 'rain'],
  [67, 'rain'],
  [71, 'snow'],
  [73, 'snow'],
  [75, 'snow'],
  [77, 'snow'],
  [80, 'rain'],
  [81, 'rain'],
  [82, 'rain'],
  [85, 'snow'],
  [86, 'snow'],
  [95, 'storm'],
  [96, 'storm'],
  [99, 'storm'],
]);

const PRESETS = {
  clear: {
    hue: 46, saturation: 0.70, lightness: 0.64,
    density: 0.34, turbulence: 0.18, decay: 0.26, audio: 0.72,
  },
  partly: {
    hue: 178, saturation: 0.54, lightness: 0.55,
    density: 0.46, turbulence: 0.28, decay: 0.36, audio: 0.56,
  },
  cloudy: {
    hue: 212, saturation: 0.30, lightness: 0.42,
    density: 0.58, turbulence: 0.38, decay: 0.48, audio: 0.38,
  },
  fog: {
    hue: 138, saturation: 0.16, lightness: 0.56,
    density: 0.64, turbulence: 0.22, decay: 0.60, audio: 0.24,
  },
  drizzle: {
    hue: 188, saturation: 0.42, lightness: 0.45,
    density: 0.70, turbulence: 0.44, decay: 0.54, audio: 0.34,
  },
  rain: {
    hue: 205, saturation: 0.58, lightness: 0.36,
    density: 0.82, turbulence: 0.62, decay: 0.66, audio: 0.42,
  },
  snow: {
    hue: 196, saturation: 0.22, lightness: 0.74,
    density: 0.56, turbulence: 0.30, decay: 0.44, audio: 0.20,
  },
  storm: {
    hue: 270, saturation: 0.66, lightness: 0.30,
    density: 0.90, turbulence: 0.95, decay: 0.84, audio: 0.88,
  },
  neutral: {
    hue: 158, saturation: 0.24, lightness: 0.42,
    density: 0.50, turbulence: 0.36, decay: 0.42, audio: 0.40,
  },
};

export const MOCK_STATES = ['clear', 'cloud', 'rain', 'storm', 'fog', 'snow', 'night', 'heat'];

const MOCK_WEATHER = {
  clear: { code: 0, temperature: 24, humidity: 35, cloud: 4, precipitation: 0, wind: 6, gusts: 12, isDay: true },
  cloud: { code: 3, temperature: 16, humidity: 66, cloud: 92, precipitation: 0, wind: 12, gusts: 21, isDay: true },
  rain: { code: 61, temperature: 13, humidity: 91, cloud: 100, precipitation: 4.2, wind: 18, gusts: 30, isDay: true },
  storm: { code: 95, temperature: 22, humidity: 86, cloud: 100, precipitation: 12, wind: 35, gusts: 62, isDay: true },
  fog: { code: 45, temperature: 9, humidity: 98, cloud: 100, precipitation: 0, wind: 2, gusts: 5, isDay: true },
  snow: { code: 71, temperature: -2, humidity: 80, cloud: 100, precipitation: 2, wind: 10, gusts: 18, isDay: true },
  night: { code: 0, temperature: 12, humidity: 60, cloud: 20, precipitation: 0, wind: 4, gusts: 8, isDay: false },
  heat: { code: 0, temperature: 38, humidity: 30, cloud: 0, precipitation: 0, wind: 8, gusts: 15, isDay: true },
};

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function stateFromCode(code) {
  return WMO_STATES.get(Number(code)) ?? 'cloudy';
}

function normalizeHue(value) {
  return ((value % 360) + 360) % 360;
}

function mixHue(from, to, amount) {
  const delta = ((to - from + 540) % 360) - 180;
  return normalizeHue(from + delta * amount);
}

export function neutralProfile() {
  return profileFromWeather(
    { code: 3, temperature: 16, humidity: 60, cloud: 55, precipitation: 0, wind: 8, gusts: 14, isDay: true },
    { neutral: true },
  );
}

export function profileFromWeather(weather, options = {}) {
  const safe = weather ?? {};
  const state = options.neutral ? 'neutral' : stateFromCode(safe.code);
  const preset = PRESETS[state] ?? PRESETS.neutral;

  const cloud = clamp(Number(safe.cloud ?? 50) / 100, 0, 1);
  const humidity = clamp(Number(safe.humidity ?? 60) / 100, 0, 1);
  const precipitation = clamp(Number(safe.precipitation ?? 0) / 12, 0, 1);
  const wind = clamp(Number(safe.wind ?? 0) / 50, 0, 1);
  const gusts = clamp(Number(safe.gusts ?? safe.wind ?? 0) / 80, 0, 1);
  const temperature = Number(safe.temperature ?? 16);
  const heat = clamp((temperature + 5) / 45, 0, 1);
  const night = safe.isDay === false;

  let hue = preset.hue;
  let saturation = clamp(
    preset.saturation + (1 - cloud) * 0.10 - humidity * 0.05 + (heat > 0.8 ? 0.08 : 0),
    0.06,
    0.95,
  );
  let lightness = clamp(
    preset.lightness - cloud * 0.10 + heat * 0.05 - (night ? 0.08 : 0),
    0.12,
    0.82,
  );

  // El calor extremo corre el tono hacia el naranja; la noche hacia el azul profundo.
  if (heat > 0.8) {
    const amount = (heat - 0.8) / 0.2;
    hue = mixHue(hue, 22, amount * 0.85);
    saturation = clamp(saturation + amount * 0.08, 0.06, 0.95);
  }

  if (night) {
    hue = mixHue(hue, 224, 0.55);
    saturation = clamp(saturation * 0.82, 0.05, 0.85);
    lightness = clamp(lightness * 0.78, 0.12, 0.62);
  }

  const density = clamp(
    preset.density * 0.72 + cloud * 0.20 + precipitation * 0.22 + (night ? 0.04 : 0),
    0,
    1,
  );

  const turbulence = clamp(
    preset.turbulence * 0.68 + wind * 0.20 + gusts * 0.16 + precipitation * 0.18,
    0,
    1,
  );

  const decay = clamp(
    preset.decay * 0.78 + humidity * 0.10 + precipitation * 0.18 + (night ? 0.08 : 0),
    0,
    1,
  );

  const audioCharacter = clamp(
    preset.audio + (1 - humidity) * 0.10 - decay * 0.08,
    0,
    1,
  );

  const seedBase = [
    state,
    Math.round(temperature),
    Math.round(humidity * 100),
    Math.round(cloud * 100),
    options.mock ?? '',
  ].join('-');

  return {
    state,
    mock: options.mock ?? null,
    neutral: Boolean(options.neutral),
    hue,
    saturation,
    lightness,
    brightness: lightness,
    density,
    heat,
    humidity,
    turbulence,
    decay,
    night,
    audioCharacter,
    expansion: clamp(0.34 + (1 - density) * 0.34 + turbulence * 0.32, 0, 1),
    seedBase,
    weather: {
      temperature,
      humidity: humidity * 100,
      cloud: cloud * 100,
      precipitation: Number(safe.precipitation ?? 0),
      wind: Number(safe.wind ?? 0),
      gusts: Number(safe.gusts ?? safe.wind ?? 0),
      code: Number(safe.code ?? 3),
      isDay: !night,
    },
  };
}

export function profileFromMock(name) {
  if (!MOCK_STATES.includes(name)) return null;
  return profileFromWeather(MOCK_WEATHER[name], { mock: name });
}
