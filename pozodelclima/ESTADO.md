# ESTADO — POZO DEL CLIMA

Última actualización: **18 de noviembre de 2026**.

Este archivo registra el avance real del proyecto para poder retomarlo en otra
máquina o en otra sesión. El plan congelado es `PLAN.md`: si algo no coincide,
manda el plan. Acá solo se anota qué está hecho, cómo se verificó y qué sigue.

---

## 1. Retomar en otra PC

1. Copiar la carpeta completa del proyecto. No hay build, `node_modules`,
   variables de entorno ni base de datos local: son solo archivos estáticos
   (el material del seed se genera en el navegador).
2. Servir la carpeta por HTTP (abrir `index.html` con doble click **no**
   funciona: los módulos ES requieren `http://` o `https://`).
3. Abrir `http://localhost:8000` (o `http://127.0.0.1:8000`) y comprobar la
   portada.
4. Leer la sección «Siguiente paso» y ejecutar **solo** el paso indicado.

No hace falta instalar nada para los Pasos 1 a 3. Los Pasos 4 y 5 sí van a
requerir configurar Supabase (ver «Configuración externa pendiente»).

### Cómo servir localmente

Cualquiera de estas opciones sirve la raíz del proyecto:

```text
python -m http.server 8000
npx --yes serve -l 8000 .
php -S localhost:8000
```

En Windows sin Python ni Node:

```text
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```

`serve.ps1` es una herramienta de desarrollo incluida en el repo. No forma
parte de la obra ni se necesita en producción. Se detiene con `Ctrl+C`.

### URLs de verificación

| URL | Qué muestra |
|---|---|
| `/` | Portada |
| `/?debug=1` | Campo + panel de debug con perfil, fuente y selección |
| `/?mock=rain` | Composición con un clima simulado (sin panel) |
| `/?debug=1&mock=storm` | Lo anterior + datos internos |

Mocks disponibles: `clear`, `cloud`, `rain`, `storm`, `fog`, `snow`, `night`,
`heat`. Sin `debug=1` no aparece ningún panel ni etiqueta de desarrollo.

---

## 2. Estado por paso

| Paso | Estado |
|---|---|
| 1 — Esqueleto, umbral y seed procedural | Completado |
| 2 — Clima invisible, selección y dispersión | **Completado y verificado (18/11/2026)** |
| 3 — Audio donado | **Completado y verificado (18/11/2026)** |
| 4 — Supabase: lectura compartida | Pendiente (siguiente, requiere aprobación) |
| 5 — Donación, análisis y aprobación | Pendiente |
| 6 — Pulido, accesibilidad y despliegue | Pendiente |
| 7 — Video | Opcional; no ejecutar sin aprobación |

---

## 3. Qué está implementado (Pasos 1 a 3)

### Flujo actual

Portada → click en «entrar» → panel de ubicación → consulta a Open-Meteo
(una sola vez) → perfil climático interno → selección 80/20 de imágenes →
selección de 1–2 audios por afinidad sonora → dispersión → fermentación →
campo fijo durante la visita. El audio se reproduce en loop con fades largos; el
clima modula filtro, `playbackRate`, bitcrush y paneo. La lente abre una pieza
sin reordenar nada; si es audio, suena sola.

### Archivos y responsabilidades

```text
index.html                 Portada, panel de ubicación, acerca de
css/base.css               Variables, reset, tipografía, reduced motion
css/ui.css                 Portada, botones, ubicación, acerca de, lente, mute, debug
css/collage.css            Campo, piezas, recortes, glitch, deriva, waveforms

js/main.js                 Orquestación de la entrada, el pintado y el audio
js/config.js               Título, ciudad default, Supabase vacío, flags
js/state.js                Estado mínimo compartido

js/seed/prng.js            xmur3 + mulberry32 (determinismo)
js/seed/images.js          8 imágenes procedurales de data decay
js/seed/audio.js           3 texturas de audio de 12 s renderizadas offline
js/analysis/color.js       Media HSL, brillo, saturación, k-means 3–5 colores
js/analysis/fft.js         FFT radix-2, ventana de Hann, magnitudes
js/analysis/audio.js       RMS, centroide, planitud, ZCR y envolvente

js/weather/open-meteo.js   Forecast + geocoding, timeout, redondeo a 2 dec.
js/weather/profile.js      WMO → estado interno → perfil (hue, densidad, etc.)

js/audio/engine.js         Buffers en loop, fades, filtro, crush, paneo, mute

js/composition/select.js   Selección 80/20 de imágenes y 1–2 audios afines
js/composition/layout.js   Dispersión hue→ángulo, brillo→radio, relajación
js/composition/decay.js    Variables CSS de fermentación

js/render/gallery.js       DOM del campo, recortes, blends, waveforms, debug

js/ui/entry.js             Entrada, desbloqueo de audio y estados de carga
js/ui/about.js             Overlay «acerca de» accesible
js/ui/location.js          Geolocalización, búsqueda de ciudad, default
js/ui/lens.js              Lente de imagen y de audio (click/Enter, Esc, foco)
js/ui/debug.js             Panel de `?debug=1`

LICENSE                    CC0 1.0
PLAN.md                    Plan congelado por pasos
ESTADO.md                  Este archivo
serve.ps1                  Servidor estático de desarrollo (Windows)
```

