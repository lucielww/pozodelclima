# ESTADO — POZO DEL CLIMA

Última actualización: **20 de noviembre de 2026**.

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

No hace falta instalar nada para los Pasos 1 a 3. Para los Pasos 4 y 5 alcanza
con un proyecto de Supabase configurado en `js/config.js`: no hay CLI, build ni
npm. El mismo proyecto se usa para leer aprobadas y recibir donaciones (ver
«Configuración externa pendiente»).

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
| 5 — Donación, análisis y aprobación | **Completado y verificado en vivo (20/11/2026)** |
| 6 — Pulido, accesibilidad y despliegue | Pendiente |
| 7 — Video | Opcional; no ejecutar sin aprobación |

---

## 3. Qué está implementado (Pasos 1 a 5)

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

Al entrar aparece también un botón discreto de donación. Abre un overlay con el
aviso de siete puntos, el checkbox obligatorio, la elección de archivo y el
envío. La imagen se decodifica, se recompone a WebP de 1600 px y se analiza en
el navegador; el audio se decodifica para validar duración y se analiza en un
worker sin transcodificarlo. Después se calcula SHA-256, se aplica la cuota
local de 3 donaciones por 24 h, se sube el blob a `pozo` y se inserta la fila
`pending`. El comprobante muestra solo el ID. La donación no toca la
composición en curso: si se aprueba, puede aparecer en una próxima entrada y el
ID propio la filtra en este navegador.

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
js/analysis/audio-worker.js  Features de audio fuera del hilo principal
js/analysis/file.js        Firma binaria, recompresión WebP, decodificación, worker

js/weather/open-meteo.js   Forecast + geocoding, timeout, redondeo a 2 dec.
js/weather/profile.js      WMO → estado interno → perfil (hue, densidad, etc.)

js/audio/engine.js         Buffers en loop, fades, filtro, crush, paneo, mute

js/supabase/client.js      Cliente perezoso; SDK ESM por CDN con versión fija
js/supabase/pieces.js      Aprobadas, firmas en lote, caché, renovación y merge
js/storage/local.js        Donaciones propias, cuota móvil de 24 h y huérfanas

js/upload/process.js       Validación, análisis, hash y rechazo de duplicados
js/upload/donate.js        Subida a Storage, insert `pending` y comprobante

js/composition/select.js   Selección 80/20 de imágenes y 1–2 audios afines
js/composition/layout.js   Dispersión hue→ángulo, brillo→radio, relajación
js/composition/decay.js    Variables CSS de fermentación

js/render/gallery.js       DOM del campo, recortes, blends, waveforms, debug

js/ui/entry.js             Entrada, desbloqueo de audio y estados de carga
js/ui/about.js             Overlay «acerca de» accesible
js/ui/location.js          Geolocalización, búsqueda de ciudad, default
js/ui/lens.js              Lente de imagen y de audio (click/Enter, Esc, foco)
js/ui/donate.js            Overlay de donación, cuota, envío y comprobante
js/ui/notice.js            Aviso de siete puntos y nota de metadatos
js/ui/debug.js             Panel de `?debug=1`

contacto.html              Netlify Form de contacto y bajas (con honeypot)
css/donate.css             Overlay de donación y página de contacto

LICENSE                    CC0 1.0
PLAN.md                    Plan congelado por pasos
ESTADO.md                  Este archivo
serve.ps1                  Servidor estático de desarrollo (Windows)

