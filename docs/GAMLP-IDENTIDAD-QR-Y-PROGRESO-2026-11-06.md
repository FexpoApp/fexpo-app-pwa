# Ciudad Productiva: interfaz, lector QR y progreso

**Actualización posterior:** la PWA ya conecta lecturas, guardado, edición y progreso al contrato de Erick. Hay seis QR en Word; la API aún publica cinco puntos. Consultar [integración vigente](INTEGRACION-GAMLP-API-Y-QR-2026-11-06.md) y [correcciones extras](CORRECCIONES-EXTRAS-2026-11-06.md). Las referencias siguientes a formularios sin envío son históricas.

Trabajo local del 06/11/2026. Esta adecuación corresponde a la Secretaría Municipal de Ciudad Productiva en **Imagina Tu Ciudad, Parque Urbano Central**, no al sector P14-A/B de FIPAZ. FIPAZ conserva su aplicación y su integración existente.

**Actualización posterior:** FIPAZ ya no aparece en el selector. Google y lectura del QR del punto son obligatorios para calificar. El domo es la sexta experiencia y el progreso se mide sobre seis puntos. Solo se generó el QR corto de prueba de Mercados, aprobado por Omar. La entrega técnica vigente, incluida la actualización automática de la PWA, está en [QR, domo y actualización automática](ENTREGA-GAMLP-QR-DOMO-AUTOUPDATE-2026-11-06.md). Las referencias a cinco puntos y al paquete de seis hojas de este registro son históricas.

## Implementado

- Selector `/`: marca FEXPO y tarjetas verticales. Dentro de `/ferias/gamlp-puc-2026`, cabecera institucional centrada, sin los iconos superiores de instalación/perfil ni la marca FEXPO. `Cambiar feria` e instalación están discretamente en Perfil.
- Inicio: banner institucional con ambos logos, fotografía conceptual del domo, franja inferior como el banner de FIPAZ y accesos ilustrados Mapa/Recorrido/Escanear. Descubrimiento horizontal de mercados, desarrollo económico y CITEs.
- Recorrido: cinco paradas con imagen, descripción y posición. Las fichas amplían la explicación, ubican el punto en el mapa y enlazan a su formulario.
- Logos reconstruidos desde los JPEG aportados, con alfa transparente; originales intactos. Banner y tres escenas conceptuales generados con imagegen. Imágenes de entrega WebP sin cambiar su composición; los PNG originales se conservan en `FERIAS/GAMLP/assets-ciudad-productiva/` del proyecto documental.
- Lector de cámara: `BarcodeDetector` cuando está disponible y respaldo `jsQR` importado bajo demanda. No depende del lector nativo para funcionar. También procesa una imagen del QR, permite reintentar y conserva el acceso manual.
- Cámara: sin audio; resolución de procesamiento limitada a 960 px, un fotograma cada 250 ms. Libera las pistas al navegar, ocultar la página y detener; una apertura que termina después de salir también libera el dispositivo. Una imagen subida se procesa localmente, no se envía al servidor.
- Perfil: progreso de cinco QR escaneados en este dispositivo, línea por parada, deduplicación y persistencia entre recargas. Calificaciones confirmadas permanecen en cero hasta integrar las respuestas reales del backend.

## Recorrido y rutas estables

Base: `/ferias/gamlp-puc-2026`. Explorar no requiere cuenta; enviar una opinión requiere Google.

| Orden | Slug | Experiencia | Ubicación |
| --- | --- | --- | --- |
| 1 | `mercados` | Dirección de Administración de Actividades Económicas con la Unidad de Mercados | Carpa inferior derecha, ingreso |
| 2 | `tunel-mercados` | Pantallas de los nuevos mercados | Pasaje derecho |
| 3 | `desarrollo-economico` | Dirección de Desarrollo Económico, Competitividad e Inversiones | Dos carpas superiores, una experiencia |
| 4 | `tunel-cites` | CITEs | Pasaje izquierdo |
| 5 | `publicidad` | Unidad Publicidad | Carpa inferior izquierda, salida |

El domo permanece en el centro y no genera una sexta calificación. El plano 2D/3D conserva seis polígonos y cinco destinos, según el croquis aprobado.

