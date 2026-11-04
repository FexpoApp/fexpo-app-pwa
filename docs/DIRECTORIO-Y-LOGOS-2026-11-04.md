# Directorio y logos — revisión del 04/11/2026

Generado con `node scripts/export-photo-directory.mjs`. 349 filas fotografiadas + 2 ubicaciones GAMLP confirmadas por Omar = 351 asignaciones. 319 identidades agrupadas por nombre; no son identidades legales verificadas ni UUID de la API.

346 asignaciones con correspondencia física; 27 usan el polígono compartido de su número principal. 5 quedan sin ubicación segura. Los nombres proceden del listado impreso; el sitio oficial verifica la marca, no confirma por sí mismo su participación.

Se incorporaron 22 marcas verificadas. Las demás usan iniciales; no se inventaron logos ni se atribuyeron marcas homónimas. Los iconos de marca se identifican como tales.

## Códigos pendientes

| Zona | Código impreso | Nombre |
| --- | --- | --- |
| yellow-lower | 49 | Industrias Veterinarias A y CH SRL |
| yellow-lower | 51 | Hotel Gloria |
| food-court | 25 | Takumi |
| food-court | 5J | Industria Rey |
| food-court | 10J | Zulma Vásquez |

El amarillo imprime dos 49 y el listado incluye 49/51. Comidas contiene 25, 5J y 10J sin polígono correspondiente. Se requiere cotejo presencial; los perfiles conservan estos códigos sin crear un marcador ficticio.

## Fuentes de las marcas

| Nombre en la guía | Recurso local | Tipo | Página de origen |
| --- | --- | --- | --- |
| Ferrotodo | /brands/exhibitors/ferrotodo.png | logo | [Fuente](https://www.ferrotodo.com/) |
| Entel | /brands/exhibitors/entel.png | logo | [Fuente](https://www.entel.bo/Inicio) |
| Mi Teleférico | /brands/exhibitors/mi-teleferico.png | brand-icon | [Fuente](https://www.miteleferico.bo/registrate/) |
| Quantum Motors | /brands/exhibitors/quantum-motors.png | logo | [Fuente](https://tuquantum.com/acerca-de-nosotros/empresa/) |
| Bagó | /brands/exhibitors/bago.png | logo | [Fuente](https://www.bago.com.bo/) |
| BancoSol | /brands/exhibitors/bancosol.svg | logo | [Fuente](https://www.bancosol.com.bo/) |
| Sofía | /brands/exhibitors/sofia.png | logo | [Fuente](https://sofia.com.bo/) |
| Pío Rico | /brands/exhibitors/pio-rico.png | logo | [Fuente](https://piorico.com/nosotros/) |
| Ind. Venado S.A. | /brands/exhibitors/ind-venado-s-a.svg | logo | [Fuente](https://grupovenado.com/) |
| CEMSE | /brands/exhibitors/cemse.png | logo | [Fuente](https://cemse.edu.bo/) |
| SOS Infantiles | /brands/exhibitors/sos-infantiles.jpg | logo | [Fuente](https://www.aldeasinfantiles.org.bo/conocenos/aldeas-infantiles-en-bolivia) |
| UPEA Posgrado | /brands/exhibitors/upea-posgrado.png | logo | [Fuente](https://programas.posgradoupea.edu.bo/) |
| RTP | /brands/exhibitors/rtp.png | logo | [Fuente](https://rtpbolivia.com.bo/) |
| Gobernación de La Paz | /brands/exhibitors/gobernacion-de-la-paz.png | brand-icon | [Fuente](https://www.lapaz.gob.bo/institucional) |
| Casio | /brands/exhibitors/casio.png | brand-icon | [Fuente](https://www.casio.com/select-country-region/) |
| Wella | /brands/exhibitors/wella.webp | logo | [Fuente](https://www.wellacompany.com/our-brands) |
| Muebles Silvera | /brands/exhibitors/muebles-silvera.png | logo | [Fuente](https://silvera.com.bo/) |
| Master Detector | /brands/exhibitors/master-detector.png | logo | [Fuente](https://masterdetector.com.bo/) |
| Thermocontrol | /brands/exhibitors/thermocontrol.png | logo | [Fuente](https://thermocontrol.com.bo/INICIO.html) |
| Kantutani | /brands/exhibitors/kantutani.png | logo | [Fuente](https://www.kantutani.com/) |
| Dabalash | /brands/exhibitors/dabalash.png | logo | [Fuente](https://www.dabalash.mx/pages/tienda-dabalash) |
| GAMLP | /brands/gamlp-2026.png | logo | [Fuente](https://lapaz.bo/) |

El manifiesto `src/features/exhibitors/data/logos.json` conserva también la URL exacta del recurso original, fecha de revisión y fondo necesario. Las imágenes se sirven desde el proyecto; no se depende de un servidor externo al abrir el plano.

Descartados: el escudo estatal del portal SIN no era su marca institucional; las coincidencias de Ferrari, Lexus, CIOMED y A3TEX no tenían identidad suficiente. El GAMLP municipal y la Gobernación departamental usan recursos distintos.

## Datos para conciliación

[Exportación de asignaciones](data/exhibitor-placements-2026-11-04.json). Cada fila conserva `sourceImage`, `printedCode`, `planId`, `lotCode` y `match`. `id` y `companyKey` son referencias locales de presentación: no enviarlas a endpoints de visitas, favoritos ni contactos.

Los originales están en `PROYECTO-OFICIAL/FERIAS/FIPAZ/mapa/`: rojo/comidas/plaza `IMG_20261104_094904.jpg`, amarillo `IMG_20261104_094928.jpg`, verde `IMG_20261104_094933.jpg`. P14-A/B fue confirmado por Omar y cotejado con `IMG_20261104_094841.jpg`.
