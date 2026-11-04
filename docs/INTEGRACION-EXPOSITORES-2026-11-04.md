# Integración de expositores: backend y base de datos

## Entrega PWA

El acceso Mapa de Inicio y de la navegación abre la revisión fotografiada del 04/11/2026. Conserva los siete planos y sus 450 espacios/zonas. Cada espacio muestra su código y, cuando existe una marca verificada, su logo. Al seleccionarlo aparecen las empresas asignadas y el acceso a sus fichas con nombre, logo o iniciales y todos sus códigos de ubicación. Los espacios compartidos mantienen una lista de ocupantes.

Se transcribieron 349 filas de las guías, agrupadas en 319 identidades por nombre. Se añaden P14-A/B confirmados por Omar: 351 asignaciones, 346 ubicadas y 5 pendientes. Hay 22 logos/iconos de marca verificados, guardados en el proyecto. Fuentes y discrepancias: [directorio y logos](DIRECTORIO-Y-LOGOS-2026-11-04.md). Geometría: [planos fotografiados](PLANOS-FOTOGRAFIADOS-2026-11-04.md).

Rutas: `/companies`, `/companies/:companyKey` y `/map?reference=2026-11-04&plan=yellow-upper&lot=117`. El directorio se consulta sin depender de la API. Las fichas curadas son informativas: no generan favoritos, contactos, puntos ni visitas con identificadores locales. Los perfiles `/stands/:uuid` y sus operaciones siguen usando el catálogo publicado. La referencia fotografiada evita mostrar empresas de ejemplo o posiciones antiguas como ocupantes de las nuevas divisiones.

P14-A/B siguen siendo un único sector GAMLP, con su ficha, emprendedores y demo QR existentes. La fila GAMLP del verde es otra ubicación de la misma institución, sin fusionar físicamente los bloques. El listado general de empresas no se carga como si fuera la lista municipal de emprendedores. La Gobernación de La Paz del V5 es una institución distinta.

## Trabajo del backend

- [ ] Conciliar cada identidad de la guía con el UUID real de empresa; revisar homónimos y nombres personales antes de fusionar. `companyKey` es una clave local por nombre, no una razón social validada.
- [ ] Reutilizar `CompanyResponseDto.displayName`, `legalName` y `logoPath`; almacenar los archivos verificados en el medio público acordado. En la PWA actual se sirven desde `/brands/exhibitors/`; esas rutas relativas no son automáticamente URLs del servidor backend.
- [ ] Reutilizar la relación empresa/evento/stand existente y `CompanyStandResponseDto`. Una empresa puede tener varios espacios y un espacio físico puede reunir varias empresas. Exponer esta relación sin sobrescribir al ocupante anterior.
- [ ] Publicar `company.id`, `company.displayName`, `company.logoPath`, identificador de stand, código comercial, plano y espacio físico. El perfil público debe incluir todos los ocupantes de un polígono compartido. Conservar la distinción entre código comercial y lote físico.
- [ ] Conciliar las nuevas divisiones con los UUID y posiciones del mapa publicado. No usar solo el nombre de planta o la cercanía de coordenadas como prueba de correspondencia.
- [ ] Permitir que la PWA sustituya las fichas curadas por los UUID publicados una vez conciliados. Hasta entonces, mantener el directorio informativo y los check-ins reales separados.
- [ ] Para GAMLP, asociar ambos lotes P14 a un solo sector/stand real y su personal autorizado. El lector del dashboard debe enviar el QR del visitante al contrato de check-in existente; abrir un perfil o un mapa no registra una visita.

## Trabajo de base de datos y carga

- [ ] Revisar las tablas y restricciones existentes de empresas, participación, stands, plantas, posiciones y activos antes de añadir estructuras. No se ejecutó ninguna migración ni carga en producción en esta entrega.
- [ ] Preparar una tabla de conciliación/importación con clave de origen, revisión, foto, código impreso, plano, lote físico, estado y UUID de empresa/stand. Hacer la carga idempotente por origen y evento; no asumir que el número de fila es un identificador permanente.
- [ ] Admitir varias asignaciones por lote y varios lotes por empresa. Por ejemplo: Ferrotodo ocupa 110 y 117 del amarillo alto; rojo 34 agrupa D - Openbrands, Swissôtel y Sisife; rojo 54 comparte las subdivisiones comerciales 54A/B.
- [ ] Conservar los cinco casos sin posición: amarillo bajo 49/51 y comidas 25/5J/10J. No importar una posición inventada. La guía debe seguir mostrando sus códigos con ubicación pendiente.
- [ ] Guardar procedencia de logos, fecha de revisión y estado de publicación; conservar el archivo original cuando se genere una versión optimizada. La marca encontrada en un sitio oficial identifica la empresa, pero la participación en FIPAZ procede de la guía fotografiada.
- [ ] Validar eventId, permisos de edición/publicación, integridad de relaciones y revisión del mapa antes de publicar. No usar `photo-assignment-*` ni slugs locales en endpoints que requieren UUID.
- [ ] Cargar primero en un entorno de prueba y revisar las 351 filas contra el plano. El archivo de conciliación está en [docs/data/exhibitor-placements-2026-11-04.json](data/exhibitor-placements-2026-11-04.json).

## Criterios para cerrar la integración

- [ ] La API devuelve los mismos nombres, logos y ocupantes que la guía validada, con UUID reales y sin duplicados al repetir la importación.
- [ ] Búsqueda, ficha y selección 2D/3D abren la misma empresa y espacio; los perfiles repetidos conservan todas sus ubicaciones.
- [ ] Un espacio compartido permite consultar a todos sus ocupantes; los cinco casos pendientes no adquieren posición por una inferencia automática.
- [ ] El staff autorizado lee el QR del visitante y confirma una única visita conforme a la regla del servidor; la PWA refleja el saldo recibido. Probar duplicados, rechazos y red intermitente con dos dispositivos.
- [ ] Los logos se leen en celular y permanecen disponibles después de actualizar la PWA y volver a abrirla sin red.

Para regenerar la exportación y la auditoría de fuentes después de corregir una transcripción: `node scripts/export-photo-directory.mjs`.
