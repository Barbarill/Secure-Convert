import { useCallback } from 'react';
import { ConversionCard } from '../components/ConversionCard';
import { useOfficeConversion } from '../hooks/useOfficeConversion';

interface OfficeRequest {
  file: File;
}

export function OfficeTools() {
  const convert = useOfficeConversion();

  const buildRequest = useCallback((files: File[]): OfficeRequest => ({ file: files[0] }), []);

  return (
    <div className="page-container">
      <h1>Strumenti Office</h1>
      <p className="page-description">
        Word, PowerPoint ed Excel vengono convertiti in PDF su un server effimero: il file viene
        elaborato ed eliminato immediatamente dopo, senza mai essere salvato in modo permanente.
      </p>

      <div style={{ marginTop: '1.5rem' }}>
        <ConversionCard
          title="Converti Office in PDF"
          description="Supporta file .docx, .pptx, .xlsx."
          acceptedExtensions={['docx', 'pptx', 'xlsx']}
          securityMode="server"
          status={convert.status}
          error={convert.error}
          result={convert.result}
          buildRequest={buildRequest}
          runConversion={convert.runConversion}
          reset={convert.reset}
        />
      </div>
    </div>
  );
}