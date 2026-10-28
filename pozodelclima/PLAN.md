# PLAN — POZO DEL CLIMA

Obra de net art colectiva. Un campo de fragmentos de archivo —imágenes y audios— que se forma de nuevo en cada entrada. El clima del visitante es un curador invisible: elige las piezas y modula una fermentación abstracta, pero nunca se muestra como clima.

Este documento es un plan de ejecución, no la implementación. Al aprobarlo se ejecuta **un solo paso** y se espera confirmación antes de seguir.

---

## 0. Decisiones congeladas

### Concepto
- Título: **POZO DEL CLIMA**. Obra colectiva, sin autoría, sin créditos y sin títulos por pieza.
- No hay cielo, agua, lluvia, viento ni lectura meteorológica visible. El clima solo se usa para seleccionar y fermentar.
- La forma no es fija: es un campo de fragmentos dispersos, full-screen, sin scroll ni brocal. Cambia con los archivos y con los parámetros internos del clima.
- Composición nueva en cada entrada; fija durante la visita. No hay “revolver”, no hay polling y no hay recomposición a mitad de visita.
- Selección: 80% afinidad y 20% contraste, con azar sembrado por clima, fecha y sesión.
- Abrir una pieza es una **lente**: no reordena, muestra la versión compostada y, si es audio, lo escucha sola.
- La donación no altera la composición actual. Aparece en visitas futuras, después de la aprobación.
- Estética: data decay. Pixelado, glitch, bit rot, scanlines, RGB offset, capas y mezclas. Sin texturas orgánicas ni iconografía climática.
- Sin envejecimiento acumulativo: la fermentación es un estado de la visita.
- Licencia: **CC0** para obra, donaciones y código.

### Técnica
- HTML, CSS y JavaScript con módulos ES. Sin frameworks, sin build, sin npm y sin servidor propio.
- Hosting estático en **Netlify**.
- Backend administrado: **Supabase** (Postgres + Storage + RLS). Sin auth.
- SDK oficial de Supabase por CDN ESM, con versión fijada. Es la única dependencia de runtime.
- Clima: **Open-Meteo**, sin clave.
- Contacto: **Netlify Forms**.
- Imágenes y audio analizados y comprimidos en el cliente antes de subir.
- Bucket privado con URLs firmadas. RLS: el rol anónimo solo inserta `pending`, solo lee `approved`, no actualiza ni borra.
- Geolocalización redondeada, nunca guardada. Buenos Aires como ciudad por defecto. Sin mostrar ciudad ni coordenadas.
- Cuota de 3 donaciones por día en `localStorage`. Es evitable sin auth; se acepta y se documenta.
- Turnstile queda como plan B documentado, no implementado.

### Fuera de alcance de la v1
- Video. Se reserva `kind = 'video'` y los puntos de extensión, pero no se implementa.
- Autenticación, cuentas, perfiles, comentarios, likes, analytics, cookies, PWA y offline.
- Moderación automática. La aprobación es manual desde el dashboard.
- Servidor propio, funciones serverless y procesos en segundo plano.

---

## 1. Arquitectura general

### Flujo de una visita
1. Portada con el título, “entrar” y “acerca de”.
2. El click de entrada desbloquea el audio y abre el pedido de ubicación.
3. La ubicación se redondea y se consulta Open-Meteo una sola vez.
4. Se construye un perfil interno: color, brillo, saturación, carácter sonoro, densidad, calor, humedad, turbulencia, decay y noche.
5. Se seleccionan piezas del seed procedural y de las aprobadas en Supabase, excluyendo las donaciones propias registradas en `localStorage`.
6. Se calcula una dispersión guiada por features y se aplica la fermentación visual/sonora.
7. Se muestra el campo. La composición queda fija hasta recargar.
8. La lente permite abrir una pieza. El botón de donación abre el ritual de subida.
9. Al recargar o volver a entrar, se genera otra composición.

