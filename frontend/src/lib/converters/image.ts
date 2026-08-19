import type { ConversionResult } from './types';

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

function replaceExtension(fileName: string, newExtension: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex === -1 ? fileName : fileName.slice(0, dotIndex);
  return `${baseName}.${newExtension}`;
}

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

// OffscreenCanvas è l'unica opzione disponibile dentro un vero Web Worker
// (non c'è `document` in quel contesto). document.createElement('canvas') è
// il fallback usato in ambiente di test jsdom, dove OffscreenCanvas non esiste.
function createCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function canvasToBlob(canvas: AnyCanvas, mimeType: string, quality?: number): Promise<Blob> {
  if ('convertToBlob' in canvas) {
    return (canvas as OffscreenCanvas).convertToBlob({ type: mimeType, quality });
  }
  return new Promise((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Impossibile generare il file immagine.'));
      },
      mimeType,
      quality
    );
  });
}

async function drawBitmapToCanvas(
  file: File,
  width: number,
  height: number
): Promise<AnyCanvas> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx) {
      throw new Error('Impossibile ottenere il contesto 2D del canvas.');
    }
    ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0, width, height);
    return canvas;
  } finally {
    bitmap.close?.();
  }
}

export async function convertImage(
  file: File,
  targetMimeType: string,
  quality = 0.92
): Promise<ConversionResult> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = createCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx) {
      throw new Error('Impossibile ottenere il contesto 2D del canvas.');
    }
    ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0, bitmap.width, bitmap.height);
    bitmap.close?.();

    const blob = await canvasToBlob(
      canvas,
      targetMimeType,
      targetMimeType === 'image/png' ? undefined : quality
    );
    const extension = EXTENSIONS[targetMimeType] ?? 'png';

    return {
      success: true,
      data: blob,
      fileName: replaceExtension(file.name, extension),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore durante la conversione del formato immagine.',
    };
  }
}

export async function compressImage(file: File, quality = 0.7): Promise<ConversionResult> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = createCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx) {
      throw new Error('Impossibile ottenere il contesto 2D del canvas.');
    }
    ctx.drawImage(bitmap as unknown as CanvasImageSource, 0, 0, bitmap.width, bitmap.height);
    bitmap.close?.();

    // Come per compressPdf: ricodifichiamo sempre in JPEG a qualità ridotta,
    // che garantisce una riduzione di dimensione reale (a costo della
    // trasparenza, se il file di partenza era PNG con canale alpha).
    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);

    return {
      success: true,
      data: blob,
      fileName: replaceExtension(file.name, 'jpg'),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore durante la compressione dell'immagine.",
    };
  }
}

export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number
): Promise<ConversionResult> {
  try {
    if (targetWidth <= 0 || targetHeight <= 0) {
      return { success: false, error: 'Larghezza e altezza devono essere maggiori di zero.' };
    }

    const canvas = await drawBitmapToCanvas(file, targetWidth, targetHeight);

    const originalExtension = file.name.split('.').pop()?.toLowerCase() ?? 'png';
    const targetMimeType =
      originalExtension === 'jpg' || originalExtension === 'jpeg'
        ? 'image/jpeg'
        : originalExtension === 'webp'
          ? 'image/webp'
          : 'image/png';

    const blob = await canvasToBlob(canvas, targetMimeType);
    const extension = EXTENSIONS[targetMimeType] ?? 'png';

    return {
      success: true,
      data: blob,
      fileName: replaceExtension(file.name, `resized.${extension}`),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore durante il ridimensionamento dell'immagine.",
    };
  }
}