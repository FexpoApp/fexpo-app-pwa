# Validación de mapas y expositores — 04/11/2026

## Comprobaciones ejecutadas

| Comprobación                                                    | Resultado                                                                                |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Unitarias, incluidos polígonos, asignaciones y fuentes de logos | 85/85                                                                                    |
| Navegador local                                                 | 22/22                                                                                    |
| Navegador demo                                                  | 23/23 en suite completa; prueba adicional de directorio/logo offline aprobada (24 casos) |
| Navegador live con API y Google simulados                       | 32/32                                                                                    |
| Compilación TypeScript y builds local/demo/live                 | Correctos                                                                                |
| Imágenes locales de marcas                                      | 22/22 decodificadas en Edge, incluidos los dos SVG                                       |
| Errores JavaScript en revisión visual                           | 0                                                                                        |
| Revisión de fichas a 320, 390, 768 y 1440 px                    | Sin desbordamiento horizontal                                                            |

El flujo nuevo comprueba Ferrotodo en ambos lotes del amarillo alto, lista compartida del rojo 34, perfil sin ubicación de Hotel Gloria, búsqueda de Gobernación → V5, carga de logos 3D y fichas con imagen válida. La suite fotográfica coteja códigos/cantidad de los siete planos en 2D y 3D y preserva la revisión al navegar.

La prueba sin conexión espera al service worker, recarga bajo su control y corta la red. Después abre el perfil de Venado con logo blanco sobre fondo oscuro y el plano con el logo de Ferrotodo. Los archivos de marca tienen revisión de contenido en la precaché. También se excluye `/brands/` de la sustitución de archivos por el HTML de la aplicación.

Se inspeccionaron capturas del plano amarillo en móvil, selección y ficha de Ferrotodo, directorio a 320 px, mapa verde 3D en escritorio y una lámina de las 22 marcas. La inspección detectó el logo blanco de Venado sobre fondo blanco; se corrigió el fondo en el manifiesto y se volvió a renderizar. Capturas locales: `../../output/company-directory-2026-11-04/screens/`, fuera del paquete web.

## Límites

Los recorridos conectados usan una API simulada y no acreditan visitas reales. Quedan pendientes la conciliación/importación del catálogo, los cinco códigos sin correspondencia, la lista real de emprendedores GAMLP y la prueba física del lector autorizado con dos dispositivos. No se ejecutaron cambios de base de datos.

Vite informa del tamaño de los chunks principales y Three.js; los builds terminan correctamente. La geometría sigue siendo una transcripción visual sin escala métrica ni GPS absoluto validados. La guía de expositores y las fuentes de logos no sustituyen la validación operativa de la organización.

Pasos de integración y aceptación: [backend y base de datos](INTEGRACION-EXPOSITORES-2026-11-04.md).

## Corrección de foco detectada en CI

El primer push de los 15 commits pasó unitarias y la suite demo de GitHub. Local y live detectaron una carrera de foco al cerrar un mini perfil GAMLP con Escape y cambiar enseguida a la pestaña QR. El cierre nativo ya había devuelto el foco; la limpieza posterior del modal volvía a enfocarlo aunque el visitante hubiera elegido otro control.

La corrección respeta el nuevo destino de foco y conserva la restauración cuando aún está dentro de la ventana o en el cuerpo del documento. La regresión se reproduce mediante cierre nativo y selección inmediata de otra pestaña, sin esperas artificiales. Se verifica también el foco de la pestaña elegida al navegar con flechas. Los tres recorridos GAMLP pasaron tres repeticiones tanto en live (9/9) como en local (9/9). La corrección se añade en un commit posterior para conservar el historial ya publicado.

Producción de la entrega inicial: se comprobó en `https://app.fexpo.lat` la ficha de Ferrotodo con ubicaciones 110/117, sus 134 espacios del amarillo alto y los 22 recursos de marca, todos con HTTP 200 y tipo de imagen; sin errores JavaScript. El estado del commit más reciente se consulta en [GitHub Actions](https://github.com/FexpoApp/fexpo-app-pwa/actions/workflows/pwa-e2e.yml).