supabase/schema.sql        Tabla `pieces`, checks, índices, RLS y trigger
supabase/storage.sql       Bucket privado `pozo`, firmas y políticas
```

Todavía no existe `netlify.toml` (headers, CSP y configuración del deploy):
corresponde al Paso 6.

---

## 4. Verificación en navegador

### Pasos 1 a 4 (18 y 19/11/2026)

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
renovación de URLs funciona. Las dos comprobaciones que quedaban para el Paso 5
(objeto `pending` real y borrado de Storage) se completaron con las donaciones
de prueba: ver «Paso 5» más abajo.

No se pudo automatizar el caso «permiso de geolocalización **concedido**»
(el navegador de prueba no concede el permiso). Sí se verificó el flujo
denegado y el de búsqueda de ciudad con clima real. Conviene probar el caso
concedido a mano en Chrome/Safari/iOS.

### Paso 5 (20/11/2026)

Navegador: Chromium del entorno de desarrollo, servidor estático local y el
proyecto real `ajgwlejmyrlfsgniwzhe`.

| Prueba | Resultado |
|---|---|
| Checkbox sin aceptar | El botón de envío queda deshabilitado; al aceptar, se habilita |
| Imagen válida (PNG 1200×800 de 188.039 B) | WebP 1200×800 de 14.934 B; análisis k-means; SHA-256 `8421ff4d…`; `POST pieces` 201; comprobante; registro local; cuota 1/3 |
| Audio válido (WAV 3 s, 258 KB) | Subido byte a byte; features en worker (RMS 0,259; centroide 445,4 Hz; planitud 0,0006); `POST pieces` 201; comprobante; cuota 2/3 |
| Archivo `.txt` | «Ese formato no se puede donar…»; sin subida ni fila |
| PNG de 8 MB + 1 KB | «El archivo supera el límite…»; sin subida |
| WAV de 95 s | «El audio dura más de 90 segundos.»; sin subida |
| Duplicado exacto del audio | El servidor responde 409 (`23505`); «Ese archivo ya está en el pozo.»; sin segunda fila; queda un objeto huérfano registrado |
| Cuota sembrada en 3/3 | Entrada bloqueada, archivo y checkbox deshabilitados, mensaje claro; al borrar `localStorage` vuelve a 0/3 |
| Comprobante | ID visible y copiable; no aparece el nombre del archivo |
| Nombre del archivo | No está en el texto visible; el input mide ≤1 px y el resumen solo muestra el tamaño |
| Composición actual | Mismos IDs seleccionados antes y después de abrir y cerrar el overlay |
| Exclusión de propias | Marcando la imagen aprobada como propia, `approvedPieces` queda vacío, el pool no la contiene y debug muestra `propias 3` |
| Pendientes con la anon key | `select` de `pending` devuelve `[]`; firmar el objeto pendiente real devuelve 404; borrar con anon devuelve 403 |
| Contacto | Código, motivo, mensaje, email opcional y honeypot; en local avisa que no envía nada y no manda consultas |
| Lighthouse | Portada, contacto y overlay de donación: accesibilidad, buenas prácticas y SEO 100 |
| Consola | Sin errores de JavaScript; el único error de red es el 409 esperado de la prueba de duplicado |
| Aprobación manual | Pendiente de una acción en el dashboard: el flujo de lectura de aprobadas y la exclusión del ID propio ya están verificados en vivo |

Evidencia de las filas creadas: el `POST` a `rest/v1/pieces` devolvió 201 para
la imagen y para el audio, con `status: "pending"` y el `sha256` calculado en el
navegador. La anon key no puede leerlas, así que su contenido solo se comprueba
en el dashboard.

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
  - `js/storage/local.js`: registro `pozo.donations` y exclusión de los IDs
    propios (el Paso 5 lo completó con cuota y huérfanas).
  - `js/config.js`, `js/main.js`, `js/state.js` y `js/ui/debug.js`: configuración
    del proyecto, carga en paralelo con el seed, merge antes de seleccionar,
    estado remoto y líneas de debug (estado, aprobadas, URLs, SDK, propias).
  - `js/render/gallery.js`: las imágenes remotas usan `referrerPolicy` sin
    referente y reintentan una vez si una URL firmada vence durante la visita.
  - Verificación simulada: consulta y firmas con `fetch` interceptado, caché de
    URLs, renovación con reloj adelantado, timeout de 5 s, merge con IDs propios,
    render de una imagen remota y de una waveform. Los 8 mocks siguen igual y
    sin errores de consola. La prueba contra el proyecto real llegó el 19/11
    (fila de arriba).
- **Paso 5 — donación, análisis y aprobación:**
  - `js/analysis/file.js` y `js/analysis/audio-worker.js`: firma binaria de
    JPEG/PNG/WebP/MP3/OGG/WAV/M4A (no por extensión), decodificación con
    `createImageBitmap` y orientación EXIF, recompresión a WebP de 1600 px al
    0,82 sobre fondo de materia, análisis de color y features de audio en un
    worker con los canales transferidos. Si el worker falla, cae al hilo
    principal; el audio no se transcodifica.
  - `js/upload/process.js`: límites de 8 MB y 12 MB, 80 megapíxeles, 90 s de
    audio, timeouts, SHA-256 con `crypto.subtle` y rechazo temprano de hashes
    aprobados. Los mensajes son claros y no incluyen el nombre del archivo.
  - `js/upload/donate.js`: genera el UUID en el navegador, sube el blob a
    `pozo` con `upsert: false`, inserta la fila `pending` **sin** `.select()`
    (anon no puede leerla) y guarda `{ id, path, at }`. Si falla el insert,
    registra la ruta en `pozo.orphans` para limpieza manual; el 409 del
    duplicado se traduce a un mensaje específico.
  - `js/storage/local.js`: registro de donaciones, cuota móvil de 3 por 24 h y
    lista de huérfanas; tolera `localStorage` roto o lleno sin romper el flujo.
  - `js/ui/donate.js` y `js/ui/notice.js`: overlay con aviso de siete puntos,
    nota de metadatos, checkbox obligatorio, estado `aria-live`, trampa de foco,
    cierre con Esc, comprobante copiable y enlace a la página de contacto. El
    botón recién aparece al entrar, para no competir con la portada.
  - `js/supabase/pieces.js`: `getApprovedHashes()` expone los hashes de las
    aprobadas cargadas en la visita para el rechazo temprano.
  - `js/config.js`, `js/main.js`, `js/state.js` y `js/ui/debug.js`: límites de
    donación, inicialización del overlay, estado de la donación, cuota, hash,
    ID y huérfanas en el panel de debug. La donación no dispara `paint()` ni
    toca `state.selected`.
  - `contacto.html` y `css/donate.css`: formulario de Netlify con código,
    motivo, mensaje, email opcional y honeypot; en local muestra el aviso y no
    envía nada. La página comparte la estética del pozo.
  - Sin errores de aplicación detectados en la verificación. El único incidente
    fue un script de prueba mal formado en la consola del navegador, ajeno al
    código de la obra.

El clima sigue siendo invisible: el audio no muestra nombres ni estados, solo
materia sonora. No hay sonidos de lluvia, viento ni truenos. Las piezas
compartidas tampoco muestran autor, título, nombre de archivo ni metadatos: solo
entran al pozo si están aprobadas. El flujo de donación tampoco muestra el
nombre original ni los metadatos del archivo.

---

## 6. Comportamiento que no se debe romper

- El clima nunca se nombra ni se muestra en la UI. Solo en `?debug=1`.
- No hay autoría, créditos, títulos por pieza, nombres de archivo ni metadatos
  visibles.
- La composición se genera una vez por entrada y queda fija durante la visita.
  No hay «revolver», polling ni recomposición a mitad de visita.
- Una donación nunca altera la composición actual. Solo puede entrar en una
  próxima visita, después de la aprobación manual.
- Las piezas propias guardadas en `pozo.donations` se excluyen de la selección.
- El comprobante es el único identificador de una donación: no hay nombre,
  autoría, título ni metadatos visibles.
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
- Las dos pruebas opcionales del Paso 4 quedaron cerradas con la donación real:
  firmar un objeto `pending` devuelve 404 y borrar con anon devuelve 403. El
  listado de Storage muestra solo los objetos aprobados: sus nombres son
  públicos por diseño, pero conviene tenerlo presente.
- El proyecto de prueba tiene una imagen aprobada de 3024×4032. Borrarla desde
  el dashboard antes de publicar si no debe quedar en la obra.
- Quedan en Supabase dos filas `pending` de prueba creadas el 20/11/2026:
  `64d3e2b5-194b-476e-b728-e4d9a805c279` (imagen WebP de 14.934 B) y
  `569b872f-6faf-4fdd-b1ee-8d31b39acd1b` (audio WAV de 264.644 B). Borrarlas
  junto con sus objetos de Storage antes de publicar. También queda el objeto
  huérfano `c196408a-4776-41cc-b2f3-5a4f40a75614.wav`, subido por la prueba de
  duplicado: no tiene fila y anon no puede borrarlo. Después de verificar se
  vaciaron `pozo.donations` y `pozo.orphans` en el navegador de prueba.
- El duplicado se detecta contra los hashes aprobados. Si el archivo repetido
  todavía está `pending`, el rechazo llega por el índice único del servidor
  (409) después de subir el objeto: queda huérfano y se limpia a mano. Se acepta
  por ahora (riesgo previsto en el plan); si molesta, guardar también los hashes
  de las donaciones locales.
- El navegador registra un error de red 409 en consola al probar un duplicado.
  Es el log del request rechazado, no una excepción de la aplicación.
- La cuota es local y evitable con incógnito o borrando `localStorage`; está
  aceptado y documentado. El servidor no limita por visitante.
- Los audios se suben sin transcodificar: pueden conservar metadatos. El aviso
  lo dice y no se promete limpieza. Las imágenes pierden EXIF y GPS al
  recomprimirse a WebP.
- La aprobación manual de una fila `pending` generada por el flujo nuevo sigue
  pendiente de una prueba en el dashboard. El camino de lectura de aprobadas y
  la exclusión del ID propio ya se verificaron en vivo.
- La lectura compartida se espera antes de entrar (timeout de 5 s). Si Supabase
  está pausado, la portada puede tardar ese tiempo de más. Si molesta, mover la
  consulta a un segundo plano y componer solo con lo que llegó.
- Las features de una fila pueden venir vacías si el admin inserta una prueba a
  mano. La pieza igual aparece, pero con perfil neutro y sin waveform: el flujo
  de donación ya las calcula, pero una fila manual no. Conviene completarlas al
  aprobar.
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

## 8. Siguiente paso: Paso 6 — pulido, rendimiento, accesibilidad y despliegue

El **Paso 5 quedó implementado y verificado en vivo** el 20/11/2026 contra el
proyecto `ajgwlejmyrlfsgniwzhe`: una imagen y un audio reales se procesaron,
subieron y quedaron `pending`; los rechazos por tipo, tamaño, duración, duplicado
y cuota funcionan; el comprobante y el registro local se guardan; las pendientes
no se leen ni se firman con anon; la composición actual no cambia y la exclusión
de IDs propios se comprobó con la pieza aprobada de prueba. El detalle está en la
sección 4.

Queda una sola comprobación manual, que no bloquea el cierre: aprobar desde el
dashboard una de las filas `pending` de prueba y verla aparecer en una nueva
entrada. El mecanismo de aprobación ya se verificó en el Paso 4 y la exclusión
del ID propio en este navegador ya se verificó en vivo. Si se prueba, conviene
hacerlo con una fila descartable y borrarla después.

Antes de publicar hay que limpiar el proyecto:

- borrar las dos filas `pending` de prueba y sus objetos (sección 7);
- borrar el objeto huérfano del duplicado;
- borrar la imagen aprobada de prueba de 3024×4032.

El **Paso 6 no está aprobado todavía**. Cuando se apruebe, el alcance está en
`PLAN.md`: lenguaje visual final, filtros SVG, glitch, transiciones, móvil,
movimiento reducido, rendimiento, `netlify.toml` con headers y CSP, y deploy en
Netlify con la prueba real del formulario. El SDK ESM se sigue cargando por CDN
con versión fijada; no hay build ni npm.

---

## 9. Configuración externa pendiente

- **Open-Meteo**: ya en uso, sin clave. No se guardan coordenadas.
- **Supabase (Pasos 4 y 5)**: proyecto `ajgwlejmyrlfsgniwzhe` en uso, con
  `supabase/schema.sql` y `supabase/storage.sql` ejecutados y la URL + clave
  pública en `js/config.js`. Bucket privado `pozo` (12 MB) con subida anónima
  `uuid.ext`, lectura solo de aprobadas y sin update/delete para anon. Nunca
  `service_role` en el cliente. Si falta configuración o Supabase está pausado,
  la obra cae al seed y la donación avisa que no está disponible. Antes de
  publicar, borrar las filas y objetos de prueba (sección 7).
- **Netlify (Paso 6)**: deploy estático desde la raíz, sin build.
  `contacto.html` ya tiene el formulario de Netlify Forms con código, motivo,
  mensaje, email opcional y honeypot; falta el deploy, la prueba real del envío
  y el `netlify.toml` con headers y CSP. Las claves públicas viven en
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
- **2026-11-19/20** — Sexta sesión. El usuario aprobó el Paso 5. Se implementó el
  flujo completo de donación (detección por contenido, recompresión WebP,
  features de audio en worker, SHA-256, cuota, subida, fila `pending`,
  comprobante, exclusión de propias y página de contacto) y se verificó en vivo
  contra Supabase con una imagen y un audio reales: ambos `POST` devolvieron 201
  y quedaron pendientes; se probaron los rechazos por tipo, tamaño, duración,
  duplicado y cuota; la anon key no pudo leer, firmar ni borrar los pendientes;
  el nombre del archivo no aparece; la composición no cambió; la exclusión del
  ID propio se comprobó con la imagen aprobada de prueba; Lighthouse dio
  100/100/100 en portada, contacto y overlay. No se detectaron errores de la
  aplicación. Quedan en Supabase las filas y objetos de prueba para borrar
  (sección 7) y la aprobación manual de una fila `pending` como comprobación
  final opcional. Se vaciaron `pozo.donations` y `pozo.orphans` del navegador.
  Próximo: aprobar el Paso 6. Respaldo en
  `C:\Users\outlet\Downloads\pozodelclima-paso5-2026-11-20.zip`
  (fuera de la carpeta del proyecto).
