/// <reference lib="webworker" />
import { mergePdfs, splitPdf, rotatePdf, compressPdf } from '../lib/converters/pdf';

export type PdfWorkerRequest =
  | { action: 'merge'; files: File[] }
  | { action: 'split'; file: File; ranges: { start: number; end: number }[] }
  | { action: 'rotate'; file: File; degreesToRotate: 90 | 180 | 270 }
  | { action: 'compress'; file: File };

self.onmessage = async (event: MessageEvent<PdfWorkerRequest>) => {
  const message = event.data;

  try {
    switch (message.action) {
      case 'merge': {
        const result = await mergePdfs(message.files);
        if (result.success) {
          self.postMessage({ type: 'result', result });
        } else {
          self.postMessage({ type: 'error', error: result.error });
        }
        break;
      }
      case 'split': {
        const results = await splitPdf(message.file, message.ranges);
        self.postMessage({ type: 'result', results });
        break;
      }
      case 'rotate': {
        const result = await rotatePdf(message.file, message.degreesToRotate);
        if (result.success) {
          self.postMessage({ type: 'result', result });
        } else {
          self.postMessage({ type: 'error', error: result.error });
        }
        break;
      }
      case 'compress': {
        const result = await compressPdf(message.file);
        if (result.success) {
          self.postMessage({ type: 'result', result });
        } else {
          self.postMessage({ type: 'error', error: result.error });
        }
        break;
      }
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Errore sconosciuto nel worker.',
    });
  }
};