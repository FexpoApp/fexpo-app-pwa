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
