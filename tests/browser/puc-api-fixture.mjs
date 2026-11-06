import { readFileSync } from 'node:fs';
const catalog = JSON.parse(
  readFileSync(
    new URL('../../docs/data/gamlp-api-catalog-2026-11-06.json', import.meta.url),
    'utf8',
  ),
);
/** Isolated API fixture: never calls production or supplies a real Google account. */
export async function setupPucApi(page, owner = 'test-user', displayName = 'Ana Visitante') {
  const state = {
    owner,
    provider: 'google',
    failRatings: 0,
    holdRating: null,
    scans: new Map(),
    ratings: new Map(),
    requests: [],
  };
  const rows = () =>
    catalog.experiences.map((p) => ({
      experienceId: p.id,
      slug: p.slug,
      order: p.order,
      name: p.name,
      shortName: p.shortName,
      type: p.type,
      scannedAt: state.scans.get(state.owner + ':' + p.id)?.lastScannedAt || null,
      myRating: state.ratings.get(state.owner + ':' + p.id) || null,
      status: state.ratings.has(state.owner + ':' + p.id) ? 'complete' : 'pending',
    }));
  const summary = () => ({
    totalExperiences: catalog.experiences.length,
    scannedCount: rows().filter((p) => p.scannedAt).length,
    ratedCount: rows().filter((p) => p.myRating).length,
  });
  await page.route('**/api/backend?*', async (route) => {
    const path = new URL(route.request().url()).searchParams.get('path') || '';
    let data;
    if (path === '/auth/me')
      data = {
        id: state.owner,
        authProvider: state.provider,
        profile: { displayName, avatarUrl: null },
      };
    else if (path === '/events/resolve/gamlp-puc-2026') data = catalog;
    else if (path === `/events/${catalog.id}/experience-progress`)
      data = { eventId: catalog.id, progress: summary(), experiences: rows() };
    else if (path.startsWith(`/events/${catalog.id}/experiences/`)) {
      const experienceId = path.split('/')[4],
        body = route.request().postDataJSON();
      const key = state.owner + ':' + experienceId;
      state.requests.push({ path, body, method: route.request().method() });
      if (path.endsWith('/scans')) {
        const prior = state.scans.get(key),
          at = new Date().toISOString();
        const scan = {
          experienceId,
          source: body.source,
          scanCount: (prior?.scanCount || 0) + 1,
          firstScannedAt: prior?.firstScannedAt || at,
          lastScannedAt: at,
        };
        state.scans.set(key, scan);
        data = {
          scan,
          firstScan: !prior,
          scanReceipt: 'receipt_' + experienceId + '_' + (state.owner || 'guest'),
          receiptExpiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
          progress: summary(),
        };
      } else if (path.endsWith('/my-rating')) {
        if (state.failRatings-- > 0)
          return route.fulfill({
            status: 502,
            json: {
              success: false,
              error: { code: 'UPSTREAM_UNAVAILABLE', message: 'No pudimos guardar. Reintenta.' },
            },
          });
        if (state.holdRating) await state.holdRating;
        const prior = state.ratings.get(key),
          at = new Date().toISOString();
        const rating = {
          id: prior?.id || 'ba000000-0000-4000-8000-000000000001',
          eventId: catalog.id,
          experienceId,
          stars: body.stars,
          comment: body.comment || null,
          createdAt: prior?.createdAt || at,
          updatedAt: at,
        };
        state.ratings.set(key, rating);
        data = { rating, created: !prior, progress: summary() };
      }
    } else return route.fallback();
    await route.fulfill({ json: { success: true, data, meta: null } });
  });
  return state;
}
