import { describe, expect, it } from 'vitest';
import { matchesStand } from '@/services/stand-search';
const stand = {
  name: 'Altura Labs',
  boothCode: 'B-17',
  tags: ['Tecnología'],
  description: 'Desarrollo móvil',
  categoryLabel: 'Tecnología',
};
describe('búsqueda de empresas y códigos', () => {
  it('combina nombre y código sin exigir el guion', () =>
    expect(matchesStand(stand, 'altura B17')).toBe(true));
  it('acepta espacios en el código y acentos en productos', () => {
    expect(matchesStand(stand, 'B 17')).toBe(true);
    expect(matchesStand(stand, 'movil')).toBe(true);
  });
  it('no confunde B17 con B117 ni ignora otros términos', () => {
    expect(matchesStand({ ...stand, boothCode: 'B-117' }, 'B17')).toBe(false);
    expect(matchesStand(stand, 'altura salud')).toBe(false);
  });
  it('admite consulta vacía', () => expect(matchesStand(stand, '  ')).toBe(true));
});
