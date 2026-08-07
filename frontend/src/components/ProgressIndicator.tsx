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
    <div data-testid="progress-indicator" data-status={status} role="status" style={{ marginTop: '1rem' }}>
      {status === 'processing' && (
        <div
          data-testid="progress-spinner"
          style={{
            width: '20px',
            height: '20px',
            border: '3px solid #eee',
            borderTopColor: '#D85A30',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      )}
      <span style={{ marginLeft: '0.5rem' }}>
        {status === 'error' && errorMessage ? errorMessage : STATUS_LABELS[status]}
      </span>
    </div>
  );
}