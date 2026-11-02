# TV DexterH4ck

Aplicación web Next.js responsive + canal Roku SceneGraph/BrightScript, con catálogo compartido, categorías, favoritos por usuario y progreso de reproducción.

## Infraestructura
- Supabase existente: esquema aislado `tv_dexter`; no se modifican tablas ni datos de la clínica veterinaria ni de otros proyectos.
- RPC seguras `tv_dexter_catalog`, `tv_dexter_get_me`, `tv_dexter_set_favorite`, `tv_dexter_save_progress`, todas SECURITY INVOKER y sujetas a RLS.
- Categorías: Inicio, En vivo, Películas, Series, Deportes, Infantil, Documentales, Xuper y Plugins.
- Las rutas de API usan clave pública + JWT del usuario; no requieren service_role.

## Variables Vercel
- `NEXT_PUBLIC_SUPABASE_URL=https://yxjyqpnvgtkdaaukackt.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = clave publishable/anon del proyecto.
- `SUPABASE_URL=https://yxjyqpnvgtkdaaukackt.supabase.co`

Activar Email OTP en Supabase Auth y añadir la URL de producción de Vercel en Redirect URLs. Añadir la misma clave pública como GitHub Actions Secret `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Publicar contenido
Crear filas en `tv_dexter.catalog_items` con `published=true`, categoría existente y una URL propia o autorizada en `stream_url`. El reproductor web soporta MP4 y HLS cuando el navegador lo admite de forma nativa. No se incluyen listas IPTV, canales de pago ni enlaces de terceros sin autorización.

## Roku
El cliente Roku inicial consume el endpoint público de catálogo. Empaquetar `roku/` en ZIP e instalar mediante Developer Installer en un Roku con modo desarrollador. Para distribución pública se requiere cuenta Roku Developer y revisión del canal.

## Desarrollo
`npm ci && npm run dev` · `npm run lint` · `npm run build`.
