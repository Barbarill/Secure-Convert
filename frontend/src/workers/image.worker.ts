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
        self.postMessage({ type: 'result', result });
        break;
      }
      case 'resize': {
        const result = await resizeImage(message.file, message.maxWidth, message.maxHeight);
        self.postMessage({ type: 'result', result });
        break;
      }
      case 'compress': {
        const result = await compressImage(message.file, message.quality);
        self.postMessage({ type: 'result', result });
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