### Módulos previstos
- `seed/`: generación determinista de imágenes y audios iniciales.
- `analysis/`: color, audio y procesamiento de archivos.
- `weather/`: Open-Meteo, geocodificación y perfil climático interno.
- `composition/`: selección, dispersión y fermentación.
- `render/`: DOM, canvas, filtros SVG y glitch.
- `audio/`: grafo Web Audio, capas, fades y analizador.
- `supabase/`: cliente, lectura de aprobados, URLs firmadas y subida pendiente.
- `upload/`: validación, análisis, hash, cuota y flujo de donación.
- `storage/`: `localStorage` de IDs y cuota.
- `ui/`: entrada, ubicación, acerca de, lente, donación, aviso y debug.

### Regla de dependencia
`ui` puede llamar a `composition`, `audio`, `upload` y `storage`. `composition` no conoce la UI. `supabase` no conoce la UI. `seed` y `analysis` son independientes. Esto permite reemplazar el seed o el backend sin tocar la composición.

---

## 2. Estructura de archivos

```text
/
├── index.html
├── contacto.html
├── PLAN.md
├── LICENSE
├── netlify.toml
├── css/
│   ├── base.css
│   ├── collage.css
│   ├── ui.css
│   └── donate.css
├── js/
│   ├── main.js
│   ├── config.js
│   ├── state.js
│   ├── seed/
│   │   ├── prng.js
│   │   ├── images.js
│   │   └── audio.js
│   ├── analysis/
│   │   ├── color.js
│   │   ├── fft.js
│   │   ├── audio.js
│   │   ├── audio-worker.js
│   │   └── file.js
│   ├── weather/
│   │   ├── open-meteo.js
│   │   └── profile.js
│   ├── composition/
│   │   ├── select.js
│   │   ├── layout.js
│   │   └── decay.js
│   ├── render/
│   │   ├── gallery.js
│   │   ├── glitch.js
│   │   └── svg-filters.js
│   ├── audio/
│   │   └── engine.js
│   ├── supabase/
│   │   ├── client.js
│   │   └── pieces.js
│   ├── upload/
│   │   ├── process.js
│   │   └── donate.js
│   ├── storage/
│   │   └── local.js
│   └── ui/
│       ├── entry.js
│       ├── about.js
│       ├── location.js
│       ├── lens.js
│       ├── donate.js
│       ├── notice.js
│       └── debug.js
└── supabase/
    ├── schema.sql
    └── storage.sql
```

Los módulos pueden fusionarse si el código queda más claro, pero no se cambia la separación de responsabilidades.

---

## 3. Modelo de datos y seguridad

### Tabla `pieces`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid, PK | Generado por el cliente con `crypto.randomUUID()` |
| `kind` | text | `image`, `audio`; `video` reservado |
| `storage_path` | text, único | `uuid.ext`, sin nombre original |
| `mime` | text | Lista blanca |
| `bytes` | integer | Tamaño del archivo almacenado |
| `width`, `height` | integer | Solo imágenes |
| `duration` | numeric | Solo audio, segundos |
| `color_h`, `color_s`, `color_l` | numeric | Media HSL de la imagen o color derivado del audio |
| `brightness`, `saturation` | numeric | 0–1 |
| `palette` | jsonb | 3–5 colores dominantes en HSL |
| `audio_features` | jsonb | RMS, centroide, planitud, ZCR |
| `sha256` | text, único | Duplicados exactos rechazados |
| `status` | text | `pending`, `approved`, `rejected` |
| `created_at` | timestamptz | Default `now()` |
| `approved_at` | timestamptz | Lo setea el admin |

Sin `owner_id`, sin nombre, sin título, sin caption y sin IP.

### RLS de `pieces`
- `anon` puede insertar solo filas con `status = 'pending'`, `approved_at` nulo, `kind` permitido, `bytes` dentro del límite y `sha256` con formato válido.
- `anon` puede leer solo filas con `status = 'approved'`.
- `anon` no puede actualizar ni borrar.
- El admin usa el dashboard de Supabase, que no pasa por RLS.
- El índice único de `sha256` hace cumplir el rechazo de duplicados también del lado del servidor.

### Storage
- Bucket `pozo`, privado, límite de 12 MB por archivo.
- MIME permitidos: JPEG, PNG, WebP, MP3, OGG, WAV, M4A.
- `anon` puede subir con un path `uuid.ext` que cumpla el patrón; no puede leer pendientes.
- `anon` puede leer u obtener URL firmada solo si existe una fila `approved` con ese `storage_path`. Se resuelve con una función `security definer` que evita la recursión de RLS.
- `anon` no puede actualizar ni borrar objetos.
- El dashboard permite previsualizar pendientes y aprobarlos.

