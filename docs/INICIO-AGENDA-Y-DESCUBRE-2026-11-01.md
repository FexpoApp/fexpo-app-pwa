# Inicio, agenda y propuesta Descubre

**Registro de la primera iteración, superado por la aprobación posterior de Descubre y QR. Estado actual: [Descubre, QR y mapa oficial](DESCUBRE-QR-Y-MAPA-OFICIAL-2026-11-01.md).**

Revisión del 1 de noviembre de 2026. Rama: `codex/inicio-anuncios-agenda-2026`.

## Alcance solicitado y entregado

El inicio mantiene las mejoras de octubre: identidad FEXPO, mapa 2D/3D, navegación, contactos, intereses, ofertas, favoritos y modos local/demo/live. El banner grande de FIPAZ se reemplaza por un acceso compacto centrado con el logotipo oficial y enlace a la misma ruta de feria. Los accesos Mapa, Stands y Check-in siguen inmediatamente disponibles. Un espacio de publicidad independiente ocupa el espacio comercial; los destacados y las ofertas conservan sus superficies.

La ficha de FIPAZ pasa a ser una agenda navegable: días del 28/10 al 08/11, selección inicial del día local de La Paz dentro de las fechas del evento, fechas compartibles y línea de tiempo. Se incluyen horarios generales y ubicación del patio de comidas. La consulta live reutiliza el endpoint de actividades existente y su paginación, sin tocar backend ni base de datos. El DTO de la PWA se amplía con los campos opcionales `eventId`, `standId` y `locationText` ya presentes en el contrato actual del backend.

Misiones, Premios y Perfil mantienen su navegación actual. No se crean ni asignan issues ni se despliega esta rama antes de la revisión solicitada.

## Investigación y contenido verificable

