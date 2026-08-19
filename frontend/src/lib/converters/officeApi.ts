import type { ConversionResult } from './types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export async function convertOfficeFile(file: File): Promise<ConversionResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BACKEND_URL}/api/convert/office`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      return {
        success: false,
        error: body?.error || 'Errore durante la conversione sul server.',
      };
    }

    const disposition = response.headers.get('content-disposition') || '';
    const match = disposition.match(/filename="(.+)"/);
    const fileName = match?.[1] || 'converted.pdf';

    const blob = await response.blob();
    return { success: true, data: blob, fileName };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Impossibile contattare il server di conversione.',
    };
  }
}