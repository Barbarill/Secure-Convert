import fs from 'fs/promises';
import path from 'path';
import os from 'os';

jest.mock('child_process', () => ({
  execFile: jest.fn(),
}));

import { execFile } from 'child_process';
import { convertOfficeFileToPdf } from '../../src/services/libreoffice.service';

const mockedExecFile = execFile as unknown as jest.Mock;

describe('convertOfficeFileToPdf', () => {
  afterEach(async () => {
    jest.clearAllMocks();
    // Pulizia di eventuali cartelle temporanee lasciate da test falliti,
    // per non inquinare l'ambiente tra una run e l'altra.
    const entries = await fs.readdir(os.tmpdir()).catch(() => []);
    for (const entry of entries) {
      if (entry.startsWith('secureconvert-')) {
        await fs.rm(path.join(os.tmpdir(), entry), { recursive: true, force: true }).catch(() => {});
      }
    }
  });

  it('rifiuta un formato non supportato senza invocare LibreOffice', async () => {
    await expect(
      convertOfficeFileToPdf(Buffer.from('contenuto finto'), 'documento.txt')
    ).rejects.toThrow('Formato non supportato');

    expect(mockedExecFile).not.toHaveBeenCalled();
  });

  it('converte un DOCX in PDF e ripulisce la cartella temporanea', async () => {
    mockedExecFile.mockImplementation((_bin, args, _opts, callback) => {
      // args: ['--headless', '--convert-to', 'pdf', '--outdir', workDir, inputPath]
      const workDir = args[4] as string;
      const outputPath = path.join(workDir, 'input.pdf');
      // Simula l'output prodotto da soffice reale.
      fs.writeFile(outputPath, Buffer.from('%PDF-finto')).then(() => callback(null, '', ''));
    });

    const result = await convertOfficeFileToPdf(Buffer.from('contenuto docx finto'), 'relazione.docx');

    expect(result.fileName).toBe('relazione.pdf');
    expect(result.buffer.toString()).toBe('%PDF-finto');
    expect(mockedExecFile).toHaveBeenCalledWith(
      'soffice',
      expect.arrayContaining(['--headless', '--convert-to', 'pdf']),
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('propaga un errore se LibreOffice fallisce e ripulisce comunque la cartella temporanea', async () => {
    mockedExecFile.mockImplementation((_bin, _args, _opts, callback) => {
      callback(new Error('soffice: comando non trovato'), '', '');
    });

    await expect(
      convertOfficeFileToPdf(Buffer.from('contenuto finto'), 'foglio.xlsx')
    ).rejects.toThrow('soffice: comando non trovato');
  });
});