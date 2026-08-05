import type { ConversionResult } from './types';

type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';
type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;

function isWorkerEnvironment(): boolean {
  return typeof document === 'undefined' && typeof OffscreenCanvas !== 'undefined';
}

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error('Impossibile leggere il file come immagine.');
  }
}

function createCanvas(width: number, height: number): AnyCanvas {
  if (isWorkerEnvironment()) {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getContext2D(canvas: AnyCanvas): any {
  return canvas.getContext('2d');
}

async function canvasToBlob(canvas: AnyCanvas, type: string, quality?: number): Promise<Blob | null> {
  if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: type as any, quality });
  }
  return new Promise((resolve) => {
    (canvas as HTMLCanvasElement).toBlob(resolve, type, quality);
  });
}

function extensionForFormat(format: ImageFormat): string {
  switch (format) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
  }
}

export async function convertImage(
  file: File,
  targetFormat: ImageFormat,
  quality: number = 0.92
): Promise<ConversionResult> {
  try {
    const bitmap = await loadImageBitmap(file);
    const canvas = createCanvas(bitmap.width, bitmap.height);
    const ctx = getContext2D(canvas);

    if (!ctx) {
      return { success: false, error: 'Impossibile creare il contesto di disegno.' };
    }

    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(bitmap, 0, 0);

    const blob = await canvasToBlob(canvas, targetFormat, quality);

    if (!blob) {
      return { success: false, error: 'La conversione non ha prodotto alcun output.' };
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    return {
      success: true,
      data: blob,
      fileName: `${baseName}.${extensionForFormat(targetFormat)}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Errore durante la conversione dell'immagine.",
    };
  }
}

export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<ConversionResult> {
  try {
    const bitmap = await loadImageBitmap(file);

    const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
    const width = Math.round(bitmap.width * ratio);
    const height = Math.round(bitmap.height * ratio);

    const canvas = createCanvas(width, height);
    const ctx = getContext2D(canvas);

    if (!ctx) {
      return { success: false, error: 'Impossibile creare il contesto di disegno.' };
    }

    ctx.drawImage(bitmap, 0, 0, width, height);

    const originalFormat = (file.type || 'image/png') as ImageFormat;
    const blob = await canvasToBlob(canvas, originalFormat);

    if (!blob) {
      return { success: false, error: 'Il ridimensionamento non ha prodotto alcun output.' };
    }

    return { success: true, data: blob, fileName: file.name };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore durante il ridimensionamento.',
    };
  }
}

export async function compressImage(
  file: File,
  quality: number = 0.7
): Promise<ConversionResult> {
  const format = (file.type === 'image/png' ? 'image/jpeg' : file.type) as ImageFormat;
  return convertImage(file, format, quality);
}