### Donaciones y `localStorage`
- Antes de subir, el cliente genera `id`, `storage_path` y un registro local `{ id, path, at }`.
- La clave es `pozo.donations`. No contiene identidad, ubicación ni datos personales.
- Si la subida o el insert fallan, el registro local se revierte o se marca para diagnóstico.
- Al leer aprobados, la composición filtra los IDs propios.
- Si el visitante borra `localStorage` o cambia de dispositivo, verá su propia pieza. Es el costo de no tener identidad.
- La confirmación muestra el ID como comprobante para pedir una baja por error. No es autoría ni identidad.

### Cuota
- 3 donaciones exitosas por ventana móvil de 24 h, contadas en `localStorage`.
- No es una garantía: se puede evadir con incógnito o borrando el almacenamiento. Se acepta.
- El servidor no limita por visitante. Turnstile es el plan B.

---

## 4. Configuración externa

### Supabase
1. Crear un proyecto free.
2. Crear el bucket privado `pozo`, límite 12 MB y MIME permitidos.
3. Ejecutar `supabase/schema.sql` y `supabase/storage.sql` en el SQL Editor.
4. Copiar `Project URL` y `anon public key` en `js/config.js`.
5. Nunca usar `service_role` en el cliente ni en el repositorio.
6. El plan free puede pausarse por inactividad; la app debe caer al seed si Supabase no responde.

### Open-Meteo
- Sin clave.
- Consulta actual: temperatura, humedad relativa, `is_day`, precipitación, código WMO, nubosidad, viento, ráfagas y dirección.
- Geocodificación manual para la ciudad alternativa.
- Una consulta por entrada. Sin refresco durante la visita.
- Sin guardar coordenadas.

### Netlify
- Deploy estático desde la raíz, sin build.
- `contacto.html` contiene el formulario de Netlify Forms con honeypot.
- El formulario solo se envía en producción; en local se muestra un aviso.
- No se usan variables de entorno: las claves públicas viven en `js/config.js`.

### Ciudad por defecto
- Buenos Aires: `-34.60, -58.38` redondeado.
- No se muestra el nombre de la ciudad ni las coordenadas.

### Plan B de spam
- Documentar Turnstile + una función serverless (Supabase Edge Function o Netlify Function) para verificar el token. No implementar en la v1.

---

## 5. Pasos de ejecución

Cada paso termina con una app que funciona. No se avanza si la verificación falla.

### Paso 1 — Esqueleto, umbral y seed procedural

**Objetivo**
Tener una app estática que abre, muestra el título, entra a un campo de 8 imágenes procedurales y permite abrir/cerrar el “acerca de”. Sin clima, sin audio, sin Supabase.

**Archivos**
- Crear: `index.html`, `css/base.css`, `css/collage.css`, `css/ui.css`, `js/main.js`, `js/config.js`, `js/state.js`, `js/seed/prng.js`, `js/seed/images.js`, `js/analysis/color.js`, `js/render/gallery.js`, `js/ui/entry.js`, `js/ui/about.js`, `LICENSE`.
- Modificar: ninguno.

**Tareas**
- HTML en español, `lang="es"`, viewport, título y metadatos mínimos. Sin autor.
- Portada con “POZO DEL CLIMA”, una línea breve, “entrar” y “acerca de”. Sin clima visible.
- Overlay “acerca de” en primera persona plural: obra colectiva, CC0, clima como curador invisible, donaciones anónimas.
- Generar 8 imágenes deterministas con canvas: gradientes, ruido, bloques, scanlines y glitch. Sin texto ni caras.
- Crear `analysis/color.js`: media HSL, brillo, saturación y k-means de 3–5 colores sobre una miniatura de 64×64.
- Analizar cada imagen del seed y guardar sus features.
- Renderizar las imágenes en un campo full-screen simple, con posiciones deterministas y responsive. Sin scroll.
- Añadir un `?debug=1` mínimo que muestre cantidad de piezas y features.
- Preparar `config.js` con título, ciudad default, placeholders de Supabase y flags de desarrollo.

