# Entrega a backend y base de datos: GAMLP / Ciudad Productiva

**Actualización posterior:** la PWA ya conecta lecturas, guardado, edición y progreso al contrato de Erick. Hay seis QR en Word; la API aún publica cinco puntos. Consultar [integración vigente](INTEGRACION-GAMLP-API-Y-QR-2026-11-06.md) y [correcciones extras](CORRECCIONES-EXTRAS-2026-11-06.md). Las referencias siguientes a formularios sin envío son históricas.

**Versión anterior. La entrega vigente, con seis experiencias, escaneo obligatorio y actualización automática, está en [ENTREGA-GAMLP-QR-DOMO-AUTOUPDATE-2026-11-06.md](ENTREGA-GAMLP-QR-DOMO-AUTOUPDATE-2026-11-06.md).**

Fecha: 06/11/2026. Repositorio de interfaz: `fexpo-app-pwa`. Evento: **Imagina Tu Ciudad**, Parque Urbano Central, La Paz, 6 al 8 de noviembre de 2026. Alcance: únicamente la **Secretaría Municipal de Ciudad Productiva**.

## Estado y regla vigente

La PWA ya tiene selector con **solo GAMLP**, identidad municipal, Inicio, mapa 2D/3D, recorrido, cinco fichas, lector QR, formulario de estrellas/comentario y Perfil con avance. FIPAZ se retiró del catálogo visible; su código y rutas históricas se conservan, sin mezclarlos con este evento.

Al conectar el catálogo al API, mantener el filtro visible por `gamlp-puc-2026`; no volver a mostrar FIPAZ porque `GET /events` lo incluya, ni borrar sus datos históricos.

**Google es obligatorio antes de abrir el lector o el formulario de calificación.** No basta con exigir Google al presionar Enviar. La exploración pública del mapa y las fichas sigue disponible.

Implementado en `src/features/events/GoogleGate.tsx` y las rutas de `src/App.tsx`:
- Invitado: no se monta el lector, no se pide cámara, no se procesa una foto y no se muestra el formulario.
- QR externo: se conserva la URL completa durante el acceso Google; al terminar se abre la calificación de ese punto.
- Sesión válida: se reutiliza sin pedir registro en cada parada.
- Sesión que termina: vuelve la barrera de acceso y se desmonta/libera la cámara.
- Local/demo: no hay bypass ni cuentas ficticias que habiliten lectura/calificación.

**Pendiente:** el formulario todavía no guarda opiniones en el servidor. El progreso de escaneos es local al dispositivo y las calificaciones confirmadas siguen en cero. Esta entrega de PWA no ejecutó migraciones ni modificó el backend.

## Flujo que debe quedar operativo

1. Visitante abre el QR general y conoce la sección.
2. Abre Escanear: si no tiene sesión, accede con Google.
3. Lee el QR de una parada con la cámara de la PWA o con el lector del teléfono.
4. El enlace abre directamente la ruta de calificación; si falta sesión, Google aparece allí sin perder el punto.
5. Registra 1 a 5 estrellas y un comentario opcional de hasta 1.000 caracteres.
6. El servidor valida, persiste y devuelve su opinión. Solo entonces aparece una confirmación real y aumenta el avance de calificados.
7. Al volver a la misma parada, consulta/edita su opinión existente. No aumenta el número de personas.
8. Perfil recupera el progreso confirmado de su cuenta y de este evento después de recargar o cambiar de dispositivo.

El lector externo del teléfono puede decodificar cualquier enlace sin nuestra intervención. El control Google se aplica al destino protegido de FEXPO y a los endpoints, no a la cámara externa.

## Seis QR estáticos y sus contenidos exactos

Cada QR contiene **solo una URL HTTPS**, sin prefijo `URL:`, sin JSON, sin correo, sin JWT y sin datos del visitante. No caduca al cerrar una sesión.

| Hoja | Ubicación | URL dentro del QR |
| --- | --- | --- |
| 1 | Ingreso general | https://app.fexpo.lat/ferias/gamlp-puc-2026 |
| 2 | Primera carpa: Actividades Económicas con Unidad de Mercados | https://app.fexpo.lat/ferias/gamlp-puc-2026/calificar/mercados?via=qr |
| 3 | Final del túnel de nuevos mercados | https://app.fexpo.lat/ferias/gamlp-puc-2026/calificar/tunel-mercados?via=qr |
| 4 | Dos carpas unidas de Desarrollo Económico, Competitividad e Inversiones | https://app.fexpo.lat/ferias/gamlp-puc-2026/calificar/desarrollo-economico?via=qr |
| 5 | Final del túnel de CITEs | https://app.fexpo.lat/ferias/gamlp-puc-2026/calificar/tunel-cites?via=qr |
| 6 | Unidad Publicidad, antes de la salida | https://app.fexpo.lat/ferias/gamlp-puc-2026/calificar/publicidad?via=qr |

Son **un acceso general + cinco experiencias evaluables**, no seis calificaciones. El domo central no es evaluable. Las dos carpas superiores comparten una experiencia y una opinión.

