import { useCallback, useEffect, useState } from 'react';
import { DropZone } from './DropZone';
import { ProgressIndicator } from './ProgressIndicator';
import { SecurityBadge } from './SecurityBadge';
import { usePdfConversion } from '../hooks/usePdfConversion';

type RotationDegrees = 90 | 180 | 270;

const ROTATION_OPTIONS: RotationDegrees[] = [90, 180, 270];

export function RotatePdfCard() {
  const { status, result, error, runConversion, reset } = usePdfConversion();

  const [file, setFile] = useState<File | null>(null);
  const [degreesToRotate, setDegreesToRotate] = useState<RotationDegrees>(90);

  const conversionResult = result?.result;

  const handleFileSelected = useCallback(
    (files: File[]) => {
      reset();
      setFile(files[0]);
    },
    [reset]
  );

  const handleRotateClick = useCallback(() => {
    if (!file) return;
    runConversion({ action: 'rotate', file, degreesToRotate });
  }, [file, degreesToRotate, runConversion]);

  const handleStartOver = useCallback(() => {
    reset();
    setFile(null);
    setDegreesToRotate(90);
  }, [reset]);

  return (
    <div data-testid="rotate-pdf-card" className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Ruota PDF</h3>
          <p className="card-description">Ruota tutte le pagine del PDF dei gradi che scegli.</p>
        </div>
        <SecurityBadge mode="local" />
      </div>

      {!file && status !== 'success' && (
        <div style={{ marginTop: '1rem' }}>
          <DropZone acceptedExtensions={['pdf']} multiple={false} onFilesSelected={handleFileSelected} />
        </div>
      )}

      {file && status === 'idle' && (
        <div style={{ marginTop: '1rem' }}>
          <p data-testid="rotate-selected-file" className="card-description" style={{ marginBottom: '0.75rem' }}>
            {file.name}
          </p>

          <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1rem' }}>
            <legend className="dropzone-hint" style={{ marginBottom: '0.5rem' }}>
              Gradi di rotazione
            </legend>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {ROTATION_OPTIONS.map((degreesOption) => (
                <label
                  key={degreesOption}
                  data-testid={`rotate-degrees-${degreesOption}`}
                  className={`selectable-chip ${degreesToRotate === degreesOption ? 'is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="rotate-degrees"
                    checked={degreesToRotate === degreesOption}
                    onChange={() => setDegreesToRotate(degreesOption)}
                  />
                  {degreesOption}°
                </label>
              ))}
            </div>
          </fieldset>

          <button data-testid="rotate-convert-button" className="btn btn-primary" onClick={handleRotateClick}>
            Ruota
          </button>
        </div>
      )}

      <ProgressIndicator status={status} errorMessage={error} />

      {status === 'success' && conversionResult?.success && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <RotateDownloadLink result={conversionResult} />
          <button data-testid="rotate-start-over-button" className="btn btn-secondary" onClick={handleStartOver}>
            Ruota un altro file
          </button>
        </div>
      )}

      {status === 'error' && (
        <button data-testid="rotate-retry-button" className="btn btn-secondary" onClick={handleStartOver} style={{ marginTop: '0.5rem' }}>
          Riprova
        </button>
      )}
    </div>
  );
}

function RotateDownloadLink({ result }: { result: { data?: Blob; fileName?: string } }) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!result.data) {
      setDownloadUrl(null);
      return;
    }
    const url = URL.createObjectURL(result.data);
    setDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result.data]);

  if (!downloadUrl) return null;

  return (
    <a data-testid="rotate-download-link" className="btn btn-primary" href={downloadUrl} download={result.fileName}>
      Scarica {result.fileName}
    </a>
  );
}