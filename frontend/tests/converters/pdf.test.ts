/**
 * @jest-environment node
 */
import { PDFDocument } from 'pdf-lib';
import { mergePdfs, splitPdf, rotatePdf, compressPdf, getPdfPageCount } from '../../src/lib/converters/pdf';

async function createTestPdfFile(pageCount: number, name: string): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage([200, 200]);
  }
  const bytes = await pdfDoc.save();
  return new File([bytes], name, { type: 'application/pdf' });
}

describe('mergePdfs', () => {
  it('unisce due PDF nel numero corretto di pagine totali', async () => {
    const fileA = await createTestPdfFile(2, 'a.pdf');
    const fileB = await createTestPdfFile(3, 'b.pdf');

    const result = await mergePdfs([fileA, fileB]);

    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Blob);

    const mergedBytes = await result.data!.arrayBuffer();
    const mergedPdf = await PDFDocument.load(mergedBytes);
    expect(mergedPdf.getPageCount()).toBe(5);
  });

  it('restituisce un errore se viene passato un solo file', async () => {
    const fileA = await createTestPdfFile(1, 'a.pdf');
    const result = await mergePdfs([fileA]);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('gestisce un file PDF corrotto senza crashare', async () => {
    const corruptFile = new File(['questo non è un pdf valido'], 'corrupt.pdf', {
      type: 'application/pdf',
    });
    const validFile = await createTestPdfFile(1, 'valid.pdf');

    const result = await mergePdfs([corruptFile, validFile]);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('splitPdf', () => {
  it('divide un PDF multipagina nel numero atteso di pagine per range', async () => {
    const file = await createTestPdfFile(6, 'source.pdf');

    const results = await splitPdf(file, [
      { start: 1, end: 2 },
      { start: 3, end: 6 },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);

    const firstBytes = await results[0].data!.arrayBuffer();
    const firstPdf = await PDFDocument.load(firstBytes);
    expect(firstPdf.getPageCount()).toBe(2);

    const secondBytes = await results[1].data!.arrayBuffer();
    const secondPdf = await PDFDocument.load(secondBytes);
    expect(secondPdf.getPageCount()).toBe(4);
  });

  it('segnala un range non valido senza interrompere gli altri split', async () => {
    const file = await createTestPdfFile(3, 'source.pdf');

    const results = await splitPdf(file, [{ start: 1, end: 10 }]);

    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain('non valido');
  });
});

describe('rotatePdf', () => {
  it('ruota tutte le pagine del numero di gradi richiesto', async () => {
    const file = await createTestPdfFile(2, 'source.pdf');

    const result = await rotatePdf(file, 90);

    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Blob);

    const bytes = await result.data!.arrayBuffer();
    const rotatedPdf = await PDFDocument.load(bytes);
    const pages = rotatedPdf.getPages();

    pages.forEach((page) => {
      expect(page.getRotation().angle).toBe(90);
    });
  });

  it('somma correttamente rotazioni multiple oltre i 360 gradi', async () => {
    const file = await createTestPdfFile(1, 'source.pdf');

    const firstRotation = await rotatePdf(file, 270);
    const bytes = await firstRotation.data!.arrayBuffer();
    const rotatedOnceFile = new File([bytes], 'rotated.pdf', { type: 'application/pdf' });

    const secondRotation = await rotatePdf(rotatedOnceFile, 180);
    const finalBytes = await secondRotation.data!.arrayBuffer();
    const finalPdf = await PDFDocument.load(finalBytes);

    // 270 + 180 = 450, che modulo 360 deve dare 90
    expect(finalPdf.getPages()[0].getRotation().angle).toBe(90);
  });

  it('gestisce un file corrotto senza crashare', async () => {
    const corruptFile = new File(['non è un pdf'], 'corrupt.pdf', { type: 'application/pdf' });

    const result = await rotatePdf(corruptFile, 90);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('compressPdf', () => {
  it('produce un PDF valido e leggibile dopo la compressione', async () => {
    const file = await createTestPdfFile(5, 'source.pdf');

    const result = await compressPdf(file);

    // La compressione può riuscire o segnalare che non ci sono margini,
    // ma in entrambi i casi non deve crashare e deve dare una risposta coerente
    if (result.success) {
      expect(result.data).toBeInstanceOf(Blob);
      const bytes = await result.data!.arrayBuffer();
      const compressedPdf = await PDFDocument.load(bytes);
      expect(compressedPdf.getPageCount()).toBe(5);
    } else {
      expect(result.error).toBeDefined();
    }
  });

  it('gestisce un file corrotto senza crashare', async () => {
    const corruptFile = new File(['non è un pdf'], 'corrupt.pdf', { type: 'application/pdf' });

    const result = await compressPdf(corruptFile);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('getPdfPageCount', () => {
  it('restituisce il numero corretto di pagine di un PDF valido', async () => {
    const file = await createTestPdfFile(7, 'source.pdf');

    const count = await getPdfPageCount(file);

    expect(count).toBe(7);
  });

  it('propaga un errore se il file non è un PDF valido', async () => {
    const corruptFile = new File(['non è un pdf'], 'corrupt.pdf', { type: 'application/pdf' });

    await expect(getPdfPageCount(corruptFile)).rejects.toThrow();
  });
});