El QR identifica la experiencia mediante un slug estable; backend debe resolverlo a UUID reales. No cambiar estas URLs al asignar los UUID. `pucPrintedQrUrl(slug)` en `catalog.ts` es la fuente de los enlaces de impresión.

## Archivos para implementar

Dentro de `fexpo-app-pwa`:
- `src/features/events/catalog.ts`: slugs, nombres, orden y destinos QR.
- `src/features/events/geometry.ts`: distribución exacta de seis polígonos y domo.
- `src/features/events/GoogleGate.tsx`: barrera de acceso.
- `src/features/events/Scanner.tsx`: lector nativo/jsQR, imagen y validación de destino.
- `src/features/events/Rating.tsx`: formulario, borrador y lugar donde conectar la escritura.
- `src/features/events/progress.ts`: historial local, que debe distinguirse del progreso confirmado.
- `src/features/events/Pages.tsx`: Perfil; sustituir el cero de confirmadas por datos del servidor.
- `src/state/live.ts`, `src/ui/GoogleLogin.tsx`, `src/services/api.ts`: identidad compartida, login y cliente de API.
- `docs/data/gamlp-puc-experiences-2026-11-06.json`: catálogo exportado desde el código, listo para preparar el seed sin UUID ficticios.

La geometría relaciona `mercados → 1`, `tunel-mercados → 2`, `desarrollo-economico → 3A/3B`, `tunel-cites → 4` y `publicidad → 5`. Una experiencia puede agrupar varios polígonos.

## Integración con lo existente

El backend ya dispone de `GET /events`, `GET /events/:eventId`, login Google y `GET /auth/me`. Reutilizar esos módulos y el modelo existente de usuarios/eventos.

La PWA entra por `POST /api/session/google` con `idToken` y `deviceId`, restaura con `POST /api/session/refresh` y usa `/api/backend?path=...` para el API autenticado. Conservar este transporte y el formato de respuesta existente. Las rutas de aplicación del cuadro anterior son URLs del navegador, no endpoints de API.

No reutilizar el UUID configurado para FIPAZ, su check-in de personal, sus puntos, NFC o su QR personal del visitante. Este circuito es de opiniones sobre experiencias públicas.

La interfaz ofrece únicamente Google, pero el backend debe verificar el proveedor de identidad y la sesión válida. Publicar `authProvider` o una capacidad equivalente en la respuesta de identidad permitirá que la PWA también distinga sesiones de otros proveedores. Una marca del navegador nunca sustituye la validación del servidor.

## Contrato objetivo a implementar

Estas operaciones son trabajo nuevo para esta entrega; todavía no están invocadas desde el formulario. Mantener el prefijo y envelope del API existente.

| Método y ruta | Acceso | Resultado |
| --- | --- | --- |
| GET /events/resolve/:slug | Público | Evento y cinco experiencias publicadas, con UUID, slug, orden y nombres |
| POST /events/:eventId/experiences/:experienceId/scans | Google | Registrar/deduplicar lectura operativa del punto y devolver avance |
| GET /events/:eventId/experience-progress | Google | Opiniones propias y progreso del usuario por las cinco experiencias |
| PUT /events/:eventId/experiences/:experienceId/my-rating | Google | Crear/editar opinión propia y devolver registro persistido + avance |
| GET /events/:eventId/experience-metrics | Organizador autorizado | Métricas agregadas; comentarios/exportación solo con permisos |

Registrar `GET /events/resolve/:slug` antes de la ruta genérica por UUID para no capturar `resolve` como eventId.

Cuerpo del registro de lectura:
```json
{ "requestKey": "<UUID de la operación>", "source": "camera" }
```
`source` admite `camera`, `image` o `external-qr`. Lecturas repetidas del mismo usuario/punto no aumentan personas únicas. Una apertura manual desde ficha no debe presentarse como escaneo.

Cuerpo de la calificación:
```json
{
  "stars": 4,
  "comment": "La información fue clara.",
  "requestKey": "<UUID de la operación>"
}
```
El usuario se obtiene del token. No aceptar un `userId` suministrado por el cliente como autor. Validar que la experiencia pertenece al evento publicado, que stars es entero 1–5 y que comment es opcional/normalizado, con máximo 1.000 caracteres.

La respuesta de escritura, dentro del envelope existente, debe incluir:
```json
{
  "rating": {
    "id": "<UUID persistido>",
    "eventId": "<UUID del evento>",
    "experienceId": "<UUID del punto>",
    "stars": 4,
    "comment": "La información fue clara.",
    "createdAt": "<fecha ISO>",
    "updatedAt": "<fecha ISO>"
  },
  "progress": {
    "totalExperiences": 5,
    "scannedCount": 2,
    "ratedCount": 1
  }
}
```
La lectura de progreso debe devolver también las cinco experiencias con su `scannedAt`, su opinión propia o null y su estado pendiente/completo. El cliente actualiza el Perfil desde esa respuesta y muestra éxito únicamente después de persistir.

Sin sesión: 401. Sin permiso para métricas: 403. Evento/punto inexistente: 404. Datos inválidos: 400. Reutilizar una clave de operación con otro contenido: 409. Ante un timeout conservar el borrador y reintentar con la misma clave. Nunca simular un envío exitoso.

