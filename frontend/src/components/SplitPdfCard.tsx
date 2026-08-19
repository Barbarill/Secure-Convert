import { useCallback, useEffect, useMemo, useState } from 'react';
import { DropZone } from './DropZone';
import { ProgressIndicator } from './ProgressIndicator';
import { SecurityBadge } from './SecurityBadge';
import { usePdfConversion } from '../hooks/usePdfConversion';
import { getPdfPageCount } from '../lib/converters/pdf';
import type { ConversionResult } from '../lib/converters/types';

// Raggruppa numeri di pagina selezionati in range contigui:
// [1,2,3,5] -> [{start:1,end:3}, {start:5,end:5}]
function buildRangesFromPages(pages: number[]): { start: number; end: number }[] {
  const sorted = [...pages].sort((a, b) => a - b);
  const ranges: { start: number; end: number }[] = [];

  for (const page of sorted) {
    const lastRange = ranges[ranges.length - 1];
    if (lastRange && page === lastRange.end + 1) {
      lastRange.end = page;
    } else {
      ranges.push({ start: page, end: page });
    }
  }

  return ranges;
}

export function SplitPdfCard() {
  const { status, result, error, runConversion, reset } = usePdfConversion();

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [pageCountError, setPageCountError] = useState<string | null>(null);
  const [loadingPageCount, setLoadingPageCount] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [downloadUrls, setDownloadUrls] = useState<{ url: string; fileName: string }[]>([]);
  const EMPTY_RESULTS: ConversionResult[] = [];

  // Il worker, per l'azione 'split', invia { type: 'result', results: ConversionResult[] }
  // (plurale, a differenza delle altre azioni) — per questo non riusiamo ConversionCard.
  const results: ConversionResult[] = useMemo(
    () => (status === 'success' && result?.results ? result.results : EMPTY_RESULTS),
    [status, result]
  );

  const handleFileSelected = useCallback(
    (files: File[]) => {
      const selected = files[0];
      reset();
      setFile(selected);
      setPageCount(null);
      setPageCountError(null);
      setSelectedPages(new Set());
      setLoadingPageCount(true);

      getPdfPageCount(selected)
        .then((count) => {
          setPageCount(count);
          setLoadingPageCount(false);
        })
        .catch((err) => {
          setPageCountError(
            err instanceof Error ? err.message : 'Impossibile leggere il numero di pagine del PDF.'
          );
          setLoadingPageCount(false);
        });
    },
    [reset]
  );

  const togglePage = useCallback((page: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(page)) {
        next.delete(page);
      } else {
        next.add(page);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!pageCount) return;
    setSelectedPages(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)));
  }, [pageCount]);

  const handleDeselectAll = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  const handleSplitClick = useCallback(() => {
    if (!file || selectedPages.size === 0) return;
    const ranges = buildRangesFromPages(Array.from(selectedPages));
    runConversion({ action: 'split', file, ranges });
  }, [file, selectedPages, runConversion]);

  const handleStartOver = useCallback(() => {
    reset();
    setFile(null);
    setPageCount(null);
    setPageCountError(null);
    setSelectedPages(new Set());
  }, [reset]);

  // Stesso pattern usato in ConversionCard: creazione/pulizia degli URL blob
  // interamente dentro un effetto, mai nel corpo del render.
  useEffect(() => {
    const successfulResults = results.filter((r) => r.success && r.data);

    if (successfulResults.length === 0) {
      setDownloadUrls([]);
      return;
    }

    const urls = successfulResults.map((r) => ({
      url: URL.createObjectURL(r.data as Blob),
      fileName: r.fileName ?? 'split.pdf',
    }));
    setDownloadUrls(urls);

    return () => {
      urls.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, [results]);

  const failedResults = results.filter((r) => !r.success);

  return (
    <div
      data-testid="split-pdf-card"
      style={{ border: '1px solid #eee', borderRadius: '12px', padding: '1.5rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0 }}>Dividi PDF</h3>
          <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>
            Seleziona le pagine da estrarre in uno o più nuovi file.
          </p>
        </div>
        <SecurityBadge mode="local" />
      </div>

      {!file && (
        <div style={{ marginTop: '1rem' }}>
          <DropZone acceptedExtensions={['pdf']} multiple={false} onFilesSelected={handleFileSelected} />
        </div>
      )}

      {file && loadingPageCount && <p style={{ marginTop: '1rem' }}>Lettura del PDF in corso…</p>}

      {file && pageCountError && (
        <div style={{ marginTop: '1rem' }}>
          <p role="alert" style={{ color: '#c0392b' }}>
            {pageCountError}
          </p>
          <button data-testid="split-retry-button" onClick={handleStartOver}>
            Riprova
          </button>
        </div>
      )}

      {file && pageCount !== null && status === 'idle' && (
        <div style={{ marginTop: '1rem' }}>
          <p data-testid="split-page-count">
            {file.name} · {pageCount} pagine
          </p>

          <div style={{ marginBottom: '0.75rem' }}>
            <button type="button" onClick={handleSelectAll} style={{ marginRight: '0.5rem' }}>
              Seleziona tutte
            </button>
            <button type="button" onClick={handleDeselectAll}>
              Deseleziona tutte
            </button>
          </div>

          <div
            data-testid="split-page-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
              <label
                key={page}
                data-testid={`split-page-checkbox-${page}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  border: `1px solid ${selectedPages.has(page) ? '#D85A30' : '#ddd'}`,
                  borderRadius: '8px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                <input type="checkbox" checked={selectedPages.has(page)} onChange={() => togglePage(page)} />
                {page}
              </label>
            ))}
          </div>

          <button
            data-testid="split-convert-button"
            onClick={handleSplitClick}
            disabled={selectedPages.size === 0}
          >
            Dividi ({selectedPages.size} pagin{selectedPages.size === 1 ? 'a' : 'e'} selezionat
            {selectedPages.size === 1 ? 'a' : 'e'})
          </button>
        </div>
      )}

      <ProgressIndicator status={status} errorMessage={error} />

      {status === 'success' && (downloadUrls.length > 0 || failedResults.length > 0) && (
        <div style={{ marginTop: '1rem' }}>
          {downloadUrls.map(({ url, fileName }) => (
            <div key={fileName} style={{ marginBottom: '0.5rem' }}>
              <a data-testid="split-download-link" href={url} download={fileName}>
                Scarica {fileName}
              </a>
            </div>
          ))}

          {failedResults.map((r, i) => (
            <p key={i} role="alert" style={{ color: '#c0392b' }}>
              {r.error}
            </p>
          ))}

          <button data-testid="split-start-over-button" onClick={handleStartOver} style={{ marginTop: '0.5rem' }}>
            Dividi un altro file
          </button>
        </div>
      )}
    </div>
  );
}