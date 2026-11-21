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

No hace falta instalar nada para los Pasos 1 y 2. Los Pasos 4 y 5 sí van a
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
| 3 — Audio donado | Pendiente (siguiente, requiere aprobación) |
| 4 — Supabase: lectura compartida | Pendiente |
| 5 — Donación, análisis y aprobación | Pendiente |
| 6 — Pulido, accesibilidad y despliegue | Pendiente |
| 7 — Video | Opcional; no ejecutar sin aprobación |

---

## 3. Qué está implementado (Pasos 1 y 2)

### Flujo actual

Portada → click en «entrar» → panel de ubicación → consulta a Open-Meteo
(una sola vez) → perfil climático interno → selección 80/20 → dispersión →
fermentación → campo fijo durante la visita. La lente abre una pieza sin
reordenar nada.

### Archivos y responsabilidades

```text
index.html                 Portada, panel de ubicación, acerca de
css/base.css               Variables, reset, tipografía, reduced motion
css/ui.css                 Portada, botones, ubicación, acerca de, lente, debug
css/collage.css            Campo, piezas, recortes, glitch, deriva

js/main.js                 Orquestación de la entrada y el pintado
js/config.js               Título, ciudad default, Supabase vacío, flags
js/state.js                Estado mínimo compartido

js/seed/prng.js            xmur3 + mulberry32 (determinismo)
js/seed/images.js          8 imágenes procedurales de data decay
js/analysis/color.js       Media HSL, brillo, saturación, k-means 3–5 colores

js/weather/open-meteo.js   Forecast + geocoding, timeout, redondeo a 2 dec.
js/weather/profile.js      WMO → estado interno → perfil (hue, densidad, etc.)

js/composition/select.js   Selección 80% afinidad / 20% contraste
js/composition/layout.js   Dispersión hue→ángulo, brillo→radio, relajación
js/composition/decay.js    Variables CSS de fermentación

js/render/gallery.js       DOM del campo, recortes, blends, debug por pieza

js/ui/entry.js             Entrada y estados de carga
js/ui/about.js             Overlay «acerca de» accesible
js/ui/location.js          Geolocalización, búsqueda de ciudad, default
js/ui/lens.js              Lente de imagen (click/Enter, Esc, foco)
js/ui/debug.js             Panel de `?debug=1`

LICENSE                    CC0 1.0
PLAN.md                    Plan congelado por pasos
ESTADO.md                  Este archivo
serve.ps1                  Servidor estático de desarrollo (Windows)
```

No existen todavía: `js/seed/audio.js`, `js/audio/`, `js/supabase/`,
`js/upload/`, `js/storage/`, `js/ui/donate.js`, `contacto.html`,
`supabase/schema.sql`, `supabase/storage.sql`, `netlify.toml`,
`css/donate.css`. Corresponden a los Pasos 3 a 6.

---

## 4. Verificación hecha el 18/11/2026

Navegador: Chromium del entorno de desarrollo, servidor estático local.

| Prueba | Resultado |
|---|---|
| Portada en escritorio (1296×894) | Sin scroll, sin errores de consola |
| Entrar y ver el campo | 8 piezas del seed, portada oculta |
| Geolocalización denegada | Aparece búsqueda de ciudad + mensaje + default |
| Búsqueda de ciudad (Córdoba) | Geocoding y forecast reales; perfil `open-meteo · city` |
| Open-Meteo caído (endpoint inválido) | Perfil `neutral`; el campo sigue funcionando |
| Los 8 `?mock=` | Cambian perfil, densidad, dispersión y fermentación |
| Selección 80/20 con el seed | 6 afinidad + 2 contraste; distancias en debug |
| Lente | Abre con click y con Enter; cierra con Esc |
| Resize | Misma selección y mismas posiciones |
| Dos entradas seguidas | Selección/orden distintos; estable dentro de la visita |
| Móvil (iframe 390×844) | 7 piezas, sin scroll, tap funciona |
| `?debug=1` / `?mock=` sin panel | Solo aparecen con query param |
| Portada tras la corrección | Título en una línea; los slices quedan superpuestos (opacidad 0 fuera del glitch) |
| Cierre de ubicación, lente y acerca de | Foco devuelto antes de ocultar; sin warnings de `aria-hidden` |
| `serve.ps1` | Responde en `localhost` y en `127.0.0.1`; rechaza rutas fuera de la carpeta |
| Lighthouse (portada) | Accesibilidad 100, buenas prácticas 100, SEO 100 |
| Consola | Sin errores en todos los casos anteriores |

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
- `ESTADO.md`: corrección de esta bitácora.

Sin cambios funcionales en clima, selección, dispersión, lente ni audio
(este último todavía no existe).

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

- En móvil se ven 7 de 8 piezas: el factor 0.6 queda limitado por el pool de
  8 imágenes del seed. Se va a notar recién cuando haya donaciones aprobadas.
- En móvil el campo tiende a agruparse arriba a la izquierda (solapamiento
  máximo 0.79, justo en el umbral de relajación). Revisar dispersión.
- `Esc` dentro del buscador de ciudad cierra todo el panel y entra con Buenos
  Aires; sería mejor que el primer `Esc` limpie la búsqueda.
- `composition/decay.js` calcula `driftX`/`driftY` que no se usan: el render
  usa los de `layout.js`. Limpiar cuando se toque la fermentación.
- `js/ui/location.js` registra listeners de `document` que no se dan de baja al
  resolver. No molesta porque solo hay una entrada por visita; limpiar al
  agregar la re-entrada o el botón de donación.

---

## 8. Siguiente paso: Paso 3 — Audio donado

Objetivo: sumar 3 audios procedurales, analizarlos con FFT, seleccionar 1–2
según el clima y reproducirlos con Web Audio. Sin colchón generado en vivo.

Archivos a crear:

```text
js/seed/audio.js
js/analysis/fft.js
js/analysis/audio.js
js/audio/engine.js
```

Archivos a modificar:

```text
js/composition/select.js
js/composition/layout.js
js/render/gallery.js
js/ui/lens.js
js/ui/entry.js
js/main.js
js/state.js
css/collage.css
css/ui.css
js/ui/debug.js
```

Dependencia: Web Audio API del navegador. Ninguna librería.

Criterios de aceptación (del `PLAN.md`):

- 3 audios deterministas de 12 s con `OfflineAudioContext`, codificados a WAV.
- Features: RMS, centroide espectral, planitud, ZCR.
- 1–2 capas según afinidad al perfil sonoro; si no hay, silencio.
- Fades de 6–10 s sin clics; `playbackRate` 0.85–1.15 según clima.
- Mute visible y accesible; audio pausado al ocultar la pestaña.
- Lente de audio: suena sola y al cerrar vuelve la mezcla.
- Sin sonidos de lluvia, viento ni truenos.
- `?debug=1` muestra capas, rate, filtro, estado del contexto y features.

Antes de empezar conviene aprobar el paso: el plan pide ejecutar uno por vez
y esperar confirmación.

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