## Trabajo de base de datos

Revisar el esquema/migraciones actuales de `fexpo_database` antes de crear estructuras. Propuesta de entidades, reutilizando los usuarios y eventos existentes:

| Entidad | Campos/relaciones necesarios |
| --- | --- |
| Experiencia de evento | UUID, event_id, slug, orden, nombres, tipo carpa/túnel, descripción, estado, asociaciones a polígonos |
| Lectura por usuario/punto | UUID, event_id, experience_id, user_id, first_scanned_at, last_scanned_at, source |
| Opinión por usuario/punto | UUID, event_id, experience_id, user_id, stars, comentario, created_at, updated_at |
| Idempotencia | Usuario, operación, request_key, hash del contenido y respuesta persistida |

Requisitos:
- [ ] Seed idempotente del evento `gamlp-puc-2026` y cinco experiencias; dos polígonos para Desarrollo Económico.
- [ ] Único `(event_id, slug)` y orden 1–5 por evento.
- [ ] FK que garantice la pertenencia de experiencia al evento; no permitir cruces entre ferias.
- [ ] Único `(event_id, experience_id, user_id)` tanto para lectura deduplicada como para opinión.
- [ ] Check de estrellas 1–5 y límite de comentario también en servidor/BD.
- [ ] Timestamps con zona horaria; presentar días en `America/La_Paz`.
- [ ] Índices para progreso por usuario/evento y métricas por evento/punto.
- [ ] Upsert de opinión e idempotencia dentro de una transacción.
- [ ] Permisos: visitante solo ve/edita sus opiniones; organizador autorizado consulta agregados/comentarios.
- [ ] Migración y rollback revisables; no sembrar perfiles ficticios ni sobreescribir FIPAZ.

## Progreso y métricas

El dato actual `fexpo-puc-scans-v1` es local al dispositivo. `via=qr` indica cómo se abrió un enlace, pero puede copiarse o escribirse manualmente. Ninguno prueba presencia física ni sirve por sí solo como estadística oficial.

Definir los indicadores como:
- Personas que calificaron: usuarios distintos con al menos una opinión persistida de este evento.
- Opiniones por parada: una por usuario/punto; editar no aumenta el total.
- Recorrido calificado: cinco experiencias distintas calificadas por la misma cuenta.
- QR leídos: indicador operativo separado, deduplicado según el contrato de lecturas.
- Borradores, accesos a página, login y QR general: no son calificaciones.

No borrar ni dar por enviado un borrador al fallar la red. Mostrar el historial confirmado de cada cuenta al volver a iniciar sesión; los escaneos locales no deben atribuirse automáticamente a otra cuenta.

## Entrega e impresión

La carpeta documental `FERIAS/GAMLP/QR-CARTA-2026-11-06/` contiene un PDF de seis páginas carta, PNG individuales 2550 × 3300 a 300 ppp, QR vectoriales SVG, destinos y verificación automática. Cada QR del PDF final fue decodificado y comparado con la URL canónica. El marco se generó con imagegen; los códigos son matemáticos, no dibujos generados.

**Antes de autorizar impresión/distribución:** publicar esta versión de la PWA y completar la integración del servidor. La decodificación del código no demuestra que la ruta ya esté publicada. No se ha certificado el despliegue público en esta entrega.

El despliegue web debe servir la PWA para `/ferias/*`, conservar la ruta y la consulta al recargar y mantener el alcance de instalación sobre esas rutas. No devolver HTML de la PWA para `/api/*`.

Validación de esta entrega: 89 pruebas unitarias, ocho recorridos conectados, cinco locales y cinco demo aprobados, con Google/API simulados cuando corresponde. Nueve capturas de selector/barrera Google a 320/390/1440 px sin errores JavaScript ni desbordamiento. Los seis QR fueron decodificados desde las páginas renderizadas del PDF final y coinciden con el catálogo. Google real, persistencia y prueba física siguen en el checklist operativo.

Imprimir el PDF en carta vertical, tamaño real/100 %, sin recortar, preferentemente sobre papel mate. Mantener el área blanca del QR y no colocar logos dentro del código.

## Checklist de aceptación conjunta

- [ ] Solo GAMLP aparece en el selector.
- [ ] Invitado no accede a cámara, imagen ni formulario; Google es obligatorio.
- [ ] Los seis QR abren la URL correcta; los cinco de opinión conservan el punto tras Google.
- [ ] Instalación PWA opcional; acceso web válido en Android/iOS.
- [ ] Un usuario puede opinar en cinco puntos; el domo no agrega otro.
- [ ] Recargar, reintentar o editar no duplica usuarios ni opiniones.
- [ ] Otra cuenta tiene su propio progreso; no accede a opiniones ajenas.
- [ ] Fallos, expiración de sesión y cancelación Google no confirman ni pierden el destino.
- [ ] Perfil y métricas coinciden con consultas de BD.
- [ ] Dos teléfonos físicos y los seis impresos de prueba completan el circuito.
- [ ] FIPAZ conserva sus datos históricos y su circuito separado.