Todavía no existen: `js/supabase/`, `js/upload/`, `js/storage/`,
`js/ui/donate.js`, `js/ui/notice.js`, `js/analysis/file.js`,
`js/analysis/audio-worker.js`, `contacto.html`, `supabase/schema.sql`,
`supabase/storage.sql`, `css/donate.css`, `netlify.toml`. Corresponden a los
Pasos 4 a 6.

---

## 4. Verificación hecha el 18/11/2026

Navegador: Chromium del entorno de desarrollo, servidor estático local.

| Prueba | Resultado |
|---|---|
| Portada en escritorio (1296×894) | Sin scroll, sin errores de consola |
| Entrar y ver el campo | 8 imágenes del seed + 1–2 audios, portada oculta |
| Geolocalización denegada | Aparece búsqueda de ciudad + mensaje + default |
| Búsqueda de ciudad (Córdoba) | Geocoding y forecast reales; perfil `open-meteo · city` |
| Open-Meteo caído (endpoint inválido) | Perfil `neutral`; el campo sigue funcionando |
| Los 8 `?mock=` | Cambian perfil, densidad, dispersión, fermentación y audio |
| Selección 80/20 con el seed | 6 afinidad + 2 contraste; distancias en debug |
| Lente de imagen | Abre con click y con Enter; cierra con Esc; foco vuelve |
| Lente de audio | Orbe + waveform; la capa suena sola; al cerrar vuelve la mezcla |
| Resize | Misma selección y mismas posiciones |
| Dos entradas seguidas | Selección/orden distintos; estable dentro de la visita |
| Móvil (iframe 390×844) | 5–7 imágenes + 2 audios, sin scroll, tap funciona |
| `?debug=1` / `?mock=` sin panel | Solo aparecen con query param |
| Portada tras la corrección | Título en una línea; los slices quedan superpuestos (opacidad 0 fuera del glitch) |
| Cierre de ubicación, lente y acerca de | Foco devuelto antes de ocultar; sin warnings de `aria-hidden` |
| `serve.ps1` | Responde en `localhost` y en `127.0.0.1`; rechaza rutas fuera de la carpeta |
| Lighthouse (portada) | Accesibilidad 100, buenas prácticas 100, SEO 100 |
| Audio del seed | 3 texturas de 12 s; WAV RIFF 44.1 kHz mono 16 bits, decodificado con RMS > 0 |
| Features de audio | RMS, centroide, planitud, ZCR y envolvente normalizada por tramo |
| Capas por mock | 2 capas en clear/cloud/rain/fog/snow/night/heat; 1 en storm |
| Modulación por clima | rate 0.89–1.10; filtro 1670–3909 Hz; crush solo con decay > 0.45 |
| Fade de entrada | Nivel RMS medido: 0.00 al entrar, 0.02–0.03 a los 9 s |
| Mute | Nivel cae a 0; `aria-pressed` y etiqueta cambian |
| Pestaña oculta (evento simulado) | Contexto `pausado` y animaciones `paused`; al volver, `activo` |
| Consola | Sin errores en los 8 mocks, la lente de audio y el mute |

No se pudo automatizar el caso «permiso de geolocalización **concedido**»
(el navegador de prueba no concede el permiso). Sí se verificó el flujo
denegado y el de búsqueda de ciudad con clima real. Conviene probar el caso
concedido a mano en Chrome/Safari/iOS.

---

## 5. Cambios hechos en esta sesión

- `index.html`, `css/ui.css`: el título de portada se anunciaba tres veces a
  lectores de pantalla porque las capas de glitch usaban
  `content: attr(data-text)`. Se pasó a dos `<span>` con `aria-hidden="true"`
  dentro del `h1`. La primera pasada dejó el HTML nuevo pero el CSS viejo: los
  spans se veían como tres títulos apilados. Se completó el cambio con reglas
  `.title__slice` (posición absoluta, `clip-path` y las animaciones existentes)
  y se eliminaron los pseudo-elementos. Ahora el título ocupa una línea.
