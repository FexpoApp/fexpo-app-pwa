# Lo que falta: conectar la calificación de la PWA al servidor

Fecha: 06/11/2026. Repositorio a modificar: `fexpo-app-pwa`. Evento: **Imagina Tu Ciudad**, Parque Urbano Central, La Paz, 6 al 8 de noviembre de 2026. Alcance: únicamente la **Secretaría Municipal de Ciudad Productiva**.

Continúa [ENTREGA-BACKEND-BD-GAMLP-2026-11-06.md](ENTREGA-BACKEND-BD-GAMLP-2026-11-06.md), cuya parte de base de datos y backend **ya está entregada y en producción**.

> ## ⚠️ Cambio de contrato pendiente de desplegar
>
> Las correcciones de [CORRECCIONES-EXTRAS-2026-11-06.md](CORRECCIONES-EXTRAS-2026-11-06.md) están implementadas y commiteadas, **pero no desplegadas**. Cuando salgan, el contrato cambia de forma incompatible:
>
> - `POST .../scans` pasa a **exigir `qrCode`** y devuelve `scanReceipt`.
> - `PUT .../my-rating` pasa a **exigir `scanReceipt`**.
> - Las tres rutas de visitante exigen que la sesión sea **de Google**, verificado en el servidor.
> - El catálogo pasa de cinco a **seis** experiencias: se publica el domo.
>
> El servidor corre con `forbidNonWhitelisted`, así que un cuerpo sin esos campos responde **400**, y uno con campos de más también. **Los dos lados tienen que salir juntos:** si el backend se despliega antes de que la PWA envíe los campos nuevos, el envío de opiniones deja de funcionar.
>
> Esto no es teórico: a las 18:30 UTC del 06/11/2026 una cuenta real de Google ya calificó las cinco paradas en producción, así que hay un circuito vivo que este cambio rompería si se despliega solo.

## El flujo confirmado

Sí: **el QR lleva directamente a la pantalla de calificar**, no a una portada ni a un menú. El código impreso contiene una sola URL HTTPS:

```
https://app.fexpo.lat/ferias/gamlp-puc-2026/calificar/<slug>?via=qr&qr=<code>
```

El parámetro `qr` lleva el identificador del código impreso (`docs/data/gamlp-issued-qr-2026-11-06.json`, también en `src/features/events/issued-qr.ts`). **Hay que leerlo de la URL y enviarlo como `qrCode` al registrar la lectura**: es lo que prueba ante el servidor que el visitante llegó por un QR emitido de ese punto.

Esa ruta es `PUC_BASE + '/calificar/:point'` (`src/App.tsx:45`) y ya existe. Si el visitante no tiene sesión, **no se le manda a otra página**: `PucGoogleGate` (`src/features/events/GoogleGate.tsx`) intercambia el contenido en el mismo sitio, sin ningún `Navigate`, `returnTo` ni `redirect` —cero coincidencias en el archivo—, así que la URL completa, con su `?via=qr`, sobrevive intacta al acceso con Google. Al terminar, el mismo componente se vuelve a renderizar mostrando el formulario de ese punto. El propio texto de la barrera lo promete: *«Después continuarás aquí, en la experiencia que elegiste»*.

Recorrido completo, tal como debe quedar:

1. El visitante lee la hoja impresa con el lector de su teléfono o con la cámara de la PWA.
2. Se abre `…/calificar/<slug>?via=qr`, es decir la pantalla de calificación de ese punto.
3. Si falta sesión, Google aparece **allí mismo**; al volver sigue en el mismo punto.
4. Elige de 1 a 5 estrellas y, si quiere, un comentario de hasta 1.000 caracteres.
5. **El servidor valida y persiste.** Solo entonces aparece la confirmación y sube el avance.
6. Al volver a esa parada, ve y puede editar su opinión. El número de personas no aumenta.
7. El Perfil recupera su avance confirmado tras recargar o cambiar de teléfono.

Los pasos 1 a 4 están hechos. Faltan el 5, el 6 y el 7.

## Lo que ya está disponible del lado del servidor

