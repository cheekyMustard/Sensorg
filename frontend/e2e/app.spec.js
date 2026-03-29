// @ts-check
import { test, expect } from '@playwright/test';

// The frontend uses VITE_API_URL=http://localhost:3000, so all API requests
// go to port 3000. We use explicit base-URL patterns (not **-globs) to avoid
// accidentally intercepting Vite's own module-server paths like /src/api/requests.js.
const API = 'http://localhost:3000';

// ── Fixture data ──────────────────────────────────────────────────────────

const USER = { id: 'user-1', username: 'alice', role: 'shopUser', shop_id: 'shop-1' };
const MGR  = { id: 'user-2', username: 'bob',   role: 'manager',  shop_id: 'shop-1' };

const SHOPS = [
  { id: 'shop-1', name: 'Arcos' },
  { id: 'shop-2', name: 'THB'   },
];

function makeRequest(overrides = {}) {
  return {
    id:                  'req-1',
    from_shop_id:        'shop-1',
    to_shop_id:          'shop-2',
    from_shop_name:      'Arcos',
    to_shop_name:        'THB',
    reason:              'rental',
    status:              'open',
    date_rental:         '2026-04-01',
    created_at:          '2026-03-18T10:00:00Z',
    updated_at:          '2026-03-18T10:00:00Z',
    version:             1,
    bikes:               [{ id: 'bike-1', label: 'SG31-48-01' }],
    note:                null,
    brm_blocked:         false,
    created_by_user_id:  'user-1',
    updated_by_user_id:  null,
    ...overrides,
  };
}

const EMPTY_PAGES = { data: [], total: 0, hasMore: false };
const ONE_PAGE    = (req) => ({ data: [req], total: 1, hasMore: false });

// ── Helpers ───────────────────────────────────────────────────────────────

/** Inject a token so the app treats the browser as logged in, and mock /api/auth/me. */
async function mockAuth(page, user = USER) {
  await page.addInitScript(() => { localStorage.setItem('token', 'test-token'); });
  await page.route(`${API}/api/auth/me`, route => route.fulfill({ json: user }));
}

