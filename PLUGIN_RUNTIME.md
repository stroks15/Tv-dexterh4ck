# Integración de Kino / Xuper en DexterH4ck

## Archivos recibidos e inspeccionados

- `kino-20261022-224342.log`: evidencia de una sesión real de Kino 0.9.70-desktop con el plugin Xuper. Confirma que el plugin ejecutó `home`, `liveCategories`, `liveChannels` y `resolve`; recuperó páginas de canales (250 elementos por página en una categoría), obtuvo respuesta del servicio y resolvió un stream con dos candidatos CDN. También muestra una carga inicial parcial del inicio y cancelaciones de paginación cuando ya no había pantalla esperando el resultado.
- `Kit-yojanderkits.kino`: kit declarativo de 28 plugins con sus repositorios y versiones. Se importó como catálogo de metadatos, no como 28 plugins funcionales. La entrada Xuper del kit fija la versión 2.2.29.
- Repositorio público de Xuper: https://github.com/xuper-plugin/kino-plugin-xuper. El README describe un plugin de Kino SDK API v6 y el repositorio contiene código fuente, pruebas y manifiesto. La versión visible actualmente en su manifiesto upstream es 2.3.3; el kit aportado fija 2.2.29. El repositorio incluye licencia Apache-2.0 y NOTICE de atribución.

## Qué significa la adaptación

El código de un plugin Kino se ejecuta dentro del sandbox y SDK de Kino. No se puede ejecutar directamente en Roku SceneGraph ni en el navegador. El port correcto es por capas:

1. Mantener una descripción neutral del plugin y sus capacidades.
2. Crear un adaptador servidor por proveedor para llamadas de catálogo, búsqueda, paginación, detalles y resolución.
3. Convertir los resultados al modelo neutral de DexterH4ck.
4. Enviar al cliente sólo URLs multimedia autorizadas y temporales, nunca contraseñas, tokens de cuenta, claves selladas o secretos del proveedor.
5. Reproducir el stream mediante HTML5/HLS/DASH en web y SceneGraph Video en Roku.

## Evidencia Xuper del log

- Sesión/token temporal y activación completados.
- Inicio consultado con una respuesta parcial.
- Categorías en vivo consultadas.
- Canales paginados con tamaños de 250, 250, 250, 250 y 35 en una categoría, y otra categoría con 138.
- Resolución de canal completada con dos hosts CDN candidatos.
- Se observaron cancelaciones de consultas de páginas cuando la vista dejó de necesitarlas. El adaptador nuevo debe propagar AbortSignal/cancelación y no duplicar solicitudes.

El log no contiene los cuerpos JSON completos, reglas de firma ni un flujo reproducible completo para web/Roku. Por eso sirve como evidencia de comportamiento y rendimiento, pero no basta por sí solo para implementar el protocolo completo.

## Seguridad y límites

- El manifiesto Xuper upstream contiene valores sellados para secretos. No se copian a DexterH4ck ni se deben exponer en frontend, Roku, logs o repositorios.
- No se reutilizan cuentas compartidas, semillas, sesiones ajenas ni mecanismos para saltar restricciones regionales o autenticación.
- Las credenciales del usuario, si el proveedor autoriza integración externa, se procesan exclusivamente en backend y se almacenan cifradas; nunca se comparten entre usuarios.
- Los 28 elementos del kit quedan desactivados hasta verificar repositorio/licencia, permisos del proveedor y fuente de contenido.
- `source_license: UNVERIFIED` significa que el kit por sí solo no acredita licencia de código ni derechos de retransmisión. No se infiere que una lista de plugins conceda derechos sobre películas, canales o servicios de terceros.

## Licencia de Xuper

El repositorio `xuper-plugin/kino-plugin-xuper` incluye Apache License 2.0 y un NOTICE con atribución a xuper-plugin. Cualquier código derivado que se distribuya debe conservar la licencia y avisos aplicables, e identificar claramente los archivos modificados. La licencia del código del plugin no otorga derechos sobre el contenido ni sobre las API/servicios de terceros.

## Próxima implementación técnica

La primera adaptación real debe centrarse en un adaptador Xuper aislado y auditado:
- contrato de proveedor: home, liveCategories, liveChannels, search, details, resolve;
- caché de catálogo con TTL y paginación incremental;
- cancelación de peticiones al cambiar de pantalla;
- normalización de categorías, títulos, logos, EPG y variantes CDN;
- resolución segura de URLs HTTP(S) y validación de hosts;
- compatibilidad de reproducción probada por separado en navegador y Roku.

No se debe portar el runtime completo de Kino ni su SDK propietario dentro de la app. Se porta el comportamiento que cada plataforma puede implementar de forma nativa.

## Interfaz Smart TV (seis vistas)

La aplicación ahora arranca en TV en Vivo, recupera el último canal guardado en el navegador y, si no existe, elige el primer canal del catálogo. La guía ordena primero los canales mexicanos por el orden solicitado y después el resto alfabéticamente. La navegación admite flechas, Enter, Escape y Backspace; la selección se mantiene visible y las tarjetas tienen foco visible.

Las vistas son: TV en Vivo, Plataformas, Categorías, Kids & Shorts, Anime y Adultos con PIN. Los carruseles y resultados se alimentan exclusivamente de tv_dexter_catalog; las etiquetas de colecciones son filtros sobre los títulos existentes, no generan contenido de relleno. Favoritos y progreso continúan usando los endpoints/RPCs existentes.

## Contrato de adaptador de plugins