**Verificación en el navegador**
- Servir por HTTP, por ejemplo `python -m http.server 8000`, y abrir `http://localhost:8000`.
- La portada se ve en escritorio y en viewport móvil; no hay scroll.
- “Entrar” muestra las 8 imágenes; “acerca de” abre y cierra; no hay errores en consola.
- Al recargar, las imágenes del seed son las mismas (deterministas).
- `?debug=1` muestra las features.

**Dependencias**
Ninguna. Solo un servidor estático local.

**Estado al terminar**
La app funciona con material precargado y navegación básica.

---

### Paso 2 — Clima invisible, selección y dispersión

**Objetivo**
Convertir el campo en una composición climática: ubicación, Open-Meteo, perfil interno, selección 80/20, dispersión guiada por features, fermentación visual y lente para imágenes.

**Archivos**
- Crear: `js/weather/open-meteo.js`, `js/weather/profile.js`, `js/composition/select.js`, `js/composition/layout.js`, `js/composition/decay.js`, `js/ui/location.js`, `js/ui/lens.js`, `js/ui/debug.js`.
- Modificar: `index.html`, `css/base.css`, `css/collage.css`, `css/ui.css`, `js/main.js`, `js/state.js`, `js/render/gallery.js`, `js/config.js`.

**Tareas**
- Panel de ubicación después del click de entrada, con explicación de privacidad: “usar mi ubicación”, “elegir ciudad” y “seguir sin ubicación (Buenos Aires)”.
- Geolocalización con `enableHighAccuracy: false`, redondeo a 2 decimales y sin persistencia.
- Búsqueda de ciudad con Open-Meteo Geocoding; resultados en un selector; sin guardar el nombre.
- Consulta Open-Meteo con timeout y fallback a un perfil neutro.
- Mapear códigos WMO a estados internos: despejado, parcial, nublado, niebla, llovizna, lluvia, nieve, tormenta.
- Construir el perfil interno: color objetivo HSL, brillo, saturación, carácter sonoro, densidad, calor, humedad, turbulencia, decay y noche. Nada se muestra.
- Selección 80/20: distancia en HSL/paleta para imágenes; mezcla de los más cercanos y los más lejanos; azar con semilla de clima + fecha + sesión.
- Cantidad de imágenes entre 6 y 18 según densidad climática. Techo de 24.
- Dispersión: hue → ángulo, brillo → radio, energía/profundidad → escala y z-index. El clima ajusta densidad, turbulencia y expansión. Relajación suave para evitar oclusiones totales, sin motor de físicas.
- Fermentación visual básica con variables CSS: tinte, saturación, contraste, blur, opacidad, pixelado y desplazamiento. Sin iconos ni palabras climáticas.
- Lente para imágenes: click/tap abre la pieza sobre un fondo oscuro, cierra con botón, Esc o click fuera. No reordena ni cambia la composición.
- Al redimensionar u orientar, recalcular posiciones con la misma selección.
- Composición nueva en cada entrada; fija durante la visita; sin polling.
- `?debug=1`: perfil interno, fuente de ubicación, IDs seleccionados, distancias, cantidad y estado.
- `?mock=clear|cloud|rain|storm|fog|snow|night|heat`: perfiles simulados solo para desarrollo. No se muestran en la UI.

**Verificación en el navegador**
- Permitir ubicación: la composición carga con el clima real. Negarla: aparece la búsqueda de ciudad y el default.
- Probar todos los `?mock=` y comprobar cambios de paleta, densidad, dispersión y fermentación, sin ningún texto climático.
- `?debug=1` muestra 80/20 y el perfil.
- La lente abre y cierra; la composición no se reordena.
- Recargar genera otra composición; durante la visita se mantiene.
- En móvil hay menos piezas, la lente responde al tap y no hay scroll.
- Si Open-Meteo falla, la app sigue con perfil neutro.

**Dependencias**
Open-Meteo y geolocalización del navegador.

**Estado al terminar**
Versión mínima de imágenes + clima funcionando.

---

### Paso 3 — Audio donado

