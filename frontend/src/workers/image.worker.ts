/// <reference lib="webworker" />
import { convertImageFormat, compressImage, resizeImage } from '../lib/converters/image';

export type ImageWorkerRequest =
  | { action: 'convert'; file: File; targetMimeType: string }
  | { action: 'compress'; file: File; quality?: number }
  | { action: 'resize'; file: File; width: number; height: number };

self.onmessage = async (event: MessageEvent<ImageWorkerRequest>) => {
  const message = event.data;

  try {
    switch (message.action) {
      case 'convert': {
        { const result = await convertImage(message.file, message.targetMimeType);
        result.success
          ? self.postMessage({ type: 'result', result })
          : self.postMessage({ type: 'error', error: result.error });
        break;
      }
      case 'compress': {
        const result = await compressImage(message.file, message.quality);
        result.success
          ? self.postMessage({ type: 'result', result })
          : self.postMessage({ type: 'error', error: result.error });
        break;
      }
      case 'resize': {
        const result = await resizeImage(message.file, message.width, message.height);
        result.success
          ? self.postMessage({ type: 'result', result })
          : self.postMessage({ type: 'error', error: result.error });
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