/** Mock all data endpoints with a full URL prefix to avoid matching Vite source files. */
async function mockAllData(page, requestsPage = EMPTY_PAGES) {
  await page.route(`${API}/api/requests*`, route => route.fulfill({ json: requestsPage }));
  await page.route(`${API}/api/notes*`,    route => route.fulfill({ json: [] }));
  await page.route(`${API}/api/tasks*`,    route => route.fulfill({ json: [] }));
  await page.route(`${API}/api/kb*`,       route => route.fulfill({ json: [] }));
  await page.route(`${API}/api/shops*`,    route => route.fulfill({ json: SHOPS }));
  await page.route(`${API}/api/push/*`,    route => route.fulfill({ status: 204, body: '' }));
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Login
// ─────────────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  test('renders login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'SensOrg' })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('successful login redirects to home and shows Deliveries section', async ({ page }) => {
    await page.route(`${API}/api/auth/login`, route =>
      route.fulfill({ json: { token: 'test-token', user: USER } })
    );
    await page.route(`${API}/api/auth/me`, route => route.fulfill({ json: USER }));
    await mockAllData(page);

    await page.goto('/login');
    await page.getByLabel('Username').fill('alice');
    await page.getByLabel('Password').fill('secret');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/');
    // Use the accordion button role to avoid matching "No active deliveries"
    await expect(page.getByRole('button', { name: /^Deliveries/ })).toBeVisible();
  });

  test('wrong credentials shows error message', async ({ page }) => {
    await page.route(`${API}/api/auth/login`, route =>
      route.fulfill({ status: 401, json: { error: 'Invalid credentials' } })
    );

    await page.goto('/login');
    await page.getByLabel('Username').fill('alice');
    await page.getByLabel('Password').fill('wrong');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toContainText('Invalid credentials');
  });

  test('unauthenticated access to / redirects to /login', async ({ page }) => {
    await page.route(`${API}/api/auth/me`, route =>
      route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    );
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. Home page
// ─────────────────────────────────────────────────────────────────────────

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
  });

  test('shows all four accordion sections', async ({ page }) => {
    await mockAllData(page);
    await page.goto('/');

    // Each section is an accordion <button> — use role to be unambiguous
    await expect(page.getByRole('button', { name: /^Deliveries/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Notes/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^What else can be done/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Nice to know/ })).toBeVisible();
  });

  test('shows "No active deliveries" when list is empty', async ({ page }) => {
    await mockAllData(page, EMPTY_PAGES);
    await page.goto('/');

    await expect(page.getByText('No active deliveries')).toBeVisible();
  });

  test('renders request card with route and bike chip', async ({ page }) => {
    await mockAllData(page, ONE_PAGE(makeRequest()));
    await page.goto('/');

    await expect(page.getByText('Arcos → THB')).toBeVisible();
    await expect(page.getByText('SG31-48-01')).toBeVisible();
  });

  test('badge shows request count when items exist', async ({ page }) => {
    await mockAllData(page, ONE_PAGE(makeRequest()));
    await page.goto('/');

    // Blue count badge next to the Deliveries header
    const badge = page.locator('span.bg-blue-100').first();
    await expect(badge).toContainText('1');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. Create delivery
// ─────────────────────────────────────────────────────────────────────────

test.describe('Create delivery', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await mockAllData(page);
  });

  test('FAB opens AddModal with type picker', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add new delivery' }).click();

    await expect(page.getByText('Add new…')).toBeVisible();
    await expect(page.getByText('Bike Delivery')).toBeVisible();
    // Use exact match to avoid hitting the "Notes" section header
    await expect(page.getByRole('button', { name: 'Note', exact: true })).toBeVisible();
  });

  test('selecting Bike Delivery shows the delivery form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add new delivery' }).click();
    await page.getByText('Bike Delivery').click();

    await expect(page.getByText('New Bike Delivery')).toBeVisible();
    // Labels in the form (no htmlFor, but text is unique in the modal)
    await expect(page.getByText('From', { exact: true })).toBeVisible();
    await expect(page.getByText('To', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create delivery' })).toBeVisible();
  });

  test('submitting form calls POST /api/requests and closes modal', async ({ page }) => {
    const newReq = makeRequest();
    let posted = false;

    // Override the generic GET mock for the exact POST URL
    await page.route(`${API}/api/requests`, async route => {
      if (route.request().method() === 'POST') {
        posted = true;
        await route.fulfill({ status: 201, json: newReq });
      } else {
        await route.fulfill({ json: ONE_PAGE(newReq) });
      }
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Add new delivery' }).click();
    await page.getByText('Bike Delivery').click();

    // Labels in AddModal have no htmlFor — select by index (From=0, To=1)
    await page.locator('select').nth(0).selectOption({ label: 'Arcos' });
    await page.locator('select').nth(1).selectOption({ label: 'THB' });

    await page.getByRole('button', { name: 'Create delivery' }).click();

    await expect(page.getByText('Add new…')).not.toBeVisible({ timeout: 5000 });
    expect(posted).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. Inline edit
// ─────────────────────────────────────────────────────────────────────────

test.describe('Inline edit', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
  });

  test('Edit button reveals date + reason fields', async ({ page }) => {
    await mockAllData(page, ONE_PAGE(makeRequest()));
    await page.goto('/');

    await page.getByRole('button', { name: 'Edit' }).click();

    // Labels in RequestCard also have no htmlFor — use element type selectors
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('Cancel exits edit mode without saving', async ({ page }) => {
    await mockAllData(page, ONE_PAGE(makeRequest()));
    await page.goto('/');

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible();
  });

  test('Save calls PATCH and exits edit mode', async ({ page }) => {
    const req = makeRequest();
    let patched = false;

    await page.route(`${API}/api/requests/${req.id}`, async route => {
      if (route.request().method() === 'PATCH') {
        patched = true;
        await route.fulfill({ json: { ...req, version: 2 } });
      }
    });
    await mockAllData(page, ONE_PAGE(req));
    await page.goto('/');

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible({ timeout: 5000 });
    expect(patched).toBe(true);
  });

  test('version conflict (409) shows Reload link', async ({ page }) => {
    const req = makeRequest();

    await page.route(`${API}/api/requests/${req.id}`, async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({ status: 409, json: { error: 'version conflict' } });
      }
    });
    await mockAllData(page, ONE_PAGE(req));
    await page.goto('/');

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Outdated')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. Status transitions
// ─────────────────────────────────────────────────────────────────────────

test.describe('Status transitions', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
  });

  test('"Take job" button appears for open request', async ({ page }) => {
    await mockAllData(page, ONE_PAGE(makeRequest({ status: 'open' })));
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Take job' })).toBeVisible();
  });

  test('"Take job" opens confirm dialog', async ({ page }) => {
    await mockAllData(page, ONE_PAGE(makeRequest({ status: 'open' })));
    await page.goto('/');

    await page.getByRole('button', { name: 'Take job' }).click();

    // Use heading role to avoid strict-mode clash with the dialog body text
    await expect(page.getByRole('heading', { name: 'Take this job?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Yes' })).toBeVisible();
  });

  test('confirming "Take job" calls POST /api/requests/:id/status', async ({ page }) => {
    const req = makeRequest({ status: 'open' });
    let statusPosted = false;

    await page.route(`${API}/api/requests/${req.id}/status`, async route => {
      statusPosted = true;
      await route.fulfill({ json: { ...req, status: 'in_progress', version: 2 } });
    });
    await mockAllData(page, ONE_PAGE(req));
    await page.goto('/');

    await page.getByRole('button', { name: 'Take job' }).click();
    await page.getByRole('button', { name: 'Yes' }).click();

    await expect(page.getByRole('heading', { name: 'Take this job?' })).not.toBeVisible({ timeout: 5000 });
    expect(statusPosted).toBe(true);
  });

  test('"Mark done" button appears for in_progress request (manager role)', async ({ page }) => {
    // Only driver/mechanic/manager/admin can transition in_progress → done
    await mockAuth(page, MGR);
    await mockAllData(page, ONE_PAGE(makeRequest({ status: 'in_progress' })));
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Mark done' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. Delete / cancel request
// ─────────────────────────────────────────────────────────────────────────

test.describe('Delete request', () => {
  test('manager sees delete icon on request card', async ({ page }) => {
    await mockAuth(page, MGR);
    await mockAllData(page, ONE_PAGE(makeRequest()));
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Delete request' })).toBeVisible();
  });

  test('clicking delete calls DELETE /api/requests/:id', async ({ page }) => {
    const req = makeRequest();
    let deleted = false;

    await page.route(`${API}/api/requests/${req.id}`, async route => {
      if (route.request().method() === 'DELETE') {
        deleted = true;
        await route.fulfill({ status: 204, body: '' });
      }
    });
    await mockAuth(page, MGR);
    await mockAllData(page, ONE_PAGE(req));
    await page.goto('/');

    await page.getByRole('button', { name: 'Delete request' }).click();
    expect(deleted).toBe(true);
  });
});
