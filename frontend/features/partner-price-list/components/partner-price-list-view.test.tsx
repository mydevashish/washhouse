import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

import { PartnerPriceListView } from '@/features/partner-price-list/components/partner-price-list-view';
import {
  applySuggestedPartnerPrices,
  getPartnerPriceList,
  putPartnerPriceList,
} from '@/features/partner-price-list/api/partner-price-list';
import type { PartnerPriceListResponse } from '@/features/partner-price-list/types';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => true,
}));

jest.mock('@/features/partner-price-list/api/partner-price-list', () => ({
  getPartnerPriceList: jest.fn(),
  putPartnerPriceList: jest.fn(),
  applySuggestedPartnerPrices: jest.fn(),
}));

const mockedGet = getPartnerPriceList as jest.MockedFunction<typeof getPartnerPriceList>;
const mockedPut = putPartnerPriceList as jest.MockedFunction<typeof putPartnerPriceList>;
const mockedApply = applySuggestedPartnerPrices as jest.MockedFunction<
  typeof applySuggestedPartnerPrices
>;

const fixture: PartnerPriceListResponse = {
  offered_count: 0,
  total_catalog_items: 2,
  items: [
    {
      catalog_item_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      slug: 'wash-fold',
      name: 'Wash & Fold',
      category: 'laundry_by_kg',
      unit: 'kg',
      sort_order: 1,
      currency: 'INR',
      suggested_dry_clean_inr: null,
      suggested_press_inr: null,
      suggested_price_inr: '79.00',
      suggested_dry_clean_paise: null,
      suggested_press_paise: null,
      suggested_price_paise: 7900,
      dry_clean_inr: null,
      press_inr: null,
      price_inr: null,
      dry_clean_paise: null,
      press_paise: null,
      price_paise: null,
      is_offered: null,
      has_override: false,
      allows_press: false,
      price_mode: 'single',
    },
    {
      catalog_item_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      slug: 'men-shirt-tshirt',
      name: 'Shirt / T-shirt',
      category: 'men',
      unit: 'piece',
      sort_order: 10,
      currency: 'INR',
      suggested_dry_clean_inr: '69.00',
      suggested_press_inr: '15.00',
      suggested_price_inr: null,
      suggested_dry_clean_paise: 6900,
      suggested_press_paise: 1500,
      suggested_price_paise: null,
      dry_clean_inr: null,
      press_inr: null,
      price_inr: null,
      dry_clean_paise: null,
      press_paise: null,
      price_paise: null,
      is_offered: null,
      has_override: false,
      allows_press: true,
      price_mode: 'dual',
    },
  ],
};

function renderView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PartnerPriceListView />
    </QueryClientProvider>,
  );
}

describe('PartnerPriceListView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGet.mockResolvedValue(fixture);
    mockedPut.mockResolvedValue({
      ...fixture,
      offered_count: 1,
      items: [
        {
          ...fixture.items[0]!,
          price_inr: '85.00',
          price_paise: 8500,
          is_offered: true,
          has_override: true,
        },
        fixture.items[1]!,
      ],
    });
    mockedApply.mockResolvedValue({
      created: 2,
      skipped_existing: 0,
      total_active_catalog: 2,
    });
  });

  it('shows success toast after saving dirty prices', async () => {
    const user = userEvent.setup();
    renderView();

    expect(await screen.findByText('Garment price list')).toBeInTheDocument();
    expect(
      screen.getByText(/Your prices are what customers see/i),
    ).toBeInTheDocument();

    const rateInputs = await screen.findAllByPlaceholderText('79');
    await user.clear(rateInputs[0]!);
    await user.type(rateInputs[0]!, '85');

    const offered = screen.getAllByRole('checkbox');
    await user.click(offered[0]!);

    expect(await screen.findByTestId('price-list-save-bar')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /save prices/i }));

    await waitFor(() => {
      expect(mockedPut).toHaveBeenCalled();
    });
    expect(toast.success).toHaveBeenCalledWith('Price list saved');
  });

  it('shows success toast after applying suggested prices', async () => {
    const user = userEvent.setup();
    renderView();

    await screen.findByText('Garment price list');
    await user.click(screen.getByRole('button', { name: /apply suggested washhouse prices/i }));
    expect(await screen.findByText(/Apply suggested WashHouse prices\?/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^apply suggested prices$/i }));

    await waitFor(() => {
      expect(mockedApply).toHaveBeenCalled();
    });
    expect(toast.success).toHaveBeenCalledWith('Applied suggested prices to 2 items');
  });
});
