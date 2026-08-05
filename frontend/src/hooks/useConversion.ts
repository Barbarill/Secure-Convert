import { useCallback, useRef, useState } from 'react';

export type ConversionStatus = 'idle' | 'processing' | 'success' | 'error';

interface UseConversionState<TResult> {
  status: ConversionStatus;
  result: TResult | null;
  error: string | null;
}

/**
 * Hook generico per comunicare con un Web Worker di conversione.
 * `createWorker` deve restituire una nuova istanza del worker desiderato
 * (es. () => new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), { type: 'module' })).
 */
export function useConversion<TRequest, TResult>(
  createWorker: () => Worker
) {
  const [state, setState] = useState<UseConversionState<TResult>>({
    status: 'idle',
    result: null,
    error: null,
  });

  const workerRef = useRef<Worker | null>(null);

  const runConversion = useCallback(
    (request: TRequest) => {
      setState({ status: 'processing', result: null, error: null });

      // Chiudi eventuali worker precedenti ancora attivi prima di crearne uno nuovo
      workerRef.current?.terminate();
      const worker = createWorker();
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent) => {
        const data = event.data;

        if (data.type === 'error') {
          setState({ status: 'error', result: null, error: data.error });
        } else {
          setState({ status: 'success', result: data, error: null });
        }

        worker.terminate();
        workerRef.current = null;
      };

      worker.onerror = (event: ErrorEvent) => {
        setState({
          status: 'error',
          result: null,
          error: event.message || 'Errore imprevisto nel worker.',
        });
        worker.terminate();
        workerRef.current = null;
      };

      worker.postMessage(request);
    },
    [createWorker]
  );

  const reset = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setState({ status: 'idle', result: null, error: null });
  }, []);

  return { ...state, runConversion, reset };
}