# PWA publicada en Vercel

- URL: https://app.fexpo.lat
- Proyecto: `fexpo-app`, scope `quispevargasomar-7449s-projects`.
- Repositorio conectado: `FexpoApp/fexpo-app-pwa`, rama `main`.
- Backend: https://api.fexpo.lat → Cloudflare → Nginx → Docker en `saul-fexpo-lor`.
- DNS Cloudflare: CNAME `app` → `43308949085b26af.vercel-dns-017.com`, DNS-only.
  La API sigue con su proxy Cloudflare independiente.

## Variables de producción

Configuradas mediante Vercel CLI, sin claves JWT ni credenciales de base de datos:

| Variable | Valor |
| --- | --- |
| `BACKEND_URL` | `https://api.fexpo.lat` (solo servidor) |
| `VITE_DATA_MODE` | `live` |
| `VITE_EVENT_ID` | `e0000000-0000-4000-8000-000000000001` |
| `VITE_GOOGLE_CLIENT_ID` | `492704011109-3479bq36uucvnqlsjrlfatur1fb3kjhu.apps.googleusercontent.com` |

El evento anterior es el único activo encontrado en la base actual, llamado
`FIPAZ 2026 (local)`; se comprobó que catálogo, mapa y actividades existen.
No se crearon ni sembraron registros para las pruebas. Al publicar otro evento,
cambiar `VITE_EVENT_ID` y desplegar otra vez, porque Vite lo incorpora al build.

El navegador llama al mismo origen (`/api/backend` y `/api/session/*`). Las
funciones de Vercel usan `BACKEND_URL` para contactar Nest. No hace falta abrir
el puerto 3000 ni conectar por SSH desde Vercel. Las cookies de refresh son
HttpOnly/Secure y no se entregan al JavaScript de la PWA.

## Build reproducible

`vercel.json` y los ajustes del proyecto fijan:

- Install: `npm ci`.
- Build: `npm run build:live`.
- Output: `dist`.
- Gestor: `npm@11.19.0`, `package-lock.json`.

Se añadió `workbox-window` explícitamente: el módulo virtual React de
vite-plugin-pwa no podía resolverlo con el árbol de dependencias previo.
`.vercelignore` excluye secretos/archivos locales y los lockfiles de pnpm
anteriores; se conservaron estos últimos en la copia local. Esto evita que el
empaquetador de funciones de Vercel elija pnpm después del build npm.

La configuración local y los cambios de integración que ya existían se
incluyeron en el despliegue CLI. Antes de desplegar por Git desde otra copia,
asegurarse de incorporar estos cambios de fuente/configuración al repositorio.

## Despliegue con comprobación previa

```bash
vercel link --project fexpo-app --scope quispevargasomar-7449s-projects
vercel env ls production
npm ci
npm run typecheck
npm test
npm run build:live
vercel deploy --prod --skip-domain --yes
# Probar la URL preparada con `vercel curl --deployment <id>` si está protegida.
vercel promote <url-o-id-del-despliegue> --yes
vercel domains verify app.fexpo.lat
```

Para cambiar una variable existente, usar `vercel env update <nombre> production`
y desplegar de nuevo. No publicar `.env.local` ni tokens de Vercel en Git.

## Pruebas reales de integración

```bash
VITE_EVENT_ID=e0000000-0000-4000-8000-000000000001 \
  node scripts/smoke-production.mjs https://app.fexpo.lat
VITE_EVENT_ID=e0000000-0000-4000-8000-000000000001 \
  node scripts/smoke-browser.mjs https://app.fexpo.lat
```

El navegador usa Playwright Chromium. Puede elegirse uno instalado mediante
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; de lo contrario, instalarlo con
`npx playwright install chromium`.

Resultado de la revisión del 2026-10-27:

- Typecheck y compilación live correctos; 29 tests unitarios correctos.
- 8 pruebas funcionales Playwright live correctas con API/OAuth/NFC simulados.
- 17 comprobaciones HTTP contra la PWA y el backend reales: SPA, manifest/SW,
  igualdad de catálogo con API directa, mapa, actividades, ranking, ficha de
  stand, protección de rutas privadas, token Google inválido, CSRF y allowlist.
- Navegador real, sin mocks de API: catálogo móvil, ficha por URL directa, mapa,
  perfil conectado, contexto seguro, service worker y caché sin `/api/`.
  Sin excepciones JavaScript. Evidencia en `test-results/production-smoke/`.
