import { useConversion } from './useConversion';
import type { ImageWorkerRequest } from '../workers/image.worker';

export function useImageConversion() {
  return useConversion<ImageWorkerRequest, any>(
    () => new Worker(new URL('../workers/image.worker.ts', import.meta.url), { type: 'module' })
  );
}