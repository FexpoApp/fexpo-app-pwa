# Correcciones extras para backend y base de datos de GAMLP

Revisión del 6 de noviembre de 2026. La API responde y reporta la base de datos activa. El catálogo publicado contiene las cinco paradas exteriores. La PWA se conecta a ese contrato; faltan los cambios siguientes para completar el alcance de seis experiencias y exigir el QR también en el servidor.

## Publicar el domo como sexta experiencia

Responsables: backend y base de datos. Prioridad alta.

La semilla `20261106120100_seed_gamlp_puc_2026.sql` excluye expresamente el domo. El CHECK de `event_experiences.kind` y `EXPERIENCE_KINDS` solo admiten carpa y tunel. El endpoint público confirma cinco registros.

Crear una migración nueva, sin modificar las ya aplicadas: admitir `domo`, sembrar de forma idempotente el punto `domo`, orden 6, nombre Domo de Ciudad Productiva y ubicación central sin inventar un lote rectangular. Actualizar DTO, Swagger y pruebas. Conservar el evento y los cinco UUID actuales. El catálogo y el progreso deben devolver seis puntos; las métricas deben contar el recorrido completo sobre seis opiniones.

Aceptación: el mismo QR de domo ya emitido resuelve a un UUID real y permite guardar, editar y recuperar su opinión. La PWA obtiene los UUID por slug; no requiere reimprimir ni inventar identificadores. Hasta publicar esa migración, la PWA informa que su calificación no está disponible.

## Exigir lectura de QR al guardar

Responsables: backend y base de datos. Prioridad alta.

Actualmente POST scans acepta source y requestKey. PUT my-rating escribe la opinión sin consultar una lectura previa; no recibe ni valida un QR emitido ni un comprobante. JWT válido por sí solo permite llamar ambas rutas. La barrera visual de la PWA no resuelve esa condición del servidor.

Validar un identificador de QR activo del mismo evento y punto al registrar la lectura. Emitir un comprobante ligado a usuario, evento, punto y caducidad, y exigirlo al guardar. Sin lectura válida responder 403 QR_SCAN_REQUIRED. Conservar idempotencia, autor desde token y aislamiento entre eventos. El identificador público impreso no es una credencial de usuario ni demuestra presencia física; un QR estático puede compartirse.

El contrato entregado por Erick rechaza campos adicionales. La PWA envía solo los campos aceptados actualmente; agregar qrCode y scanReceipt requiere coordinar y versionar ambos lados. Los seis códigos públicos y sus destinos estables están en QR-WORD-2026-11-06/enlaces.json y en docs/data/gamlp-issued-qr-2026-11-06.json de la PWA.

Aceptación: rechazar opinión sin lectura, comprobante de otra cuenta o punto, código revocado y comprobante vencido. Reintentar o editar no duplica personas ni opiniones.

## Verificar Google en las rutas privadas

Responsable: backend. Prioridad alta.

GET auth/me publica authProvider, pero ExperiencesController aplica JwtAuthGuard; no comprueba que el proveedor sea Google. Incorporar esa verificación para lecturas, progreso propio y calificación, con una respuesta coherente para otras cuentas. La PWA conserva authProvider al restaurar sesión y solo habilita este flujo para Google; el servidor debe aplicar la misma regla.

Aceptación: Google válido permitido y otra sesión rechazada aunque tenga JWT válido. El cambio no debe impedir las funciones históricas de FIPAZ que usen otros mecanismos de acceso.

## Verificación del despliegue

La revisión pública comprobó health 200 con database up y catálogo por slug 200. Progreso, lecturas, calificación y métricas sin token devuelven 401. No se crearon usuarios ni opiniones de prueba en producción.

Antes de este cambio, el proxy publicado de la PWA devolvía 404 para resolve. La corrección forma parte de la PWA: lista cerrada de rutas y métodos GET para catálogo/progreso, POST para lecturas y PUT para opinión propia. Las métricas de organizador no se exponen desde el proxy de visitantes.

Después del despliegue comprobar con una cuenta Google real: QR impreso, acceso sin perder el punto, lectura registrada, opinión guardada, edición, reintento ante pérdida de red y progreso al recargar o cambiar de dispositivo. Contrastar los conteos con la base de datos. La revisión sin credenciales no certifica ese circuito autenticado en producción.

## Cambios recibidos

Backend: commit remoto f00890f, integrado localmente preservando el historial previo. Base de datos: d971250, actualizado por fast forward. Se revisaron las migraciones, sin aplicarlas a otra base de datos. Las 34 pruebas focalizadas de experiencias, eventos y autenticación aprobaron con Node 24 del entorno de trabajo; el backend declara Node 22.20 o superior dentro de la rama 22 para despliegue.

Fuentes: código de fexpo-backend/src/experiences, fexpo_database/migrations y respuestas públicas de https://api.fexpo.lat/api/v1. Evidencia de la revisión en output/gamlp-puc-2026-11-06/api-review.json del proyecto documental.
