# Calificación de GAMLP: estado de la integración y despliegue coordinado

Fecha: 06/11/2026. Repositorios: `fexpo-app-pwa`, `fexpo-backend`, `fexpo_database`. Evento: **Imagina Tu Ciudad**, Parque Urbano Central, La Paz, 6 al 8 de noviembre de 2026. Alcance: únicamente la **Secretaría Municipal de Ciudad Productiva**.

Continúa [ENTREGA-BACKEND-BD-GAMLP-2026-11-06.md](ENTREGA-BACKEND-BD-GAMLP-2026-11-06.md) y recoge las correcciones de [CORRECCIONES-EXTRAS-2026-11-06.md](CORRECCIONES-EXTRAS-2026-11-06.md).

## Dónde estamos

**El circuito ya funciona en producción.** A las 18:30 UTC del 06/11/2026 una cuenta real de Google calificó las cinco paradas exteriores de punta a punta: QR impreso, acceso con Google sin perder el punto, lectura registrada y opinión persistida. En la base hay 5 opiniones y 5 lecturas de un visitante real.

Lo que está desplegado hoy: la base con las cinco experiencias, el backend con los cinco endpoints, y la PWA con el proxy abierto a esas rutas, las llamadas conectadas, el guardado con reintentos y el progreso confirmado en el Perfil.

**Lo que falta es un despliegue coordinado**, no más implementación. Las tres correcciones están commiteadas en los tres repos, en la rama `fix/gamlp-domo-y-qr-obligatorio`, y cambian el contrato de forma incompatible:

| Corrección | Efecto en el contrato |
| --- | --- |
| El domo pasa a ser evaluable | El catálogo y el progreso devuelven **seis** experiencias; el recorrido completo exige las seis |
| El servidor exige haber leído el QR | `POST .../scans` exige **`qrCode`** y devuelve `scanReceipt`; `PUT .../my-rating` exige **`scanReceipt`** |
| Google verificado en el servidor | Las tres rutas de visitante exigen que `app_users.auth_provider` sea `google` |

> ### ⚠️ Los dos lados salen juntos o no salen
>
> El backend corre con `forbidNonWhitelisted`: un cuerpo sin los campos nuevos responde **400**, y uno con campos de más también. Si el backend se despliega antes que la PWA, **el envío de opiniones deja de funcionar durante la feria**; si la PWA se despliega antes, sus envíos fallan con 400 por campos no reconocidos.
>
> El despliegue del backend es automático al empujar a `main` (`.github/workflows/ci-cd.yml`: `test` → `image` → `deploy`), así que el orden hay que decidirlo antes de empujar, no después.

## El flujo, confirmado

**El QR lleva directamente a la pantalla de calificar**, no a una portada ni a un menú. El código impreso contiene una sola URL HTTPS:

```
https://app.fexpo.lat/ferias/gamlp-puc-2026/calificar/<slug>?via=qr&qr=<code>
```

El parámetro `qr` lleva el identificador del código impreso (`docs/data/gamlp-issued-qr-2026-11-06.json`, también en `src/features/events/issued-qr.ts`). Es lo que se envía como `qrCode` al registrar la lectura: prueba ante el servidor que el visitante llegó por un QR emitido de ese punto.

Si falta sesión **no se le manda a otra página**: `PucGoogleGate` (`src/features/events/GoogleGate.tsx`) intercambia el contenido en el mismo sitio, sin ningún `Navigate`, `returnTo` ni `redirect` —cero coincidencias en el archivo—, así que la URL completa sobrevive intacta al acceso con Google y al terminar se renderiza el formulario de ese punto. Su propio texto lo promete: *«Después continuarás aquí, en la experiencia que elegiste»*.

Recorrido completo:

1. El visitante lee la hoja impresa con el lector de su teléfono o con la cámara de la PWA.
2. Se abre `…/calificar/<slug>?via=qr&qr=<code>`, la pantalla de calificación de ese punto.
3. Si falta sesión, Google aparece **allí mismo**; al volver sigue en el mismo punto.
4. La PWA registra la lectura con el código y recibe el comprobante.
5. Elige de 1 a 5 estrellas y, si quiere, un comentario de hasta 1.000 caracteres.
6. El servidor valida el comprobante, persiste y responde. **Solo entonces** aparece la confirmación y sube el avance.
7. Al volver a esa parada ve y puede editar su opinión. El número de personas no aumenta.
8. El Perfil recupera su avance confirmado tras recargar o cambiar de teléfono.

## Las seis experiencias

