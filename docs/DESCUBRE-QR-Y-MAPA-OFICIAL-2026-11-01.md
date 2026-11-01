# Descubre, QR y comparación del plano oficial

Actualización local del 1 de noviembre de 2026. Rama `codex/inicio-anuncios-agenda-2026`. Sustituye la propuesta de navegación anterior tras la aprobación de Omar. Sin despliegue, cambios de issues ni escrituras de negocio en producción.

## Implementación

- [x] Navegación: Inicio, Mapa, Check-in, Descubre y Perfil. `/missions` y `/rewards` continúan como enlaces de Perfil; se conservan progreso, insignias y canjes existentes.
- [x] Descubre abre en Hoy. Comer ofrece búsqueda del catálogo gastronómico y detalle del menú; Ofertas reutiliza las promociones existentes; Servicios enlaza el plano oficial. Selección compartible en `?section=hoy|comer|ofertas|servicios`.
- [x] Menú de muestra únicamente en local/demo, identificado y no canjeable. En live, `PUBLISHED_MENUS` está vacío hasta disponer del contrato publicado; no se deducen platos o precios de promociones.
- [x] Check-in muestra el QR personal. La PWA solicita `GET /me/qr?eventId=…`; el visitante no se confirma su propia visita. Mientras se muestra el pase, consulta progreso cada 4 segundos y al recuperar el foco/conexión. Los puntos proceden del servidor.
- [x] `NFC_ENABLED = false`: no se ofrece lectura NFC, la antigua ruta `/nfc-test` redirige a Check-in y el código NFC queda conservado para futuras ferias. El modo local tampoco abre un lector desde el recorrido principal.
- [x] Carrusel horizontal de anuncios, una tarjeta cada 6 segundos y vuelta al inicio. Controles anterior/siguiente y pausa; se detiene al enfocar, interactuar, pasar el puntero, ocultar la pestaña o salir del área visible. El movimiento reducido desactiva el avance automático.
- [x] Logo de FIPAZ reducido a 80 x 27 px dentro de un acceso de al menos 44 px. Inicio, agenda y Descubre usan títulos pequeños y separación compacta; no hay una cabecera promocional grande en la agenda.
- [x] La última visita confirmada puede servir de origen orientativo del mapa; no equivale a localizar físicamente el teléfono.

## Publicaciones suministradas

Las capturas son material aportado por Omar, no un feed de Facebook conectado. Se conservan los afiches y se optimizan para web sin recrear artistas, marcas ni texto mediante IA. Procedencia y hashes de los originales: `../../../output/pwa-descubre-2026-11-01/assets.json`.

| Material                                                                                                           | Uso en la PWA                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cartelera verde «22 años», cierre 2023                                                                             | Excluida: corresponde a otra gestión; sus fechas, precios y artistas no pasan a 2026.                                                                            |
| Afiches dorados del 1 de noviembre: Mala Kumbala, Dulce Sentimiento, Lucy, Tatiana Vera, Inspira Dance y Los Pinos | Seis actividades fechadas, Escenario principal. Hora individual desconocida: «Horario no publicado». El horario de ingreso no se convierte en hora de concierto. |
| Pío Rico / Chichi Kim, lunes 2 de noviembre, 18:00                                                                 | Actividad fechada y con hora. No se inventa número de stand ni se la vincula a un expositor distinto.                                                            |
| Niños disfrazados, 31 de octubre                                                                                   | Promoción histórica de ese día; ingreso únicamente por patio del Bloque Verde. No se muestra como beneficio permanente.                                          |
| Noche Chaqueña, sábado 31 de octubre                                                                               | Actividad de ese día; no se inventa la hora de inicio del espectáculo.                                                                                           |

Los afiches de cartelera del 1 de noviembre indican ingreso de fines de semana/feriados **11:30–23:00**, adultos **35 Bs**, niños y adultos mayores **15 Bs**. El folleto indica visitantes de lunes a viernes **16:00–22:00** y fines de semana/feriados **11:00–23:00**. El afiche de Noche Chaqueña presenta otro horario para el 31. La interfaz identifica las fuentes y conserva las diferencias en el detalle «Horarios y entradas»; no presenta una hora única inventada para todos los días.