Desplegado en `api.fexpo.lat` y verificado en producción.

| Método y ruta | Acceso | Devuelve |
| --- | --- | --- |
| `GET /events/resolve/:slug` | Público | Evento y sus cinco experiencias publicadas, con UUID, orden y nombres |
| `POST /events/:eventId/experiences/:experienceId/scans` | Google | Registra y deduplica la lectura; devuelve el avance |
| `GET /events/:eventId/experience-progress` | Google | Opiniones propias y avance por las cinco experiencias |
| `PUT /events/:eventId/experiences/:experienceId/my-rating` | Google | Crea o edita la opinión propia; devuelve el registro persistido y el avance |
| `GET /events/:eventId/experience-metrics` | Organizador | Agregados y comentarios |

Los UUID ya sembrados, estables en local, CI y producción:

| Orden | Slug | UUID de la experiencia | Lotes del plano |
| --- | --- | --- | --- |
| 1 | `mercados` | `ea000000-0000-4000-8000-000000000001` | `1` |
| 2 | `tunel-mercados` | `ea000000-0000-4000-8000-000000000002` | `2` |
| 3 | `desarrollo-economico` | `ea000000-0000-4000-8000-000000000003` | `3A`, `3B` |
| 4 | `tunel-cites` | `ea000000-0000-4000-8000-000000000004` | `4` |
| 5 | `publicidad` | `ea000000-0000-4000-8000-000000000005` | `5` |
| 6 | `domo` | `ea000000-0000-4000-8000-000000000006` | ninguno |

Evento `gamlp-puc-2026`: `e0000000-0000-4000-8000-000000000002`.

El domo es la sexta experiencia y llega con `type: 'domo'` y `lots: []`: es la estructura central del recinto y no ocupa un lote rectangular del plano. **Los contadores van sobre seis, no cinco**, y el «recorrido calificado» exige las seis. El domo del orden 6 ya está en `catalog.ts`, así que la interfaz no necesita cambios de contenido para él.

**No hay que escribir esos UUID en el código.** El QR lleva el slug y `GET /events/resolve/:slug` lo traduce; así las URLs impresas no dependen de los identificadores. Conviene resolver una vez al entrar a la feria y guardar el mapa slug → UUID en memoria.

## El bloqueo principal: el proxy no deja pasar las rutas nuevas

`src/services/api.ts` no habla con el backend directamente: todo va por `/api/backend?path=…`, implementado en `server/bridge.mjs`, que antepone `/api/v1` y **solo acepta una lista cerrada de rutas** (`server/bridge.mjs:5`). Es deliberado: el comentario dice *«Fixed upstream + strict routes: never an open proxy or arbitrary URL fetch»*.

Hoy ninguna de las cinco rutas nuevas la atraviesa: el proxy responde **404 `NOT_FOUND` sin llegar al backend**. Hay dos detalles que no se pueden pasar por alto:

- El segmento de evento en la regex es `[\da-f-]{36}`, es decir **exige un UUID**. `/events/resolve/gamlp-puc-2026` lleva un slug, así que necesita su propia alternativa en la lista.
- La tabla de métodos (`server/bridge.mjs:74-82`) asume `GET` por omisión. Sin entradas nuevas, `POST …/scans` y `PUT …/my-rating` darían **405**.

Hay que ampliar la allowlist **sin** convertirla en un proxy abierto: alternativas explícitas para estas cinco rutas y nada más. `tests/unit/bridge.test.ts` afirma hoy el rechazo de rutas desconocidas, así que necesita casos nuevos que cubran tanto lo que ahora se permite como lo que debe seguir prohibido.

## Archivos a modificar

