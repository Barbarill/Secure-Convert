import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PDFDocument } from 'pdf-lib';
import { SplitPdfCard } from '../../src/components/SplitPdfCard';
import { usePdfConversion } from '../../src/hooks/usePdfConversion';

jest.mock('../../src/hooks/usePdfConversion', () => ({
  usePdfConversion: jest.fn(),
}));

const mockedUsePdfConversion = usePdfConversion as jest.Mock;

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = jest.fn();
});

beforeEach(() => {
  jest.clearAllMocks();
});

async function createTestPdfFile(pageCount: number, name = 'source.pdf'): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage([200, 200]);
  }
  const bytes = await pdfDoc.save();
  return new File([bytes], name, { type: 'application/pdf' });
}

function mockHook(overrides: Record<string, unknown> = {}) {
  const value = {
    status: 'idle',
    result: null,
    error: null,
    runConversion: jest.fn(),
    reset: jest.fn(),
    ...overrides,
  };
  mockedUsePdfConversion.mockReturnValue(value);
  return value;
}

describe('SplitPdfCard', () => {
  it('mostra la DropZone quando non è stato ancora selezionato un file', () => {
    mockHook();
    render(<SplitPdfCard />);

    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
    expect(screen.queryByTestId('split-page-grid')).not.toBeInTheDocument();
  });

  it('dopo il caricamento di un PDF mostra il conteggio pagine e una checkbox per pagina', async () => {
    mockHook();
    render(<SplitPdfCard />);

    const file = await createTestPdfFile(4);
    await userEvent.upload(screen.getByTestId('dropzone-input'), file);

    expect(await screen.findByTestId('split-page-count')).toHaveTextContent('4 pagine');
    for (let page = 1; page <= 4; page++) {
      expect(screen.getByTestId(`split-page-checkbox-${page}`)).toBeInTheDocument();
    }
  });

  it('il pulsante dividi è disabilitato finché non è selezionata almeno una pagina', async () => {
    mockHook();
    render(<SplitPdfCard />);

    const file = await createTestPdfFile(3);
    await userEvent.upload(screen.getByTestId('dropzone-input'), file);
    await screen.findByTestId('split-page-count');

    expect(screen.getByTestId('split-convert-button')).toBeDisabled();
  });

  it('raggruppa le pagine selezionate in range contigui e chiama runConversion di conseguenza', async () => {
    const { runConversion } = mockHook();
    render(<SplitPdfCard />);

    const file = await createTestPdfFile(5);
    await userEvent.upload(screen.getByTestId('dropzone-input'), file);
    await screen.findByTestId('split-page-count');

    await userEvent.click(screen.getByTestId('split-page-checkbox-1'));
    await userEvent.click(screen.getByTestId('split-page-checkbox-2'));
    await userEvent.click(screen.getByTestId('split-page-checkbox-4'));
    await userEvent.click(screen.getByTestId('split-convert-button'));

    expect(runConversion).toHaveBeenCalledTimes(1);
    expect(runConversion).toHaveBeenCalledWith({
      action: 'split',
      file,
      ranges: [
        { start: 1, end: 2 },
        { start: 4, end: 4 },
      ],
    });
  });

  it('mostra un link di download per ogni range convertito con successo', () => {
    mockHook({
      status: 'success',
      result: {
        type: 'result',
        results: [
          { success: true, data: new Blob(['fake-pdf-1']), fileName: 'split_1-2.pdf' },
          { success: true, data: new Blob(['fake-pdf-2']), fileName: 'split_4-4.pdf' },
        ],
      },
    });

    render(<SplitPdfCard />);

    const links = screen.getAllByTestId('split-download-link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('download', 'split_1-2.pdf');
    expect(links[1]).toHaveAttribute('download', 'split_4-4.pdf');
  });

  it('mostra un messaggio di errore per i range non validi senza nascondere gli altri download', () => {
    mockHook({
      status: 'success',
      result: {
        type: 'result',
        results: [
          { success: true, data: new Blob(['fake-pdf']), fileName: 'split_1-2.pdf' },
          { success: false, error: 'Range non valido: 8-10 (il PDF ha 5 pagine).' },
        ],
      },
    });

    render(<SplitPdfCard />);

    expect(screen.getByTestId('split-download-link')).toBeInTheDocument();
    expect(screen.getByText('Range non valido: 8-10 (il PDF ha 5 pagine).')).toBeInTheDocument();
  });

  it('al click su "dividi un altro file" chiama reset', async () => {
    const { reset } = mockHook({
      status: 'success',
      result: {
        type: 'result',
        results: [{ success: true, data: new Blob(['fake-pdf']), fileName: 'split_1-2.pdf' }],
      },
    });

    render(<SplitPdfCard />);

    await userEvent.click(screen.getByTestId('split-start-over-button'));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});