import { render, screen } from '@testing-library/react';
import { ProgressIndicator } from '../../src/components/ProgressIndicator';

describe('ProgressIndicator', () => {
  it('non renderizza nulla quando lo stato è idle', () => {
    render(<ProgressIndicator status="idle" />);
    expect(screen.queryByTestId('progress-indicator')).not.toBeInTheDocument();
  });

  it('mostra lo spinner e il testo corretto durante processing', () => {
    render(<ProgressIndicator status="processing" />);
    expect(screen.getByTestId('progress-spinner')).toBeInTheDocument();
    expect(screen.getByText('Elaborazione in corso...')).toBeInTheDocument();
  });

  it('mostra il messaggio di successo quando lo stato è success', () => {
    render(<ProgressIndicator status="success" />);
    expect(screen.getByText('Conversione completata')).toBeInTheDocument();
  });

  it('mostra il messaggio di errore specifico quando fornito', () => {
    render(<ProgressIndicator status="error" errorMessage="Il file è corrotto." />);
    expect(screen.getByText('Il file è corrotto.')).toBeInTheDocument();
  });

  it('mostra un messaggio di errore generico se non ne viene fornito uno specifico', () => {
    render(<ProgressIndicator status="error" />);
    expect(screen.getByText('Si è verificato un errore')).toBeInTheDocument();
  });
});