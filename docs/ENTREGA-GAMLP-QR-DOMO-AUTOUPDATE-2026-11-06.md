# GAMLP: QR obligatorio, domo y actualización automática

**Actualización posterior:** la PWA ya conecta lecturas, guardado, edición y progreso al contrato de Erick. Hay seis QR en Word; la API aún publica cinco puntos. Consultar [integración vigente](INTEGRACION-GAMLP-API-Y-QR-2026-11-06.md) y [correcciones extras](CORRECCIONES-EXTRAS-2026-11-06.md). Las referencias siguientes a formularios sin envío son históricas.

Revisión vigente del 06/11/2026. Sustituye el alcance anterior de cinco experiencias y URLs directas de impresión.

## Lo implementado en PWA

- Solo GAMLP visible en el selector; FIPAZ conserva su información histórica separada.
- Seis experiencias calificables: cinco paradas exteriores y el domo central.
- Google obligatorio antes de acceder al lector o a una calificación.
- La ficha y el mapa llevan a **Escanear para calificar**.
- Abrir una URL de calificación o añadir `via=qr` no muestra el formulario sin lectura.
- Sin formulario para pegar manualmente enlaces en el lector.
- Acceso de lectura separado por cuenta/punto, conservado durante seis horas en la sesión del navegador.
- Domo seleccionable en 2D/3D, ficha propia y progreso sobre seis puntos.
- Actualización automática de la PWA, con conservación de ruta y borrador.

**El guardado de opiniones y la validación de lectura en servidor siguen pendientes de backend/BD.** La restricción local de interfaz no sustituye autorización del servidor.

## Seis experiencias y siete destinos

| Orden | Slug | Contenido | Ubicación |
| --- | --- | --- | --- |
| 1 | mercados | Dirección de Administración de Actividades Económicas con la Unidad de Mercados | Ingreso; carpa inferior derecha, lote 1 |
| 2 | tunel-mercados | Túnel de los nuevos mercados | Pasaje derecho, lote 2 |
| 3 | desarrollo-economico | Dirección de Desarrollo Económico, Competitividad e Inversiones | Dos carpas superiores, lotes 3A/3B, una sola experiencia |
| 4 | tunel-cites | Túnel de los CITEs | Pasaje izquierdo, lote 4 |
| 5 | publicidad | Unidad Publicidad | Carpa inferior izquierda, salida, lote 5 |
| 6 | domo | Domo de Ciudad Productiva | Círculo central, visita libre |

El domo no se desplaza al final del recorrido físico ni agrega otra carpa. Se conservan los seis polígonos del plano y el círculo central.

El alcance es **seis QR de opinión más un QR general de ingreso**. En esta revisión se generó únicamente un QR de prueba de Mercados. No se generó la tanda definitiva ni el QR del domo.

## Enlace corto aprobado

Omar confirmó que el nuevo QR aparece como sitio web y permite abrirlo.

Contenido exacto:
```text
https://is.gd/fexpo_gamlp_mercados
```

Redirección 301 verificada:
```text
https://app.fexpo.lat/ferias/gamlp-puc-2026/calificar/mercados?via=qr&qr=mercados_3f7d1a9c6e4b48a5b1c2d0ef9a65b732
```

El código contiene únicamente esa URL corta, sin “URL:”, JSON ni credenciales personales. El parámetro qr identifica un código público emitido, no la sesión de un visitante. El enlace is.gd/fexpo_app existente no se modificó.

Conservar este destino y el código público de Mercados al integrar el backend; no dependen de UUID provisionales. Los otros enlaces cortos se emitirán después. El paquete de seis hojas anterior es histórico: omite el domo y sus URLs directas fueron reconocidas como texto por ese lector.

## Flujo obligatorio

1. Explorar mapa/fichas es público.
2. Google antes de activar cámara o seleccionar una imagen QR.
3. Leer un QR de la experiencia; si se pidió un punto y se escanea otro, informar el error.
4. Solo después se muestra su formulario: 1 a 5 estrellas y comentario opcional de hasta 1.000 caracteres.
5. Al guardar, servidor debe validar sesión y comprobante de lectura de la misma cuenta/evento/punto.
6. Tras una actualización de la PWA, conservar el destino, borrador y autorización vigente.
7. Editar/reintentar no duplica opiniones ni personas.

