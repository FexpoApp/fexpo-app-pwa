# Pruebas E2E y estado funcional de la PWA

Revisión: 2026-10-27. El dominio `app.fexpo.lat` y los demás subdominios
`fexpo.lat` son producción. La suite de GitHub Actions usa un backend
inaccesible de prueba y respuestas controladas en Playwright. No crea usuarios,
visitas, favoritos ni inscripciones en la base de producción.

## Cobertura automatizada

| Modo    | Recorridos comprobados                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `demo`  | Rutas y recursos sin desbordamiento en cuatro anchos y dos temas; visita NFC simulada, duplicados y cancelación; mapa, búsqueda, perfil de stand, favoritos visuales, ruleta y raspadita; PWA offline; perfil, nombre, apariencia, sonidos, QR, avisos, premios y reinicio.                                                                                                                                                                                                 |
| `local` | Entrada de prueba sin Google ni API, persistencia local, salida; lectura NDEF, UID ausente, cancelación, error de formato y permiso rechazado; mapa original 2D/3D en siete plantas, búsqueda, NFC de ubicación sin puntos, GPS relativo y errores; WebGL no disponible; uso sin red y diseño adaptable.                                                                                                                                                                    |
| `live`  | Sesión Google con credencial **simulada**, QR personal, favoritos, catálogo y filtros, mapa y ranking; edición del nombre con validación y persistencia; inscripción a actividades con error y reintento; error/reintento al cargar actividades; NFC, visita duplicada y cola offline, saldo autoritativo del servidor; cierre de sesión, limpieza de datos privados, acceso invitado, enlaces inválidos, backend caído, audio y service worker offline; vistas adaptables. |

Las pruebas `live` interceptan la API con fixtures. El navegador y los flujos
del frontend son reales; los datos y la identidad no proceden de producción.
Las pruebas unitarias cubren además el bridge HTTP, sesión, cola, GPS, audio,
NFC, mapa y estado de demo.

El workflow [`pwa-e2e.yml`](../.github/workflows/pwa-e2e.yml) ejecuta
`npm ci`, tipos, unitarias y auditoría de dependencias, seguido de una matriz
Playwright con `demo`, `local` y `live` en Chromium. Corre en PR, cambios de
aplicación enviados a `main` y manualmente. Si falla, conserva capturas y
trazas durante siete días. Cada modo compila su propio `dist` y usa
`BACKEND_URL=http://127.0.0.1:9`; no necesita secretos de GitHub.

Vercel continúa desplegando automáticamente desde Git. Un push directo a
`main` puede publicarse antes de que termine este workflow; para hacer sus
checks obligatorios antes de producción, el repositorio necesita proteger
`main` y exigir que los cambios entren por PR con los jobs `unit` y `browser`
aprobados.

Para repetir localmente:

```bash
npm ci
npm run typecheck
npm test
npm audit
export BACKEND_URL=http://127.0.0.1:9
export VITE_EVENT_ID=e0000000-0000-4000-8000-000000000001
export VITE_GOOGLE_CLIENT_ID=492704011109-3479bq36uucvnqlsjrlfatur1fb3kjhu.apps.googleusercontent.com
for mode in demo local live; do
  npm run build:$mode
  npm run test:e2e:$mode
done
```

Instalar Chromium antes de la primera E2E con
`npx playwright install --with-deps chromium`. Los resultados temporales se
guardan en `test-results/`; la suite no modifica capturas versionadas.

## Problemas encontrados y resueltos

| Problema                                                                                                              | Corrección                                                                                          |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Si fallaba `GET /events/:id/activities`, el detalle del stand mostraba un vacío engañoso.                             | Mensaje de error visible y botón para reintentar; E2E reproduce 503 y recuperación.                 |
| El bridge de desarrollo podía preferir `.env.local` sobre un `BACKEND_URL` explícito del proceso.                     | Se dio prioridad al entorno del proceso para aislar las pruebas.                                    |
| Playwright podía reutilizar un preview de otro modo y las E2E sobrescribían capturas de documentación.                | Cada ejecución inicia su preview y escribe capturas en `test-results/`.                             |
| El fixture E2E no persistía favoritos y un selector QR encontraba dos enlaces.                                        | Fixture de favoritos con estado y selector exacto.                                                  |
| En GitHub Actions la prueba GPS consultó `clearWatch` antes de terminar el cambio de ruta.                            | Se espera la URL de inicio y la limpieza asíncrona del seguimiento.                                 |
| La auditoría inicial señaló cinco vulnerabilidades en dependencias, incluidas dos críticas de herramientas de prueba. | Vitest 5 y actualizaciones compatibles del lockfile; `npm audit` terminó con cero vulnerabilidades. |

La compilación todavía avisa que `IndoorScene` pesa aproximadamente 621 KiB
antes de compresión. Es una mejora de rendimiento pendiente; no bloqueó
compilación, instalación offline ni pruebas funcionales.

## Funcionalidades pendientes o fuera del alcance de CI

- Las misiones y los canjes reales en `live` muestran estados de espera:
  requieren endpoints y publicación de premios por la organización. Los
  premios, ruleta y raspadita de `demo` no entregan beneficios reales.
- La programación del evento en `live` aún se muestra como pendiente y la
  ficha de feria utiliza contenido público estático. La integración dinámica
  de `GET /events/:id` depende del backend.
- Logos, redes sociales y un catálogo de productos con precios para cada
  expositor no están disponibles; la ficha actual muestra etiquetas y
  promociones publicadas.
- Los avisos de `live` proceden de actividad local de la sesión; no hay
  suscripción push ni fuente de avisos remota.
- CI no puede completar un acceso Google con una cuenta humana ni comprobar
  el chip NFC, el GPS, el motor de vibración o el audio en un teléfono físico.
  Tampoco ejecuta operaciones de negocio contra producción. Esos casos
  requieren un dispositivo y un entorno de pruebas con cuentas y datos
  aislados.
