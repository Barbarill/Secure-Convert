import { useCallback, useState } from 'react';
import { convertOfficeFile } from '../lib/converters/officeApi';
import type { ConversionStatus } from './useConversion';
import type { ConversionResult } from '../lib/converters/types';

interface OfficeConversionRequest {
  file: File;
}

export function useOfficeConversion() {
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [result, setResult] = useState<{ result?: ConversionResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runConversion = useCallback(async ({ file }: OfficeConversionRequest) => {
    setStatus('processing');
    setResult(null);
    setError(null);

    const conversionResult = await convertOfficeFile(file);

    if (conversionResult.success) {
      setStatus('success');
      setResult({ result: conversionResult });
    } else {
      setStatus('error');
      setError(conversionResult.error || 'Errore sconosciuto durante la conversione.');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, runConversion, reset };
}