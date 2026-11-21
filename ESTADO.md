# ESTADO — POZO DEL CLIMA

Última actualización: **19 de noviembre de 2026**.

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

No hace falta instalar nada para los Pasos 1 a 3. Para el Paso 4 alcanza con
un proyecto de Supabase configurado en `js/config.js`: no hay CLI, build ni
npm. El Paso 5 va a usar el mismo proyecto (ver «Configuración externa
pendiente»).

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
| 4 — Supabase: lectura compartida | **Completado y verificado en vivo (19/11/2026)** |
| 5 — Donación, análisis y aprobación | Pendiente |
| 6 — Pulido, accesibilidad y despliegue | Pendiente |
| 7 — Video | Opcional; no ejecutar sin aprobación |

---

## 3. Qué está implementado (Pasos 1 a 4)

### Flujo actual

Portada → click en «entrar» → panel de ubicación → consulta a Open-Meteo
(una sola vez) → perfil climático interno → llegada de las piezas aprobadas de
Supabase (si está configurado; en paralelo con el seed) → selección 80/20 de
imágenes → selección de 1–2 audios por afinidad sonora → dispersión →
fermentación → campo fijo durante la visita. El audio se reproduce en loop con
fades largos; el clima modula filtro, `playbackRate`, bitcrush y paneo. La lente
abre una pieza sin reordenar nada; si es audio, suena sola.

Las piezas compartidas usan URLs firmadas de una hora, cacheadas en memoria y
renovadas antes de vencer. Si Supabase no está configurado, está pausado o
falla, la obra sigue con el seed y el debug muestra el motivo.

### Archivos y responsabilidades

```text
index.html                 Portada, panel de ubicación, acerca de
css/base.css               Variables, reset, tipografía, reduced motion
css/ui.css                 Portada, botones, ubicación, acerca de, lente, mute, debug
css/collage.css            Campo, piezas, recortes, glitch, deriva, waveforms

js/main.js                 Orquestación de la entrada, el pintado y el audio
js/config.js               Título, ciudad default, Supabase, flags
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

js/supabase/client.js      Cliente perezoso; SDK ESM por CDN con versión fija
js/supabase/pieces.js      Aprobadas, firmas en lote, caché, renovación y merge
js/storage/local.js        Registro local de donaciones propias (stub)

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

supabase/schema.sql        Tabla `pieces`, checks, índices, RLS y trigger
supabase/storage.sql       Bucket privado `pozo`, firmas y políticas
```

Todavía no existen: `js/upload/`, `js/ui/donate.js`, `js/ui/notice.js`,
`js/analysis/file.js`, `js/analysis/audio-worker.js`, `contacto.html`,
`css/donate.css`, `netlify.toml`. Corresponden a los Pasos 5 y 6.

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
| Supabase sin configurar | Modo seed; aviso único en consola; debug `sin configurar · 0 aprobadas` |
| Merge seed + aprobadas (simulado) | IDs propios excluidos, duplicados descartados; la imagen remota se selecciona y renderiza |
| Fetch + firmas (API simulada) | Consulta `status=eq.approved`; 2 URLs en un solo lote; caché reutilizada en la segunda lectura |
| Renovación de firmas (reloj adelantado) | 2 URLs renovadas y `src` actualizado; al detener, no hay más firmas |
| Supabase caído / sin respuesta | Corte a los 5 s, estado `error`, sin excepción; la obra sigue con seed |
| Render de pieza remota | Imagen aprobada visible y decodificada; waveform de audio en el campo |
| Fila no aprobada devuelta por error | El cliente descarta `pending`, `rejected` y tipos desconocidos, y no firma sus rutas |
| Entrada completa con API simulada | 8 aprobadas de prueba; 7 remotas seleccionadas y marcadas `red`; debug `ok`; sin errores JS |
| Debug de Supabase | Estado, aprobadas, URLs, SDK y propias en el panel |
| Supabase real: conexión | Proyecto `ajgwlejmyrlfsgniwzhe` responde; `sdk listo`; debug `ok · 1 aprobada · 1 con url` |
| Pieza aprobada real | Imagen webp de 3024×4032 (860 KB): URL firmada con HTTP 200 y render en el campo con `no-referrer` |
| Firma de ruta no aprobada | La función de política devuelve `false`; `createSignedUrls` falla con «object does not exist or you do not have access» |
| Update/delete con anon | `42501 permission denied for table pieces` en ambas operaciones |
| Renovación real de URL | Reloj adelantado: 1 URL renovada, `src` actualizado y nuevo vencimiento correcto |
| Listado de Storage | Solo aparece el objeto aprobado (1); el resto del bucket no se expone |

