# Ajustes de descubrimiento y mapa — 28/10/2026

Segunda iteración tras revisar las capturas móviles de Omar. Referencias visuales: Devconnect App, capturas aportadas por el usuario. Se conserva Poppins y la identidad azul/lima/marfil de fexpo. Trabajo local, sin add, commit, push ni despliegue.

## Mapa

- Inicio en **2D por defecto** en el recinto y en los pisos publicados. 3D continúa disponible por elección del visitante.
- El enlace Ubicación del perfil solicita 2D y centra/amplía el lote del expositor. No abre automáticamente una ficha ni un selector de origen.
- Al tocar un espacio se abre una ficha inferior modal anclada al borde de la app, por encima de su navegación. Incluye nombre, código, rubro/imagen y Ver perfil; Cómo llegar está disponible cuando existe destino conocido.
- Se retiraron la barra “Toca un espacio…” y el lector “Ubicarme con NFC”. Check-in mantiene la lectura y una visita NFC confirmada actualiza el último punto conocido sin guardar UID en la ubicación.
- Cómo llegar abre un diálogo independiente para elegir ingreso o última visita NFC confirmada. Solo después de solicitarlo se dibuja el recorrido. No hay un bloque permanente de nombre, origen y perfil por encima del mapa.
- El GPS relativo se conserva como opción explícita desde Mi ubicación: pide confirmar el punto inicial en un diálogo. No estima una posición absoluta y solo muestra su indicador al activarse.
- El 3D general elimina las etiquetas rasterizadas sobre los techos. Bloques y T1/T2/T3/T4 usan texto HTML proyectado, que permanece nítido al rotar. Los números interiores conservan el atlas, con resolución adaptada y filtrado anisotrópico.
- Iconos de servicios se apoyan en las etiquetas reales del plano, sin inferir accesibilidad o instalaciones no publicadas.

La distribución general respeta el orden relativo de bloques y plazas de la foto IMG_20261026_174114.jpg. **Es un esquema, no una réplica arquitectónica a escala ni un plano georreferenciado.** Las geometrías interiores originales y las publicadas por el servidor se mantienen. El trazado de pasillos requiere los planos canónicos compatibles; los pisos nuevos siguen necesitando su red de recorridos.

## Intereses y ofertas

- Se pregunta por intereses al primer acceso autenticado en Inicio o Perfil; puede omitirse para ver todas las categorías. Se puede editar desde el botón Intereses de Inicio.
- Preferencias locales separadas por modo, evento y cuenta, en fexpo-interests-v1. No se añadieron campos ni escrituras al backend. Otra cuenta no hereda los intereses de la anterior.
- Debajo de destacados aparece una fila horizontal de ofertas filtradas por intereses.
- En live se utiliza exclusivamente la promoción publicada de cada stand (promotionHighlight → promotion). No se inventan descuentos cuando faltan datos. En demo/local se identifica el contenido como ejemplo.
- La flecha abre un explorador modal: deslizar a izquierda/derecha, usar flechas del teclado o los botones cambia la oferta. Tocar una oferta abre el perfil del stand.
- Los módulos comerciales personalizados del perfil continúan bloqueados; mostrar un resumen promocional público no habilita los servicios de pago.
- El banner añade FIPAZ 2026 dentro de la imagen y conserva el rótulo inferior.

## Insignias

Misiones incorpora una fila horizontal de insignias de recorrido. Su progreso se calcula a partir de visitas únicas confirmadas, con reglas generales o por rubro. Las lecturas pendientes y duplicadas no cuentan como visitas nuevas.

Las insignias son indicadores visuales del recorrido de fexpo; no generan puntos adicionales, premios, certificados ni activos en otro sistema. Las misiones y el ranking existentes se conservan.

## Tema y área del sistema

Se sincronizan tema de la app, color-scheme, fondo raíz y theme-color desde la primera carga. La ficha inferior contempla las áreas seguras.

La ficha puede cubrir la navegación de fexpo, pero **no sustituir ni bloquear los controles nativos de Android**. El aspecto final de la barra de tres botones o gestos depende de Chrome, Android y su fabricante. Las comprobaciones de escritorio verifican las señales de tema; el resultado nativo debe comprobarse físicamente.

Referencia técnica: [Chrome edge-to-edge](https://developer.chrome.com/docs/css-ui/edge-to-edge).

## Verificación

- 52 pruebas unitarias aprobadas, incluidas ofertas sin datos inventados, filtros por intereses, separación de claves y progreso de insignias sin pendientes/duplicados.
- 25 pruebas live de navegador aprobadas con API simulada, incluidos primer acceso, persistencia, gesto de ofertas y apertura del perfil.
- Prueba específica del mapa: 2D inicial, lote centrado con error menor a 1 px, ficha al borde inferior, recorridos exterior/interior, sin excepciones JavaScript.
- Revisión visual clara/oscura a 390 px y comprobaciones de desbordamiento a 320/390/1440 px. Capturas: qa/2026-10-28-v2/.
- Demo: 15 pruebas aprobadas. Local: 18 casos comprobados; 15 pasaron en la ejecución completa y los tres restantes se repitieron y aprobaron tras corregir las expectativas de liberación NFC, el texto NDEF y la conservación del aviso de fallback WebGL.
- Tipos y compilaciones local/demo aprobados; compilación final restaurada al modo live. Se conserva la advertencia de tamaño del módulo Three.js, cargado de manera diferida.
- La segunda revisión visual corrigió contraste del año e insignias y separó la leyenda del selector 2D/3D. El barrido final no registró errores de página ni desbordamientos.

Las pruebas usan servidores aislados y los cierran al terminar. No se dejan procesos en el puerto 5174 del usuario.