- `js/ui/location.js`, `js/ui/lens.js`, `js/ui/about.js`: el foco se devuelve
  **antes** de ocultar el overlay y poner `aria-hidden`. Antes Chromium
  bloqueaba el `aria-hidden` del panel de ubicación («Blocked aria-hidden on an
  element because its descendant retained focus», con foco en
  `#location-skip`).
- `serve.ps1`: el chequeo de ruta ahora compara con el separador final (no
  acepta una carpeta hermana con el mismo prefijo) y el listener atiende
  también `http://127.0.0.1:8000` además de `localhost`.
- **Paso 3 — audio donado:**
  - `js/seed/audio.js`: 3 texturas deterministas de 12 s renderizadas con
    `OfflineAudioContext` (drone, granos y grilla de clicks), codificadas a WAV
    PCM y entregadas como `blob:` igual que una donación.
  - `js/analysis/fft.js` y `js/analysis/audio.js`: FFT radix-2, ventana de Hann,
    RMS, pico, centroide, planitud, ZCR y envolvente por tramos. El color de
    cada audio sale del espectro.
  - `js/audio/engine.js`: grafo buffer → gain (fade) → filtro → waveshaper
    opcional → paneo → master → analizador → salida. `playbackRate` 0.85–1.15,
    filtro y crush derivados del perfil, mute, solo de lente y pausa al ocultar
    la pestaña.
  - `js/composition/select.js`: selección de 1–2 audios por afinidad
    (centroide, planitud y, con poco peso, RMS). `layout.js`, `gallery.js`,
    `lens.js`, `entry.js`, `main.js`, `state.js` y `debug.js` incorporan el
    audio, la lente sonora y los datos internos.
  - `css/collage.css` y `css/ui.css`: waveforms de campo, orbe y envolvente de
    la lente, botón de sonido y pausa de animaciones con la pestaña oculta.
  - Error detectado y corregido durante la verificación: al hacer opcional el
    waveshaper, el nodo de paneo quedó sin conectar al master y todo sonaba en
    silencio aunque las capas existieran. Se vio con el nivel RMS del analizador
    en debug; se agregó `pan.connect(master)` y se volvió a medir.
- `ESTADO.md`: actualización de esta bitácora.

El clima sigue siendo invisible: el audio no muestra nombres ni estados, solo
materia sonora. No hay sonidos de lluvia, viento ni truenos.

---

## 6. Comportamiento que no se debe romper

- El clima nunca se nombra ni se muestra en la UI. Solo en `?debug=1`.
- No hay autoría, créditos, títulos por pieza, nombres de archivo ni metadatos
  visibles.
- La composición se genera una vez por entrada y queda fija durante la visita.
  No hay «revolver», polling ni recomposición a mitad de visita.
- Si el clima o la red fallan, la obra sigue funcionando (perfil neutro, seed).
- Sin scroll: portada y campo ocupan el viewport.
- Licencia CC0 para obra, donaciones y código.
- Sin frameworks, sin build, sin npm y sin servidor propio.

---

## 7. Deuda conocida (candidata al Paso 6)

- En móvil se ven 7 de 8 imágenes: el factor 0.6 queda limitado por el pool de
  8 imágenes del seed. Se va a notar recién cuando haya donaciones aprobadas.
- En móvil el campo tiende a agruparse arriba a la izquierda (solapamiento
  máximo 0.77 con audio, justo en el umbral de relajación). Revisar dispersión.
- `Esc` dentro del buscador de ciudad cierra todo el panel y entra con Buenos
  Aires; sería mejor que el primer `Esc` limpie la búsqueda.
- `composition/decay.js` calcula `driftX`/`driftY` que no se usan: el render
  usa los de `layout.js`. Limpiar cuando se toque la fermentación.
- `js/ui/location.js` registra listeners de `document` que no se dan de baja al
  resolver. No molesta porque solo hay una entrada por visita; limpiar al
  agregar la re-entrada o el botón de donación.
- El seed de audio renderiza 3 archivos de 12 s al cargar (~1,2 s y ~3 MB de
  WAV en memoria). Se genera junto con las imágenes antes de entrar; si molesta
  en móvil, conviene renderizar solo 1–2 texturas o hacerlo perezoso.
- Los `blob:` de audio no se revocan (`URL.revokeObjectURL`) para permitir
  re-entradas futuras; revisar cuando exista re-entrada o donación.
- Con solo 3 texturas, dos capas pueden ser casi la misma familia (drone +
  granos). La variedad real llega con los audios aprobados del Paso 4/5.
- La pausa al ocultar la pestaña se verificó simulando `visibilitychange`; el
  paso a segundo plano real del sistema operativo queda para la prueba manual.
- No se pudo escuchar la mezcla en este entorno (sin salida de audio): se midió
  el nivel RMS del analizador y se verificó que la ganancia sube desde 0 sin
  saltos. Falta la escucha crítica en Chrome, Safari e iOS.