| Archivo | Qué hacer |
| --- | --- |
| `server/bridge.mjs:5` y `:74-82` | Añadir las cinco rutas a `allowed` (con una alternativa para `resolve/<slug>` que no exija UUID) y las entradas de método para `POST` y `PUT` |
| `tests/unit/bridge.test.ts` | Casos nuevos: las cinco pasan, el resto sigue devolviendo 404, y los métodos no permitidos siguen dando 405 |
| `src/features/events/Rating.tsx:119-127` | Sustituir el `setError('El envío todavía no está habilitado…')` por la llamada real |
| `src/features/events/Scanner.tsx:42-57`, `:117`, `:165` | Distinguir `camera` de `image`, que hoy comparten el mismo booleano `scanned` |
| `src/features/events/Rating.tsx:64` | El `markPucScanned` de `via=qr` pasa a registrar también la lectura con `source: 'external-qr'` |
| `src/features/events/Pages.tsx:311`, `:318`, `:323`, `:329-332` | Perfil: avance confirmado del servidor en lugar del contador local y del cero literal |
| `src/features/events/Pages.tsx:117-118`, `:136` | Recorrido: `'QR leído'` y los pasos usan el mismo estado del servidor |
| `src/features/events/progress.ts` | Conservar el historial local, pero marcado claramente como «de este dispositivo», separado del avance confirmado |
| `src/types/api.ts` | Declarar los tipos del contrato. El encabezado del archivo obliga a sincronizarlos con `fexpo-dashboard/src/types/api.ts` |

## El contrato, al detalle

### Registrar la lectura

```
POST /events/<eventId>/experiences/<experienceId>/scans
{ "qrCode": "<code del parámetro qr>",
  "source": "camera",
  "requestKey": "<UUID de la operación>" }
```

`source` admite `camera`, `image` o `external-qr`. Una apertura manual desde la ficha **no** es un escaneo y no debe registrarse (hoy `Scanner.tsx:225` ya lo evita pasando `scanned = false`).

`qrCode` es obligatorio: el servidor comprueba que ese código esté activo y que pertenezca a ese evento y punto. El QR de otra parada responde **403 `QR_CODE_INVALID`**.

Respuesta:

```json
{
  "scan": { "experienceId": "…", "source": "camera", "scanCount": 2,
            "firstScannedAt": "…", "lastScannedAt": "…" },
  "firstScan": false,
  "scanReceipt": "<UUID del comprobante>",
  "receiptExpiresAt": "<fecha ISO, 12 h>",
  "progress": { "totalExperiences": 6, "scannedCount": 2, "ratedCount": 1 }
}
```

**Hay que guardar `scanReceipt`:** es lo que habilita la calificación de ese punto. Es estable entre relecturas, así que volver a escanear devuelve el mismo y un reintento idempotente también.

**Una relectura es un 200 con `firstScan: false`, no un error.** No aumenta las personas únicas. El `409` está reservado para el conflicto de idempotencia.

### Crear o editar la opinión

```
PUT /events/<eventId>/experiences/<experienceId>/my-rating
{ "stars": 4,
  "comment": "La información fue clara.",
  "scanReceipt": "<el scanReceipt de ese punto>",
  "requestKey": "<UUID de la operación>" }
```

El autor sale del token. **No enviar `userId`**: el servidor corre con `forbidNonWhitelisted`, así que cualquier campo de más es un `400`. `stars` es entero de 1 a 5; `comment` es opcional y se recorta a 1.000 caracteres —el límite ya lo aplica el `<textarea maxLength={1000}>` y el `slice(0, 1000)` de `readDraft`—.

`scanReceipt` es obligatorio y debe ser el de **esta cuenta y este punto**, sin caducar. Sin él la respuesta es **403 `QR_SCAN_REQUIRED`**: el servidor ya no se conforma con la barrera visual de la interfaz. El comprobante de otra cuenta, el de otro punto y el vencido se rechazan igual.

Implicación de flujo: **antes de poder guardar hay que haber llamado a `scans`**. Para el QR impreso eso es natural, porque `Rating.tsx:64` ya detecta `via=qr`; pero si el visitante llega al formulario por el mapa o por la ficha, no habrá comprobante y hay que mandarlo a escanear en lugar de mostrarle el formulario.

Respuesta:

```json
{
  "rating": { "id": "…", "eventId": "…", "experienceId": "…", "stars": 4,
              "comment": "La información fue clara.",
              "createdAt": "…", "updatedAt": "…" },
  "progress": { "totalExperiences": 5, "scannedCount": 2, "ratedCount": 1 },
  "created": true
}
```