| Orden | Slug | UUID de la experiencia | Lotes del plano |
| --- | --- | --- | --- |
| 1 | `mercados` | `ea000000-0000-4000-8000-000000000001` | `1` |
| 2 | `tunel-mercados` | `ea000000-0000-4000-8000-000000000002` | `2` |
| 3 | `desarrollo-economico` | `ea000000-0000-4000-8000-000000000003` | `3A`, `3B` |
| 4 | `tunel-cites` | `ea000000-0000-4000-8000-000000000004` | `4` |
| 5 | `publicidad` | `ea000000-0000-4000-8000-000000000005` | `5` |
| 6 | `domo` | `ea000000-0000-4000-8000-000000000006` | ninguno |

Evento `gamlp-puc-2026`: `e0000000-0000-4000-8000-000000000002`.

El domo llega con `type: 'domo'` y `lots: []`: es la estructura central del recinto y no ocupa un lote rectangular del plano. **Los contadores van sobre seis**, y el «recorrido calificado» exige las seis. La PWA no necesita cambios por esto: ya usa `PUC_EXPERIENCE_COUNT` y prefiere el `totalExperiences` del servidor.

**No hay que escribir esos UUID en el código.** El QR lleva el slug, `GET /events/resolve/:slug` lo traduce y `server.ts` ya resuelve el catálogo una vez y lo cachea 60 s.

## El contrato

### Registrar la lectura

```
POST /events/<eventId>/experiences/<experienceId>/scans
{ "qrCode": "<code del parámetro qr>",
  "source": "camera",
  "requestKey": "<UUID de la operación>" }
```

`source` admite `camera`, `image` o `external-qr`. Una apertura manual desde la ficha **no** es un escaneo y no se registra.

`qrCode` es obligatorio: el servidor comprueba que esté activo y que pertenezca a ese evento y punto. El QR de otra parada responde **403 `QR_CODE_INVALID`**.

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

`scanReceipt` es lo que habilita la calificación de ese punto. Es **estable entre relecturas**, así que volver a escanear devuelve el mismo y un reintento idempotente también.

**Una relectura es un 200 con `firstScan: false`, no un error.** No aumenta las personas únicas. El `409` está reservado para el conflicto de idempotencia.

### Crear o editar la opinión

```
PUT /events/<eventId>/experiences/<experienceId>/my-rating
{ "stars": 4,
  "comment": "La información fue clara.",
  "scanReceipt": "<el scanReceipt de ese punto>",
  "requestKey": "<UUID de la operación>" }
```

El autor sale del token. **No enviar `userId`**: cualquier campo de más es un `400`. `stars` es entero de 1 a 5; `comment` es opcional, hasta 1.000 caracteres.

`scanReceipt` debe ser el de **esta cuenta y este punto**, sin caducar. Sin él, **403 `QR_SCAN_REQUIRED`**: el servidor ya no se conforma con la barrera visual de la interfaz. El comprobante de otra cuenta, el de otro punto y el vencido se rechazan igual.

Implicación de flujo: **antes de guardar hay que haber llamado a `scans`**. `server.ts` lo encadena solo (`savePucRating` llama a `ensurePucScan` y usa su comprobante), y llegar al formulario por el mapa o por la ficha sin haber escaneado da `QR_SCAN_REQUIRED` tanto en el cliente como en el servidor.

```json
{
  "rating": { "id": "…", "eventId": "…", "experienceId": "…", "stars": 4,
              "comment": "…", "createdAt": "…", "updatedAt": "…" },
  "progress": { "totalExperiences": 6, "scannedCount": 2, "ratedCount": 1 },
  "created": true
}
```

`created` distingue alta de edición. Editar **no** aumenta `ratedCount` ni el total de opiniones.

### Leer el avance confirmado

```
GET /events/<eventId>/experience-progress
```

Devuelve `{ eventId, progress, experiences[] }`, con una fila por cada una de las seis:

```json
{ "experienceId": "…", "slug": "mercados", "order": 1, "name": "…", "shortName": "…",
  "type": "carpa", "scannedAt": "…", "myRating": null, "status": "pending" }
```

`status` es `complete` **solo** cuando hay opinión persistida. Leer el QR no completa un punto y un borrador local tampoco.

### Métricas

`GET /events/<eventId>/experience-metrics` exige permisos de organizador sobre el evento y **no se expone por el proxy de visitantes**, a propósito. Los comentarios viajan solo en esa respuesta. No lleva la verificación de Google, porque los organizadores usan cuentas internas.

## Idempotencia

El `requestKey` es un UUID **generado una vez por intento y reutilizado en cada reintento**. `server.ts` lo persiste en `sessionStorage` junto al contenido y genera uno nuevo solo si el contenido cambia.