- El arranque de audio en iOS depende del gesto de entrada; no se probó en un
  dispositivo real.
- El analizador del motor se usa para el nivel de debug; todavía no modula la
  visualización (el orbe es CSS).

---

## 8. Siguiente paso: Paso 4 — Supabase: lectura compartida

Objetivo: configurar Supabase y leer las piezas aprobadas de todos los
visitantes, con bucket privado y URLs firmadas. El seed sigue siendo el
fallback. El Paso 4 requiere aprobación explícita antes de empezar.

Archivos a crear:

```text
supabase/schema.sql
supabase/storage.sql
js/supabase/client.js
js/supabase/pieces.js
```

Archivos a modificar:

```text
js/config.js
js/main.js
js/state.js
js/composition/select.js
js/ui/debug.js
js/storage/local.js (stub de IDs propios)
```

Tareas principales (del `PLAN.md`):

- Proyecto y bucket privado `pozo`; ejecutar schema y storage.
- Tabla `pieces` con checks, índices y `sha256` único.
- RLS: insertar solo `pending`; leer solo `approved`; sin update/delete para
  `anon`.
- Storage: subida anónima `uuid.ext`; lectura solo de aprobados mediante
  función `security definer`; sin update/delete.
- `fetchApprovedPieces()` solo con aprobados; URLs firmadas en lote (1 h) y
  caché en memoria; renovarlas antes de vencer.
- Merge de seed + aprobados, excluyendo IDs propios de `localStorage`.
- Si Supabase falla o está pausado, seguir solo con seed y avisar en debug.
- Nunca `service_role` en el cliente.

Verificación esperada:

- Una pieza aprobada de prueba aparece junto al seed.
- Pendientes y sus archivos no se ven; una URL firmada de un pendiente falla.
- La anon key no puede actualizar ni borrar filas.
- Sin configuración o con Supabase caído, la app sigue con seed.
- `?debug=1` muestra estado de Supabase, cantidad de aprobados y URLs.

Dependencia externa: cuenta y proyecto de Supabase. El SDK ESM se carga por CDN
con versión fijada; no hay build ni npm.

---

## 9. Configuración externa pendiente

- **Open-Meteo**: ya en uso, sin clave. No se guardan coordenadas.
- **Supabase (Paso 4)**: proyecto free, bucket privado `pozo` (12 MB),
  ejecutar `supabase/schema.sql` y `supabase/storage.sql`, copiar `Project URL`
  y `anon public key` en `js/config.js`. Nunca `service_role` en el cliente.
  Si falta configuración o Supabase está pausado, la obra cae al seed.
- **Netlify (Paso 6)**: deploy estático desde la raíz, sin build.
  `contacto.html` con Netlify Forms. Las claves públicas viven en
  `js/config.js`; no hay variables de entorno.
- **Turnstile**: plan B documentado contra spam, no se implementa en la v1.

---

## 10. Registro de sesiones

- **2026-11-18** — Revisión del estado heredado tras una sesión interrumpida
  durante el Paso 2. Se verificó en navegador que el Paso 2 estaba completo;
  se corrigió el título duplicado en accesibilidad y se agregó esta bitácora.
  Próximo: aprobar y ejecutar el Paso 3.
- **2026-11-18** — Segunda revisión, ya en otra PC. Se levantó el proyecto con
  `serve.ps1` y se probaron los 8 mocks, Open-Meteo real, la lente, el panel de
  ubicación, el «acerca de» y Lighthouse (100/100/100), sin errores de consola.
  Se corrigieron tres cosas: el título triplicado en la portada (el CSS había
  quedado atrás), el orden del foco al cerrar overlays (warning de Chromium) y
  dos detalles de `serve.ps1`. Ver sección 5. El Paso 2 queda verificado de
  nuevo; el Paso 3 sigue pendiente de aprobación. Se guardó un respaldo del
  estado verificado en `C:\Users\outlet\Downloads\pozodelclima-paso2-2026-11-18.zip`
  (fuera de la carpeta del proyecto; la máquina no tenía git instalado).
- **2026-11-18** — Tercera sesión. El usuario aprobó el Paso 3. Se implementó el
  audio donado completo (seed offline, FFT y features, motor con fades, mute,
  pausa al ocultar, lente sonora, waveforms y debug). Se verificaron los 8
  mocks, el mute, el nivel RMS de las capas, la lente y el cierre con foco, sin
  errores de consola. Se corrigió un bug de conexión del paneo que dejaba todo
  en silencio. Próximo: aprobar el Paso 4. Respaldo del estado verificado en
  `C:\Users\outlet\Downloads\pozodelclima-paso3-2026-11-18.zip` (29 archivos,
  fuera de la carpeta del proyecto).