`created` distingue alta de edición. Editar **no** aumenta `ratedCount` ni el total de opiniones.

### Leer el avance confirmado

```
GET /events/<eventId>/experience-progress
```

Devuelve `{ eventId, progress, experiences[] }`, con una fila por cada una de las cinco:

```json
{ "experienceId": "…", "slug": "mercados", "order": 1, "name": "…", "shortName": "…",
  "type": "carpa", "scannedAt": "…", "myRating": null, "status": "pending" }
```

`status` es `complete` **solo** cuando hay opinión persistida. Leer el QR no completa un punto y un borrador local tampoco. `scannedAt` y `myRating` son nulos explícitos, no campos ausentes.

## Idempotencia: la parte que más fácil se hace mal

El `requestKey` es un UUID **generado una vez por intento y reutilizado en cada reintento**. El precedente exacto está en `src/state/live.ts:393` (`registerNfc`), que lo genera al crear el trabajo pendiente y lo conserva en los reenvíos.

El servidor guarda un hash del contenido junto a la clave y se comporta así:

| Situación | Respuesta |
| --- | --- |
| Misma clave, mismo contenido | `200` con la respuesta guardada, sin escribir otra vez |
| Misma clave, **otro** contenido | `409 IDEMPOTENCY_CONFLICT` |
| Clave nueva, contenido nuevo | `200`, crea o edita |

De ahí se desprende la regla del cliente: **ante un timeout, conservar el borrador y reintentar con la misma clave.** Si el primer intento alcanzó a fallar, su transacción se revirtió junto con la fila de idempotencia, así que el reintento se ejecuta normalmente; si alcanzó a terminar, el reintento recibe la misma respuesta. En ningún caso se duplica. Si el usuario **cambia** las estrellas o el comentario, hay que generar una clave nueva, porque la vieja con otro contenido es un `409`.

## Errores y qué mostrar

| Código | Significado | Qué debe hacer la interfaz |
| --- | --- | --- |
| `401` | Sin sesión o token vencido | `api.ts` ya refresca y reintenta una vez; si vuelve a fallar, reaparece la barrera de Google sin perder el punto |
| `400 VALIDATION_ERROR` | Estrellas fuera de 1-5, comentario largo, falta `qrCode` o `scanReceipt`, campo de más | Mensaje del campo; conservar el borrador |
| `403 QR_SCAN_REQUIRED` | No hay lectura previa vigente de esta cuenta para este punto | Mandar a escanear el QR del punto; conservar el borrador |
| `403 QR_CODE_INVALID` | El código no está vigente o es de otro punto | «Ese QR no corresponde a este punto» |
| `403 GOOGLE_ACCOUNT_REQUIRED` | La sesión no es de Google | Rehacer el acceso con Google; no es un fallo del formulario |
| `404 EVENT_NOT_FOUND` / `EXPERIENCE_NOT_FOUND` | Slug o punto inexistente | «Ese QR no corresponde a esta feria» |
| `409 IDEMPOTENCY_CONFLICT` | Clave reusada con otro contenido | Reintentar con clave nueva; nunca presentarlo como éxito |
| `502 UPSTREAM_UNAVAILABLE` | Backend caído o lento | Conservar el borrador y ofrecer reintentar con la misma clave |

El comprobante dura 12 horas y se renueva en cada lectura, así que un `QR_SCAN_REQUIRED` en medio de la feria casi siempre significa que el visitante llegó al formulario sin pasar por el QR, no que se le haya vencido.

**Nunca simular un envío exitoso**, y no borrar ni dar por enviado un borrador cuando falla la red. La confirmación se muestra únicamente con la respuesta del servidor en la mano. La pantalla de confirmación ya está construida y se puede ver con `?preview=1` en modo local (`Rating.tsx:72-104`); hoy se alimenta de `draft.stars` y debe pasar a alimentarse de `rating.stars`.

## Progreso y métricas: qué cuenta y qué no

