# TV DexterH4ck

Aplicación web Next.js responsive + cliente Roku SceneGraph/BrightScript, con catálogo compartido, categorías, favoritos por usuario y progreso de reproducción.

## Estado de infraestructura
- Supabase: esquema aislado `tv_dexter` creado en el proyecto existente de Clínica Veterinaria Salud Animal. No se modificaron tablas, funciones ni datos del esquema `public` ni del resto de aplicaciones.
- Tablas: `categories`, `catalog_items`, `favorites`, `playback_progress`, `ingestion_jobs`. RLS activado; favoritos y progreso restringidos al usuario autenticado.
- Categorías iniciales: Inicio, En vivo, Películas, Series, Deportes, Infantil, Documentales, Xuper y Plugins.

## Configuración Vercel
Configurar en Production y Preview:
- `NEXT_PUBLIC_SUPABASE_URL=https://yxjyqpnvgtkdaaukackt.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = clave publishable/anon del proyecto
- `SUPABASE_URL=https://yxjyqpnvgtkdaaukackt.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = clave secreta solo servidor. Nunca usar prefijo NEXT_PUBLIC.

El inicio de sesión usa enlace mágico por correo (activar Email OTP en Supabase Auth y configurar URL de redirección de Vercel). Las claves secretas deben añadirse en Vercel y GitHub Actions Secrets, nunca al repositorio.

## Publicar catálogo
Insertar elementos en `tv_dexter.catalog_items` con `published=true`, `category_id` existente y una URL de reproducción legal/propia en `stream_url`. Para HLS usar una URL .m3u8; la reproducción web depende del soporte del navegador. No se incluyen listas IPTV, canales de pago ni contenido de terceros sin autorización.

## Roku
El directorio `roku/` contiene el canal SceneGraph mínimo que consume el endpoint web de catálogo. Configurar `api_base` en `source/main.brs` con el dominio de producción. Empaquetar la carpeta `roku` como ZIP e instalar con Developer Installer en un Roku habilitado para desarrollo. Para distribución pública se requiere cuenta Roku Developer, identificador de canal, revisión y credenciales propias.

## Desarrollo
`npm ci && npm run dev` — `npm run build` valida producción.