- [Sitio oficial de FIPAZ](https://www.fipaz.com.bo/): confirma la edición del 28 de octubre al 8 de noviembre de 2026 y enlaza sus redes.
- [Folleto y plano oficial de la edición 2026](https://www.fipaz.com.bo/docs/FIPAZ%202026%20-%20DEL%2028%20DE%20OCT%20AL%208%20DE%20NOV%20-%20CFCM%20-%20LA%20PAZ%20-%20BOLIVIA.pdf): página 2, horario de visitantes de lunes a viernes 16:00–22:00 y fines de semana/feriados 11:00–23:00. Página 3, patio de comidas entre los bloques Amarillo y Verde. Describe actividades musicales, familiares, empresariales y culturales, sin una cartelera diaria con artistas y horas.
- Logotipo incorporado desde [el archivo del sitio oficial](https://www.fipaz.com.bo/auspi25/Logo_nuevo26.png), sin redibujarlo ni generar una marca sustituta.
- Se intentó revisar los perfiles enlazados por el portal: [Facebook](https://www.facebook.com/feriafipaz/), [Facebook alternativo](https://www.facebook.com/fipazferia/), [Instagram](https://www.instagram.com/fipazbolivia/) y TikTok. Sus publicaciones diarias no resultaron accesibles/verificables desde las herramientas de consulta. No se obtuvo una cartelera diaria fiable a partir de ellos.

No se corroboraron el beneficio infantil del 31/10, artistas ni horas de conciertos. La mención de Omar se conserva como referencia para investigar, no como anuncio oficial. El material encontrado de otras ediciones no se reutiliza como programación 2026. Tampoco se presentan estimaciones promocionales de asistencia como cifras reales.

Por eso la vista local/demo utiliza actividades ficticias genéricas con avisos «Ejemplo». En live solo aparecen actividades `scheduled` o `completed` devueltas por la API pública. Una agenda vacía o caída muestra su estado real y un enlace al canal oficial, sin inventar contenido. No se promete actualización en tiempo real: se consulta al abrir la pantalla o reintentar.

## Propuesta para la pestaña Misiones

La siguiente priorización es una hipótesis de producto basada en las tareas del visitante y el contenido oficial disponible; no proviene de una encuesta de usuarios. Antes de ir, una persona necesita saber qué sucede, cuándo y dónde; dentro del recinto necesita ubicar un stand, comer, encontrar servicios y aprovechar actividades u ofertas relevantes. Las misiones son un incentivo secundario para ese recorrido.

### Opción A: Descubre — recomendada

Navegación: Inicio · Mapa · Check-in · **Descubre** · Perfil.

Orden de la pantalla:

1. **¿Qué te gustaría hacer?** Accesos claros a Comer, Qué hay hoy, Ofertas y Servicios.
2. **Patio de comidas.** Restaurantes con nombre, tipo de comida y acceso al menú. Filtros sencillos por comida, bebida/postre y precio únicamente si esos datos están publicados. No afirmar «abierto ahora» sin horarios mantenidos.
3. **Qué hay hoy.** Próximas actividades publicadas, con hora y ubicación. Abre el día correspondiente de la agenda existente, sin crear otra cartelera diferente.
4. **Ofertas para explorar.** Reutiliza promociones publicadas; los anuncios pagados deben identificarse y respetar su vigencia.
5. **Servicios del recinto.** Accesos a comida, baños, ingresos y otros puntos realmente presentes en el mapa. No inventar servicios ni rutas de accesibilidad.

En el menú de un restaurante: platos, precios en Bs con fecha de actualización, disponibilidad, ubicación y botón Ver en mapa. No incluir pedidos, cobros, alergias o garantías alimentarias sin acordar y verificar ese alcance.

En Perfil: puntos y nivel, misiones/insignias, premios/canjes, Mi QR, favoritos e historial de visitas. Los enlaces actuales `/missions` y `/rewards` deben seguir funcionando aunque dejen de ser pestañas principales.

La ventaja es reunir necesidades prácticas sin convertir la pestaña en un listado exclusivo de comida. El principal requisito es que existan menús y contenidos mantenidos: una pestaña llena de secciones vacías no sería útil.

### Opción B: Comer

Una pestaña enfocada solo en restaurantes, menús, precios, bebidas y ubicación. Es la alternativa más directa si podemos obtener menús verificables de suficientes locales. La agenda permanece en el logo de FIPAZ. Tiene menor alcance fuera de las horas de comida y deja otras experiencias repartidas.

### Opción C: Hoy

Agenda del día como contenido principal; debajo, comida, actividades y ofertas cercanas a ese plan. Puede ser atractiva con cartelera actualizada, pero depende más de que la organización publique horarios y cambios. Además, debe compartir la misma fuente de datos que la agenda del logo para evitar contradicciones.

## Conexión futura y asignación de trabajo

El README contiene la lista de implementación y pendientes por área. Después de que Omar apruebe la navegación, preparar issues acotadas por contrato: campañas y creativos; publicación y cambios de cartelera; restaurantes y menús; agregación de contenido en Descubre; migración de accesos de premios/misiones a Perfil y QA. Verificar primero lo que ya existe en backend/BD y coordinar con sus responsables; no duplicar tablas ni endpoints por inferencia.

No debe interpretarse esta propuesta como autorización para activar juegos, simular pagos, registrar impresiones ficticias ni aplicar migraciones. La publicidad de ejemplo enlaza stands ficticios y está separada de las campañas reales.

## Verificación

- Tipos y compilaciones demo/live aprobados. Compilación final restaurada con la configuración live habitual; no se modificó `.env.local`.
- 60 pruebas unitarias en 13 archivos, 16 pruebas demo y 27 pruebas live de navegador aprobadas. Las pruebas live interceptan API y Google; no prueban una cuenta real, hardware NFC ni escrituras de producción.
- Inicio y agenda comprobados a 320, 390 y 1440 px en claro y oscuro: navegación del carrusel y del calendario, recarga con fecha compartida, imágenes, errores JavaScript y desbordamiento horizontal sin fallos.
- Evidencias locales: `../../../output/pwa-inicio-agenda-2026-11-01/review/results.json` y capturas en esa misma carpeta. Se revisaron las vistas móviles y de escritorio antes de cerrar la entrega.
- Vista local de revisión en modo demo: `http://127.0.0.1:5187/`; agenda: `/events/event-fipaz-2026?day=2026-11-01`. Requiere que el servidor de desarrollo siga abierto; no es un despliegue.
- Rama sin commit ni push, sin cambios a issues, backend o esquema de base de datos.
