# Mejoras móviles por fases — 28/10/2026

> Registro de la primera iteración. La interfaz vigente (2D por defecto, ficha inferior, NFC en Check-in y GPS relativo bajo solicitud) se describe en [Descubrimiento y mapa](MEJORAS-DESCUBRIMIENTO-2026-10-28.md).


Trabajo local solicitado por Omar, sin git add, commit ni despliegue. Identidad: IDENTIDAD-FEXPO; fotografías del recinto: FERIAS/FIPAZ. Se conservan Google, las misiones, los sonidos de avisos/lectura y la geometría interior publicada.

## Fases implementadas

1. **Identidad, audio e inicio:** símbolo oficial, Poppins y paleta azul/lima/marfil en temas claro y oscuro; iconos PWA renovados. Voz retirada de interfaz y reproducción, con migración de preferencias. Solo Mapa, Stands y Check-in en inicio, banner compacto y destacados horizontales. Las misiones y recompensas siguen accesibles desde sus pantallas.
2. **Catálogo y perfiles:** filas horizontales por rubro; flecha a categoría completa y buscador por empresa/número. Perfil compacto con imagen a la derecha, guardar, compartir y ubicación. Ofertas → Dinámicas → Catálogo permanecen bloqueados; sus muestras están identificadas y no entregan descuentos, premios ni puntos.
3. **Conexión comercial:** modal con nombre, correo, celular internacional opcional, nota y autorización explícita. POST autenticado al endpoint existente /stands/:id/leads; estado confirmado solo con ID de respuesta. Evita doble envío simultáneo y no persiste los datos de contacto en almacenamiento del navegador. En local/demo explica que no envía. El acuse dura la sesión de la página, no sustituye a una consulta de contactos ya enviados en el backend.
4. **Mapa:** vista general 2D/3D con bloques rojo, amarillo y verde, torres y plazas Akapana/Kalasasaya, según IMG_20261026_174114.jpg. Chips horizontales de colores y plantas Baja/Alta. Búsqueda y selección del inicio; recorrido exterior esquemático y recorrido interior ortogonal por pasillos, evitando puestos y baños/mesas. Se conservan los planos originales y el visor 3D. La geometría del servidor tiene prioridad y el visor genérico conserva los pisos nuevos sin sustituirlos por stands ficticios.
5. **NFC:** un lector activo y un resultado por sesión. Los eventos repetidos se absorben durante una breve ventana para retirar la tarjeta. Se libera al ocultar/salir de la pantalla. La visita sigue requiriendo UID y confirmación del servidor. Se valida evento y versión de los registros JSON, además de conservar etiquetas antiguas compatibles.
6. **Perfil y verificación:** disposición compacta, avatar real de Google cuando se publica, iniciales de respaldo. Google, preferencias, QR y sesión continúan funcionando. Las pruebas usan API simulada, sin escrituras en producción.

## Límites concretos

- **Ubicación y rutas:** la foto no tiene coordenadas topográficas. El plano general es un esquema, no una reconstrucción a escala. El usuario elige un ingreso o usa la última lectura NFC; no se dibuja un avatar inicial como si fuera su posición real. El GPS existente sigue siendo relativo y experimental. No se promete navegación exacta, accesible o de evacuación. El trazado por pasillos se habilita en los planos canónicos compatibles; los planos nuevos del servidor se muestran con su geometría y requieren su propia red de recorridos.
- **Datos de expositores:** la API pública actual no entrega logos ni redes sociales. Se muestra una ilustración de categoría en su lugar. El componente admite imágenes y enlaces cuando existan datos publicados; no se inventan cuentas o sitios de empresas.
- **Panel de empresa:** el contacto queda registrado por el endpoint existente. La lectura autorizada es GET /companies/:companyId/leads. Esta tarea modifica la PWA y su puente, no implementa una nueva pantalla en el repositorio del dashboard.
- **Módulos comerciales:** las pestañas están bloqueadas de manera uniforme. La activación de servicios de pago necesita una autorización/plan de empresa desde el servidor; no existe un interruptor de pago simulado en el cliente.
- **NFC físico:** pruebas automatizadas con lector simulado; falta la prueba con Android y una tarjeta real. Una PWA no ofrece una API para impedir todos los diálogos del sistema. La ventana posterior a la lectura reduce la devolución inmediata a Android, pero no garantiza suprimir avisos de todos los fabricantes.
- **Vista general:** muestra el orden de bloques de la foto y permite acceder a los pisos publicados. El bloque verde tiene un solo plano disponible en la geometría actual.