**Objetivo**
Sumar 3 audios procedurales, analizarlos, seleccionar 1–2 según el clima y reproducirlos con Web Audio. Sin colchón generado. Lente de audio, mute, fades y pausa al ocultar.

**Archivos**
- Crear: `js/seed/audio.js`, `js/analysis/fft.js`, `js/analysis/audio.js`, `js/audio/engine.js`.
- Modificar: `js/composition/select.js`, `js/composition/layout.js`, `js/render/gallery.js`, `js/ui/lens.js`, `js/ui/entry.js`, `js/main.js`, `js/state.js`, `css/collage.css`, `css/ui.css`, `js/ui/debug.js`.

**Tareas**
- Generar 3 audios deterministas de 12 s con `OfflineAudioContext`: drones, ruido filtrado, clicks y texturas. Codificar a WAV y tratarlos como piezas donadas iniciales.
- Implementar FFT radix-2 y features: RMS, centroide espectral, planitud y ZCR. Analizar los audios del seed.
- Seleccionar 1–2 audios por afinidad al perfil sonoro del clima; si no hay, silencio.
- Grafo por capa: buffer en loop → ganancia con fade → filtro → waveshaper opcional → paneo → master → analizador → salida.
- El clima modula filtro, `playbackRate` (0.85–1.15), bitcrush y paneo. Sin sonidos de lluvia, viento o truenos.
- Fades de 6–10 s; máximo 2 capas; sin colchón sintetizado en vivo.
- Desbloquear el `AudioContext` con el click de entrada. Botón de mute visible y accesible.
- Pausar audio y animaciones al ocultar la pestaña; reanudar al volver.
- Visualizar las piezas de audio como orbes/waveforms con color derivado del espectro y data decay.
- Lente de audio: suena sola, las demás capas bajan; al cerrar, vuelve la mezcla.
- Si un audio falla al cargar, se omite; si todos fallan, silencio sin error visible.
- `?debug=1`: capas activas, rate, filtro, estado del contexto y features.

**Verificación en el navegador**
- Después de entrar suenan 1–2 capas; el mute funciona; no hay clics en los fades.
- Distintos `?mock=` cambian las capas, el rate y el filtro.
- La lente de audio suena sola y vuelve a la mezcla.
- Al cambiar de pestaña se pausa; al volver se reanuda.
- En iOS Safari el audio arranca después del gesto.
- Sin audios disponibles, la obra queda en silencio y sigue funcionando.
- En debug se confirma que no hay colchón generado, solo buffers donados.

**Dependencias**
Web Audio API. Ninguna librería.

**Estado al terminar**
La obra funciona con imágenes y audio; el clima sigue invisible.

---

### Paso 4 — Supabase: lectura compartida

**Objetivo**
Configurar Supabase y leer las piezas aprobadas de todos los visitantes, con bucket privado y URLs firmadas. El seed sigue siendo el fallback.

**Archivos**
- Crear: `supabase/schema.sql`, `supabase/storage.sql`, `js/supabase/client.js`, `js/supabase/pieces.js`.
- Modificar: `js/config.js`, `js/main.js`, `js/state.js`, `js/composition/select.js`, `js/ui/debug.js`, `js/storage/local.js` (stub de IDs propios).

**Tareas**
- Crear el proyecto, el bucket y ejecutar el schema.
- Tabla `pieces` con los campos, checks, índices y `sha256` único.
- RLS: insertar solo `pending`; leer solo `approved`; sin update/delete para `anon`.
- Storage: subida anónima con path `uuid.ext`; lectura solo de objetos aprobados mediante función `security definer`; sin update/delete.
- `js/config.js`: URL y anon key. Si faltan, modo seed-only con aviso en consola, sin romper la UI.
- `fetchApprovedPieces()`: seleccionar solo aprobados, sin pendientes; pedir URLs firmadas en lote (1 h) y cachearlas en memoria.
- Merge de seed + aprobados; excluir IDs propios de `localStorage` (aunque todavía no haya flujo de subida).
- Renovar URLs firmadas antes de vencer mientras la visita sigue abierta.
- Si Supabase falla o está pausado, usar solo seed; debug muestra el estado.
- Documentar que el admin puede insertar una pieza de prueba aprobada desde el dashboard.