La agenda y Hoy comparten `useProgramme`. La API tiene prioridad ante un mismo título/día. Los ejemplos no rellenan un día con afiches reales. Si la API falla, se muestra el error y permanecen los afiches locales identificados por fecha/fuente, sin afirmar sincronización en tiempo real. Si la API devuelve una cancelación con el mismo título y fecha, se retira el afiche coincidente. La API pública actual puede omitir cancelaciones: hace falta acordar el contrato editorial para garantizar cambios, retiros y vigencia.

Se consultó [el sitio oficial](https://www.fipaz.com.bo/) y se intentó abrir [Facebook oficial](https://www.facebook.com/feriafipaz). No se pudo extraer una cartelera diaria verificable de Facebook. Las fechas y transcripciones anteriores se apoyan en los adjuntos suministrados, no en una supuesta lectura completa de sus redes.

## Plano oficial y mapa actual

Fuente local: `../../FERIAS/FIPAZ/FIPAZ_2026_BOLIVIA.pdf`, **página 3**, plano general. Se renderizaron las tres páginas; los horarios del folleto están en la página 2. Copia idéntica del PDF disponible en la PWA: `public/assets/events/fipaz-2026-oficial.pdf`; los accesos de Servicios abren la página 3. Ese PDF no está incluido en el precaché offline; requiere descarga/conexión. El mapa interactivo conserva su funcionamiento offline existente.

La comparación se hizo contra `src/data/map-plans.ts` y `src/features/campus/site.ts`, además del render 2D. Los siguientes son **espacios modelados**, no empresas inscritas ni ocupación validada:

| Plano oficial                            | Plano PWA                  | Coincidencias verificadas                                                                                                              | Espacios en código |
| ---------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -----------------: |
| Internacional I, Rojo, planta baja       | `red-lower`                | Nombre, planta, organización general y referencias 1–49, R1 y R2                                                                       |                 51 |
| Internacional II, Rojo, planta alta      | `red-upper`                | Nombre, planta y numeración 50–110                                                                                                     |                 61 |
| La Paz, Amarillo, planta baja            | `yellow-lower`             | Nombre, planta, distribución y A1–A6. En el impreso también se salta de 45 a 48; no añadir 46/47 por secuencia.                        |                 90 |
| Bolivia, Amarillo, planta alta           | `yellow-upper`             | Nombre, planta, distribución y referencias especiales P14, P14-A/P14-B, A8. Revisión puntual; falta cotejo métrico de todos los lotes. |                133 |
| Americano, Verde, planta alta            | `green-upper`              | Nombre, planta y referencias 1–101                                                                                                     |                101 |
| Ingreso principal, entre Rojo y Amarillo | `entrance` / Plaza Akapana | Escenario principal, Xtrem Park, anfitrión, 1–5 y E1/E2                                                                                |                  7 |
| Patio de comidas, entre Amarillo y Verde | `food-court`               | Posición entre bloques, disposición general y conjunto G-1 a G-29, incluido G-25                                                       |                 29 |

Total del modelo: **472 espacios**. No debe compararse directamente con las cifras promocionales de expositores: un espacio no identifica por sí mismo a una empresa y puede cambiar por fusiones o nueva publicación.

### Diferencias y límites

1. **Geometría aproximada.** El modelo porta una transcripción vectorial simplificada. Los `viewBox` y coordenadas internas no son metros, coordenadas GPS ni un levantamiento del edificio. Coincidencia de nombres y códigos no certifica proporciones, áreas o escala.
2. **Vista general.** `site.ts` organiza Rojo, Amarillo y Verde de forma esquemática y usa una fotografía anterior como fuente. «Plaza Kalasasaya», Parqueo y T1–T4 no quedan corroborados por este PDF como rótulos/lotes equivalentes; no se presentan como una nueva transcripción de la página 3.
3. **Patio de comidas.** La PWA conserva los 29 lotes, pero no representa todas las mesas centrales, flechas, segundo ingreso ni mobiliario del PDF. El plano no contiene un menú ni prueba quién ocupa cada lote. El nivel interno «Exterior» es una clasificación del renderer; no certifica que el patio sea descubierto.
4. **Ingreso y servicios.** La geometría simplifica escenario y juegos; faltan detalles como enfermería, boletería, domos, zona de basura y algunos rótulos del documento. Servicios remite al PDF donde no hay un punto interactivo validado.
5. **Recorridos.** Son orientativos por pasillos/accesos modelados; el PDF no valida accesibilidad, sentido de evacuación, trazado seguro ni posicionamiento interior. No se modificó la geometría en esta entrega.
6. **Publicación live.** La maqueta local solo se usa cuando los planos publicados coinciden en nombre, `outline` y `viewBox`. En otro caso, el visor usa la geometría de la API. La asignación real expositor/lote y las fusiones deben validarse con el backend y el plano operativo vigente.

### Trabajo pendiente a coordinar

- [ ] Organización: confirmar plano operativo vigente, lotes fusionados, ocupantes gastronómicos, accesos y servicios.
- [ ] PWA/mapa, issues #8 y #10: cotejo por lote y áreas; revisar escala/orientación, puntos de servicio y correspondencia 2D/3D. No modificar lotes solo para completar series numéricas.
- [ ] Backend/BD: relacionar restaurante, stand y lote G validado; publicar menú, ítems, precio en Bs, disponibilidad, fecha de actualización y permisos de edición. No hay pedidos ni pagos en este alcance.
- [ ] Editorial/backend: unificar actividades API, afiches, categoría, fecha sin hora, fuente, cancelaciones y retiros; evitar mantener dos carteleras divergentes.
- [ ] Publicidad/backend: feed de campañas, creativos, vigencias, destinos y orden; impresiones/clics con contrato y persistencia. El carrusel visual no supone que esos datos ya existen.
- [ ] Dashboard/backend, prioridad QR: `ScannerView` llama `scanVisitor` con `visitorQrData` y `occurredAt`; el cliente apunta a `POST /stands/scan-visitor`. El backend actual ofrece `POST /stands/:standId/manual-check-ins` con `userQrToken` y `requestKey`. Conciliar contrato, sesión/roles, alcance del stand, idempotencia, duplicados y actualización de progreso antes de declararlo operativo.
- [ ] QA físico: QR real leído por el personal en Android/iOS, permisos de cámara, red intermitente, duplicados diarios y cuenta/evento correctos. NFC queda fuera de la validación operativa de esta feria.

## Verificación de esta iteración

- Tipos y compilaciones demo/live aprobados; compilación final restaurada con la configuración live habitual. `.env.local` permanece intacto.
- 63 pruebas unitarias en 13 archivos y 28 pruebas live de navegador aprobadas. API, Google y confirmación de personal simulados: no acreditan una prueba física ni acceso a datos reales.
- 19 casos demo verificados. La primera ejecución tuvo un selector de prueba ambiguo entre dos encabezados; se acotó al contenido principal. La repetición de ese caso, el caso offline y el nuevo caso de apertura de archivos pasó 3/3. Los demás 17 casos de la ejecución inicial habían pasado.
- 42 capturas de siete vistas en 320, 390 y 1440 px y claro/oscuro, sin desbordamiento horizontal, imágenes rotas ni errores JavaScript. Se inspeccionaron capturas representativas móviles y de escritorio, incluida la comparación del patio de comidas. La suite demo también cubre 768 px.
- Autoplay, pausa y vuelta al inicio del carrusel comprobados; movimiento reducido conserva controles manuales. La regla de fallback del service worker excluye archivos de assets, de modo que los afiches y el PDF abren su contenido real.
- Fuente y copia pública del PDF tienen el mismo SHA-256: `a12e7c6b906eed860460222986e1c1ba9d61290d2ffec1304c39d1cd767e3271`.
- Evidencias: `../../../output/pwa-descubre-2026-11-01/review/results.json`, capturas y manifiesto de fuentes en esa carpeta de trabajo. Servidor de revisión demo: `http://127.0.0.1:5187/` mientras siga abierto. No es un despliegue.