Las pruebas de red se hicieron primero con `window.fetch` interceptado
(respuestas simuladas de PostgREST y Storage) y con el reloj adelantado para
forzar la renovación. El **19/11/2026** se conectó el proyecto real y se repitió
la verificación contra Supabase: la pieza aprobada se firma y se renderiza, las
filas no aprobadas no se leen, la anon key no puede actualizar ni borrar y la
renovación de URLs funciona. Queda pendiente, para el Paso 5, probar con un
objeto `pending` real (hoy se verificó con la función de política y una ruta no
aprobada) y el borrado de Storage sin destruir la pieza de prueba.

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
- **Paso 4 — Supabase (lectura compartida):**
  - `supabase/schema.sql`: tabla `pieces` con `kind`, `status`, ruta, MIME,
    bytes, dimensiones, duración, `sha256` único, `features` JSONB, fechas y
    checks. Índices para aprobadas y rutas. Trigger que completa `approved_at`.
    RLS: `anon` solo lee aprobadas y solo inserta pendientes; sin update ni
    delete. `video` queda reservado para el Paso 7.
  - `supabase/storage.sql`: bucket privado `pozo` (12 MB, MIME de imagen y
    audio), política de subida anónima con nombre `uuid.ext` y lectura solo de
    objetos aprobados mediante `pozo_is_approved_object()` (`security definer`).
  - `js/supabase/client.js`: importa `@supabase/supabase-js@2.119.1` desde
    jsDelivr con versión exacta; sin sesiones persistidas; si el CDN o la
    configuración fallan, devuelve `null` y no rompe la entrada.
  - `js/supabase/pieces.js`: consulta solo `status = approved`, firma URLs en
    lote (1 h), las cachea en memoria, renueva antes de vencer (cada 5 min y al
    volver a la pestaña) y normaliza las features de la base. También une seed +
    aprobadas, descarta duplicados y excluye los IDs propios.
  - `js/storage/local.js`: stub del registro `pozo.donations`; por ahora solo
    expone los IDs propios para la exclusión del Paso 5.
  - `js/config.js`, `js/main.js`, `js/state.js` y `js/ui/debug.js`: configuración
    del proyecto, carga en paralelo con el seed, merge antes de seleccionar,
    estado remoto y líneas de debug (estado, aprobadas, URLs, SDK, propias).
  - `js/render/gallery.js`: las imágenes remotas usan `referrerPolicy` sin
    referente y reintentan una vez si una URL firmada vence durante la visita.
  - Verificación simulada: consulta y firmas con `fetch` interceptado, caché de
    URLs, renovación con reloj adelantado, timeout de 5 s, merge con IDs propios,
    render de una imagen remota y de una waveform. Los 8 mocks siguen igual y
    sin errores de consola. **Falta la prueba contra un proyecto real.**
- `ESTADO.md`: actualización de esta bitácora.

El clima sigue siendo invisible: el audio no muestra nombres ni estados, solo
materia sonora. No hay sonidos de lluvia, viento ni truenos. Las piezas
compartidas tampoco muestran autor, título, nombre de archivo ni metadatos: solo
entran al pozo si están aprobadas.

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
- **Paso 4 verificado en vivo, con dos pruebas pendientes:** falta subir un
  objeto `pending` real para confirmar que su URL firmada falla (la función de
  política y una ruta no aprobada ya lo hacen) y probar el borrado de Storage sin
  destruir la pieza de prueba. El listado de Storage sí muestra los nombres de
  los objetos aprobados: son públicos por diseño, pero conviene tenerlo presente.
- El proyecto de prueba tiene una imagen aprobada de 3024×4032. Borrarla desde
  el dashboard antes de publicar si no debe quedar en la obra.
- Paso 5: al insertar una donación no conviene pedir representación
  (`.select()`); la fila nace `pending` y anon solo puede leer aprobadas. Usar
  el UUID generado en el navegador.
- La lectura compartida se espera antes de entrar (timeout de 5 s). Si Supabase
  está pausado, la portada puede tardar ese tiempo de más. Si molesta, mover la
  consulta a un segundo plano y componer solo con lo que llegó.
- Las features de una fila pueden venir vacías si el admin inserta una prueba a
  mano. La pieza igual aparece, pero con perfil neutro y sin waveform hasta que
  el Paso 5 las calcule. Conviene completarlas al aprobar.
