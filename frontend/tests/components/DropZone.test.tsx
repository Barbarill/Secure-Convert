import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from '../../src/components/DropZone';

function createFile(name: string, sizeInBytes: number, type = 'application/pdf'): File {
  const file = new File(['a'.repeat(sizeInBytes)], name, { type });
  return file;
}

describe('DropZone', () => {
  it('accetta un file con estensione e dimensione valide', async () => {
    const onFilesSelected = jest.fn();
    render(
      <DropZone acceptedExtensions={['pdf']} maxSizeMb={5} onFilesSelected={onFilesSelected} />
    );

    const input = screen.getByTestId('dropzone-input') as HTMLInputElement;
    const validFile = createFile('documento.pdf', 1024);

    await userEvent.upload(input, validFile);

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected).toHaveBeenCalledWith([validFile]);
    expect(screen.queryByTestId('dropzone-error')).not.toBeInTheDocument();
  });

  it('rifiuta un file con estensione non supportata e mostra un errore', async () => {
    const onFilesSelected = jest.fn();
    render(
      <DropZone acceptedExtensions={['pdf']} maxSizeMb={5} onFilesSelected={onFilesSelected} />
    );

    const input = screen.getByTestId('dropzone-input') as HTMLInputElement;
    const invalidFile = createFile('immagine.exe', 1024, 'application/octet-stream');

    await userEvent.upload(input, invalidFile, { applyAccept: false });

    expect(onFilesSelected).not.toHaveBeenCalled();
    expect(screen.getByTestId('dropzone-error')).toHaveTextContent('Formato non supportato');
  });

  it('rifiuta un file che supera la dimensione massima consentita', async () => {
    const onFilesSelected = jest.fn();
    // maxSizeMb molto basso per non dover creare file enormi nel test
    render(
      <DropZone acceptedExtensions={['pdf']} maxSizeMb={0.0001} onFilesSelected={onFilesSelected} />
    );

    const input = screen.getByTestId('dropzone-input') as HTMLInputElement;
    const bigFile = createFile('grande.pdf', 1024);

    await userEvent.upload(input, bigFile);

    expect(onFilesSelected).not.toHaveBeenCalled();
    expect(screen.getByTestId('dropzone-error')).toHaveTextContent('supera il limite');
  });

  it('gestisce correttamente il drag&drop di un file valido', () => {
    const onFilesSelected = jest.fn();
    render(
      <DropZone acceptedExtensions={['png']} maxSizeMb={5} onFilesSelected={onFilesSelected} />
    );

    const dropzone = screen.getByTestId('dropzone');
    const validFile = createFile('foto.png', 1024, 'image/png');

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [validFile] },
    });

    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onFilesSelected).toHaveBeenCalledWith([validFile]);
  });

  it('resetta il messaggio di errore precedente dopo una selezione valida', async () => {
    const onFilesSelected = jest.fn();
    render(
      <DropZone acceptedExtensions={['pdf']} maxSizeMb={5} onFilesSelected={onFilesSelected} />
    );

    const input = screen.getByTestId('dropzone-input') as HTMLInputElement;

    // Prima un file non valido
    await userEvent.upload(input, createFile('bad.exe', 1024, 'application/octet-stream'), {
  applyAccept: false,
});
    expect(screen.getByTestId('dropzone-error')).toBeInTheDocument();

    // Poi un file valido
    await userEvent.upload(input, createFile('good.pdf', 1024));
    expect(screen.queryByTestId('dropzone-error')).not.toBeInTheDocument();
  });
});