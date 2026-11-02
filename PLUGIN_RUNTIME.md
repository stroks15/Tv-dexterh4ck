# DexterH4ck — runtime de plugins multiplataforma

## Qué se portó desde Kino

El launcher Android de Kino ya define un contrato declarativo en `plugin_sources.json` y `recomendaciones_launcher.json`: cada entrada tiene un `id`, `plugin_source`, `target_content`, `playback_mode` y `extras.stream_url`. Su reproductor Android usa Media3/ExoPlayer para HLS y DASH, y su configuración separa el proveedor de la UI.

DexterH4ck conserva esa separación y porta el contrato, no el binario Kotlin:

- `public/plugins.json`: registro compartido y neutral de los conectores.
- `src/lib/plugin-runtime.ts`: valida la versión del registro y resuelve las fuentes por `source_name`.
- Web: HLS con hls.js / HLS nativo; DASH con dash.js cargado sólo al abrir un stream DASH; MP4 con `<video>` nativo.
- Roku: BrightScript carga el mismo `plugins.json`, muestra los proveedores y reproduce HLS/DASH/MP4 con el nodo nativo `Video`.
- Catálogo: las filas publicadas en `tv_dexter.catalog_items` usan `source_name` igual al `id` o `name` del plugin, o `metadata.plugin_source` igual al `id`; `stream_url` contiene el manifiesto o archivo autorizado. Para conservar el contrato Kino, también se aceptan `metadata.target_content`, `metadata.playback_mode` y `metadata.extras.stream_url` / `metadata.extras.stream_format`.

## Límite de portabilidad

Kotlin, Media3, Android Intents, ContentProviders, APKs y librerías `.aar` no se ejecutan en navegador ni en Roku. Se adaptan sus contratos y comportamiento con reproductores nativos de cada plataforma. Un plugin que sólo funciona como código Android no se convierte automáticamente en plugin web/Roku: necesita un adaptador equivalente documentado, una API oficial o una URL multimedia compatible.

El repositorio XTVR consultado declara Apache-2.0, pero en el checkout disponible sólo aparecen archivos Gradle/README/guías y no está presente el código de `app`, ni las clases del proveedor Xuper. Por eso no se ha copiado ni inventado código interno de XTVR. El registro Xuper de Kino está portado como adaptador `direct_hls_dash`, pendiente de una fuente autorizada real.

## Habilitar un plugin

1. Verifica que el proveedor permite el uso en tu servicio y que la URL/API es legítima.
2. Configura `enabled: true` en `public/plugins.json` y mantén `platforms` limitado a `web` y/o `roku` según las pruebas.
3. Publica registros en `tv_dexter.catalog_items` con `published=true`, `source_name` igual al `id` o `name`, y `stream_type` (`hls`, `dash` o `mp4`).
4. `stream_url` debe ser HTTP(S), reproducible desde el dispositivo y con CORS habilitado para web. Las credenciales privadas no se guardan en `plugins.json` ni en el cliente.
5. Si el proveedor requiere tokens, firma o renovación de URL, implementa un endpoint servidor específico; nunca expongas secretos en el navegador o Roku.

## Compatibilidad

- Web: HLS depende de hls.js/MSE o del soporte HLS nativo del navegador; DASH depende de MediaSource Extensions y de códecs/DRM compatibles. DRM no se elimina ni se evade.
- Roku: el canal usa el `Video` node del sistema. La reproducción real depende de modelo Roku, códec, manifiesto, TLS, DRM y red.
- No se incluye scraping, extracción de URLs de apps de terceros, bypass de autenticación ni desbloqueo de servicios de pago.
