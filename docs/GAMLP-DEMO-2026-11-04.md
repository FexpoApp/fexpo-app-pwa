# GAMLP · demostración del sector municipal

Entrega PWA del 04/11/2026. Un sector, dos espacios físicos y un registro conjunto de visita. No se crean stands por emprendedor ni se cambia el backend.

## Recorrido para la presentación

1. Inicio → anuncio «Conoce a quienes emprenden en La Paz».
2. Abre `/map?plan=yellow-upper&view=2d&sector=gamlp&lot=P14-A`. Se resaltan **P14-A y P14-B** en el pabellón Bolivia, planta alta del bloque amarillo.
3. Tocar cualquiera abre la misma ficha del GAMLP. El escudo aparece dentro del plano 2D y como marcador en 3D; el contorno seleccionado en 3D abarca los dos espacios.
4. «Ver emprendedores» abre `/sectors/gamlp`. Su directorio está listo para recibir la lista real.
5. «Probar demo del sector» añade `demo=1`: muestra tres entradas expresamente ficticias, sus mini perfiles y productos de ejemplo. La pestaña «Visita QR» permite simular la lectura del personal.
6. El primer registro suma **una visita de prueba** para todo el sector. Repetir el mismo pase no duplica el conteo. «Probar otro pase» genera otro visitante ficticio; «Reiniciar prueba» limpia el ejercicio. Salir de la demostración oculta los controles y datos ficticios.

El QR de prueba no es un QR de acceso a la app ni una credencial de producción. El botón simula una lectura; **no activa una cámara ni sustituye al escáner del personal**. La presentación no acredita puntos, no altera la ubicación ni escribe visitas reales. El conteo se conserva únicamente en este navegador, en `fexpo-gamlp-sector-demo-v1`; no se sincroniza entre dispositivos.

## Fuentes y comparación del mapa

- **Fotos del 04/11:** `../FERIAS/FIPAZ/mapa/IMG_20261104_094841.jpg` para la geometría visual; `IMG_20261104_094926.jpg`, `094928.jpg` y `094933.jpg` para cotejar el directorio. Las rutas son relativas al repositorio. Los originales de 9000 × 12000 se mantienen fuera del paquete web.
- **Ocupación GAMLP:** Omar confirmó en el chat **P14-A y P14-B**. No se dedujo del listado impreso ni se confundió con P14, ubicado en el extremo opuesto de la planta.
- **Escudo oficial:** [sitio del GAMLP](https://lapaz.bo/), recurso servido por su cabecera: [cropped-logolpz26-1.png](https://lapaz.bo/wp-content/uploads/2026/06/cropped-logolpz26-1.png). Copia local en `public/brands/gamlp-2026.png`.
- **Planta alta:** el modelo ya tenía las posiciones de P14-A/B. Se conservan ambos polígonos y se vinculan a una identidad conjunta. El espacio 90 se divide en **90A/90B** como en la foto; el número de polígonos pasa de 133 a **134**.
- **Planta baja:** 53 se divide en **53A/53B/53C**; se corrige la fila superior para incluir **47/46**, y 49 deja de ocupar doble altura. Pasa de 90 a **94** polígonos.
- Se preservan contornos, accesos, rampas, coordenadas y `viewBox`. El modelo completo pasa de 472 a **477 polígonos**, que no equivalen a 477 empresas. La escala sigue siendo aproximada y el plano no está georreferenciado.
- **Conflicto visible:** la foto imprime 49 dos veces en la fila superior del amarillo bajo, donde la versión anterior tenía 51; el directorio sí contiene 51 (Hotel Gloria). Se conserva 51 hasta aclarar esa discrepancia, sin crear dos lotes con la misma identidad.
- Sufijos comerciales del directorio como 114A/B, 116A/B o 202A/B/C/D no implican límites físicos relevados. No se inventaron nuevas divisiones para ellos. La lista de emprendedores municipales aún no fue entregada; no se atribuyen los expositores generales del pabellón al GAMLP.

## Integración y pendientes

- [x] Anuncio institucional dentro del carrusel existente; primera tarjeta durante la feria, con la misma rotación, pausa y preferencia de movimiento reducido. Se distingue de campañas pagadas y no genera métricas ficticias.
- [x] Enlace, búsqueda GAMLP/P14-A/P14-B, selección conjunta, logo, ficha y navegación en 2D/3D.
- [x] Ficha de sector, directorio con mini perfiles y demostración QR con deduplicación/persistencia local.
- [x] En live, el enlace municipal puede mostrar el plano de referencia aunque el API no haya publicado una planta compatible. En ese caso lo identifica como fotografía del 04/11; no inventa ocupantes del API. Los demás planos conservan su selección publicada habitual.
- [ ] **Omar / GAMLP:** entregar nombres, categoría, descripción y productos autorizados; cargar `GAMLP_ENTREPRENEURS` en `src/features/sectors/gamlp.ts`. No usar `EXAMPLE_ENTREPRENEURS` como datos reales.
- [ ] **Backend / BD:** identificar un único sector o stand autorizado GAMLP para los dos lotes, con UUID real, evento y miembros de staff. Definir relación sector → emprendedores, publicación y permisos. Revisar tablas existentes antes de proponer migraciones.
- [ ] **Dashboard / backend:** asociar el escáner a ese sector; usar el contrato real `POST /stands/:standId/manual-check-ins` con `userQrToken` y `requestKey`, autorización de staff e idempotencia. La PWA ya conserva el acceso al QR personal del visitante; **todavía no existe una asociación de producción entre GAMLP y un UUID de stand**.
- [ ] **QA física:** leer el QR personal con un segundo dispositivo, verificar que P14-A/B comparten conteo y alcance, duplicados según la política del servidor, red intermitente y reporte del sector. La simulación local no valida ese circuito.
- [ ] **Mapa:** aclarar el rótulo 49/51 y comprobar medidas/límites con la organización. La actualización prioriza el bloque amarillo y el sector confirmado, sin afirmar un levantamiento completo del recinto.

## Archivos para continuar

`src/features/sectors/gamlp.ts`: ubicación y directorio real/ejemplos separados. `SectorDirectory.tsx`: filas y modal. `visit-demo.ts`: formato del pase y contador aislado. `src/pages/Sector.tsx`: ficha/pestañas. `CampusMap.tsx`, `IndoorPlan.tsx` e `IndoorScene.tsx`: interacción y representación. `src/data/map-plans.ts`: correcciones cotejadas con la foto.

Los datos simulados no tienen teléfonos, redes ni contactos inventados. No se cargaron nombres de emprendedores desde noticias ni se modificaron Supabase, dashboard o repositorios de backend.

## Validación realizada

66 pruebas unitarias y las suites de navegador completas: 20 local, 21 demo, 30 live. Incluyen la selección del sector, navegación por teclado, cierre/foco del mini perfil, persistencia del conteo y duplicados, conservación de puntos y ausencia de confirmaciones de servidor durante la simulación. La suite local mantiene las siete plantas en 2D/3D y el fallback cuando falla WebGL. La suite demo revisa también 320/390/768/1440 px en claro/oscuro.

Se inspeccionaron capturas móviles y de escritorio del anuncio, mapa 2D/3D, ficha inferior, directorio, modal y pase QR. Se corrigió el solapamiento del marcador municipal con las etiquetas de servicios en 3D. La visita física mediante cámara no fue validada: el control presentado es una simulación explícita.