- Ficha: `<base>/experiencias/<slug>`.
- Formulario: `<base>/calificar/<slug>`.
- QR general de ingreso: `https://app.fexpo.lat/ferias/gamlp-puc-2026`.
- Cinco QR de opinión: `https://app.fexpo.lat/ferias/gamlp-puc-2026/calificar/<slug>?via=qr`. `pucPrintedQrUrl()` produce los seis destinos y rechaza slugs desconocidos. Imprimir después de publicar y probar las rutas.
- El lector admite únicamente los seis destinos del origen actual o del dominio canónico `https://app.fexpo.lat`. No abre enlaces de otros eventos o dominios.

## Qué significa el progreso

`src/features/events/progress.ts` guarda `fexpo-puc-scans-v1` en `localStorage`. Contiene únicamente slugs válidos y deduplicados, sin nombres, correos ni comentarios. Es historial **del dispositivo**, compartido por quienes usen ese navegador; no se presenta como historial sincronizado de una cuenta.

Se marca al decodificar un QR válido con cámara/imagen, o al abrir un formulario atribuido con `?via=qr` desde un lector externo. Pegar un enlace sin esa atribución, abrir una ficha o visitar el mapa no suma escaneos. `via=qr` puede escribirse manualmente: no acredita presencia física ni es una medida antifraude.

Los borradores usan `sessionStorage`, separados por feria, punto y cuenta. Elegir estrellas, guardar un borrador o abrir una confirmación visual de ejemplo **no completa una calificación**. La interfaz aún no invoca un endpoint de opiniones ni informa un envío exitoso real.

## Siguiente trabajo de backend y base de datos

- [ ] Publicar evento GAMLP y cinco experiencias con UUID reales; resolver los slugs de las rutas sin reutilizar el UUID de FIPAZ.
- [ ] Conectar la identidad Google ya existente. El servidor determina el usuario autenticado; la cuenta local/demo no autoriza opiniones reales.
- [ ] Persistir una opinión propia por `(eventId, experienceId, userId)`, estrellas enteras de 1 a 5 y comentario opcional de hasta 1.000 caracteres, con creación/edición e idempotencia.
- [ ] Acordar el contrato HTTP antes de cablear `Rating.tsx`; validar el ámbito del evento y devolver la opinión persistida y sus fechas. Aumentar el progreso únicamente después de esa respuesta.
- [ ] Publicar lectura de opiniones/progreso de la cuenta por evento, restaurar estrellas/comentario y permitir editar su propia opinión.
- [ ] Sustituir el cero de confirmadas del Perfil por datos del servidor; indicar por parada si falta leer/evaluar o si ya se guardó la opinión. Mantener separado el historial local de QR.
- [ ] Calcular participantes únicos, opiniones por punto, distribuciones de estrellas y recorridos completos desde opiniones persistidas, nunca desde `localStorage`, `via=qr`, visitas de página o borradores.
- [ ] Definir si se necesitan escaneos oficiales como métrica adicional. Un enlace estático copiable no prueba presencia. Requiere su contrato, deduplicación y reglas de medición propios.
- [ ] Probar Google real, dos cuentas/dispositivos, red intermitente, errores/reintentos y los seis enlaces públicos en Android/iOS y PWA instalada antes de imprimir.

## Fuentes y revisión

- Nombres, orden y posiciones: croquis y explicación de Omar del 06/11/2026.
- Identidad: `logo_secretaria.jpeg` y `logo_la_paz.jpeg`, aportados por Omar. Las escenas son ilustraciones conceptuales, no fotografías del montaje real.
- Fechas/lugar: [publicación oficial municipal del 05/11/2026](https://lapaz.bo/imagina-tu-ciudad-la-paz-vivira-una-expoexperiencia-inedita-para-conocer-seis-meses-de-gestion-municipal/).
- Decodificación: [documentación oficial de jsQR](https://github.com/cozmo/jsQR). Las imágenes de cámara/foto se procesan en el navegador.
- Verificación: 88 pruebas unitarias, suite local completa de 30 casos, revisión local final de ocho recorridos GAMLP, suite conectada completa de 39 y siete recorridos GAMLP en modo demo aprobados. Revisión visual de 19 pantallas/estados a 320/390/768/1440 px, claro/oscuro, sin errores JS, imágenes rotas ni desbordamiento. La lectura física con teléfonos reales sigue pendiente; los ensayos automatizados alimentan vídeo con píxeles de un QR auténtico.
