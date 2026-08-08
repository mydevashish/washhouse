import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PhoneNumericKeypad } from '@/features/partner-shop-floor/components/phone-numeric-keypad';

describe('PhoneNumericKeypad', () => {
  it('appends digits and exposes a11y labels', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    const { rerender } = render(<PhoneNumericKeypad value="" onChange={onChange} />);

    expect(screen.getByRole('group', { name: /phone number keypad/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Digit 9' }));
    expect(onChange).toHaveBeenCalled();

    rerender(<PhoneNumericKeypad value="+919876543210" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Digit 1' }));
    // Max 10 national digits — should not append past full mobile.
    const last = onChange.mock.calls.at(-1)?.[0] as string;
    expect(last.replace(/\D/g, '').length).toBeLessThanOrEqual(12);
  });

  it('clears and backspaces', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<PhoneNumericKeypad value="+9198" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /delete last digit/i }));
    expect(onChange).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /clear phone number/i }));
    expect(onChange).toHaveBeenCalledWith('');
  });
});
