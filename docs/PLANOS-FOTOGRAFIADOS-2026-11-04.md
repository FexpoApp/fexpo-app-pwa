# Planos operativos cotejados con las fotografías del 04/11/2026

Esta revisión actualiza las siete zonas fotografiadas de la PWA. Reproduce rótulos, subdivisiones, sectores, formas características y colores de orientación del plano operativo. No es un levantamiento topográfico: las coordenadas son una transcripción visual, sin escala métrica o georreferenciación validadas.

## Fuentes y resultado

Los originales están en `../FERIAS/FIPAZ/mapa/` respecto de la raíz del repositorio. No se incluyen las fotografías de 108 MP en el paquete web.

| Plano                             | Foto principal            | Espacios/zonas seleccionables | Cambios cotejados                                                                                                                                          |
| --------------------------------- | ------------------------- | ----------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Internacional I · Rojo bajo       | `IMG_20261104_094828.jpg` |                            55 | 49A/B a la izquierda y 49D/C a la derecha; 40A/40B lado a lado. Se conservan R1/R2 y la secuencia del resto de puestos.                                    |
| Internacional II · Rojo alto      | `IMG_20261104_094828.jpg` |                            63 | 93A/93B en vertical; 56B/56A de izquierda a derecha; ancho reducido de 98 y ampliado de 96.                                                                |
| Pabellón La Paz · Amarillo bajo   | `IMG_20261104_094841.jpg` |                            94 | 53A/53B/53C, fila de 46–52, dos rótulos impresos 49. Se retira el 51 del dibujo, sin inventar su ubicación.                                                |
| Pabellón Bolivia · Amarillo alto  | `IMG_20261104_094841.jpg` |                           134 | 90A/90B y distribución de puestos. P14-A y P14-B conservan la ficha conjunta GAMLP confirmada por Omar; P14 del extremo izquierdo permanece independiente. |
| Pabellón Americano · Verde alto   | `IMG_20261104_094853.jpg` |                            71 | Sector V5, CDT en forma de L y área de selfies/mesas. Se retiran los sublotes reemplazados: 24–30, 34–49, 87–89 y 96–101.                                  |
| Plaza Akapana · Ingreso principal | `IMG_20261104_094841.jpg` |                             9 | 1 domo, 2 boletería, 3–5, 6 enfermería, 7 juegos, 8 escenario y 9. Se retiran E1/E2 del modelo anterior y servicios sin respaldo en esta foto.             |
| Patio de comidas                  | `IMG_20261104_094853.jpg` |                            24 | 21/22 hexagonales, 14 en L y mesas como mobiliario. Se retiran 25–29, ausentes del plano actual.                                                           |

Total: **450 espacios y zonas**, no 450 empresas. El modelo anterior tenía 477 polígonos después de la primera revisión del amarillo. La diferencia responde principalmente a las zonas agrupadas del verde y al plano actual del patio, no a una pérdida de puestos al renderizar.

La segunda fotografía `IMG_20261104_094852.jpg` permite corroborar verde/comidas. Los listados `094904`, `094917`, `094926`, `094928` y `094933` sirven para contrastar rótulos; sus sufijos comerciales no se convierten automáticamente en divisiones físicas si no aparecen dibujadas.

## Una sola geometría para 2D, 3D y selección

`src/data/map-plans.ts` contiene `PLAN_LOTS` y `PLAN_LOT_DETAILS`. `lotFootprint` y `lotPath` definen los polígonos; ambos renderizadores los consumen. Los cuerpos no rectangulares se extruyen en Three.js y se seleccionan mediante sus superficies reales. `lotContains` utiliza esos mismos límites para ubicar puntos publicados y calcular obstáculos de recorridos. El hueco de CDT y las esquinas libres de los hexágonos no se tratan como superficie ocupada.

Los colores se transcriben como referencia visual, sin inferir categoría comercial, disponibilidad o anunciante. Las mesas no son stands ni suman espacios al contador. Las áreas de servicio de la plaza tienen su nombre en la ficha.

Se mantienen los `viewBox` y contornos de referencia para conservar el marco de coordenadas con el que se integró el API. Las diferencias de perspectiva de la foto y las medidas precisas requieren verificación presencial; los límites de navegación no son rutas de evacuación o accesibilidad certificadas.

## Duplicación impresa 49/51

La foto del amarillo bajo imprime **49 dos veces**. Esta revisión reproduce ambos rótulos: el de la izquierda tiene ID físico interno `49-ref`; el otro conserva `49`. El ID interno no se presenta como un código comercial. La ficha del primero informa la discrepancia. No se convierte el 51 del directorio en una ubicación confirmada ni se generan QR de stand a partir de ese rótulo provisional.

## Integración con datos publicados

- El visor habitual conserva los datos reales del API cuando sus planos son compatibles con el marco existente. La revisión no escribe en base de datos. El directorio fotografiado incorpora ocupantes locales informativos; su conciliación con UUID del servidor se documenta en [Integración de expositores](INTEGRACION-EXPOSITORES-2026-11-04.md).
- `/map?reference=2026-11-04` permite recorrer los siete planos fotografiados incluso si el API no publicó una planta compatible. El selector mantiene esa referencia al cambiar de bloque, planta, vista o ficha. El visor alternativo de planos publicados ofrece un enlace al plano actualizado.
- Un antiguo ocupante de los sublotes retirados del verde no se atribuye automáticamente a V5 o CDT por coincidir espacialmente: estos dos códigos deben concordar con el stand publicado.
- Los sufijos de subdivisiones, asignaciones comerciales, UUID y posiciones del catálogo del backend deben conciliarse con esta revisión antes de usar una ubicación para operaciones reales. No se infieren arrendatarios de los colores.
- GAMLP conserva un solo sector en P14-A/P14-B. Esta revisión no cambia su directorio ni convierte su prueba QR en un registro real.

## Verificación y pendientes

- [x] Conjunto independiente de rótulos esperado por foto para los siete planos; sin IDs físicos duplicados.
- [x] Pruebas de hexágonos, hueco de CDT, selección por posición y separación de ocupantes antiguos de V5.
- [x] Misma lista y cantidad de espacios en 2D y 3D; selección de V5 y preservación de la referencia al navegar.
- [x] Revisión de capturas de las siete zonas en móvil/escritorio y claro/oscuro. Capturas locales en `../../output/map-audit-2026-11-04/` respecto de la raíz del repositorio.
- [x] Primera revisión geométrica: 79 pruebas unitarias; 21 locales completas y 22 casos demo/31 live verificados en navegador. La ampliación del directorio y su validación se detallan en [Validación de mapas y expositores](VALIDACION-MAPAS-EXPOSITORES-2026-11-04.md). Se comprobó también un clic real sobre el hexágono 22 en vista aérea 3D. Controles 2D/3D sin quedar tapados por la navegación fija a 320/768/1440 px.
- [ ] Organización: aclarar el doble 49 y el 51 del directorio; confirmar dimensiones y accesos operativos sobre el terreno.
- [ ] Backend/BD: conciliar sublotes retirados y nuevas divisiones con la publicación del mapa y el catálogo, sin reutilizar IDs de empresas para sectores agrupados.
- [ ] Validación física: comprobar actualización del service worker, legibilidad y ubicación operativa del plano servido en un teléfono real.

No hay una planta verde baja separada en las fotos suministradas: no se inventó otra planta para completar el recinto.