- Las dependencias de producción no muestran vulnerabilidades en `npm audit
  --omit=dev`. El audit completo aún señala dependencias de herramientas de test;
  no se hizo una migración mayor de Vitest dentro de este despliegue.

## Google OAuth

La PWA usa el cliente web indicado por el usuario:

```text
492704011109-3479bq36uucvnqlsjrlfatur1fb3kjhu.apps.googleusercontent.com
```

En **Orígenes de JavaScript autorizados** de ese mismo cliente debe figurar:

```text
https://app.fexpo.lat
```

Añadir la dirección solo a URI de redireccionamiento no habilita el flujo de
Google Identity Services con callback JavaScript. La PWA y el backend deben
coincidir en el client ID: `VITE_GOOGLE_CLIENT_ID` se incorpora al build de Vite,
y `GOOGLE_CLIENT_ID` de Nest valida el audience del token.

El backend ya incluye este cliente en su lista de audiences, conservando el
cliente anterior para compatibilidad. Después de cambiar una variable VITE,
volver a desplegar; una PWA instalada puede necesitar aceptar la actualización
del service worker para dejar de usar la compilación anterior.

Comprobar `/profile` en un navegador nuevo: el iframe `/gsi/button` debe responder
200 y mostrar el botón sin el error de origen no autorizado. Esta comprobación
no sustituye iniciar sesión con una cuenta real ni las políticas de audiencia
Testing/Production del consentimiento de Google.

Validación posterior al cambio de cliente (2026-10-27): nueva compilación
`dpl_6HvvNwXFAnN24uXpB9ttMwrJw4MR` promovida a producción. Chromium confirmó
client ID `492704011109-…`, botón visible, `/gsi/client`, `/gsi/style` y
`/gsi/button` HTTP 200, sin mensajes de origen no autorizado. Volvieron a pasar
las 17 comprobaciones HTTP reales. El login completo con una cuenta real queda
para el usuario; no se introdujeron credenciales en las pruebas automáticas.

## Origen canónico y enlaces antiguos

Los alias estables `fexpo-app.vercel.app` y
`fexpo-app-quispevargasomar-7449s-projects.vercel.app` no están autorizados en
Google para este cliente. Se reprodujo el rechazo del iframe Google (403) en el
primero, mientras `app.fexpo.lat` abría la ventana de acceso con el client ID y
el origen correctos.

`vercel.json` redirige sus navegaciones HTML a `https://app.fexpo.lat`,
conservando ruta y query. El alias del equipo conserva la protección SSO de
Vercel, que puede ejecutarse antes de la redirección para usuarios no autenticados.
La condición Accept HTML evita redirigir peticiones de
service worker, precache, assets y API, para que las instalaciones antiguas
puedan descargar la actualización. `src/main.tsx` también normaliza esos dos
hosts antes de montar React, cubriendo la entrada desde HTML cacheado cuando el
nuevo bundle ya está disponible. No se redirigen localhost ni despliegues de
preview.

Una instalación que todavía ejecuta un bundle antiguo debe aceptar **Actualizar**
en el aviso de nueva versión. Para diagnosticar sin borrar datos locales ni
lecturas pendientes, abrir `https://app.fexpo.lat/profile` en una ventana privada.
Si persiste el error después de seleccionar una cuenta, revisar los campos
`origin` y `client_id` de los detalles de Google. No compartir secretos, códigos
ni tokens.

Prueba del origen y apertura anónima de la ventana Google (sin iniciar sesión):

```bash
VITE_GOOGLE_CLIENT_ID=492704011109-3479bq36uucvnqlsjrlfatur1fb3kjhu.apps.googleusercontent.com \
  node scripts/smoke-google.mjs
```

Validación de alias (2026-10-27): desplegado
`dpl_4xQD718d8C4azdNzA1EJbksDLsKd`. Alias público: HTML 308 al dominio canónico
con query preservada y `/sw.js` 200. Alias de equipo: SSO Vercel conservado;
con bypass autorizado del CLI devuelve la redirección 308 esperada. El smoke
Google confirmó el redirect del cliente incluso con Accept `*/*`, botón visible
y popup con client ID `492704011109-…` y origen `https://app.fexpo.lat`, sin
`origin_mismatch` antes del login. Typecheck, build, 29 unitarios y 17 pruebas
HTTP reales correctos. La validación posterior a seleccionar una cuenta real
requiere intervención del usuario y no se da por completada automáticamente.
