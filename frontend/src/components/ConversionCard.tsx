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
    <div data-testid="conversion-card" className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">{title}</h3>
          {description && <p className="card-description">{description}</p>}
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
          <p data-testid="selected-files-summary" className="card-description" style={{ marginBottom: '0.75rem' }}>
            {selectedFiles.length} file selezionat{selectedFiles.length === 1 ? 'o' : 'i'}:{' '}
            {selectedFiles.map((f) => f.name).join(', ')}
          </p>
          <button
            data-testid="convert-button"
            className="btn btn-primary"
            onClick={handleConvertClick}
            disabled={status === 'processing'}
          >
            Converti
          </button>
        </div>
      )}

      <ProgressIndicator status={status} errorMessage={error} />

      {status === 'success' && conversionResult?.success && downloadUrl && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a data-testid="download-link" className="btn btn-primary" href={downloadUrl} download={conversionResult.fileName}>
            Scarica {conversionResult.fileName}
          </a>
          <button data-testid="start-over-button" className="btn btn-secondary" onClick={handleStartOver}>
            Converti un altro file
          </button>
        </div>
      )}

      {status === 'error' && (
        <button data-testid="retry-button" className="btn btn-secondary" onClick={handleStartOver} style={{ marginTop: '0.5rem' }}>
          Riprova
        </button>
      )}
    </div>
  );
}