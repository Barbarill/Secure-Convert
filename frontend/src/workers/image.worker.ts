/// <reference lib="webworker" />
import { convertImage, resizeImage, compressImage } from '../lib/converters/image';

export type ImageWorkerRequest =
  | { action: 'convert'; file: File; targetFormat: 'image/jpeg' | 'image/png' | 'image/webp'; quality?: number }
  | { action: 'resize'; file: File; maxWidth: number; maxHeight: number }
  | { action: 'compress'; file: File; quality?: number };

self.onmessage = async (event: MessageEvent<ImageWorkerRequest>) => {
  const message = event.data;

  try {
    switch (message.action) {
      case 'convert': {
        const result = await convertImage(message.file, message.targetFormat, message.quality);
        if (result.success) {
          self.postMessage({ type: 'result', result });
        } else {
          self.postMessage({ type: 'error', error: result.error });
        }
        break;
      }
      case 'resize': {
        const result = await resizeImage(message.file, message.maxWidth, message.maxHeight);
        if (result.success) {
          self.postMessage({ type: 'result', result });
        } else {
          self.postMessage({ type: 'error', error: result.error });
        }
        break;
      }
      case 'compress': {
        const result = await compressImage(message.file, message.quality);
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