# fexpo · App PWA

Aplicación de visitantes en React, Vite y TypeScript. Identidad oficial: símbolo de módulos, Poppins y paleta azul, lima y marfil; temas claro y oscuro.

Dominio de producción: [app.fexpo.lat](https://app.fexpo.lat), conectado a la API mediante el puente del mismo origen. **Los cambios móviles del 28/10/2026 están implementados localmente y no se han desplegado.**

Detalle de las fases, contratos y límites: [Mejoras móviles 2026](docs/MEJORAS-MOVIL-2026-10-28.md).

## Experiencia móvil actual

- **Inicio:** banner FIPAZ compacto; accesos Mapa, Stands y Check-in; destacados con desplazamiento horizontal. Las tarjetas de nivel y los accesos de misiones, premios y Mi QR se retiraron únicamente del inicio.
- **Stands:** filas horizontales por categoría y flecha hacia la categoría completa. Búsqueda por nombre, rubro, descripción y código; acepta códigos con o sin guion y varios términos.
- **Perfil de empresa:** nombre a la izquierda, imagen a la derecha, guardar, compartir y ubicación. Las redes se muestran cuando existen datos publicados. La API pública actual no entrega logos ni redes; se utiliza una ilustración de categoría como respaldo.
- **Conexión comercial:** formulario con consentimiento explícito, nombre, correo, celular internacional opcional y nota. La confirmación se muestra después de recibir el identificador del servidor.
- **Servicios comerciales:** orden Ofertas → Dinámicas → Catálogo. Permanecen bloqueados con muestras identificadas; los ejemplos no entregan descuentos, premios ni puntos.
- **Perfil del visitante:** presentación compacta, avatar Google cuando está disponible, preferencias, QR y recorrido.
- **Audio:** sonidos de aviso y lectura NFC, con vibración opcional. La guía de voz fue retirada.

Las portadas por rubro son ilustrativas; no representan productos ni logotipos oficiales de las empresas. Imagen maestra y prompt: [Pósteres de categorías](docs/POSTERS-CATEGORIAS-2026-10-28.md).

## Modos de ejecución

| Modo | Acceso y datos | Check-in |
| --- | --- | --- |
| `live` | Google y sesión del backend; catálogo y mapas publicados. | UID validado por el servidor; puntos únicamente confirmados por la API. |
| `local` | Bienvenida y visitante de prueba guardado en este dispositivo. El botón Google está deshabilitado y marcado «Próximamente». Sin API de fexpo. | Lectura NFC real de prueba; sin visitas oficiales ni puntos del servidor. |
| `demo` | Expositores y progreso ficticios para explorar la interfaz. | Simulación identificada como demostración. |

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

| Variable | Uso |
| --- | --- |
| `VITE_DATA_MODE` | `live`, `local` o `demo`. |
| `VITE_EVENT_ID` | UUID real del evento publicado; no su slug. Necesario en live. |
| `VITE_GOOGLE_CLIENT_ID` | Cliente OAuth de aplicación web, compatible con el backend. |
| `BACKEND_URL` | URL raíz del backend, solo en el servidor. El puente admite y normaliza el sufijo `/api/v1`. |

Autorizar en Google Cloud los **orígenes JavaScript** que se utilicen, incluidos sus puertos y el dominio HTTPS de producción. Si aparece `origin_mismatch`, comprobar el cliente configurado y sus orígenes; configurar solamente una URI de redirección no resuelve este flujo JavaScript.

El evento `e0000000-0000-4000-8000-000000000001` también se utiliza en las fixtures y el seed de pruebas. No asumir que existe en otro entorno: comprobar el UUID publicado.

`.env.local` está ignorado por Git. No colocar secretos JWT, credenciales de base de datos ni otras claves privadas en variables `VITE_*`.

## Mapa y recorridos

Mapa abre con una vista general 2D/3D del campo ferial, basada en la fotografía de FIPAZ 2026: bloques rojo, amarillo y verde, torres y plazas Akapana/Kalasasaya. Los bloques se eligen mediante botones horizontales por color; sus planos interiores mantienen los controles de planta y las vistas 2D/3D.

Al buscar y seleccionar un stand se puede elegir un ingreso como inicio o usar la última lectura NFC conocida. El recorrido exterior es esquemático; el interior sigue pasillos evitando los puestos, baños y mesas representados. Durante el recorrido, el acceso al perfil queda en el resumen para no tapar el trazado.

**Límites:** la foto no aporta coordenadas topográficas. Las rutas son orientativas y el GPS existente es relativo, con escala y orientación provisionales; no es navegación interior exacta ni una ruta de evacuación o accesibilidad. El avatar no se presenta inicialmente como una ubicación real.

La geometría publicada por el servidor tiene prioridad. El trazado por pasillos utiliza los planos canónicos compatibles; los pisos nuevos se conservan en el visor genérico y necesitan su propia red de recorridos. No se sustituyen datos reales por stands de demostración.

Referencia de los planos originales: [Mapa del recinto](docs/CAMPUS_MAP.md). Cambios actuales: [fase de mapa y límites](docs/MEJORAS-MOVIL-2026-10-28.md).

## Conexiones comerciales

La PWA envía un POST autenticado a `/stands/:standId/leads` con:

- `contact_name`, `contact_email`.
- `contact_phone` y `notes` opcionales.
- `consent_given: true`, únicamente tras la autorización explícita del visitante.

Evita envíos simultáneos y confirma solo cuando el servidor devuelve un ID. El acuse se conserva durante la sesión de la página; los datos de contacto no se persisten en el almacenamiento del navegador. En local/demo no se envían contactos.

La API existente permite consultar los contactos con permisos de empresa mediante `GET /companies/:companyId/leads`. **La nueva pantalla de consulta en el dashboard no forma parte de estos cambios y sigue pendiente.** El puente de visitantes permite crear contactos, pero no consultar ni eliminar listas de contactos de empresas.

La activación de los módulos comerciales requiere un contrato de autorización/plan desde el servidor. No existe un desbloqueo de pago simulado en el cliente.

## Audio y vibración

| Uso | Archivo |
| --- | --- |
| Avisos | `sonido-05.mp3` |
| Lectura NFC | `sonido-07.mp3` |

Se mantiene una reproducción a la vez, con prioridad de lectura NFC; los avisos esperan a cerrar el comprobante. El navegador necesita una interacción previa para habilitar el audio. Perfil permite activar/desactivar sonidos y vibración.

Cada efecto solicita un pulso de 80 ms cuando el dispositivo lo admite. Las preferencias anteriores se migran conservando sonidos y vibración y eliminando la opción de voz. Los archivos de voz ya no se reproducen ni se precachean; los dos efectos continúan disponibles offline.

## NFC y dispositivos

Web NFC necesita Chrome Android compatible, hardware NFC encendido, HTTPS, permiso explícito y pantalla visible/desbloqueada. La presencia de `NDEFReader` no garantiza que el dispositivo tenga hardware NFC. Las etiquetas deben admitir NDEF.

Para producción se recomienda un único registro de **texto UTF-8**:

```json
{"v":1,"eventId":"UUID_REAL_DEL_EVENTO","standId":"UUID_REAL_DEL_STAND"}
```

Reemplazar los valores por los UUID reales y registrar previamente el UID físico de la etiqueta en el backend, asociado a ese stand. El texto identifica el destino; no acredita por sí mismo una visita. El servidor valida el UID. No guardar datos personales, tokens o secretos en la tarjeta; UID y texto estáticos no son protección criptográfica contra clonación.

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

Para usar un Chromium existente, configurar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Las pruebas live interceptan la API y simulan NDEF y vibración: verifican contratos e interacciones, no hardware ni una cuenta Google real.

Última verificación del 28/10/2026:

- **46 pruebas unitarias aprobadas** en 11 archivos.
- **22 pruebas de navegador aprobadas**, incluidos Google simulado, NFC online/offline, contactos, fallos y ausencia de desbordamiento a 320/390/1440 px en claro/oscuro.
- Dos regresiones finales de NFC repetido y mapa publicado aprobadas: tres eventos NFC consecutivos generan una sola solicitud.
- Tipos y compilación live aprobados. Revisión visual móvil/escritorio y recorridos exterior/interior completados.
- Sin escrituras de negocio en producción; sin add, commit ni despliegue durante esta actualización.

Capturas: [Inicio](docs/qa/2026-10-28/light-home.png) · [Recinto 3D](docs/qa/2026-10-28/dark-map-3d.png). Registro completo: [Mejoras móviles](docs/MEJORAS-MOVIL-2026-10-28.md).

## Despliegue

En Vercel: React/Vite, build `npm run build:live`, output `dist` y las variables del entorno correspondiente. `api/backend.ts` y `api/session/[action].ts` usan el puente Node del mismo origen; la reescritura SPA excluye `/api/`. Vite monta el mismo puente en desarrollo y preview.

El puente limita rutas y métodos y evita caché de API. El service worker precachea recursos estáticos y excluye `/api/` del fallback. No desplegar únicamente `dist` en un alojamiento estático sin implementar también el puente.

Guía: [Vercel](docs/DEPLOY_VERCEL.md). Informes anteriores: [integración](docs/INTEGRATION_QA.md), [E2E/CI](docs/PWA_E2E_CI.md) y [modo local](docs/LOCAL_MODE_QA.md).
