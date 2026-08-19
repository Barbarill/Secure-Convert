import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { createTempWorkDir } from '../config/paths';

const execFileAsync = promisify(execFile);

// Il binario si chiama 'soffice' sia su Linux (immagine Docker) sia tipicamente
// su macOS/Windows con LibreOffice installato, ma può essere sovrascritto via
// env var per ambienti dove il path non è nel PATH di sistema.
const SOFFICE_BIN = process.env.SOFFICE_BIN || 'soffice';

const ALLOWED_CONVERSIONS: Record<string, string> = {
  docx: 'pdf',
  pptx: 'pdf',
  xlsx: 'pdf',
};

export interface ConvertOfficeFileResult {
  buffer: Buffer;
  fileName: string;
}

function getExtension(fileName: string): string {
  return path.extname(fileName).slice(1).toLowerCase();
}

export async function convertOfficeFileToPdf(
  fileBuffer: Buffer,
  originalFileName: string
): Promise<ConvertOfficeFileResult> {
  const sourceExtension = getExtension(originalFileName);
  const targetFormat = ALLOWED_CONVERSIONS[sourceExtension];

  if (!targetFormat) {
    throw new Error(
      `Formato non supportato: .${sourceExtension}. Formati accettati: ${Object.keys(ALLOWED_CONVERSIONS).join(', ')}.`
    );
  }

  const workDir = createTempWorkDir();
  const inputPath = path.join(workDir, `input.${sourceExtension}`);

  try {
    await fs.mkdir(workDir, { recursive: true });
    await fs.writeFile(inputPath, fileBuffer);

    // --convert-to scrive l'output nella stessa cartella (--outdir), con lo
    // stesso nome base e l'estensione target. Non serve conoscere il nome
    // esatto in anticipo: lo ricaviamo cambiando estensione a inputPath.
    await execFileAsync(
      SOFFICE_BIN,
      ['--headless', '--convert-to', targetFormat, '--outdir', workDir, inputPath],
      { timeout: 60_000 }
    );

    const outputPath = path.join(workDir, `input.${targetFormat}`);
    const buffer = await fs.readFile(outputPath);

    const baseName = path.basename(originalFileName, path.extname(originalFileName));
    return { buffer, fileName: `${baseName}.${targetFormat}` };
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT' && (error as Error).message.includes(outputPathHint(workDir, targetFormat))) {
      throw new Error('La conversione non ha prodotto un file di output valido.');
    }
    throw error instanceof Error ? error : new Error('Errore sconosciuto durante la conversione.');
  } finally {
    // Cleanup garantito: il file (input e output) non deve mai sopravvivere
    // oltre la singola richiesta, in linea con l'architettura "effimera".
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {
      // Se anche il cleanup fallisce, logghiamo ma non blocchiamo la risposta
      // già inviata: non è un errore da propagare al client.
      console.error(`Impossibile ripulire la cartella temporanea: ${workDir}`);
    });
  }
}

function outputPathHint(workDir: string, targetFormat: string): string {
  return path.join(workDir, `input.${targetFormat}`);
}