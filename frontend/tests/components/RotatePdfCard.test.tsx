import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RotatePdfCard } from '../../src/components/RotatePdfCard';
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

function createTestPdfFile(name = 'source.pdf'): File {
  return new File(['fake-pdf-content'], name, { type: 'application/pdf' });
}

describe('RotatePdfCard', () => {
  it('mostra la DropZone quando non è stato ancora selezionato un file', () => {
    mockHook();
    render(<RotatePdfCard />);

    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
    expect(screen.queryByTestId('rotate-degrees-90')).not.toBeInTheDocument();
  });

  it('90° è selezionato di default dopo il caricamento del file', async () => {
    mockHook();
    render(<RotatePdfCard />);

    await userEvent.upload(screen.getByTestId('dropzone-input'), createTestPdfFile());

    const input90 = screen.getByTestId('rotate-degrees-90').querySelector('input');
    expect(input90).toBeChecked();
  });

  it('chiama runConversion con i gradi selezionati', async () => {
    const { runConversion } = mockHook();
    render(<RotatePdfCard />);

    const file = createTestPdfFile();
    await userEvent.upload(screen.getByTestId('dropzone-input'), file);

    await userEvent.click(screen.getByTestId('rotate-degrees-270'));
    await userEvent.click(screen.getByTestId('rotate-convert-button'));

    expect(runConversion).toHaveBeenCalledWith({
      action: 'rotate',
      file,
      degreesToRotate: 270,
    });
  });

  it('mostra il link di download dopo una conversione riuscita', () => {
    mockHook({
      status: 'success',
      result: {
        result: { success: true, data: new Blob(['fake-pdf']), fileName: 'rotated.pdf' },
      },
    });

    render(<RotatePdfCard />);

    expect(screen.getByTestId('rotate-download-link')).toHaveAttribute('download', 'rotated.pdf');
  });

  it('al click su "ruota un altro file" chiama reset', async () => {
    const { reset } = mockHook({
      status: 'success',
      result: {
        result: { success: true, data: new Blob(['fake-pdf']), fileName: 'rotated.pdf' },
      },
    });

    render(<RotatePdfCard />);

    await userEvent.click(screen.getByTestId('rotate-start-over-button'));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});