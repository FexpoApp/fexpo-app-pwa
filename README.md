# fexpo · App PWA

Aplicación de visitantes en React, Vite y TypeScript. Identidad FEXPO: símbolo de módulos, Poppins, azul, lima y marfil; temas claro y oscuro.

Producción: [app.fexpo.lat](https://app.fexpo.lat). **Esta actualización del 01/11/2026 está local en `codex/inicio-anuncios-agenda-2026` para revisión; no se ha desplegado.** Conserva los cambios previos de la PWA.

Documentación actual: [Descubre, QR y comparación del mapa oficial](docs/DESCUBRE-QR-Y-MAPA-OFICIAL-2026-11-01.md). Registros anteriores: [Inicio y agenda](docs/INICIO-AGENDA-Y-DESCUBRE-2026-11-01.md), [Descubrimiento y mapa](docs/MEJORAS-DESCUBRIMIENTO-2026-10-28.md) y [Mejoras móviles](docs/MEJORAS-MOVIL-2026-10-28.md).

## Para el equipo: implementado y pendiente

Las casillas marcadas describen código de la PWA, no un despliegue ni una certificación de todo el circuito backend/dashboard. Los ejemplos están identificados y no deben sembrarse en producción. Los afiches oficiales suministrados se distinguen de esos ejemplos y de los datos de API.

### Implementado en la aplicación

- [x] Inicio con acceso centrado a FIPAZ de 80 x 27 px y área táctil de 44 px; abre la agenda existente. Mapa, Stands y Check-in siguen como accesos rápidos.
- [x] Anuncios separados de destacados/ofertas: carrusel horizontal automático cada 6 segundos, vuelta al inicio, anterior/siguiente y pausa; se detiene al interactuar, perder visibilidad/foco y con movimiento reducido. Los anuncios de muestra solo aparecen en local/demo.
- [x] Descubre reemplaza la pestaña Misiones: Hoy, Comer, Ofertas y Servicios. Abre en Hoy y conserva la sección en la URL. Misiones/progreso y Premios tienen accesos propios desde Perfil; sus rutas se mantienen.
- [x] Comer consulta el catálogo gastronómico, permite buscar y abre el menú. Hay un menú ilustrativo en local/demo; live muestra que el expositor aún no lo publicó, sin inventar platos/precios.
- [x] Agenda por los 12 días del evento, línea de tiempo y fechas/horas en America/La_Paz. Hoy comparte esa fuente; no mantiene otra cartelera separada.
- [x] API de actividades existente, paginación y deduplicación; afiches fechados suministrados por Omar, con atribución. No se inventan horas de espectáculo a partir del horario general ni se incorpora la cartelera 2023. La API tiene prioridad por título/día y puede retirar afiches coincidentes si devuelve cancelaciones.
- [x] Visitas por QR personal: GET /me/qr, pase visible desde Check-in y actualización del progreso cada 4 segundos mientras se muestra. Abrir un enlace de stand o mostrar un QR no acredita puntos.
- [x] NFC en pausa (`NFC_ENABLED = false`): sin botón de lectura; `/nfc-test` redirige a Check-in. Código y pruebas unitarias conservados para una futura feria.
- [x] Comparación documentada del PDF oficial, página 3, con las siete zonas y 472 espacios del modelo. No se modificó la geometría ni se afirmó georreferenciación. Servicios ofrece el plano oficial donde falta un punto interactivo validado.
- [x] Se mantienen sesión, favoritos, contactos con consentimiento, intereses, mapa 2D/3D, ofertas y progreso confirmado por servidor.

### Pendientes por responsable

- [ ] **Dashboard / backend — prioridad QR:** adaptar el escáner al contrato real `POST /stands/:standId/manual-check-ins` (`userQrToken`, `requestKey`). Hoy su cliente usa `/stands/scan-visitor`, `visitorQrData` y `occurredAt`; no coincide con ese contrato. Validar sesión, roles y alcance del stand. Esta entrega no modifica el dashboard.
- [ ] **QA — issue #4:** probar físicamente QR personal leído por staff, duplicados diarios, rechazos, Android/iOS, red intermitente, actualización de saldo, mapa e instalación. NFC queda para otra feria.
- [ ] **Organización / editorial:** confirmar cartelera vigente, horas individuales, cambios y cancelaciones. Los afiches del 1 nov y el folleto difieren en horarios; consultar las fuentes, no homogeneizar sin confirmación.
- [ ] **Backend / BD — agenda:** acordar publicación con categoría, fuente/afiche, fecha sin hora y estados de cancelación/retiro; sustituir la curación local por la fuente editorial común. El endpoint actual solo publica scheduled/completed; no garantiza comunicar cancelaciones.
- [ ] **Backend / BD — comida:** publicar restaurante asociado a stand/lote validado, menú/ítems, precio/moneda, disponibilidad, fecha de actualización y permisos de edición. PWA: conectar `PUBLISHED_MENUS` al contrato acordado. Sin pedidos ni pagos en este alcance.
- [ ] **Backend / BD — anuncios:** definir campañas y creativos por evento, anunciante, destino, estado, vigencia y orden; revisar tablas existentes antes de crear otras. PWA: conectar la fuente live actualmente vacía.
- [ ] **PWA / backend — métricas comerciales:** definir y persistir impresiones/clics, deduplicación y reportes. El carrusel no simula ventas ni registra métricas todavía.
- [ ] **PWA — issue #6:** dinámicas reales, finalización idempotente y progreso del servidor. Los juegos actuales siguen como muestras bloqueadas.
- [ ] **PWA / mapa — issues #10 y #8:** validar fusiones, ocupantes, escala, orientación y paridad 2D/3D. Cotejar cada lote con el plano operativo; completar mesas, accesos y servicios. Ver comparación documentada.
- [ ] **PWA / backend — issue #9:** promociones flash/avisos publicados, ventana de vigencia, expiración y enlace. Las promociones no equivalen a anuncios pagados.
- [ ] **PWA / backend — issue #1:** conciliar integración general y sesión/datos comunes con la issue #3 de Saúl.
- [ ] **PWA / backend:** sincronización entre dispositivos de intereses/preferencias; hoy se guardan por cuenta/evento en este navegador.

### Qué se consulta o guarda hoy

| Función               | Fuente o persistencia actual                                                                   | Falta                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Agenda / Hoy          | API de actividades y transcripción local de afiches con fecha/fuente; día en URL               | Publicación editorial única, horarios, retiros/cancelaciones |
| Anuncios              | Ejemplos locales; fuente live vacía                                                            | API, campañas/creativos en BD y métricas                     |
| Comer / menús         | Catálogo API en live; menú demo solo local                                                     | Publicación y persistencia de menús reales                   |
| Visita QR             | Token del backend; el staff confirma; PWA consulta visitas/saldo                               | Adaptar escáner dashboard y probar físicamente el circuito   |
| NFC histórico         | Código desactivado; cola anterior de IndexedDB conservada                                      | Reactivación y validación en otra feria                      |
| Contactos comerciales | POST con consentimiento; confirmación tras ID del servidor                                     | Consulta/gestión en panel del expositor                      |
| Intereses             | localStorage por cuenta/evento                                                                 | Sincronización en servidor                                   |
| Mapa                  | Geometría publicada o maqueta compatible; último stand confirmado solo como origen orientativo | Cotejo operativo, servicios y lotes fusionados               |

## Experiencia móvil actual

- **Inicio:** botón compacto con el logotipo oficial de FIPAZ y acceso a su agenda; Mapa, Stands y Check-in; anuncios separados de stands destacados y ofertas. Se conserva el trabajo previo de descubrimiento y navegación.
- **Agenda:** programación por día del 28 de octubre al 8 de noviembre, con línea de tiempo. En live utiliza actividades publicadas del evento; local/demo contiene ejemplos identificados. Los horarios generales y la ubicación del patio de comidas son información oficial, no horarios inventados de conciertos.
- **Stands:** filas horizontales por categoría y flecha hacia la categoría completa. Búsqueda por nombre, rubro, descripción y código; acepta códigos con o sin guion y varios términos.
- **Perfil de empresa:** nombre a la izquierda, imagen a la derecha, guardar, compartir y ubicación. Las redes se muestran cuando existen datos publicados. La API pública actual no entrega logos ni redes; se utiliza una ilustración de categoría como respaldo.
- **Conexión comercial:** formulario con consentimiento explícito, nombre, correo, celular internacional opcional y nota. La confirmación se muestra después de recibir el identificador del servidor.
- **Servicios comerciales:** orden Ofertas → Dinámicas → Catálogo. Permanecen bloqueados con muestras identificadas; los ejemplos no entregan descuentos, premios ni puntos.
- **Perfil del visitante:** presentación compacta, avatar Google cuando está disponible, preferencias, QR y recorrido.
- **Intereses y ofertas:** selección opcional al primer acceso autenticado, guardada por cuenta/evento en este dispositivo. Ofertas filtradas y explorador deslizable con acceso al stand; en live solo se utilizan promociones publicadas.
- **Misiones:** insignias horizontales de recorrido, calculadas con visitas únicas confirmadas; no suman premios ni puntos adicionales.
- **Audio:** avisos de progreso confirmado, con vibración opcional. La señal de lectura NFC se conserva solo en el código pausado. La guía de voz fue retirada.

Las portadas por rubro son ilustrativas; no representan productos ni logotipos oficiales de las empresas. Imagen maestra y prompt: [Pósteres de categorías](docs/POSTERS-CATEGORIAS-2026-10-28.md).

## Modos de ejecución

| Modo    | Acceso y datos                                                                                                                                | Check-in                                                                      |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `live`  | Google y sesión del backend; catálogo y mapas publicados.                                                                                     | QR personal para lectura del staff; puntos únicamente confirmados por la API. |
| `local` | Bienvenida y visitante de prueba guardado en este dispositivo. El botón Google está deshabilitado y marcado «Próximamente». Sin API de fexpo. | Pase y confirmación de ejemplo; sin visitas oficiales ni puntos del servidor. |
| `demo`  | Expositores y progreso ficticios para explorar la interfaz.                                                                                   | Simulación identificada como demostración.                                    |

El acceso Google del modo conectado continúa disponible desde Perfil. El modo local no inicia OAuth desde su bienvenida.

## Ejecutar

Node.js 22.12 o posterior compatible con Vite 7.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Desarrollo: http://localhost:5174. Elegir el modo mediante `VITE_DATA_MODE` y reiniciar Vite después de cambiar variables.

```powershell
npm run build:live
npm run preview
# Alternativas aisladas:
npm run build:local
npm run build:demo
```

Vista previa: http://127.0.0.1:4174. Cada compilación reemplaza `dist`; compilar el modo deseado antes de ejecutar preview o sus pruebas de navegador.

### Pantalla en blanco al iniciar desarrollo

Si la consola muestra `ERR_CONNECTION_TIMED_OUT` en `/@vite/client`, `/src/main.tsx` y `/@react-refresh`, comprobar primero el servidor local; esas peticiones todavía no dependen del backend ni de `VITE_DATA_MODE=live`.

```powershell
Get-NetTCPConnection -LocalPort 5174 -State Listen |
  Select-Object LocalAddress, LocalPort, OwningProcess
```

Puede haber un servidor anterior enlazado a `127.0.0.1:5174` y otro nuevo en `0.0.0.0:5174`. El primero tiene prioridad en loopback y puede interceptar las peticiones aunque Vite muestre que el segundo arrancó. Detener únicamente la instancia anterior desde su terminal; no cerrar todos los procesos Node. Las verificaciones automatizadas deben usar otro puerto y cerrar sus servidores al terminar.

Después, abrir http://localhost:5174 y recargar con **Ctrl+Shift+R** para pedir el HTML actual si había un service worker antiguo. El service worker de desarrollo está deshabilitado; las pruebas offline/PWA se realizan con build y preview. Si persiste, revisar en Network que los tres módulos anteriores respondan y distinguir errores de red de excepciones JavaScript.

## Configuración

| Variable                | Uso                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `VITE_DATA_MODE`        | `live`, `local` o `demo`.                                                                    |
| `VITE_EVENT_ID`         | UUID real del evento publicado; no su slug. Necesario en live.                               |
| `VITE_GOOGLE_CLIENT_ID` | Cliente OAuth de aplicación web, compatible con el backend.                                  |
| `BACKEND_URL`           | URL raíz del backend, solo en el servidor. El puente admite y normaliza el sufijo `/api/v1`. |

Autorizar en Google Cloud los **orígenes JavaScript** que se utilicen, incluidos sus puertos y el dominio HTTPS de producción. Si aparece `origin_mismatch`, comprobar el cliente configurado y sus orígenes; configurar solamente una URI de redirección no resuelve este flujo JavaScript.

El evento `e0000000-0000-4000-8000-000000000001` también se utiliza en las fixtures y el seed de pruebas. No asumir que existe en otro entorno: comprobar el UUID publicado.

`.env.local` está ignorado por Git. No colocar secretos JWT, credenciales de base de datos ni otras claves privadas en variables `VITE_*`.

## Mapa y recorridos

Mapa abre en **2D por defecto**, con 3D opcional, mostrando una vista general del campo ferial, basada en la fotografía de FIPAZ 2026: bloques rojo, amarillo y verde, torres y plazas Akapana/Kalasasaya. Los bloques se eligen mediante botones horizontales por color; sus planos interiores mantienen los controles de planta y las vistas 2D/3D.

Desde Ubicación en el perfil se abre el piso en 2D y se centra el lote, sin paneles de origen ni fichas automáticas. Tocar un espacio abre una ficha inferior sobre la navegación de fexpo. **Cómo llegar** solicita el origen en un diálogo y dibuja una ruta orientativa desde un ingreso o la última visita confirmada. El exterior es esquemático y el interior sigue los pasillos representados. El NFC está desactivado en esta edición; Check-in muestra el QR personal. **Mi ubicación** conserva el GPS relativo con confirmación explícita del punto inicial.

**Límites:** la foto no aporta coordenadas topográficas. Las rutas son orientativas y el GPS existente es relativo, con escala y orientación provisionales; no es navegación interior exacta ni una ruta de evacuación o accesibilidad. El avatar no se presenta inicialmente como una ubicación real.

La geometría publicada por el servidor tiene prioridad. El trazado por pasillos utiliza los planos canónicos compatibles; los pisos nuevos se conservan en el visor genérico y necesitan su propia red de recorridos. No se sustituyen datos reales por stands de demostración.

Referencia de los planos originales: [Mapa del recinto](docs/CAMPUS_MAP.md). Cambios actuales: [mapa, intereses y límites](docs/MEJORAS-DESCUBRIMIENTO-2026-10-28.md).

## Conexiones comerciales

La PWA envía un POST autenticado a `/stands/:standId/leads` con:

- `contact_name`, `contact_email`.
- `contact_phone` y `notes` opcionales.
- `consent_given: true`, únicamente tras la autorización explícita del visitante.

Evita envíos simultáneos y confirma solo cuando el servidor devuelve un ID. El acuse se conserva durante la sesión de la página; los datos de contacto no se persisten en el almacenamiento del navegador. En local/demo no se envían contactos.

La API existente permite consultar los contactos con permisos de empresa mediante `GET /companies/:companyId/leads`. **La nueva pantalla de consulta en el dashboard no forma parte de estos cambios y sigue pendiente.** El puente de visitantes permite crear contactos, pero no consultar ni eliminar listas de contactos de empresas.

La activación de los módulos comerciales requiere un contrato de autorización/plan desde el servidor. No existe un desbloqueo de pago simulado en el cliente.

## Audio y vibración

| Uso         | Archivo         |
| ----------- | --------------- |
| Avisos      | `sonido-05.mp3` |
| Lectura NFC | `sonido-07.mp3` |

Se mantiene una reproducción a la vez; en el código NFC archivado, la lectura tenía prioridad y los avisos esperan a cerrar el comprobante. El navegador necesita una interacción previa para habilitar el audio. Perfil permite activar/desactivar sonidos y vibración.

Cada efecto solicita un pulso de 80 ms cuando el dispositivo lo admite. Las preferencias anteriores se migran conservando sonidos y vibración y eliminando la opción de voz. Los archivos de voz ya no se reproducen ni se precachean; los dos efectos continúan disponibles offline.

## NFC archivado para futuras ferias

**No operativo en esta edición: `NFC_ENABLED = false`.** Las instrucciones siguientes documentan el código conservado. Los accesos NFC ya no aparecen; `/nfc-test` redirige al pase QR. No activar este bloque durante la revisión actual.

Web NFC necesita Chrome Android compatible, hardware NFC encendido, HTTPS, permiso explícito y pantalla visible/desbloqueada. La presencia de `NDEFReader` no garantiza que el dispositivo tenga hardware NFC. Las etiquetas deben admitir NDEF.

Para producción se recomienda un único registro de **texto UTF-8**:

```json
{ "v": 1, "eventId": "UUID_REAL_DEL_EVENTO", "standId": "UUID_REAL_DEL_STAND" }
```

Reemplazar los valores por los UUID reales y registrar previamente el UID físico de la etiqueta en el backend, asociado a ese stand. El texto identifica el destino; no acredita por sí mismo una visita. El servidor valida el UID. No guardar datos personales, tokens o secretos en la tarjeta; UID y texto estáticos no son protección criptográfica contra clonación.

Una visita NFC confirmada en Check-in también actualiza el último punto conocido para el mapa; Mapa no abre otro lector.

Se mantienen los formatos anteriores compatibles: enlaces de feria/stand, `/stands/UUID_STAND`, JSON con `standId` y contexto `/scan?stand=UUID_STAND`. Abrir un enlace nunca acredita puntos. La PWA no escribe ni modifica etiquetas.

Solo hay una sesión de lectura activa y un resultado por sesión. Después del primer evento, el lector se mantiene brevemente mientras se retira la tarjeta; los eventos repetidos no generan otro check-in. Se libera al ocultar la página o salir de la pantalla. **Esto reduce la devolución inmediata del lector a Android, pero no permite garantizar la supresión de todos los avisos del sistema.**

iPhone y navegadores sin Web NFC usan **Mi QR**, que escanea el personal del stand. No hay lectura NFC en segundo plano.

### Prueba física y acceso por USB

Las pruebas automatizadas del flujo actualizado simulan NDEF; falta repetir la validación con teléfono y tarjeta reales. La lectura física local documentada anteriormente no equivale a validar los ajustes actuales: [QA del modo local](docs/LOCAL_MODE_QA.md).

Con las herramientas Android existentes y preview activo:

```powershell
.\.local-tools\platform-tools\adb.exe reverse tcp:4174 tcp:4174
.\.local-tools\platform-tools\adb.exe shell am start -a android.intent.action.VIEW -d http://localhost:4174/ -p com.android.chrome
```

Mantener USB conectado. Fuera de este acceso localhost, usar HTTPS: una IP LAN con HTTP no habilita Web NFC. La lista de comprobaciones físicas está en [Mejoras móviles](docs/MEJORAS-MOVIL-2026-10-28.md).

## Sesión, datos y funcionamiento offline

- Access token en memoria; refresh token en cookie `HttpOnly`, `SameSite=Strict` y `Secure` en producción. Rotación y reintento de un 401.
- Catálogo paginado, perfiles, favoritos autenticados y mapas publicados.
- Saldo, nivel, visitas y racha confirmados por el servidor; sin puntos ficticios en modo live.
- QR personal emitido por el backend. Consulta del progreso cada 4 segundos al mostrarlo y cada 15 segundos en otras pantallas, además del regreso al primer plano.
- Cola offline de check-ins en IndexedDB por cuenta/evento, con `requestKey` estable. Los pendientes no acreditan puntos antes de confirmarse.
- Caché pública de catálogo, mapa y perfiles. Datos privados separados por cuenta; cerrar sesión limpia QR, progreso local y pendientes.
- Restaurar la sesión al recargar requiere red. El QR offline se conserva mientras la sesión validada siga abierta; recargar sin conexión requiere volver a acceder cuando regrese la red.
- Avisos internos por visitas confirmadas, incluidos registros del staff con QR; no son notificaciones push del sistema.

Las misiones/canjes conectados siguen sujetos a los endpoints disponibles del backend. Las simulaciones de progreso, juegos y canjes permanecen identificadas como demostración.

El tema sincroniza color-scheme, fondo raíz y theme-color. La barra nativa de Android depende del navegador y del sistema; la app no puede cubrir sus botones. Se requiere comprobación física del color final.

Las rutas de URL se conservan. Mantener solo la raíz requeriría cambiar la navegación y resolver recarga, Atrás y enlaces compartidos. La PWA ya declara `display: standalone` para abrir instalada sin la barra habitual del navegador.

## Verificación

```powershell
npm run typecheck
npm test
npx playwright install chromium
npm run build:live
npm run test:e2e:live
# Para comprobar la demo por separado:
npm run build:demo
npm run test:e2e:demo
# Al terminar, recompilar el modo que se vaya a utilizar.
```

Para usar un Chromium existente, configurar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Las pruebas live interceptan la API, Google y la confirmación del personal: verifican contratos e interacciones, no hardware, una cuenta Google real ni un escaneo físico. Comprueban que el recorrido actual no abre el lector NFC.

Para aislar las pruebas de un servidor abierto, configurar `PWA_TEST_PORT` antes de ejecutarlas (por defecto, `4174`). El puerto debe estar libre; Playwright inicia y cierra su propio servidor de preview.

Última verificación del 01/11/2026, Descubre, QR y plano oficial:

- **63 pruebas unitarias aprobadas** en 13 archivos, incluidas fechas sin hora, prioridad de API sobre afiches y cancelaciones recibidas.
- **28 pruebas live de navegador aprobadas** con servicios simulados: QR y actualización tras confirmación del personal, sesión, ausencia de lectura NFC, catálogo, menú no publicado, mapa, contactos y agenda con error/reintento.
- **19 casos demo verificados**, incluyendo la repetición de los casos afectados por el ajuste del service worker: navegación, menú ilustrativo, carrusel automático/pausa, persistencia y recursos offline. Los afiches y el PDF abren como archivos con el service worker activo.
- Tipos y compilaciones demo/live aprobados. La compilación final usa la configuración live local habitual, sin las variables temporales de QA.
- **42 capturas de siete vistas**, a 320/390/1440 px y en claro/oscuro, con comprobación de desbordamiento, imágenes y errores JavaScript; revisión visual de vistas móviles y de escritorio. También se cubre 768 px en la suite demo.
- Evidencias locales: `../../output/pwa-descubre-2026-11-01/review/results.json` y capturas en la misma carpeta. Vista de revisión demo: `http://127.0.0.1:5187/` mientras el servidor siga abierto.
- No se modificaron issues, dashboard, backend ni esquema de BD. Sin escrituras de negocio en producción, commit, push o despliegue. Faltan menús/campañas publicados y la adaptación del escáner del personal al contrato real.

Verificación anterior del 01/11/2026, inicio y agenda (antes de Descubre y pausa NFC):

- **60 pruebas unitarias aprobadas** en 13 archivos; incluyen fechas en La Paz, actividades publicadas, paginación y vigencia de anuncios.
- **27 pruebas live de navegador aprobadas**, con API y Google simulados; incluyen carga de agenda, exclusión de borradores, fallo y reintento.
- **16 pruebas demo de navegador aprobadas**; incluyen acceso desde el logo, carrusel de anuncios, selector de días y conservación de la fecha al recargar.
- Tipos y compilaciones demo/live aprobados. La compilación final utiliza la configuración live local habitual, sin las variables temporales de QA.
- Inicio y agenda revisados a **320, 390 y 1440 px**, en claro y oscuro: sin desbordamiento horizontal, imágenes rotas ni errores JavaScript en esos recorridos.
- No se modificaron issues, backend ni esquema de BD; no hubo escrituras de negocio en producción, commit, push ni despliegue. La vista de revisión usa ejemplos identificados; live consulta únicamente actividades de la API y mantiene vacía la fuente de anuncios hasta su integración.

Alcance, fuentes y propuesta de navegación: [Inicio, agenda y Descubre](docs/INICIO-AGENDA-Y-DESCUBRE-2026-11-01.md). Las capturas de esta revisión están en `../../output/pwa-inicio-agenda-2026-11-01/review/`.

Registro anterior del 28/10/2026:

- **52 pruebas unitarias aprobadas** en 12 archivos.
- **25 pruebas live de navegador aprobadas**, incluidos Google simulado, NFC online/offline, contactos, fallos y ausencia de desbordamiento a 320/390/1440 px en claro/oscuro.
- **15 pruebas demo aprobadas** y **18 casos locales comprobados**, incluidos GPS relativo, NFC y fallback a 2D sin WebGL. Tres eventos NFC consecutivos generan una sola solicitud de check-in.
- Tipos y compilación live aprobados. Revisión visual móvil/escritorio y recorridos exterior/interior completados.
- Sin escrituras de negocio en producción; sin add, commit ni despliegue durante esta actualización.

Capturas de esa revisión: [Ficha inferior](docs/qa/2026-10-28-v2/light-map-sheet.png) · [Ofertas](docs/qa/2026-10-28-v2/light-offer-explorer.png) · [Recinto 3D](docs/qa/2026-10-28-v2/dark-map-general-3d.png). Registro completo: [Segunda iteración](docs/MEJORAS-DESCUBRIMIENTO-2026-10-28.md).

## Despliegue

En Vercel: React/Vite, build `npm run build:live`, output `dist` y las variables del entorno correspondiente. `api/backend.ts` y `api/session/[action].ts` usan el puente Node del mismo origen; la reescritura SPA excluye `/api/`. Vite monta el mismo puente en desarrollo y preview.

El puente limita rutas y métodos y evita caché de API. El service worker precachea recursos estáticos y excluye `/api/` del fallback. No desplegar únicamente `dist` en un alojamiento estático sin implementar también el puente.

Guía: [Vercel](docs/DEPLOY_VERCEL.md). Informes anteriores: [integración](docs/INTEGRATION_QA.md), [E2E/CI](docs/PWA_E2E_CI.md) y [modo local](docs/LOCAL_MODE_QA.md).
