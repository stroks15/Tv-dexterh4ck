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
