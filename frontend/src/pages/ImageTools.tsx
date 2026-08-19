import { useCallback } from 'react';
import { ConversionCard } from '../components/ConversionCard';
import { useImageConversion } from '../hooks/useImageConversion';
import type { ImageWorkerRequest } from '../workers/image.worker';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

export function ImageTools() {
  const toPng = useImageConversion();
  const toJpeg = useImageConversion();
  const toWebp = useImageConversion();
  const compress = useImageConversion();

  const buildPngRequest = useCallback(
    (files: File[]): ImageWorkerRequest => ({ action: 'convert', file: files[0], targetMimeType: 'image/png' }),
    []
  );

  const buildJpegRequest = useCallback(
    (files: File[]): ImageWorkerRequest => ({ action: 'convert', file: files[0], targetMimeType: 'image/jpeg' }),
    []
  );

  const buildWebpRequest = useCallback(
    (files: File[]): ImageWorkerRequest => ({ action: 'convert', file: files[0], targetMimeType: 'image/webp' }),
    []
  );

  const buildCompressRequest = useCallback(
    (files: File[]): ImageWorkerRequest => ({ action: 'compress', file: files[0], quality: 0.7 }),
    []
  );

  return (
    <div className="page-container">
      <h1>Strumenti Immagini</h1>
      <p className="page-description">
        Tutte le operazioni qui sotto avvengono interamente nel tuo browser: nessun file viene
        caricato su un server.
      </p>

      <div style={{ marginTop: '1.5rem' }}>
        <ConversionCard
          title="Converti in PNG"
          description="Converte l'immagine in formato PNG (senza perdita di qualità)."
          acceptedExtensions={IMAGE_EXTENSIONS}
          securityMode="local"
          status={toPng.status}
          error={toPng.error}
          result={toPng.result}
          buildRequest={buildPngRequest}
          runConversion={toPng.runConversion}
          reset={toPng.reset}
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <ConversionCard
          title="Converti in JPEG"
          description="Converte l'immagine in formato JPEG."
          acceptedExtensions={IMAGE_EXTENSIONS}
          securityMode="local"
          status={toJpeg.status}
          error={toJpeg.error}
          result={toJpeg.result}
          buildRequest={buildJpegRequest}
          runConversion={toJpeg.runConversion}
          reset={toJpeg.reset}
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <ConversionCard
          title="Converti in WebP"
          description="Converte l'immagine in formato WebP."
          acceptedExtensions={IMAGE_EXTENSIONS}
          securityMode="local"
          status={toWebp.status}
          error={toWebp.error}
          result={toWebp.result}
          buildRequest={buildWebpRequest}
          runConversion={toWebp.runConversion}
          reset={toWebp.reset}
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <ConversionCard
          title="Comprimi immagine"
          description="Riduce la dimensione del file ricodificando in JPEG a qualità ridotta."
          acceptedExtensions={IMAGE_EXTENSIONS}
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