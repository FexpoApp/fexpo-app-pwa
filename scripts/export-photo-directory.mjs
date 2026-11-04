import { createServer } from 'vite';
import { format } from 'prettier';
import { mkdir, writeFile } from 'node:fs/promises';

// Uses the same resolver as the UI; the export never writes to a database.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { PHOTO_ROWS, PHOTO_COMPANIES, EXHIBITOR_PLACEMENTS, VERIFIED_LOGOS } =
    await server.ssrLoadModule('/src/features/exhibitors/model.ts');
  await mkdir('docs/data', { recursive: true });
  const placements = EXHIBITOR_PLACEMENTS.map((p) => ({
    ...p,
    companyName: PHOTO_COMPANIES.find((c) => c.id === p.companyKey).name,
  }));
  await writeFile(
    'docs/data/exhibitor-placements-2026-11-04.json',
    JSON.stringify({ revision: '2026-11-04', sourceRows: PHOTO_ROWS.length, placements }, null, 2) +
      '\n',
  );
  const unresolved = placements.filter((p) => !p.lotCode);
  const shared = placements.filter((p) => p.match === 'shared');
  const lines = [
    '# Directorio y logos — revisión del 04/11/2026',
    '',
    `Generado con \`node scripts/export-photo-directory.mjs\`. ${PHOTO_ROWS.length} filas fotografiadas + 2 ubicaciones GAMLP confirmadas por Omar = ${placements.length} asignaciones. ${PHOTO_COMPANIES.length} identidades agrupadas por nombre; no son identidades legales verificadas ni UUID de la API.`,
    '',
    `${placements.length - unresolved.length} asignaciones con correspondencia física; ${shared.length} usan el polígono compartido de su número principal. ${unresolved.length} quedan sin ubicación segura. Los nombres proceden del listado impreso; el sitio oficial verifica la marca, no confirma por sí mismo su participación.`,
    '',
    `Se incorporaron ${VERIFIED_LOGOS.length} marcas verificadas. Las demás usan iniciales; no se inventaron logos ni se atribuyeron marcas homónimas. Los iconos de marca se identifican como tales.`,
    '',
    '## Códigos pendientes',
    '',
    '| Zona | Código impreso | Nombre |',
    '| --- | --- | --- |',
    ...unresolved.map((p) => `| ${p.planId} | ${p.printedCode} | ${p.name} |`),
    '',
    'El amarillo imprime dos 49 y el listado incluye 49/51. Comidas contiene 25, 5J y 10J sin polígono correspondiente. Se requiere cotejo presencial; los perfiles conservan estos códigos sin crear un marcador ficticio.',
    '',
    '## Fuentes de las marcas',
    '',
    '| Nombre en la guía | Recurso local | Tipo | Página de origen |',
    '| --- | --- | --- | --- |',
    ...VERIFIED_LOGOS.map(
      (l) =>
        `| ${PHOTO_COMPANIES.find((c) => c.id === l.companyKey).name} | ${l.src} | ${l.assetKind} | [Fuente](${l.sourcePage}) |`,
    ),
    '',
    'El manifiesto `src/features/exhibitors/data/logos.json` conserva también la URL exacta del recurso original, fecha de revisión y fondo necesario. Las imágenes se sirven desde el proyecto; no se depende de un servidor externo al abrir el plano.',
    '',
    'Descartados: el escudo estatal del portal SIN no era su marca institucional; las coincidencias de Ferrari, Lexus, CIOMED y A3TEX no tenían identidad suficiente. El GAMLP municipal y la Gobernación departamental usan recursos distintos.',
    '',
    '## Datos para conciliación',
    '',
    '[Exportación de asignaciones](data/exhibitor-placements-2026-11-04.json). Cada fila conserva `sourceImage`, `printedCode`, `planId`, `lotCode` y `match`. `id` y `companyKey` son referencias locales de presentación: no enviarlas a endpoints de visitas, favoritos ni contactos.',
    '',
    'Los originales están en `PROYECTO-OFICIAL/FERIAS/FIPAZ/mapa/`: rojo/comidas/plaza `IMG_20261104_094904.jpg`, amarillo `IMG_20261104_094928.jpg`, verde `IMG_20261104_094933.jpg`. P14-A/B fue confirmado por Omar y cotejado con `IMG_20261104_094841.jpg`.',
  ];
  await writeFile('docs/DIRECTORIO-Y-LOGOS-2026-11-04.md', lines.join('\n') + '\n');
  console.log(
    JSON.stringify({
      companies: PHOTO_COMPANIES.length,
      assignments: placements.length,
      shared: shared.length,
      unresolved: unresolved.length,
      logos: VERIFIED_LOGOS.length,
    }),
  );
} finally {
  await server.close();
}