- Se piden como máximo 60 aprobadas y se firman en lotes de 100. El caché de
  URLs no se purga: con muchas piezas conviene limitarlo o usar un Map por
  visita.
- El SDK se carga por CDN con versión fijada, pero un `import()` dinámico no
  permite `integrity`: si jsDelivr cambia o cae, se vuelve al seed. El CSP del
  Paso 6 debe permitir ese origen.
- El cliente descarta filas `pending`/`rejected` aunque la API las devuelva, pero
  RLS sigue siendo la defensa real: una URL firmada de un pendiente debe fallar
  igual. Revisar las políticas antes de publicar.
- Con muchas donaciones, 1–2 capas de audio hacen que la mayoría de los audios
  aprobados nunca suene en una visita. Es parte del diseño, pero conviene
  verificarlo con un pool grande.
- La renovación de URLs actualiza `piece.src`; el próximo `paint()` o un error
  de imagen lo aprovecha. Una imagen ya cargada no se recarga hasta el resize o
  la próxima entrada.
- El bucket todavía no acepta `video` aunque el schema reserve el tipo; se
  habilita en el Paso 7.

---

## 8. Siguiente paso: Paso 5 — donación, análisis y aprobación

El **Paso 4 quedó cerrado y verificado en vivo** el 19/11/2026 contra el proyecto
`ajgwlejmyrlfsgniwzhe`: el SQL se ejecutó, el bucket `pozo` es privado y
`js/config.js` ya tiene la URL y la clave pública (`sb_publishable_…`). La pieza
aprobada de prueba se firma, se descarga y se compone; las filas no aprobadas no
se leen; `update` y `delete` con anon fallan; la renovación de URLs funciona.

Quedaron dos comprobaciones opcionales que el Paso 5 va a cubrir de forma
natural, porque crea objetos y filas `pending`:

- firmar la URL de un objeto pendiente real y comprobar que falla;
- intentar borrar un objeto de Storage con anon sin destruir la pieza aprobada.

El **Paso 5 no está aprobado todavía**. Cuando se apruebe, el alcance está en
`PLAN.md` (subida, análisis en el navegador, fila pendiente, aviso y
aprobación). El SDK ESM se sigue cargando por CDN con versión fijada; no hay
build ni npm.

Antes de publicar, borrar la imagen de prueba de 3024×4032 desde el dashboard.

---

## 9. Configuración externa pendiente

- **Open-Meteo**: ya en uso, sin clave. No se guardan coordenadas.
- **Supabase (Paso 4)**: proyecto `ajgwlejmyrlfsgniwzhe` en uso, con
  `supabase/schema.sql` y `supabase/storage.sql` ejecutados y la URL + clave
  pública en `js/config.js`. Bucket privado `pozo` (12 MB). Nunca `service_role`
  en el cliente. Si falta configuración o Supabase está pausado, la obra cae al
  seed. Antes de publicar, borrar la imagen de prueba aprobada.
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
- **2026-11-18** — Cuarta sesión. El usuario aprobó el Paso 4. Se implementó la
  lectura compartida: SQL de tabla, RLS y Storage; cliente perezoso por CDN;
  consulta de aprobadas; URLs firmadas en lote con caché y renovación; merge con
  exclusión de IDs propios; debug y reintento de imágenes. Se verificó con la
  API interceptada (consulta, firmas, caché, renovación, timeout, merge,
  descarte de filas no aprobadas y render) y los 8 mocks siguen sin errores. No
  hay credenciales en esta máquina:
  falta crear el proyecto Supabase y hacer la prueba en vivo. Respaldo en
  `C:\Users\outlet\Downloads\pozodelclima-paso4-2026-11-18.zip`
  (fuera de la carpeta del proyecto).
- **2026-11-19** — Quinta sesión. Con la URL y la clave pública del proyecto
  `ajgwlejmyrlfsgniwzhe` se completó la verificación en vivo del Paso 4: 1 imagen
  aprobada firmada, descargada (HTTP 200) y renderizada; consulta solo de
  aprobadas; `update`/`delete` rechazados con `42501`; firma de una ruta no
  aprobada rechazada; renovación real de URL con reloj adelantado. Sin errores
  de consola. Se corrigió la documentación sobre el listado de Storage (los
  objetos aprobados sí se pueden listar) y se anotaron dos pruebas opcionales
  para el Paso 5. El Paso 4 queda cerrado; el Paso 5 sigue pendiente de
  aprobación. Respaldo verificado en
  `C:\Users\outlet\Downloads\pozodelclima-paso4-2026-11-19.zip`.
