import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ClothWallTileButton } from '@/features/partner-shop-floor/components/cloth-wall-tile';
import type { ClothWallTile } from '@/features/partner-shop-floor/lib/cloth-wall-items';
import { WASHHOUSE_CATALOG_PHOTOS } from '@/features/marketing/catalog/washhouse-catalog-photos';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

const shirtTile: ClothWallTile = {
  id: 'catalog:shirt-1',
  source: 'catalog',
  catalogItemId: 'shirt-1',
  slug: 'men-shirt-tshirt',
  name: 'Shirt / T-shirt',
  hinglish: 'Shirt',
  english: 'Shirt / T-shirt',
  category: 'men',
  photo: WASHHOUSE_CATALOG_PHOTOS.shirt,
  priceMode: 'dual',
  allowsPress: true,
  dryCleanInr: 69,
  pressInr: 15,
  priceInr: null,
  defaultProcess: 'dry_clean',
};

describe('ClothWallTileButton', () => {
  it('tapping photo increments qty via onIncrement and shows badge', async () => {
    const user = userEvent.setup();
    const onIncrement = jest.fn();
    const onDecrement = jest.fn();

    const { rerender } = render(
      <ClothWallTileButton
        tile={shirtTile}
        quantity={0}
        process="dry_clean"
        onIncrement={onIncrement}
        onDecrement={onDecrement}
      />,
    );

    await user.click(screen.getByRole('button', { name: /add shirt/i }));
    expect(onIncrement).toHaveBeenCalledTimes(1);

    rerender(
      <ClothWallTileButton
        tile={shirtTile}
        quantity={2}
        process="dry_clean"
        onIncrement={onIncrement}
        onDecrement={onDecrement}
      />,
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    await user.click(screen.getByTestId('cloth-wall-dec-catalog:shirt-1'));
    expect(onDecrement).toHaveBeenCalledTimes(1);
  });
});
