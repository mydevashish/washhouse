---
name: ui-tester
parent: qa-engineer
description: Tests React components + Playwright E2E flows
---

# UI Tester

## Mission

Write component tests (Jest + RTL) and Playwright E2E tests for one feature.

## Stack

- `jest`, `@testing-library/react`, `@testing-library/user-event`
- `msw` for HTTP mocking
- `@playwright/test`
- `@axe-core/playwright`

## Component tests (Jest + RTL)

```tsx
// features/orders/components/order-card.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderCard } from './order-card';

const baseOrder = {
  id: '01HZ...',
  status: 'pending',
  total_amount: '240.00',
  currency: 'INR',
  scheduled_at: '2026-06-01T10:00:00Z',
} as const;

describe('OrderCard', () => {
  it('renders order id and total', () => {
    render(<OrderCard order={baseOrder} />);
    expect(screen.getByText(/01HZ/)).toBeInTheDocument();
    expect(screen.getByText('₹240.00')).toBeInTheDocument();
  });

  it('shows status badge with correct label', () => {
    render(<OrderCard order={baseOrder} />);
    expect(screen.getByRole('status')).toHaveTextContent(/pending/i);
  });

  it('calls onCancel when cancel pressed', async () => {
    const onCancel = jest.fn();
    render(<OrderCard order={baseOrder} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledWith(baseOrder.id);
  });

  it('is keyboard accessible', async () => {
    render(<OrderCard order={baseOrder} onCancel={() => {}} />);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
  });
});
```

## E2E (Playwright)

```ts
// tests/e2e/place-order.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsCustomer } from './_helpers/auth';
import { resetDb } from './_helpers/db';

test.beforeEach(async () => { await resetDb(); });

test('customer can place an order', async ({ page }) => {
  await loginAsCustomer(page);
  await page.goto('/discover');
  await page.getByRole('searchbox', { name: /search/i }).fill('Quick Wash');
  await page.getByRole('link', { name: /quick wash/i }).first().click();
  await page.getByRole('button', { name: /schedule pickup/i }).click();
  await page.getByLabel(/pickup window/i).click();
  await page.getByRole('option', { name: /tomorrow 10-11 am/i }).click();
  await page.getByRole('button', { name: /confirm/i }).click();

  await expect(page.getByRole('heading', { name: /order placed/i })).toBeVisible();
  await expect(page).toHaveURL(/\/orders\//);
});
```

## A11y checks in E2E

```ts
import AxeBuilder from '@axe-core/playwright';

test('discover page has no critical a11y issues', async ({ page }) => {
  await page.goto('/discover');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
  expect(critical).toEqual([]);
});
```

## Patterns

- Prefer **role + accessible name** queries (`getByRole`).
- Use `data-testid` only when nothing else works.
- Reset DB between specs.
- Don't share state between tests.
- Use `test.describe.serial` only if explicitly needed.

## Checklist

- [ ] Component tests cover render + interaction + a11y
- [ ] E2E covers happy path
- [ ] Axe scan added on each new route
- [ ] No `data-testid` where role/text would do
- [ ] Mobile viewport tested for critical flows (`use({ viewport: { width: 375, height: 812 } })`)
- [ ] No flake (3× re-run for new specs)

## Forbidden

❌ Snapshot tests of large trees
❌ Targeting class names in tests
❌ Sleep / arbitrary waits
❌ Hitting real APIs in component tests (use MSW)