| Situación | Respuesta |
| --- | --- |
| Misma clave, mismo contenido | `200` con la respuesta guardada, sin escribir otra vez |
| Misma clave, **otro** contenido | `409 IDEMPOTENCY_CONFLICT` |
| Clave nueva, contenido nuevo | `200`, crea o edita |

**Ante un timeout, conservar el borrador y reintentar con la misma clave.** Si el primer intento falló, su transacción se revirtió junto con la fila de idempotencia, así que el reintento se ejecuta; si alcanzó a terminar, recibe la misma respuesta. En ningún caso se duplica.

`scanReceipt` queda **fuera** de la huella del contenido: es una credencial, no la opinión. Así un reintento con el mismo texto y estrellas repite la respuesta guardada aunque el visitante haya vuelto a escanear por el camino.

## Errores y qué mostrar

| Código | Significado | Qué hace la interfaz |
| --- | --- | --- |
| `401` | Sin sesión o token vencido | `api.ts` refresca y reintenta una vez; si vuelve a fallar, reaparece la barrera de Google sin perder el punto |
| `400 VALIDATION_ERROR` | Estrellas fuera de 1-5, comentario largo, falta un campo, o campo de más | Mensaje del campo; conservar el borrador |
| `403 QR_SCAN_REQUIRED` | No hay lectura previa vigente de esta cuenta para este punto | Mandar a escanear; conservar el borrador |
| `403 QR_CODE_INVALID` | El código no está vigente o es de otro punto | «Ese QR no corresponde a este punto» |
| `403 GOOGLE_ACCOUNT_REQUIRED` | La sesión no es de Google | Rehacer el acceso con Google; no es un fallo del formulario |
| `404 EVENT_NOT_FOUND` / `EXPERIENCE_NOT_FOUND` | Slug o punto inexistente | «Ese QR no corresponde a esta feria» |
| `409 IDEMPOTENCY_CONFLICT` | Clave reusada con otro contenido | Reintentar con clave nueva; nunca presentarlo como éxito |
| `502 UPSTREAM_UNAVAILABLE` | Backend caído o lento | Conservar el borrador y ofrecer reintentar con la misma clave |

El comprobante dura 12 horas y se renueva en cada lectura, así que un `QR_SCAN_REQUIRED` en plena feria casi siempre significa que el visitante llegó al formulario sin pasar por el QR, no que se le haya vencido.

**Nunca simular un envío exitoso**, y no borrar ni dar por enviado un borrador cuando falla la red.

## Progreso y métricas: qué cuenta y qué no

- **Personas que calificaron:** cuentas distintas con al menos una opinión persistida.
- **Opiniones por parada:** una por usuario y punto. Editar no aumenta el total.
- **Recorrido calificado:** las **seis** experiencias calificadas por la misma cuenta.
- **QR leídos:** indicador operativo, deduplicado, **separado** de las calificaciones.
- **No son calificaciones:** borradores, visitas a la página, inicios de sesión y el QR de ingreso general.

Ninguno de estos indicadores prueba presencia física: el identificador impreso es público y un QR estático puede compartirse o transcribirse. Lo que el comprobante sí garantiza es que la opinión salió de una cuenta que leyó ese código, y que caduca.

`fexpo-puc-scans-v1` (`progress.ts`) sigue siendo el historial del dispositivo, pero su clave **no incluye usuario ni evento**, así que es compartida entre cuentas en un mismo navegador. Al iniciar sesión, el avance que manda es el del servidor.

## Qué falta verificar

Lo que ninguna prueba automática cubre, y que exige estar en el recinto:

- [ ] Con una cuenta Google real y los seis impresos: QR, acceso sin perder el punto, lectura, opinión, edición, reintento con la red caída y progreso al recargar y en otro teléfono.
- [ ] El QR de una parada no sirve para registrar la lectura de otra.
- [ ] Llegar al formulario desde el mapa o la ficha lleva a escanear, no al envío.
- [ ] El domo se puede calificar y el recorrido completo solo se da con las seis.
- [ ] Los conteos del Perfil coinciden con consultas directas a la base.
- [ ] Dos teléfonos físicos distintos completan el circuito con cuentas distintas.
- [ ] FIPAZ conserva sus datos históricos y su circuito separado.

## Antes de autorizar más impresión y distribución

Que un código decodifique bien no demuestra que la ruta esté publicada ni que la opinión se guarde. El despliegue web debe servir la PWA para `/ferias/*`, conservar ruta y consulta al recargar, y **no** devolver el HTML de la PWA para `/api/*`.

Los seis códigos emitidos están verificados contra el validador del backend y la restricción de la base: todos pasan. Si se emite alguno nuevo hay que sembrarlo en `event_experience_qr_codes`, porque un código que no esté en esa tabla responde `403 QR_CODE_INVALID`.