Un lector externo del teléfono puede decodificar un enlace sin intervención de FEXPO; Google se exige en la pantalla de destino. Tras Google, solo un identificador QR reconocido habilita ese punto. via=qr por sí solo no concede acceso.

## Estado local y trabajo pendiente de servidor

`scan-access.ts` guarda autorizaciones de interfaz por evento/cuenta/punto en `sessionStorage`, con origen camera, image o external-qr y duración de seis horas. La lectura de un punto no habilita otro. `fexpo-puc-scans-v1` únicamente dibuja historial del dispositivo; no autoriza calificar ni acredita presencia física.

Los códigos estáticos pueden compartirse. La regla de QR emitido requiere validación en backend; no demuestra ubicación física por sí sola. No confiar en almacenamiento del navegador, source, via o userId del cuerpo de una solicitud.

El formulario aún no envía opiniones. Las calificaciones confirmadas siguen en cero hasta conectar una respuesta persistida del servidor.

## Contrato objetivo de backend

Reutilizar usuarios/eventos y autenticación Google existentes. Mantener el transporte actual: POST /api/session/google, POST /api/session/refresh y puente /api/backend?path=...; conservar el envelope del API.

| Operación nueva | Acceso | Resultado |
| --- | --- | --- |
| GET /events/resolve/:slug | Público | Evento y seis experiencias publicadas con UUID, tipo y geometría |
| POST /events/:eventId/experiences/:experienceId/scans | Google | Validar código QR emitido y entregar scanReceipt |
| GET /events/:eventId/experience-progress | Google | Seis puntos, lecturas y opiniones propias |
| PUT /events/:eventId/experiences/:experienceId/my-rating | Google + scanReceipt | Crear/editar opinión y devolver avance confirmado |
| GET /events/:eventId/experience-metrics | Organizador autorizado | Métricas y exportación según permisos |

Resolver el slug antes de la ruta genérica por UUID. Mantener solo gamlp-puc-2026 en el selector aunque el listado general incluya FIPAZ. No reutilizar check-ins de personal, puntos, QR personal o NFC.

Solicitud de lectura:
```json
{
  "qrCode": "<identificador QR emitido>",
  "source": "camera",
  "requestKey": "<UUID de operación>"
}
```
Validar QR activo y pertenencia a evento/experiencia. Emitir scanReceipt vinculado al usuario, evento, experiencia y caducidad. source es solo operativo (camera, image, external-qr).

Solicitud de opinión:
```json
{
  "stars": 4,
  "comment": "La información fue clara.",
  "scanReceipt": "<comprobante válido de la misma cuenta y punto>",
  "requestKey": "<UUID de operación>"
}
```
Obtener usuario de la sesión. Sin lectura válida: 403 y QR_SCAN_REQUIRED; volver al lector sin perder borrador. Sin sesión: 401. Datos inválidos: 400. Clave de idempotencia reutilizada con otro contenido: 409.

Respuesta: opinión persistida con UUID/fechas y progress con totalExperiences=6, scannedCount y ratedCount. La consulta devuelve cada punto con su opinión propia o null. Confirmar solo después de guardar. Conservar borrador y requestKey ante timeout.

El servidor debe comprobar el proveedor Google y publicar authProvider o capacidad equivalente para distinguir otras sesiones. No basta con que la PWA solo ofrezca ese botón.

## Base de datos

Revisar primero las migraciones existentes y reutilizar los identificadores de usuarios/eventos.

- [ ] Seed idempotente de GAMLP y seis experiencias; tipo domo y círculo central.
- [ ] Experiencias únicas por (event_id, slug), orden 1–6, nombres, descripción y estado.
- [ ] Varias geometrías por experiencia: Desarrollo Económico agrupa 3A/3B.
- [ ] QR emitidos por evento/punto con identificador/huella, estado y vigencia; conservar el código de Mercados ya enlazado.
- [ ] Lecturas/comprobantes por usuario/punto, primera/última lectura y caducidad.
- [ ] Opinión única (event_id, experience_id, user_id); estrellas enteras 1–5 y comentario máximo 1.000.
- [ ] FK que impida asociar puntos de otro evento.
- [ ] Upsert e idempotencia transaccionales; reintentar o editar no duplica.
- [ ] Índices de progreso por usuario/evento y métricas por evento/punto.
- [ ] Timestamps con zona horaria; mostrar fechas en America/La_Paz.
- [ ] Opiniones propias para el visitante y agregados/comentarios solo con roles autorizados.
- [ ] Migración y rollback; no modificar FIPAZ ni insertar personas ficticias.

