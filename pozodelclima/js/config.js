// Configuración pública de la obra.
// La anon key de Supabase es pública por diseño: la seguridad real vive en RLS.
// No guardar acá ninguna clave privada ni service_role.

export const CONFIG = {
  title: 'POZO DEL CLIMA',

  // Fallback cuando el visitante no comparte ubicación.
  defaultCity: {
    name: 'Buenos Aires',
    lat: -34.60,
    lon: -58.38,
  },

  // Se completa en el Paso 4. Si queda vacío, la obra funciona solo con el seed.
  supabase: {
    url: '',
    anonKey: '',
  },

  seed: {
    imageCount: 8,
  },

  weather: {
    endpoint: 'https://api.open-meteo.com/v1/forecast',
    geocodingEndpoint: 'https://geocoding-api.open-meteo.com/v1/search',
    timeoutMs: 9000,
    geocodingTimeoutMs: 7000,
    geocodingCount: 5,
    language: 'es',
  },

  composition: {
    minCount: 6,
    maxCount: 18,
    hardCap: 24,
    mobileFactor: 0.6,
    affinityRatio: 0.8,
  },

  // Se usa en el Paso 5 para el formulario de contacto.
  contactPath: 'contacto.html',

  debug: false,
};