Un plugin es reproducible únicamente cuando su adaptador puede devolver metadatos de catálogo y una URL multimedia autorizada. El endpoint GET /api/plugins/:id/catalog?q=... consulta el RPC tv_dexter_catalog, filtra por metadata.plugin_source o source_name y solo responde con resultados de esa fuente cuando el plugin está habilitado en public/plugins.json. El reproductor web admite HLS (hls.js), MP4 y reproducción nativa del navegador; las URLs deben ser HTTP(S), CORS/códecs deben ser compatibles y el proveedor debe permitir su reproducción.

Los 28 registros importados desde YojanderKits siguen deshabilitados mientras no exista un adaptador probado y una fuente cuyo uso/retransmisión esté autorizado. El registro de metadatos no equivale a un plugin funcional. Para habilitar uno hay que implementar su adaptador backend, normalizar resultados a catalog_items/RPC, probar búsqueda, paginación, detalles y resolución, validar URL/códecs y documentar licencia/derechos. No se deben usar endpoints privados, credenciales compartidas publicadas, pools de sesiones, huellas de emulador, tokens sellados ni mecanismos de evasión de geobloqueo/DRM.

### Xuper

Se inspeccionó el repositorio público xuper-plugin/kino-plugin-xuper (Apache-2.0; kit fija 2.2.29 y upstream consultado declara 2.3.3). Su código depende del entorno/SDK de Kino y de un portal de terceros, sesiones de dispositivo, firmas de peticiones y hosts/CDN. El código fuente por sí solo no otorga derechos sobre los streams ni convierte el SDK Kino en un runtime web/Roku. No se copiaron secretos ni se reutilizaron cuentas compartidas o mecanismos de rescate de sesión. Por eso Xuper permanece desactivado hasta disponer de una integración del proveedor con credenciales propias y autorización verificable. Roku requiere además validar compatibilidad real del formato en el dispositivo; compilar el ZIP no prueba reproducción en hardware.

## Control parental

El PIN se valida exclusivamente en servidor en POST /api/adult/verify. Configurar:
- TV_ADULT_PIN_HASH: SHA-256 hexadecimal del PIN numérico (4–8 dígitos).
- TV_ADULT_SESSION_SECRET: secreto aleatorio de al menos 32 bytes para firmar la cookie.

La sesión dura 20 minutos; la cookie es HttpOnly, SameSite=Strict y Secure en producción. No se incluye PIN por defecto. Si las variables no existen, el acceso queda cerrado. La vista de adultos abre sitios externos oficiales en otra pestaña; no captura contraseñas/cookies ni automatiza sesiones. Los servicios no ofrecen una API pública común que permita consolidar sus historiales privados; el historial unificado solo puede contener reproducciones de DexterH4ck o integraciones oficialmente autorizadas.

## Validación

npm run lint, npm run validate:plugins, npm run build y npm run build:roku deben pasar antes de integrar cambios. La compilación Roku valida el empaquetado, no el comportamiento de un Roku físico.

## Declaraciones de red del kit Android (actualización)

Se incorporaron al manifiesto `public/plugins.json` los hosts que el usuario declaró explícitamente para los plugins cuya lista pudo identificarse. Cada registro conserva los hosts como **metadatos declarativos**, no como prueba de titularidad, autorización de retransmisión ni permiso para ejecutar código remoto. Los nombres de host ambiguos o transcritos de forma incompleta se omitieron en lugar de adivinarlos.

La política declarada es `declared_hosts_only`: cualquier adaptador futuro debe restringir sus solicitudes a los hosts exactos documentados y no habilitar navegación oculta, servidores HTTPS arbitrarios, saltos de autenticación, DRM o geobloqueos. Las capacidades se limitan a consulta de catálogo, búsqueda, canales en vivo, autenticación del propio usuario y reproducción de streams autorizados, según cada plugin.

Por decisión del usuario, se excluyeron expresamente `offline_video_downloads` y `diagnostic_telemetry` de todos los registros. No se implementarán descargas locales ni recopilación/envío de diagnósticos a Kino.

**Estado:** los metadatos de red quedaron agregados; los plugins continúan deshabilitados hasta completar revisión de código/licencia, autorización de la fuente y adaptadores funcionales probados. Añadir hosts no equivale a habilitar el plugin ni a confirmar que su contenido esté disponible.

## Fuentes personales reproducibles (implementación)

Se añadió una conexión nativa de DexterH4ck en **Mis fuentes** para servicios Xtream propios/suscritos y listas M3U que el usuario tenga derecho a reproducir.

- Xtream: consulta categorías, canales en vivo y películas mediante la API estándar del servidor; construye las URLs de reproducción del propio proveedor.
- M3U: lee una lista remota, interpreta `#EXTINF`, nombres, logos y grupos; normaliza enlaces HLS, DASH, MP4 y MPEG-TS.
- El reproductor web admite HLS (hls.js), DASH (dash.js) y reproducción nativa compatible.
- Los datos de acceso permanecen en el estado temporal del formulario; no se guardan en Supabase ni en localStorage. La URL de reproducción del proveedor puede contener el usuario/clave y queda visible al navegador durante la reproducción, como requiere el formato Xtream estándar.
- No se descargan archivos de video ni se envían diagnósticos. Las respuestas de conexión usan `Cache-Control: no-store`.
- La conexión valida HTTP(S), resuelve el host y rechaza destinos locales/privados, limita tamaño/tiempo y no sigue redirecciones. Los streams M3U con hosts no públicos se descartan.

**Alcance:** este conector no ejecuta plugins Android/Kino ni extrae enlaces ocultos de páginas, no reutiliza sesiones de Kino y no desbloquea DRM, cuentas compartidas o geobloqueos. Los demás plugins del kit continúan deshabilitados hasta que exista una integración autorizada y un adaptador probado para cada proveedor. La conexión requiere un servicio Xtream o lista M3U del usuario y no trae canales precargados.