**Verificación en el navegador**
- Con URL/anon key válidas, una pieza aprobada de prueba aparece junto al seed.
- Una fila pendiente y su archivo no se ven; una URL firmada de un pendiente falla.
- La app no puede actualizar ni borrar filas con la anon key.
- Sin configuración o con Supabase caído, la app sigue con seed y sin errores graves.
- Las URLs firmadas cargan imágenes y audios; la renovación funciona.
- `?debug=1` muestra estado de Supabase, cantidad de aprobados y URLs.
- No hay `service_role` en el cliente.

**Dependencias**
Cuenta y proyecto de Supabase; SDK ESM por CDN con versión fijada.

**Estado al terminar**
Galería compartida de lectura funcionando, con fallback local.

---

### Paso 5 — Donación, análisis y aprobación

**Objetivo**
Completar el flujo de donación: aviso, checkbox, validación, análisis, compresión, hash, cuota, subida a Supabase, fila pendiente, comprobante, exclusión de piezas propias y contacto.

**Archivos**
- Crear: `js/analysis/file.js`, `js/analysis/audio-worker.js`, `js/upload/process.js`, `js/upload/donate.js`, `js/storage/local.js`, `js/ui/donate.js`, `js/ui/notice.js`, `contacto.html`, `css/donate.css`.
- Modificar: `index.html`, `js/main.js`, `js/config.js`, `js/supabase/pieces.js`, `js/composition/select.js`, `js/ui/debug.js`, `css/ui.css`.

**Tareas**
- Botón discreto de donación, con etiqueta accesible. Abre un overlay a pantalla completa.
- Aviso obligatorio con los siete puntos: pública, donada y sin autoría; aparecerá en collages futuros; se revisa antes de publicarse; no se puede retirar; solo material propio o de uso libre; no rostros, voces ni datos de terceros sin permiso; CC0 e irrevocable.
- Checkbox obligatorio; el botón de enviar permanece deshabilitado hasta aceptar.
- Link al formulario de contacto para bajas por error.
- Validar tipo y tamaño decodificando, no por extensión. Imagen: JPEG/PNG/WebP, 8 MB. Audio: MP3/OGG/WAV/M4A, 12 MB y 90 s.
- Imagen: `createImageBitmap`, orientación EXIF, resize a 1600 px de lado mayor, WebP 0.82, k-means y features. EXIF/GPS se pierden en el reencodeo.
- Audio: `decodeAudioData`, duración, features en worker (transferir canales), sin transcodificar. Advertir que los metadatos pueden persistir.
- SHA-256 con `crypto.subtle`; comparar con hashes aprobados y manejar el conflicto único del servidor.
- Cuota de 3 donaciones exitosas por 24 h en `localStorage`; mensaje claro al llegar al límite.
- Subir el blob a `pozo` con path `uuid.ext`, luego insertar la fila `pending` con features. Si falla el insert, informar y dejar registro para diagnóstico.
- Guardar `{ id, path, at }` en `pozo.donations`; mostrar comprobante con el ID; no mostrar el nombre del archivo.
- La donación no entra en la composición actual; solo se verá en una próxima entrada, si se aprueba.
- Excluir de la selección los IDs propios guardados en `localStorage`.
- Admin: dashboard de Supabase → `pieces` → filtrar `pending` → previsualizar el objeto en Storage → `status = approved` y `approved_at = now()` → guardar. Rechazar: `rejected` o borrar fila y objeto.
- `contacto.html`: Netlify Form con código de donación, motivo, mensaje, email opcional y honeypot. Envío por fetch con mensaje inline de éxito. En local, aviso de que requiere deploy.
- `?debug=1`: estado del procesamiento, hash, cuota, resultado del insert y error de Supabase.

