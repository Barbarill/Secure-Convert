import { useConversion } from './useConversion';
import type { PdfWorkerRequest } from '../workers/pdf.worker';

export function usePdfConversion() {
  return useConversion<PdfWorkerRequest, any>(
    () => new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), { type: 'module' })
  );
}