import { useCallback, useEffect, useState } from 'react';
import { DropZone } from './DropZone';
import { ProgressIndicator } from './ProgressIndicator';
import { SecurityBadge } from './SecurityBadge';
import type { ConversionStatus } from '../hooks/useConversion';
import type { ConversionResult } from '../lib/converters/types';

interface ConversionCardProps<TRequest> {
  title: string;
  description?: string;
  acceptedExtensions: string[];
  multiple?: boolean;
  maxSizeMb?: number;
  securityMode: 'local' | 'server';
  status: ConversionStatus;
  error: string | null;
  result: { result?: ConversionResult } | null;
  buildRequest: (files: File[]) => TRequest;
  runConversion: (request: TRequest) => void;
  reset: () => void;
}

export function ConversionCard<TRequest>({
  title,
  description,
  acceptedExtensions,
  multiple = false,
  maxSizeMb = 50,
  securityMode,
  status,
  error,
  result,
  buildRequest,
  runConversion,
  reset,
}: ConversionCardProps<TRequest>) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const conversionResult = result?.result;

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      reset();
      setSelectedFiles(files);
    },
    [reset]
  );

  const handleConvertClick = useCallback(() => {
    if (selectedFiles.length === 0) return;
    runConversion(buildRequest(selectedFiles));
  }, [selectedFiles, buildRequest, runConversion]);

  const handleStartOver = useCallback(() => {
    reset();
    setSelectedFiles([]);
  }, [reset]);

  // Creazione/pulizia dell'URL del blob affidata esclusivamente a un effetto:
  // il corpo del render deve restare puro, non deve creare risorse esterne.
  // Con questo pattern, anche il doppio invoke degli effetti che React esegue
  // in sviluppo (StrictMode) lascia comunque un URL valido al termine del ciclo.
  useEffect(() => {
    if (conversionResult?.success && conversionResult.data) {
      const url = URL.createObjectURL(conversionResult.data);
      setDownloadUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }

    setDownloadUrl(null);
  }, [conversionResult]);

  return (
    <div data-testid="conversion-card" style={{ border: '1px solid #eee', borderRadius: '12px', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0 }}>{title}</h3>
          {description && <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>{description}</p>}
        </div>
        <SecurityBadge mode={securityMode} />
      </div>

      {status === 'idle' && selectedFiles.length === 0 && (
        <div style={{ marginTop: '1rem' }}>
          <DropZone
            acceptedExtensions={acceptedExtensions}
            maxSizeMb={maxSizeMb}
            multiple={multiple}
            onFilesSelected={handleFilesSelected}
          />
        </div>
      )}

      {selectedFiles.length > 0 && status !== 'success' && (
        <div style={{ marginTop: '1rem' }}>
          <p data-testid="selected-files-summary">
            {selectedFiles.length} file selezionat{selectedFiles.length === 1 ? 'o' : 'i'}:{' '}
            {selectedFiles.map((f) => f.name).join(', ')}
          </p>
          <button
            data-testid="convert-button"
            onClick={handleConvertClick}
            disabled={status === 'processing'}
          >
            Converti
          </button>
        </div>
      )}

      <ProgressIndicator status={status} errorMessage={error} />

      {status === 'success' && conversionResult?.success && downloadUrl && (
        <div style={{ marginTop: '1rem' }}>
          <a data-testid="download-link" href={downloadUrl} download={conversionResult.fileName}>
            Scarica {conversionResult.fileName}
          </a>
          <button data-testid="start-over-button" onClick={handleStartOver} style={{ marginLeft: '1rem' }}>
            Converti un altro file
          </button>
        </div>
      )}

      {status === 'error' && (
        <button data-testid="retry-button" onClick={handleStartOver} style={{ marginTop: '0.5rem' }}>
          Riprova
        </button>
      )}
    </div>
  );
}