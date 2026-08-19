import { useCallback } from 'react';
import { ConversionCard } from '../components/ConversionCard';
import { SplitPdfCard } from '../components/SplitPdfCard';
import { usePdfConversion } from '../hooks/usePdfConversion';
import type { PdfWorkerRequest } from '../workers/pdf.worker';

export function PdfTools() {
  const compress = usePdfConversion();
  const merge = usePdfConversion();
  const rotate = usePdfConversion();

  const buildCompressRequest = useCallback(
    (files: File[]): PdfWorkerRequest => ({ action: 'compress', file: files[0] }),
    []
  );

  const buildMergeRequest = useCallback(
    (files: File[]): PdfWorkerRequest => ({ action: 'merge', files }),
    []
  );

  // Nota: rotazione fissata a 90° orari per questo step.
  // Un selettore di gradi (90/180/270) verrà aggiunto in un mini-step dedicato,
  // dato che ConversionCard oggi supporta solo la selezione file, non input extra.
  const buildRotateRequest = useCallback(
    (files: File[]): PdfWorkerRequest => ({
      action: 'rotate',
      file: files[0],
      degreesToRotate: 90,
    }),
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

      <div style={{ marginTop: '1.5rem' }}>
        <ConversionCard
          title="Unisci PDF"
          description="Combina più file PDF in un unico documento, nell'ordine in cui li selezioni."
          acceptedExtensions={['pdf']}
          multiple
          securityMode="local"
          status={merge.status}
          error={merge.error}
          result={merge.result}
          buildRequest={buildMergeRequest}
          runConversion={merge.runConversion}
          reset={merge.reset}
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <ConversionCard
          title="Ruota PDF"
          description="Ruota tutte le pagine del PDF di 90° in senso orario."
          acceptedExtensions={['pdf']}
          securityMode="local"
          status={rotate.status}
          error={rotate.error}
          result={rotate.result}
          buildRequest={buildRotateRequest}
          runConversion={rotate.runConversion}
          reset={rotate.reset}
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <SplitPdfCard />
      </div>
    </div>
  );
}