**Verificación en el navegador**
- Sin aceptar el checkbox no se puede enviar.
- Imagen y audio válidos se procesan, suben y quedan `pending`; la fila y el objeto existen.
- Archivo inválido, demasiado grande, audio de más de 90 s o duplicado se rechazan con mensajes claros.
- A las 3 donaciones exitosas se bloquea la cuarta; borrar `localStorage` la habilita (limitación aceptada).
- El comprobante muestra el ID; `pozo.donations` contiene el registro; la composición actual no cambia.
- Aprobar desde el dashboard: en otra pestaña/dispositivo la pieza aparece en la próxima entrada. En el navegador del donante, el ID propio la filtra.
- La anon key no puede leer pendientes, actualizar ni borrar.
- El formulario de contacto se prueba en el deploy del Paso 6; en local muestra el aviso.
- No se muestra nombre de archivo, título, autor ni metadatos.

**Dependencias**
Supabase Storage y Database; `crypto.subtle`; Netlify Forms para el contacto.

**Estado al terminar**
Flujo completo de donación, moderación manual y contacto funcionando.

---

### Paso 6 — Pulido estético, rendimiento, accesibilidad y despliegue

**Objetivo**
Convertir el prototipo funcional en la obra final: data decay convincente, glitch y filtros SVG, tipografía, transiciones, móvil, movimiento reducido, rendimiento y deploy en Netlify.

**Archivos**
- Crear: `js/render/glitch.js`, `js/render/svg-filters.js`, `netlify.toml`.
- Modificar: `index.html`, `contacto.html`, todas las CSS, `js/composition/decay.js`, `js/render/gallery.js`, `js/ui/entry.js`, `js/ui/about.js`, `js/ui/lens.js`, `js/ui/donate.js`, `js/ui/debug.js`, `js/main.js`, `js/config.js`.

**Tareas**
- Definir el lenguaje visual: fondo oscuro de datos, fragmentos recortados, capas con blend modes, pixelado, glitch por slices, RGB offset, bit rot, scanlines y ruido. Sin iconos climáticos ni texturas orgánicas.
- Filtros SVG de fermentación con `feTurbulence` y `feDisplacementMap`, dosificados para no matar el rendimiento.
- Tipografía mono del sistema; jerarquía mínima; portada con título y texto breve; transición de entrada tipo fermentación.
- Símbolos discretos para “acerca de”, mute y donar; etiquetas accesibles; foco visible; cierre de overlays con Esc.
- Lente: foco atrapado, fondo atenuado, audio solo, retorno suave.
- Audio: normalización por RMS, fades sin clics, mute persistente en la sesión, pausa al ocultar.
- Móvil: 60% de las piezas, tap en lugar de hover, áreas seguras, sin scroll, orientación.
- `prefers-reduced-motion`: congelar deriva y glitch, mantener la fermentación estática.
- Rendimiento: máximo 24 imágenes y 2 audios; DPR 2; pausar rAF al ocultar; revocar object URLs; cache de buffers con tope; limitar filtros SVG.
- Renovación de URLs firmadas; fallback a seed si falla.
- Debug y mocks solo con query param; nada visible en producción.
- Netlify: publicar la raíz sin build; formulario de contacto detectado; headers de seguridad y CSP que permitan Supabase, Open-Meteo, Netlify Forms y el CDN del SDK.
- Textos finales del “acerca de”, aviso, contacto y `LICENSE` CC0. Sin autoría.
- QA final en Chrome, Firefox, Safari, iOS Safari y Android Chrome.

**Verificación en el navegador**
- La obra se ve terminada en escritorio y móvil; no hay overflow ni scroll.
- La lente, el mute, la donación y el “acerca de” son accesibles por teclado y tacto.
- Con movimiento reducido no hay deriva ni glitch.
- Repetir entradas no fuga memoria ni degrada el rendimiento; el audio no produce clics.
- `?debug=1` funciona; sin query param no hay panel ni mocks.
- Deploy en Netlify correcto: HTTPS, formulario detectado, envío de contacto visible en el dashboard, CSP sin bloqueos.
- Fallos simulados: Open-Meteo caído, Supabase pausado, geolocalización denegada; la obra sigue funcionando.
- No hay autor, créditos, títulos por pieza ni lectura climática.

**Dependencias**
Netlify para el deploy y Forms.

**Estado al terminar**
Obra final publicable.

---

### Paso 7 — Video (opcional, no ejecutar sin aprobación)

**Objetivo**
Dejar preparada la extensión a video sin implementarla en la v1. Solo se ejecuta si se aprueba después de la obra final.