- **Personas que calificaron:** cuentas distintas con al menos una opinión persistida.
- **Opiniones por parada:** una por usuario y punto. Editar no aumenta el total.
- **Recorrido calificado:** las cinco experiencias calificadas por la misma cuenta.
- **QR leídos:** indicador operativo, deduplicado, **separado** de las calificaciones.
- **No son calificaciones:** borradores, visitas a la página, inicios de sesión y el QR de ingreso general.

`fexpo-puc-scans-v1` (`progress.ts`) seguirá siendo útil como historial del dispositivo, pero su clave **no incluye usuario ni evento**, así que es compartida entre cuentas en un mismo navegador. Los escaneos locales no deben atribuirse automáticamente a otra cuenta: al iniciar sesión, el avance que manda es el del servidor.

## Avisos que ahorran tiempo

- **`authProvider` ya se publica** en `GET /auth/me`, pero va al nivel superior, junto a `id` y `email`. El cliente hace `activate({ id: me.id, ...me.profile })` (`src/state/live.ts:223`), que aplana **solo** `data.profile`, así que un hermano de `profile` se descarta en silencio: hay que leerlo explícitamente. Y recordar que una marca del navegador nunca sustituye la validación del servidor.
- **El avance de GAMLP necesita su propia llamada.** `GoogleLogin` pasa `accountOnly = true` para los propósitos `rating`, `scanner` y `account`, así que el flujo de GAMLP nunca ejecuta `syncProgress()` (`live.ts:301`), que está atado al `EVENT_ID` y a los endpoints de FIPAZ. No hay que engancharse ahí.
- **El plazo real de una escritura son 12 s, no 15.** El bridge aborta a los 12 s (`AbortSignal.timeout(12000)`) dentro de los 15 s del cliente, y un timeout del backend llega como `502`, no como `408`.
- **`resolvePucQr` descarta la query**, así que devuelve el slug limpio; `?via=qr` solo se lee en `Rating.tsx:62`.
- **No reutilizar nada del circuito de FIPAZ:** ni su UUID de evento, ni su check-in de personal, ni puntos, NFC o el QR personal del visitante. Son opiniones sobre experiencias públicas.

## Checklist de aceptación

- [ ] Las cinco rutas nuevas atraviesan el proxy; cualquier otra sigue devolviendo 404 y los métodos indebidos, 405.
- [ ] Un visitante sin sesión que lee un QR impreso llega a la pantalla de calificar, accede con Google **sin perder el punto** y envía su opinión.
- [ ] La confirmación aparece únicamente después de que el servidor persistió.
- [ ] Al volver a la misma parada ve su opinión y puede editarla; el total de personas no aumenta.
- [ ] Recargar, reintentar tras un timeout o editar no duplica usuarios ni opiniones.
- [ ] El Perfil muestra el avance confirmado de la cuenta tras recargar y en otro teléfono.
- [ ] Otra cuenta tiene su propio progreso y no accede a opiniones ajenas.
- [ ] La cancelación de Google y la expiración de sesión no confirman nada ni pierden el destino.
- [ ] Un usuario puede opinar en los **seis** puntos, el domo incluido, y el «recorrido calificado» solo se da por completo con las seis.
- [ ] Sin pasar por el QR no se puede guardar: llegar al formulario desde el mapa o la ficha lleva a escanear, no al envío.
- [ ] El QR de una parada no sirve para registrar la lectura de otra.
- [ ] Los seis QR impresos abren la URL correcta en Android y iOS.
- [ ] FIPAZ conserva sus datos históricos y su circuito separado.

## Antes de autorizar impresión y distribución

El documento anterior ya lo advertía y sigue vigente: **publicar esta versión de la PWA antes de distribuir los impresos.** Que un código decodifique bien no demuestra que la ruta esté publicada ni que la opinión se guarde. Hoy el backend responde, pero la PWA todavía no lo llama.

El despliegue web debe servir la PWA para `/ferias/*`, conservar ruta y consulta al recargar, y **no** devolver el HTML de la PWA para `/api/*`.
