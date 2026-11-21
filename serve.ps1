# Servidor estático de desarrollo para Windows.
# No forma parte de la obra: la app se publica como archivos estáticos.
# Uso:
#   powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1 -Port 8080
# Se detiene con Ctrl+C.

param([int]$Port = 8000)

$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$prefix = "http://localhost:$Port/"

$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.webmanifest' = 'application/manifest+json; charset=utf-8'
  '.md'   = 'text/markdown; charset=utf-8'
  '.txt'  = 'text/plain; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.woff2' = 'font/woff2'
  '.wav'  = 'audio/wav'
  '.mp3'  = 'audio/mpeg'
  '.ogg'  = 'audio/ogg'
  '.m4a'  = 'audio/mp4'
  '.mp4'  = 'video/mp4'
  '.webm' = 'video/webm'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Prefixes.Add("http://127.0.0.1:$Port/")

try {
  $listener.Start()
} catch {
  Write-Host "No se pudo abrir $prefix"
  Write-Host "Probá con otro puerto: powershell -File serve.ps1 -Port 8080"
  exit 1
}

Write-Host "POZO DEL CLIMA en $prefix"
Write-Host "Raíz: $root"
Write-Host "Ctrl+C para detener."

while ($listener.IsListening) {
  try {
    $context = $listener.GetContext()
  } catch {
    break
  }

  $request = $context.Request
  $response = $context.Response
  $isHead = $request.HttpMethod -eq 'HEAD'

  try {
    $relative = [Uri]::UnescapeDataString($request.Url.AbsolutePath)
    if ($relative -eq '/' -or $relative -eq '') { $relative = '/index.html' }

    $candidate = Join-Path $root ($relative.TrimStart('/').Replace('/', '\'))
    $full = [System.IO.Path]::GetFullPath($candidate)
    $rootPrefix = $root.TrimEnd('\') + '\'

    # No salir de la carpeta del proyecto (ni a una carpeta hermana con el mismo prefijo).
    if (-not $full.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
      $response.StatusCode = 403
      $response.Close()
      continue
    }

    if (Test-Path $full -PathType Container) {
      $full = Join-Path $full 'index.html'
    }

    if (Test-Path $full -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
      $response.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
      $response.Headers.Add('Cache-Control', 'no-store')
      # Mismas cabeceras que netlify.toml, sin upgrade-insecure-requests para
      # poder probar la CSP en http://localhost.
      $response.Headers.Add('Content-Security-Policy', "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://ajgwlejmyrlfsgniwzhe.supabase.co; media-src 'self' blob: https://ajgwlejmyrlfsgniwzhe.supabase.co; font-src 'self'; connect-src 'self' blob: https://ajgwlejmyrlfsgniwzhe.supabase.co wss://ajgwlejmyrlfsgniwzhe.supabase.co https://api.open-meteo.com https://geocoding-api.open-meteo.com https://cdn.jsdelivr.net; worker-src 'self' blob:; manifest-src 'self'")
      $response.Headers.Add('X-Content-Type-Options', 'nosniff')
      $response.Headers.Add('X-Frame-Options', 'DENY')
      $response.Headers.Add('Referrer-Policy', 'strict-origin-when-cross-origin')
      $response.Headers.Add('Permissions-Policy', 'geolocation=(self), camera=(), microphone=(), payment=(), usb=()')
      $response.Headers.Add('Cross-Origin-Opener-Policy', 'same-origin')
      $response.ContentLength64 = $bytes.Length
      if (-not $isHead) {
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } else {
      $response.StatusCode = 404
      $body = [System.Text.Encoding]::UTF8.GetBytes('404')
      $response.ContentType = 'text/plain; charset=utf-8'
      $response.ContentLength64 = $body.Length
      if (-not $isHead) {
        $response.OutputStream.Write($body, 0, $body.Length)
      }
    }
  } catch {
    try { $response.StatusCode = 500 } catch {}
  } finally {
    try { $response.Close() } catch {}
  }
}
