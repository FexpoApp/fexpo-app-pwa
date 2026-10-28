import type { Stand } from '@/types/domain';
const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
/** Accept booth codes with/without a hyphen and combine all query terms. */
export function matchesStand(
  stand: Pick<Stand, 'name' | 'boothCode' | 'tags' | 'description' | 'categoryLabel'>,
  query: string,
) {
  const terms = query
    .trim()
    .replace(/\b([a-z])\s*-?\s*(\d+)/gi, '$1$2')
    .split(/\s+/)
    .map(fold)
    .filter(Boolean);
  const fields = [
    stand.name,
    stand.boothCode,
    stand.categoryLabel ?? '',
    stand.description,
    ...stand.tags,
  ].map(fold);
  return terms.every((term) =>
    /^[a-z]\d+$/.test(term)
      ? fold(stand.boothCode).includes(term)
      : fields.some((field) => field.includes(term)),
  );
}