## Etiqueta NFC de producción

Usar una etiqueta NDEF compatible. Para leer dentro de la app se propone un único registro de **texto UTF-8**, evitando un registro URL que invite al sistema a abrir otro enlace:

```json
{"v":1,"eventId":"UUID_REAL_DEL_EVENTO","standId":"UUID_REAL_DEL_STAND"}
```

Los valores se reemplazan por los UUID del catálogo real. Registrar previamente el UID físico en el backend y asociarlo a ese stand. No guardar datos personales, tokens de sesión ni secretos en la tarjeta. El JSON identifica el destino; no demuestra por sí solo una visita válida. La credencial sigue siendo el UID y la decisión corresponde al servidor; UID/texto estáticos no son protección criptográfica contra clonación.

El QR impreso puede abrir el perfil o el enlace de la feria/stand. Abrir ese enlace nunca acredita puntos por sí mismo. Tras comprobar el UID, contenido y asociación, puede protegerse la escritura de la etiqueta.

Requisitos: Chrome Android compatible, hardware NFC y NFC activado, HTTPS, permiso explícito, pantalla desbloqueada y app en primer plano. Prueba física: un tap → un comprobante; mantener tarjeta unos segundos → sin segundo envío; retirar → nuevo intento; cambiar de cuenta/pantalla → sin lector previo; otra feria/UID no registrado → rechazo; sin red → pendiente y sincronización sin puntos ficticios.

## URL (sin cambios, por solicitud)

Es posible mantener la navegación en memoria para conservar la raíz en la barra del navegador. Requiere rediseñar persistencia, enlaces NFC/QR, compartir, recargar y botón Atrás; no es un mecanismo de seguridad. La PWA ya declara display: standalone: instalada abre sin la barra habitual del navegador. Se conservan todas las rutas actuales.

Fuentes técnicas consultadas:
- https://developer.chrome.com/docs/capabilities/nfc
- https://w3c-cg.github.io/web-nfc/
- https://www.w3.org/TR/appmanifest/#display-member
- https://reactrouter.com/api/declarative-routers/MemoryRouter

## Verificación

Registro final de comandos/resultados al cierre. Revisión visual en claro/oscuro, móvil y escritorio. Los artefactos de QA no se incorporan al bundle de la app.


### Resultados de cierre

- Tipos: aprobados con tsc (también dentro de la compilación).
- Vitest: **46 pruebas aprobadas**, 11 archivos. Incluye los seis destinos de ejemplo por pasillos, búsqueda combinada/códigos sin guion, consentimiento/rutas del puente y sesión NFC repetida/oculta.
- Playwright conectado: **22 pruebas aprobadas** con API aislada. Google, sesión, favoritos, QR, check-in online/offline, módulos bloqueados, contacto comercial, fallos de servidor y ausencia de desbordamiento a 320/390/1440 px en claro/oscuro.
- Regresión final: los dos flujos de mapa publicado y NFC repetido se volvieron a ejecutar: **2 aprobados**. Tres eventos NFC consecutivos generan una sola solicitud de check-in.
- QA de demostración: inicio, catálogo, perfil, general 2D/3D y planos interiores en claro/oscuro; recorridos desde Rojo a Amarillo e interior hasta B-117. La prueba espera el trazado renderizado. Se eliminó la ficha flotante durante el recorrido para no taparlo y se mantuvo Ver perfil en el resumen. Sin errores de página/desbordamiento en el barrido. Capturas en qa/2026-10-28/.
- Compilación live aprobada, sin despliegue. El visor Three.js sigue cargándose de manera diferida; conserva su advertencia de tamaño de chunk. Los pósteres web usan WebP (~350 kB); la imagen maestra queda fuera de public.
- Índice Git vacío: no se ejecutó add ni commit. No se modificaron identidad fuente, backend, dashboard ni datos de producción.

La búsqueda también acepta nombres con códigos sin guion (por ejemplo, Altura B17 para un stand B-17) y varios términos; no confunde B17 con B117.
