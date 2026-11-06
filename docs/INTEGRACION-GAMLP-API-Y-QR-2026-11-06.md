# GAMLP conectado a la API y QR para impresión

Entrega del 06/11/2026. Reemplaza el estado anterior de formularios sin envío. La cabecera conserva escudo y Secretaría a la izquierda y suma el logo de La Paz a la derecha. Solo GAMLP aparece en el selector.

## Integración realizada

- Resolución pública de evento/experiencias por slug. Los UUID vienen del backend, sin constantes inventadas ni reutilización del evento FIPAZ.
- Proxy cerrado: GET catálogo/progreso, POST lectura y PUT opinión propia. No habilita métricas de organizador ni rutas arbitrarias.
- Google obligatorio en la PWA. La restauración conserva authProvider desde auth/me. Una sesión de otro proveedor no abre lector ni formulario.
- QR obligatorio por cuenta y punto. Los seis enlaces emitidos y los códigos públicos se reconocen al volver de Google. Una ficha o via=qr sin lectura no habilita estrellas.
- Registro de lectura con source y requestKey. Preparación del formulario solo después de confirmar esa llamada y obtener la opinión propia.
- Guardado/edición reales mediante PUT, confirmación solo con rating devuelto. Estrellas/comentario conservados al fallar; requestKey estable en reintentos del mismo contenido y nuevo al modificarlo.
- Perfil y recorrido usan opiniones confirmadas de la cuenta. Borradores e historial del dispositivo no se convierten en progreso oficial. No se muestran ceros confirmados mientras falta la respuesta.
- Cambiar cuenta o cerrar sesión borra el estado privado en memoria y descarta respuestas tardías de la cuenta anterior.
- Catálogo revisado con caducidad de un minuto; progreso al recuperar conexión o volver al primer plano. Actualización automática del paquete PWA conserva ruta/borrador.

El contrato actual solo acepta source/requestKey en lecturas y stars/comment/requestKey en opiniones. No se envían qrCode, scanReceipt ni userId porque el backend los rechaza. La validación de QR y proveedor aún debe reforzarse en servidor: [correcciones extras](CORRECCIONES-EXTRAS-2026-11-06.md).

## Domo y alcance publicado

Se mantienen seis experiencias en la PWA y seis QR de opinión, incluido el domo central. La API publicada solo contiene las cinco paradas exteriores. La PWA muestra el domo y su ficha, pero informa que todavía no está disponible para calificar; no inventa un UUID ni registra una confirmación local.

El denominador del progreso confirmado procede de la API: hoy cinco. Al publicar el domo en el mismo evento, será seis. El mapa conserva seis polígonos y el círculo central; las carpas 3A/3B siguen siendo una sola opinión.

## Impresos

Documento Word carta: [seis páginas con marco institucional](entregables/QR-CIUDAD-PRODUCTIVA-CARTA.docx). Cada página contiene únicamente título de sección, QR y «Valora tu experiencia de 1 a 5 estrellas», además de los logos del marco. Sin instrucciones de Google, números de punto ni enlaces impresos.

Los seis enlaces cortos is.gd se verificaron con redirección 301 al destino exacto. El enlace original de Mercados se conserva. Los demás se emitieron al recibir la solicitud del Word. No se modificó is.gd/fexpo_app.

- [Enlaces emitidos y destinos estables](data/gamlp-issued-qr-2026-11-06.json).
- [Catálogo público observado](data/gamlp-api-catalog-2026-11-06.json).
- [Correcciones extras en Word](entregables/CORRECCIONES-EXTRAS-GAMLP-2026-11-06.docx).

El Word tiene seis páginas tamaño carta y los QR se decodificaron independientemente tras renderizarlo con Word. La impresión debe conservar tamaño real y márgenes blancos del código. La página del domo queda preparada para su publicación; no distribuirla como calificación operativa antes de la corrección de backend/BD.

## Revisión de los repositorios y API

Se descargaron referencias actuales de main. Backend remoto f00890f integrado en el historial local y base de datos d971250 actualizado por fast forward. No se aplicaron migraciones ni se publicaron cambios de esos repositorios.

API pública: health 200 con database up; resolve 200 con cinco experiencias; progreso, lecturas, opiniones y métricas sin token 401. Antes del cambio, el proxy público de la PWA devolvía 404 para resolve; se comprobará nuevamente después del despliegue de main.

Las pruebas de navegador usan Google/API simulados. No se crearon cuentas, lecturas ni opiniones de prueba en producción. La validación final con Google real y comparación de métricas con BD sigue siendo una comprobación operativa distinta de las pruebas automatizadas.

## Checklist del equipo

Verificación de la entrega: 99 pruebas unitarias de PWA, 43 de navegador conectado, 28 locales, 30 demo y dos escenarios de actualización automática. Además, 34 pruebas focalizadas del backend. Las pruebas de navegador simulan Google y respuestas de API; la comprobación pública de producción valida disponibilidad y rechazo sin sesión. Se revisaron las interfaces a 320, 390, 768 y 1440 px, el perfil oscuro y las ocho páginas renderizadas de los dos Word. Los seis QR del documento final se decodificaron contra sus destinos emitidos.

- [x] Conectar PWA al contrato entregado por Erick y conservar el circuito FIPAZ separado.
- [x] Lectura y opinión propia con idempotencia y manejo de errores.
- [x] Avance remoto por cuenta, recuperación al recargar y aislamiento de cuentas.
- [x] Logo de La Paz en las interfaces de GAMLP.
- [x] Seis enlaces cortos y Word minimalista por sección.
- [ ] Backend/BD: nueva migración para domo, tipo domo y sexto punto publicado.
- [ ] Backend/BD: validar QR emitido, comprobante y lectura previa al guardar.
- [ ] Backend: exigir Google en las rutas del circuito visitante.
- [ ] Organización: probar una cuenta Google real en Android/iOS/PWA instalada y cotejar lecturas/opiniones con las métricas.