Personas que calificaron = usuarios distintos con opinión persistida del evento. Recorrido completo = seis puntos distintos calificados por la misma cuenta. No contar login, QR general, páginas abiertas, borradores ni sumar ediciones como personas nuevas.

## Actualización automática

- `vite.config.ts`: autoUpdate, activación y control automáticos.
- Registro único desde main.tsx mediante src/pwa/auto-update.ts.
- Revisión al abrir, recuperar conexión o volver al primer plano; cada 60 segundos mientras esté visible/conectada.
- Cachés por revisión de contenido; recarga automática cuando la nueva versión esté lista, sin botón Actualizar.
- public/pwa-auto-migrate-v1.js realiza una migración única para instalaciones antiguas con actualización manual.
- Antes de recargar se guarda el borrador; la ruta y los datos de sesión del navegador se conservan.

Hay que compilar y desplegar para actualizar teléfonos: editar archivos o hacer commits locales no publica cambios. Sin red, o con la app cerrada/suspendida por el sistema, la comprobación espera a que el navegador pueda ejecutarla. No requiere reinstalar.

Los datos de API siguen su propio ciclo de consulta: el service worker actualiza el paquete web, no sustituye el guardado/sincronización de opiniones.

## Archivos y validación

- src/features/events/catalog.ts: seis puntos, destinos y enlace corto de prueba.
- src/features/events/scan-access.ts y Rating.tsx: restricción por lectura y borrador.
- Scanner.tsx: lectura real, sin pegado manual; valida el punto esperado.
- geometry.ts, Map.tsx y Pages.tsx: domo, fichas y avance de seis puntos.
- src/pwa/auto-update.ts y public/pwa-auto-migrate-v1.js: registro/migración.
- scripts/test-pwa-update.mjs: prueba de actualización real de service worker y migración antigua, manteniendo borrador/ruta.
- docs/data/gamlp-puc-experiences-2026-11-06.json: catálogo y plano para seed; coordenadas locales SVG, no GPS.

El evento está fechado del 6 al 8 de noviembre de 2026; el JSON no inventa horarios de apertura/cierre ni UUID.

Verificación de esta revisión:

- 93 pruebas unitarias aprobadas y TypeScript sin errores.
- 41 pruebas de navegador en modo conectado aprobadas, con Google/API simulados para no usar cuentas ni enviar opiniones reales.
- Dos pruebas de actualización real del service worker aprobadas: versión actual e instalación anterior con actualización manual; ambas mantienen ruta y borrador.
- Revisión visual a 320, 390 y 1440 px de mapa/domo, ficha, recorrido, perfil y acceso condicionado a QR; perfil oscuro a 390 px. Sin desbordamiento horizontal ni errores de JavaScript en esas capturas.
- QR de prueba decodificado independientemente y redirección 301 verificada; Omar confirmó su reconocimiento como sitio web en su teléfono.

Evidencias locales en `output/gamlp-puc-2026-11-06/screens-scan-dome/` y `pwa-auto-update-result.json`, desde la raíz del proyecto documental. El trabajo permanece local: no se hizo push ni despliegue en esta revisión.

Antes de distribuir la tanda definitiva: publicar PWA/backend, probar Google y escritura reales, validar comprobantes por usuario/punto, contrastar progreso con BD y probar Android/iOS en instalación anterior, suspensión, reapertura y red intermitente. No emitir ni imprimir los otros QR sin la siguiente indicación de Omar.

Fuentes técnicas: [is.gd API](https://is.gd/apishorteningreference.php), [Vite PWA: actualización automática](https://vite-pwa-org.netlify.app/guide/auto-update). La lectura del QR de prueba como sitio web fue confirmada por Omar.
