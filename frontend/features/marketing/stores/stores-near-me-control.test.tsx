/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { StoresNearMeControl } from '@/features/marketing/stores/stores-near-me-control';

describe('StoresNearMeControl', () => {
  it('renders idle Near me and requests on click', async () => {
    const user = userEvent.setup();
    const onRequest = jest.fn();
    const onClear = jest.fn();

    render(
      <StoresNearMeControl
        status="idle"
        errorMessage={null}
        onRequest={onRequest}
        onClear={onClear}
      />,
    );

    const button = screen.getByRole('button', { name: /near me/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.click(button);
    expect(onRequest).toHaveBeenCalledTimes(1);
    expect(onClear).not.toHaveBeenCalled();
  });

  it('shows Cancel while pending and clears on click', async () => {
    const user = userEvent.setup();
    const onClear = jest.fn();

    render(
      <StoresNearMeControl
        status="pending"
        errorMessage={null}
        onRequest={jest.fn()}
        onClear={onClear}
      />,
    );

    const button = screen.getByRole('button', { name: /cancel/i });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).not.toBeDisabled();
    await user.click(button);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('shows Near me · on when granted and clears on click', async () => {
    const user = userEvent.setup();
    const onRequest = jest.fn();
    const onClear = jest.fn();

    render(
      <StoresNearMeControl
        status="granted"
        errorMessage={null}
        onRequest={onRequest}
        onClear={onClear}
      />,
    );

    expect(screen.getByText(/sorted by distance from your location/i)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /near me · on/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await user.click(button);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onRequest).not.toHaveBeenCalled();
  });

  it('respects nearMeActive=false even when status is granted', () => {
    render(
      <StoresNearMeControl
        status="granted"
        nearMeActive={false}
        errorMessage={null}
        onRequest={jest.fn()}
        onClear={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /^near me$/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.queryByText(/sorted by distance/i)).not.toBeInTheDocument();
  });

  it('hides inline messages when hideMessages is set', () => {
    render(
      <StoresNearMeControl
        status="denied"
        errorMessage="Location access was denied. Search by area instead."
        hideMessages
        onRequest={jest.fn()}
        onClear={jest.fn()}
      />,
    );

    expect(screen.queryByText(/location access was denied/i)).not.toBeInTheDocument();
  });

  it('shows partial message when GPS is on but pins are missing', () => {
    render(
      <StoresNearMeControl
        status="granted"
        errorMessage={null}
        partialMessage="Location on, but store map pins are not published yet."
        onRequest={jest.fn()}
        onClear={jest.fn()}
      />,
    );

    expect(
      screen.getByText(/store map pins are not published yet/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/sorted by distance from your location/i)).not.toBeInTheDocument();
  });

  it('shows polite error when denied', async () => {
    const user = userEvent.setup();
    const onRequest = jest.fn();

    render(
      <StoresNearMeControl
        status="denied"
        errorMessage="Location access was denied. Search by area, or enable location in browser settings and try again."
        onRequest={onRequest}
        onClear={jest.fn()}
      />,
    );

    expect(screen.getByText(/location access was denied/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^near me$/i }));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it('shows polite error when unavailable', () => {
    render(
      <StoresNearMeControl
        status="unavailable"
        errorMessage="Location needs a secure connection (HTTPS). Search by area instead."
        onRequest={jest.fn()}
        onClear={jest.fn()}
      />,
    );

    expect(screen.getByText(/secure connection/i)).toBeInTheDocument();
  });
});
