import type { ConversionStatus } from '../hooks/useConversion';

interface ProgressIndicatorProps {
  status: ConversionStatus;
  errorMessage?: string | null;
}

const STATUS_LABELS: Record<ConversionStatus, string> = {
  idle: '',
  processing: 'Elaborazione in corso...',
  success: 'Conversione completata',
  error: 'Si è verificato un errore',
};

export function ProgressIndicator({ status, errorMessage }: ProgressIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div data-testid="progress-indicator" data-status={status} role="status" className="progress-indicator">
      {status === 'processing' && <div data-testid="progress-spinner" className="spinner" />}
      <span>{status === 'error' && errorMessage ? errorMessage : STATUS_LABELS[status]}</span>
    </div>
  );
}