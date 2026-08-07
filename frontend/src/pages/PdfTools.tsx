import { useCallback } from 'react';
import { ConversionCard } from '../components/ConversionCard';
import { usePdfConversion } from '../hooks/usePdfConversion';
import type { PdfWorkerRequest } from '../workers/pdf.worker';

export function PdfTools() {
  const compress = usePdfConversion();

  const buildCompressRequest = useCallback(
    (files: File[]): PdfWorkerRequest => ({ action: 'compress', file: files[0] }),
    []
  );

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>Strumenti PDF</h1>
      <p style={{ opacity: 0.7 }}>
        Tutte le operazioni qui sotto avvengono interamente nel tuo browser: nessun file viene
        caricato su un server.
      </p>

      <div style={{ marginTop: '1.5rem' }}>
        <ConversionCard
          title="Comprimi PDF"
          description="Riduce la dimensione del file rimuovendo ridondanze interne."
          acceptedExtensions={['pdf']}
          securityMode="local"
          status={compress.status}
          error={compress.error}
          result={compress.result}
          buildRequest={buildCompressRequest}
          runConversion={compress.runConversion}
          reset={compress.reset}
        />
      </div>
    </div>
  );
}