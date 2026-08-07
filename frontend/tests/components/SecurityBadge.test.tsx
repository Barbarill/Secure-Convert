import { render, screen } from '@testing-library/react';
import { SecurityBadge } from '../../src/components/SecurityBadge';

describe('SecurityBadge', () => {
  it('mostra il messaggio corretto per la modalità locale', () => {
    render(<SecurityBadge mode="local" />);
    const badge = screen.getByTestId('security-badge');

    expect(badge).toHaveAttribute('data-mode', 'local');
    expect(badge).toHaveTextContent('il file non lascia il tuo dispositivo');
  });

  it('mostra il messaggio corretto per la modalità server', () => {
    render(<SecurityBadge mode="server" />);
    const badge = screen.getByTestId('security-badge');

    expect(badge).toHaveAttribute('data-mode', 'server');
    expect(badge).toHaveTextContent('cancellato automaticamente');
  });
});