**Puntos de extensión**
- `kind = 'video'` ya reservado en el schema.
- `analysis/video.js`: extraer un fotograma póster con canvas y analizarlo con el mismo pipeline de color.
- `render/video.js`: `<video>` muted, loop, playsinline, con data decay; reproducción solo cuando está visible.
- Subida: límite 20 MB y 30 s; MIME MP4/WebM; sin audio del video.
- Bucket: agregar MIME de video y, si hace falta, subir el límite.
- La composición y la lente reutilizan la interfaz de pieza.

**Verificación**
- Un video corto se analiza, se sube como `pending`, se aprueba y aparece en la próxima entrada.
- Se reproduce mudo y en loop, sin bloquear el audio donado.
- El fallback y la lente funcionan.

**Dependencias**
Códecs del navegador; Supabase Storage.

**Estado al terminar**
Solo si se ejecuta: video opcional integrado. Si no, la v1 queda sin video.

---

## 6. Verificación transversal

### Matriz mínima
- Escritorio: Chrome, Firefox, Safari.
- Móvil: iOS Safari y Android Chrome.
- Geolocalización: concedida, denegada, no disponible.
- Clima: real y todos los `?mock=`.
- Supabase: configurado, ausente, caído/pausado.
- Galería: solo seed, con aprobados, sin audios.
- Subida: imagen válida, audio válido, tipo inválido, tamaño excedido, duración excedida, duplicado, cuota llena.
- Moderación: aprobar, rechazar, borrar.
- Accesibilidad: teclado, foco, lector de pantalla básico, movimiento reducido.
- Rendimiento: 24 imágenes + 2 audios, pestaña oculta, resize/orientación, entradas repetidas.

### Criterios de aceptación
- Cada paso deja la app funcionando y sin errores de consola.
- El clima nunca se muestra ni se nombra en la UI principal.
- La composición cambia en cada entrada y se mantiene durante la visita.
- No hay “revolver”, polling ni recomposición a mitad de visita.
- No hay autoría, créditos, títulos, nombres de archivo ni metadatos visibles.
- Las donaciones quedan pendientes, privadas y solo aparecen tras aprobación.
- La anon key no puede leer pendientes, actualizar ni borrar.
- La obra funciona en móvil y escritorio.
- El código es legible, modular y comentado en español.

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Cuota 3/día evitable sin auth | Aceptado. Turnstile documentado como plan B. |
| Spam de filas u objetos | Aprobación manual, bucket con límite, MIME whitelist, hash único, Turnstile futuro. |
| Supabase free se pausa | Fallback a seed; aviso en debug; reactivar desde el dashboard. |
| Metadatos de audio persistentes | Aviso explícito; no se promete limpieza. |
| EXIF/GPS en imágenes | Reencodeo a WebP en canvas; verificación con imagen de prueba. |
| URLs firmadas vencen | Renovación antes de expirar; cache en memoria. |
| Archivos huérfanos si falla el insert | Registro en debug; limpieza manual desde Storage. |
| `localStorage` borrado | La pieza propia puede aparecer; aceptado por no tener identidad. |
| Filtros SVG costosos | Presupuesto limitado; solo algunos elementos; probar FPS. |
| Autoplay bloqueado | Entrada por gesto; `resume()`; mute visible. |
| Geolocalización denegada | Búsqueda manual y default Buenos Aires. |
| Dependencia del CDN del SDK | Versión fijada; se puede vendorizar en `vendor/` si falla. |
| Netlify Forms solo en deploy | Verificación local con aviso; prueba final en producción. |

---

## 8. Orden de trabajo

1. Aprobar este plan.
2. Ejecutar el Paso 1 completo.
3. Verificar en el navegador y esperar confirmación.
4. Repetir con el Paso 2, 3, 4, 5 y 6.
5. El Paso 7 solo si se aprueba después de la v1.

No se implementan pasos futuros “de paso”. No se agregan dependencias ni servicios sin consultar. No se commitea nada salvo pedido explícito.

---

## 9. Aprobación

Al responder **“aprobado, paso 1”**, se ejecuta únicamente el Paso 1 y se detiene para verificar. La implementación no empieza hasta esa confirmación.
