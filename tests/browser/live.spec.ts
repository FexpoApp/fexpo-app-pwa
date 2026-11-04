import { test, expect, type Page } from '@playwright/test';
import { PLAN_GEOMETRY, PLAN_LOTS } from '../../src/data/map-plans';
import { sectorFlow } from './sector-flow';
sectorFlow(async (page) => {
  const checkins = await setup(page);
  // The presentation must not create a real check-in, even with an active session.
  return () => expect(checkins).toHaveLength(0);
});
const eventId = 'e0000000-0000-4000-8000-000000000001';
const standId = '5a000000-0000-4000-8000-000000000001';
const secondId = '5a000000-0000-4000-8000-000000000002';
const floorId = 'f0000000-0000-4000-8000-000000000001';
const stands = [
  {
    id: standId,
    boothCode: 'A-01',
    displayName: 'Café Altiplano',
    description: 'Café de altura',
    company: { id: 'c1', displayName: 'Café Altiplano' },
    categories: [{ id: 'ca1', slug: 'gastronomia', label: 'Gastronomía' }],
    tags: ['Café', 'Degustación'],
    featured: true,
    activityHighlight: 'Degustación',
    promotionHighlight: 'Consulta nuestros packs',
    visitPoints: 50,
    location: { floorId, zoneId: null, x: 0.2, y: 0.4 },
  },
  {
    id: secondId,
    boothCode: 'B-01',
    displayName: 'TecnoAndes',
    description: 'Robótica educativa',
    company: { id: 'c2', displayName: 'TecnoAndes' },
    categories: [{ id: 'ca2', slug: 'tecnologia', label: 'Tecnología' }],
    tags: ['Robótica'],
    featured: false,
    promotionHighlight: 'Asesoría inicial sin costo',
    visitPoints: 80,
    location: null,
  },
];
async function setup(
  page: Page,
  guest = false,
  failCatalog = false,
  freshInterests = false,
  staffState?: { visited: boolean },
) {
  if (!freshInterests)
    await page.addInitScript(() => {
      localStorage.setItem(
        'fexpo-interests-v1',
        JSON.stringify({
          version: 1,
          state: {
            byVisitor: {
              'live:e0000000-0000-4000-8000-000000000001:test-user': {
                categories: [],
                completed: true,
              },
            },
          },
        }),
      );
    });
  let signedIn = !guest;
  let displayName = 'Ana Visitante';
  let visited = false;
  const favoriteIds = new Set<string>();
  const checkins: Record<string, unknown>[] = [];
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, any>;
    w.__audio = [];
    w.__vibrations = [];
    Object.defineProperty(navigator, 'vibrate', {
      value: (pattern: unknown) => {
        w.__vibrations.push(pattern);
        return true;
      },
    });
    w.Audio = class {
      onplaying: (() => void) | null = null;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public src: string) {}
      pause() {}
      load() {}
      removeAttribute() {}
      async play() {
        w.__audio.push(this.src);
        queueMicrotask(() => {
          this.onplaying?.();
          setTimeout(() => this.onended?.(), 20);
        });
      }
    };
    w.NDEFReader = class extends EventTarget {
      async scan({ signal }: { signal: AbortSignal }) {
        w.__reader = this;
        signal.addEventListener('abort', () => {
          w.__aborted = true;
        });
      }
    };
    let callback: (response: { credential: string }) => void;
    w.google = {
      accounts: {
        id: {
          initialize(options: { callback: typeof callback }) {
            callback = options.callback;
          },
          renderButton(element: HTMLElement) {
            const button = document.createElement('button');
            button.textContent = 'Continuar con Google';
            button.onclick = () => callback({ credential: 'test-only-google-token' });
            element.appendChild(button);
          },
          disableAutoSelect() {},
        },
      },
    };
  });
  await page.route('**/api/session/**', async (route) => {
    const action = new URL(route.request().url()).pathname.split('/').at(-1);
    if (action === 'logout') {
      signedIn = false;
      await route.fulfill({ status: 204 });
      return;
    }
    if (action === 'google') signedIn = true;
    if (!signedIn) {
      await route.fulfill({
        status: 401,
        json: { success: false, error: { code: 'AUTH_REQUIRED', message: 'Accede con Google' } },
      });
      return;
    }
    await route.fulfill({
      json: {
        success: true,
        data: {
          accessToken: 'test-access-only',
          expiresIn: 900,
          user: { id: 'test-user', displayName, avatarUrl: null },
        },
        meta: null,
      },
    });
  });
  await page.route('**/api/backend?*', async (route) => {
    const path = new URL(route.request().url()).searchParams.get('path') || '';
    if (failCatalog && (path.includes('/stands') || path.endsWith('/map'))) {
      await route.fulfill({
        status: 502,
        json: {
          success: false,
          error: { code: 'UPSTREAM_UNAVAILABLE', message: 'No pudimos conectar con la feria.' },
        },
      });
      return;
    }
    if (staffState?.visited) visited = true;
    let data: unknown = [];
    if (path === '/auth/me') data = { id: 'test-user', profile: { displayName, avatarUrl: null } };
    else if (path === '/me/profile') {
      if (route.request().method() === 'PATCH')
        displayName = route.request().postDataJSON().displayName;
      data = {
        id: 'test-user',
        displayName,
        fullName: null,
        avatarUrl: null,
        phone: null,
        bio: null,
        locale: null,
      };
    } else if (path.includes('/check-ins')) {
      checkins.push(route.request().postDataJSON());
      visited = true;
      data = {
        checkinId: 'c1',
        visitId: 'v1',
        isFirstVisit: true,
        dailyDuplicate: checkins.length > 1,
        pointsAwarded: checkins.length > 1 ? 0 : 50,
        scoreAwarded: 50,
      };
    } else if (path.endsWith('/gamification'))
      data = {
        pointsBalance: visited ? 67 : 17,
        rankingScore: visited ? 92 : 42,
        level: { number: 2, name: 'Viajero', nextLevelScore: 300 },
      };
    else if (path.endsWith('/visits'))
      data = visited
        ? [
            {
              visitId: 'v1',
              standId,
              standName: 'Café Altiplano',
              boothCode: 'A-01',
              visitedAt: new Date().toISOString(),
              pointsAwarded: 50,
              scoreAwarded: 50,
            },
          ]
        : [];
    else if (path.endsWith('/favorites')) data = [...favoriteIds].map((id) => ({ standId: id }));
    else if (path.endsWith('/favorite')) {
      const id = path.split('/')[2];
      if (route.request().method() === 'POST') favoriteIds.add(id);
      else favoriteIds.delete(id);
      data = null;
    } else if (path.endsWith('/streak')) data = { currentStreak: 2, bestStreak: 3, days: [] };
    else if (path.startsWith('/me/qr'))
      data = {
        qrId: 'qr1',
        eventId,
        token: 'test-personal-qr-issued-by-server',
        issuedAt: new Date().toISOString(),
      };
    else if (path.includes('/activities?'))
      data = [
        {
          id: 'ac000000-0000-4000-8000-000000000001',
          title: 'Taller de café',
          description: 'Aprende sobre café de altura',
          startsAt: null,
          endsAt: null,
          status: 'published',
        },
      ];
    else if (path.startsWith('/activities/') && path.endsWith('/register'))
      data = {
        id: 'at000000-0000-4000-8000-000000000001',
        activityId: 'ac000000-0000-4000-8000-000000000001',
        status: 'registered',
      };
    else if (path.includes('/leaderboard?'))
      data = [
        {
          position: 1,
          userId: 'test-user',
          displayName,
          avatarUrl: null,
          rankingScore: 42,
          level: 2,
        },
      ];
    else if (path.startsWith(`/events/${eventId}/stands`)) data = stands;
    else if (path === `/stands/${standId}`) data = stands[0];
    else if (path.endsWith('/map'))
      data = {
        version: 1,
        floors: [
          {
            id: floorId,
            code: 'A',
            name: 'Pabellón de pruebas',
            levelLabel: 'Planta baja',
            viewBox: '0 0 1000 600',
            outline: 'M0 0H1000V600H0Z',
            svgUrl: null,
            structures: [
              {
                id: 'entry',
                kind: 'area',
                path: 'M450 260H550V340H450Z',
                label: 'Ingreso',
                labelX: 500,
                labelY: 300,
              },
            ],
            zones: [],
            pois: [],
            stands: [
              {
                standId,
                displayName: 'Café Altiplano',
                boothCode: 'A-01',
                x: 0.2,
                y: 0.4,
                width: 0.15,
                height: 0.15,
                rotation: 0,
                categories: [],
              },
            ],
          },
        ],
      };
    await route.fulfill({
      json: {
        success: true,
        data,
        meta: path.includes('/stands?') ? { page: 1, limit: 100, total: 2, totalPages: 1 } : null,
      },
    });
  });
  return checkins;
}
test('Descubre live usa el catálogo y no publica un menú o precio inventado', async ({ page }) => {
  await setup(page, true);
  await page.goto('/discover?section=comer');
  await page.getByRole('button', { name: /Café Altiplano/ }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByText('Este expositor todavía no publicó su menú.', { exact: false }),
  ).toBeVisible();
  await expect(page.locator('.menu-items')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cerrar ventana' }).click();
  await expect(page.getByText('Restaurantes y menús de ejemplo.')).toHaveCount(0);
  await page.goto('/profile');
  await expect(page.getByRole('link', { name: 'Misiones y progreso', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mis premios', exact: true })).toBeVisible();
});

test('QR muestra el pase y actualiza solo tras confirmación del personal', async ({ page }) => {
  const staff = { visited: false };
  const requests = await setup(page, false, false, false, staff);
  await page.goto('/scan');
  await expect(page.getByRole('heading', { name: 'Muéstralo en el stand' })).toBeVisible();
  await expect(page.locator('.qr-paper svg')).toHaveCount(1);
  await expect(page.locator('.app-header .points-pill')).toHaveText('17');
  await expect(page.getByRole('button', { name: /NFC/ })).toHaveCount(0);
  expect(await page.evaluate(() => !!(window as any).__reader)).toBe(false);
  // External staff confirmation is a fixture, never a visitor-created check-in.
  staff.visited = true;
  await expect(page.locator('.app-header .points-pill')).toHaveText('67', { timeout: 7000 });
  expect(requests).toHaveLength(0);
  await page.goto('/profile');
  await expect(
    page.locator('main').getByRole('link').filter({ hasText: 'Café Altiplano' }),
  ).toBeVisible();
});

test('QR guardado puede mostrarse offline sin simular confirmaciones ni NFC', async ({
  page,
  context,
}) => {
  const requests = await setup(page);
  await page.goto('/scan');
  await expect(page.locator('.qr-paper svg')).toHaveCount(1);
  await context.setOffline(true);
  await expect(page.locator('.qr-paper svg')).toHaveCount(1);
  await expect(page.locator('.app-header .points-pill')).toHaveText('17');
  expect(requests).toHaveLength(0);
  expect(await page.evaluate(() => !!(window as any).__reader)).toBe(false);
  await context.setOffline(false);
  await expect(page.locator('.app-header .points-pill')).toHaveText('17');
});

test('los enlaces identifican un stand pero no acreditan visitas y NFC redirige al QR', async ({
  page,
}) => {
  const requests = await setup(page);
  await page.goto('/e/' + eventId + '/s/' + standId);
  await expect(page.getByRole('heading', { name: 'Muéstralo en el stand' })).toBeVisible();
  await expect(page.getByText('En Café Altiplano', { exact: true })).toBeVisible();
  expect(requests).toHaveLength(0);
  await page.goto('/nfc-test');
  await expect(page).toHaveURL(/\/scan$/);
  await expect(page.locator('.qr-paper svg')).toHaveCount(1);
  expect(await page.evaluate(() => !!(window as any).__reader)).toBe(false);
  expect(requests).toHaveLength(0);
});

test('Google, QR firmado, favoritos y cierre de sesión sin datos privados', async ({ page }) => {
  await setup(page, true);
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Continuar con Google' }).click();
  await expect(page.getByText('Ana Visitante', { exact: true })).toBeVisible();
  await page.goto('/my-qr');
  await expect(page.getByRole('img', { name: 'Tu QR personal de Fexpo' })).toBeVisible();
  await page.goto(`/stands/${standId}`);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Guardado', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar sesión y limpiar dispositivo' }).click();
  await expect(page.getByRole('button', { name: 'Continuar con Google' })).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('test-access');
  const accountKeys = await page.evaluate(
    () =>
      new Promise<IDBValidKey[]>((resolve, reject) => {
        const open = indexedDB.open('keyval-store');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const read = db.transaction('keyval').objectStore('keyval').getAllKeys();
          read.onsuccess = () => {
            resolve(read.result.filter((key) => String(key).startsWith('fexpo-account-v1:')));
            db.close();
          };
          read.onerror = () => {
            reject(read.error);
            db.close();
          };
        };
      }),
  );
  expect(accountKeys).toEqual([]);
  await page.goto('/my-qr');
  await expect(page.getByRole('link', { name: 'Acceder con Google' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Tu QR personal de Fexpo' })).toHaveCount(0);
});
test('salir sin red impide restaurar automáticamente la cuenta al recargar', async ({ page }) => {
  await setup(page);
  await page.route('**/api/session/logout', (route) => route.abort('internetdisconnected'));
  await page.goto('/profile');
  await expect(page.getByText('Ana Visitante', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar sesión y limpiar dispositivo' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Continuar con Google' })).toBeVisible();
  await expect(page.getByText('Ana Visitante', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Continuar con Google' }).click();
  await expect(page.getByText('Ana Visitante', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('fexpo-session-closed'))).toBeNull();
});
test('backend caído: no sustituye el catálogo por expositores ficticios', async ({ page }) => {
  await setup(page, false, true);
  await page.goto('/stands');
  await expect(page.getByText('Conexión pendiente')).toBeVisible();
  await expect(page.getByText('Altura Labs', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reintentar conexión' })).toBeVisible();
});
test('sin Web NFC muestra Mi QR y nunca inventa una visita', async ({ page }) => {
  const requests = await setup(page);
  await page.addInitScript(() => {
    delete window.NDEFReader;
  });
  await page.goto('/scan');
  await expect(page.locator('.qr-paper svg')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Leer tarjeta NFC' })).toHaveCount(0);
  expect(requests).toHaveLength(0);
});
test('audio offline válido y ausencia de caché de API privada', async ({ page, context }) => {
  await setup(page);
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  const report = await page.evaluate(async () => {
    const files = ['sonido-05.mp3', 'sonido-07.mp3'];
    const audio = new OfflineAudioContext(1, 44100, 44100);
    const clips = [];
    for (const file of files) {
      const response = await fetch(`/assets/audio/${file}`);
      const buffer = await audio.decodeAudioData(await response.arrayBuffer());
      clips.push({ file, status: response.status, duration: buffer.duration });
    }
    const urls = (
      await Promise.all(
        (await caches.keys()).map(async (key) =>
          (await (await caches.open(key)).keys()).map((request) => request.url),
        ),
      )
    ).flat();
    return { clips, apiCached: urls.some((url) => new URL(url).pathname.startsWith('/api/')) };
  });
  expect(report.apiCached).toBe(false);
  expect(report.clips.every((clip) => clip.status === 200 && clip.duration > 0)).toBe(true);
  await context.setOffline(false);
});
test('catálogo horizontal, categoría completa, búsqueda y guardado', async ({ page }) => {
  await setup(page);
  await page.goto('/stands');
  await expect(
    page
      .locator('.poster-rail')
      .first()
      .getByRole('link', { name: /Café Altiplano/ }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Gastronomía Ver todos' }).click();
  await expect(
    page.locator('.poster-grid').getByRole('link', { name: /Café Altiplano/ }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /TecnoAndes/ })).toHaveCount(0);
  await page.getByRole('link', { name: /Café Altiplano/ }).click();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Guardado', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goto('/stands');
  await page.getByRole('searchbox', { name: 'Buscar stands y empresas' }).fill('tecno');
  await expect(page.getByRole('link', { name: /TecnoAndes/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Café Altiplano/ })).toHaveCount(0);
});
test('editar el nombre valida, guarda y persiste al recargar', async ({ page }) => {
  await setup(page);
  await page.goto('/profile');
  await expect(page.getByText('Ana Visitante', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Editar mi nombre' }).click();
  await page.getByRole('textbox', { name: 'Nombre visible' }).fill('   ');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Escribe un nombre');
  await page.getByRole('textbox', { name: 'Nombre visible' }).fill('  Ana QA  ');
  const patch = page.waitForRequest(
    (r) => r.method() === 'PATCH' && new URL(r.url()).searchParams.get('path') === '/me/profile',
  );
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  expect((await patch).postDataJSON()).toEqual({ displayName: 'Ana QA' });
  await expect(page.getByText('Ana QA', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Ana QA', { exact: true })).toBeVisible();
});
test('servicios bloqueados muestran ejemplos sin registrar actividades', async ({ page }) => {
  await setup(page);
  const mutations: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().includes('/api/backend')) mutations.push(r.url());
  });
  await page.goto('/stands/' + standId);
  for (const name of ['Ofertas', 'Dinámicas', 'Catálogo']) {
    await page.getByRole('tab', { name, exact: true }).click();
    await expect(page.getByText('Módulo no habilitado')).toBeVisible();
    await expect(page.getByText('Vista de ejemplo')).toBeVisible();
  }
  expect(mutations).toEqual([]);
});
test('conexión comercial requiere consentimiento y confirma la respuesta real', async ({
  page,
}) => {
  await setup(page);
  const leads: Record<string, unknown>[] = [];
  await page.route('**/api/backend?*', async (route) => {
    if (!new URL(route.request().url()).searchParams.get('path')?.endsWith('/leads'))
      return route.fallback();
    leads.push(route.request().postDataJSON());
    await route.fulfill({ json: { success: true, data: { id: 'lead-test-1' }, meta: null } });
  });
  await page.goto('/stands/' + standId);
  await page.getByRole('button', { name: 'Conectar con la empresa' }).click();
  await expect(page.getByRole('button', { name: 'Enviar interés comercial' })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Correo de contacto' }).fill('ana@example.test');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Enviar interés comercial' }).click();
  await expect(page.getByRole('button', { name: 'Interés comercial enviado' })).toBeDisabled();
  expect(leads).toHaveLength(1);
  expect(leads[0]).toMatchObject({
    contact_name: 'Ana Visitante',
    contact_email: 'ana@example.test',
    consent_given: true,
  });
  expect(
    JSON.stringify(await page.evaluate(() => ({ ...localStorage, ...sessionStorage }))),
  ).not.toContain('ana@example.test');
});
test('un fallo de conexión comercial no muestra una confirmación falsa', async ({ page }) => {
  await setup(page);
  await page.route('**/api/backend?*', async (route) => {
    if (!new URL(route.request().url()).searchParams.get('path')?.endsWith('/leads'))
      return route.fallback();
    await route.fulfill({
      status: 503,
      json: { success: false, error: { code: 'UNAVAILABLE', message: 'No disponible.' } },
    });
  });
  await page.goto('/stands/' + standId);
  await page.getByRole('button', { name: 'Conectar con la empresa' }).click();
  await page.getByRole('textbox', { name: 'Correo de contacto' }).fill('ana@example.test');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Enviar interés comercial' }).click();
  await expect(page.getByRole('alert')).toContainText('No disponible');
  await expect(page.getByRole('button', { name: 'Interés comercial enviado' })).toHaveCount(0);
});
test('mapa, ranking y QR personal usan datos del servidor', async ({ page }) => {
  await setup(page);
  await page.goto('/map');
  await page.getByRole('textbox', { name: 'Buscar stands y empresas' }).fill('tecno');
  await expect(page.locator('.stand-result').filter({ hasText: 'TecnoAndes' })).toBeVisible();
  await expect(page.locator('.stand-result').filter({ hasText: 'Café Altiplano' })).toHaveCount(0);
  await page.goto('/missions');
  await expect(page.getByRole('list', { name: 'Ranking del evento' })).toContainText(
    'Ana Visitante',
  );
  await page.goto('/my-qr');
  await expect(page.getByRole('img', { name: 'Tu QR personal de Fexpo' })).toBeVisible();
  const refresh = page.waitForRequest(
    (r) => new URL(r.url()).searchParams.get('path')?.startsWith('/me/qr?') === true,
  );
  await page.getByRole('button', { name: 'Actualizar QR' }).click();
  await refresh;
  await expect(page.getByRole('img', { name: 'Tu QR personal de Fexpo' })).toBeVisible();
});
test('el mapa publicado ofrece el visor 3D y conserva la vista 2D y la ficha real', async ({
  page,
}) => {
  const checkins = await setup(page);
  const plan = PLAN_GEOMETRY[0];
  const lot = PLAN_LOTS[plan.id].find(([code]) => Number(code) === 1)!;
  await page.route('**/api/backend?*', async (route) => {
    if (new URL(route.request().url()).searchParams.get('path') !== `/events/${eventId}/map`)
      return route.fallback();
    await route.fulfill({
      json: {
        success: true,
        data: {
          version: 1,
          floors: [
            {
              id: floorId,
              code: 'R-PB',
              name: plan.name,
              levelLabel: plan.level,
              viewBox: plan.viewBox,
              outline: plan.outline,
              svgUrl: null,
              zones: [],
              pois: [],
              structures: plan.structures.map((item, index) => ({
                id: `area-${index}`,
                kind: 'area',
                path: item.path,
                label: item.label || null,
                labelX: item.x ?? null,
                labelY: item.y ?? null,
              })),
              stands: [
                {
                  standId,
                  displayName: 'Café Altiplano',
                  boothCode: 'A-01',
                  x: (lot[1] + lot[3] / 2) / 800,
                  y: (lot[2] + lot[4] / 2 - 90) / 630,
                  width: lot[3] / 800,
                  height: lot[4] / 630,
                  rotation: 0,
                  categories: [],
                },
              ],
            },
          ],
        },
      },
    });
  });
  await page.goto('/map');
  await expect(page.getByRole('region', { name: 'Mapa interactivo FIPAZ' })).toBeVisible();
  await expect(page.locator('.campus-overview')).toBeVisible();
  await page.locator('.building-chips').getByRole('button', { name: 'Rojo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Baja', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: '2D', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await expect(page.locator('[data-campus-canvas]')).toHaveAttribute('data-plan-id', plan.id);
  await expect(page.locator('[data-campus-canvas]')).toHaveAttribute('data-lot-count', '51');
  await expect(page.getByRole('button', { name: 'Girar mapa' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ver Café Altiplano, stand A-01/ })).toBeVisible();
  await expect(page.getByText('Altura Labs', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '2D', exact: true }).click();
  await expect(page.getByLabel('Plano de Internacional I')).toBeVisible();
  await expect(page.locator('.indoor-svg [data-lot]')).toHaveCount(51);
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await page.goto(`/map?stand=${standId}&view=3d`);
  await expect(page.locator('.indoor-selection')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ubicarme con NFC' })).toHaveCount(0);
  await page.getByRole('button', { name: /Ver Café Altiplano, stand A-01/ }).click();
  await expect(page.locator('.stand-bottom-sheet')).toBeVisible();
  expect(checkins).toHaveLength(0);
  await page.getByRole('link', { name: 'Ver perfil', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/stands/${standId}$`));
});
test('invitados y enlaces inválidos no acreditan visitas ni muestran QR privado', async ({
  page,
}) => {
  const requests = await setup(page, true);
  await page.goto('/my-qr');
  await expect(page.getByRole('link', { name: 'Acceder con Google' })).toBeVisible();
  await page.goto('/scan');
  await expect(page.getByRole('link', { name: 'Acceder con Google', exact: true })).toBeVisible();
  await page.goto('/e/otra-feria/s/' + standId);
  await expect(page.getByText('Esta tarjeta pertenece a otra feria')).toBeVisible();
  await page.goto('/stands/id-no-valido');
  await expect(page.getByText('El identificador del stand no es válido.')).toBeVisible();
  expect(requests).toHaveLength(0);
});
for (const width of [320, 390, 1440])
  for (const theme of ['light', 'dark'])
    test(`interfaz conectada sin desbordamiento ${theme} ${width}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await setup(page);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/profile');
      await page
        .getByRole('button', { name: theme === 'light' ? 'Claro' : 'Oscuro', exact: true })
        .click();
      for (const path of [
        '/',
        '/map',
        '/scan',
        '/missions',
        '/profile',
        '/stands',
        '/my-qr',
        '/notifications',
        `/stands/${standId}`,
        '/rewards',
      ]) {
        await page.goto(path);
        await expect(page.locator('.page')).toBeVisible();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
          path,
        ).toBe(true);
        expect(
          await page.evaluate(
            () => [...document.images].filter((i) => i.complete && !i.naturalWidth).length,
          ),
          path,
        ).toBe(0);
        if (
          width === 390 &&
          ['/', '/map', '/scan', '/missions', '/profile', `/stands/${standId}`].includes(path)
        ) {
          await expect(page.locator('.app-header .points-pill')).toHaveText('17');
          await page.screenshot({
            path: `test-results/screenshots/integration/${theme}-${path === '/' ? 'home' : path.startsWith('/stands/') ? 'stand' : path.slice(1)}.png`,
            fullPage: true,
          });
        }
        if (width === 1440 && path === '/profile')
          await page.screenshot({
            path: `test-results/screenshots/integration/${theme}-desktop.png`,
            fullPage: true,
          });
      }
      expect(errors).toEqual([]);
    });

test('primer acceso pregunta intereses, los recuerda y separa otra cuenta', async ({ page }) => {
  await setup(page, false, false, true);
  await page.addInitScript(() => {
    if (!localStorage.getItem('fexpo-interests-v1'))
      localStorage.setItem(
        'fexpo-interests-v1',
        JSON.stringify({
          version: 1,
          state: {
            byVisitor: {
              'live:e0000000-0000-4000-8000-000000000001:otra-cuenta': {
                categories: ['health'],
                completed: true,
              },
            },
          },
        }),
      );
  });
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: '¿Qué te interesa descubrir?' })).toBeVisible();
  await page.getByRole('button', { name: 'Tecnología', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar intereses', exact: true }).click();
  await expect(page.locator('.offer-rail')).toContainText('Asesoría inicial sin costo');
  await expect(page.locator('.offer-rail')).not.toContainText('Consulta nuestros packs');
  await page.reload();
  await expect(page.getByRole('dialog', { name: '¿Qué te interesa descubrir?' })).toHaveCount(0);
  await expect(page.locator('.offer-rail')).toContainText('Asesoría inicial sin costo');
  const preferences = await page.evaluate(
    () => JSON.parse(localStorage.getItem('fexpo-interests-v1')!).state.byVisitor,
  );
  expect(preferences['live:e0000000-0000-4000-8000-000000000001:otra-cuenta'].categories).toEqual([
    'health',
  ]);
  expect(preferences['live:e0000000-0000-4000-8000-000000000001:test-user'].categories).toEqual([
    'technology',
  ]);
});
test('las ofertas se recorren con botones y gesto, y abren el stand', async ({ page }) => {
  await setup(page);
  await page.goto('/');
  await page.locator('.offers-heading .shelf-heading').click();
  await expect(page.getByRole('dialog', { name: 'Descubre las ofertas' })).toBeVisible();
  await expect(page.locator('.offer-browser-controls')).toContainText('1 de 2');
  await page.getByRole('button', { name: 'Siguiente oferta' }).click();
  await expect(page.locator('.offer-browser-controls')).toContainText('2 de 2');
  const box = (await page.locator('.offer-swipe-stage').boundingBox())!;
  await page.mouse.move(box.x + 35, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 35, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator('.offer-browser-controls')).toContainText('1 de 2');
  await page.locator('.offer-swipe-stage .offer-card').click();
  await expect(page).toHaveURL(new RegExp('/stands/' + standId + '$'));
  await expect(page.getByRole('heading', { name: 'Café Altiplano' })).toBeVisible();
});
test('misiones ofrece insignias horizontales y el tema comunica color oscuro', async ({ page }) => {
  await setup(page);
  await page.goto('/missions');
  await expect(page.getByRole('region', { name: 'Insignias de recorrido' })).toBeVisible();
  await page.getByRole('button', { name: /Primer encuentro/ }).click();
  await expect(page.getByRole('dialog', { name: 'Primer encuentro' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Primer encuentro' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await page.getByRole('button', { name: 'Cerrar ventana' }).click();
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Oscuro', exact: true }).click();
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#101b27');
});

test('agenda live usa actividades publicadas, hora de La Paz y no anuncia ejemplos', async ({
  page,
}) => {
  await setup(page, true);
  await page.route('**/api/backend?*', async (route) => {
    const path = new URL(route.request().url()).searchParams.get('path') || '';
    if (!path.startsWith(`/events/${eventId}/activities?`)) return route.fallback();
    await route.fulfill({
      json: {
        success: true,
        data: [
          {
            id: 'real-activity',
            eventId,
            standId,
            title: 'Presentación publicada por el organizador',
            description: 'Actividad del servidor',
            startsAt: '2026-11-02T02:30:00Z',
            endsAt: null,
            status: 'scheduled',
            locationText: 'Escenario principal',
          },
          {
            id: 'tomorrow',
            eventId,
            standId: null,
            title: 'Actividad del lunes',
            description: null,
            startsAt: '2026-11-02T17:00:00-04:00',
            endsAt: null,
            status: 'scheduled',
          },
          {
            id: 'draft',
            eventId,
            title: 'Borrador que no debe mostrarse',
            description: null,
            startsAt: '2026-11-01T17:00:00-04:00',
            endsAt: null,
            status: 'draft',
          },
        ],
        meta: { page: 1, limit: 100, total: 3, totalPages: 1 },
      },
    });
  });
  await page.goto('/events/event-fipaz-2026?day=2026-11-01');
  await expect(
    page.getByRole('heading', { name: 'Presentación publicada por el organizador' }),
  ).toBeVisible();
  await expect(page.locator('.agenda-time').first()).toContainText('22:30');
  await expect(page.getByText('Escenario principal', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Borrador que no debe mostrarse')).toHaveCount(0);
  await expect(
    page.getByText('Actividades de ejemplo para explorar el diseño.', { exact: false }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'lunes, 2 de noviembre', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Actividad del lunes' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Presentación publicada por el organizador' }),
  ).toHaveCount(0);
  await page.goto('/');
  await expect(page.locator('.advertisement')).toHaveCount(1);
  await expect(page.locator('.poster-municipal')).toContainText('Sector municipal');
  await expect(page.getByText('Ejemplo · Publicidad', { exact: true })).toHaveCount(0);
});

test('agenda caída permite reintentar sin presentar una cartelera ficticia', async ({ page }) => {
  await setup(page, true);
  let requests = 0;
  await page.route('**/api/backend?*', async (route) => {
    const path = new URL(route.request().url()).searchParams.get('path') || '';
    if (!path.startsWith(`/events/${eventId}/activities?`)) return route.fallback();
    requests++;
    await route.fulfill(
      requests === 1
        ? {
            status: 503,
            json: { success: false, error: { code: 'UNAVAILABLE', message: 'Unavailable' } },
          }
        : { json: { success: true, data: [], meta: null } },
    );
  });
  await page.goto('/events/event-fipaz-2026?day=2026-11-07');
  await expect(page.getByRole('alert')).toContainText('No pudimos actualizar la agenda');
  await expect(page.getByRole('heading', { name: 'La noche también se disfruta' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(
    page.getByText('Aún no hay actividades publicadas para este día.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver novedades oficiales' })).toHaveAttribute(
    'href',
    'https://www.facebook.com/feriafipaz/',
  );
});
