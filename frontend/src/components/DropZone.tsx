import { useCallback, useRef, useState } from 'react';

interface DropZoneProps {
  acceptedExtensions: string[];
  maxSizeMb?: number;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
}

export function DropZone({
  acceptedExtensions,
  maxSizeMb = 50,
  multiple = false,
  onFilesSelected,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errorMessage: string | null } => {
      const valid: File[] = [];

      for (const file of files) {
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (!extension || !acceptedExtensions.includes(extension)) {
          return {
            valid: [],
            errorMessage: `Formato non supportato: .${extension}. Formati accettati: ${acceptedExtensions.join(', ')}`,
          };
        }

        const sizeMb = file.size / (1024 * 1024);
        if (sizeMb > maxSizeMb) {
          return {
            valid: [],
            errorMessage: `Il file "${file.name}" supera il limite di ${maxSizeMb}MB.`,
          };
        }

        valid.push(file);
      }

      return { valid, errorMessage: null };
    },
    [acceptedExtensions, maxSizeMb]
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const files = Array.from(fileList);
      const { valid, errorMessage } = validateFiles(files);

      if (errorMessage) {
        setError(errorMessage);
        return;
      }

      setError(null);
      onFilesSelected(valid);
    },
    [validateFiles, onFilesSelected]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(event.target.files);
      // Reset dell'input per permettere di selezionare di nuovo lo stesso file in futuro
      event.target.value = '';
    },
    [handleFiles]
  );

  return (
    <div>
      <div
        data-testid="dropzone"
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${isDragging ? '#D85A30' : '#ccc'}`,
          borderRadius: '12px',
          padding: '2.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragging ? 'rgba(216, 90, 48, 0.05)' : 'transparent',
          transition: 'all 0.15s ease',
        }}
      >
        <p>Trascina qui il file, oppure clicca per selezionarlo</p>
        <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>
          Formati accettati: {acceptedExtensions.join(', ')} · max {maxSizeMb}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          data-testid="dropzone-input"
          accept={acceptedExtensions.map((ext) => `.${ext}`).join(',')}
          multiple={multiple}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
      </div>
      {error && (
        <p data-testid="dropzone-error" role="alert" style={{ color: '#c0392b', marginTop: '0.5rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}