import { PDFDocument, degrees } from 'pdf-lib';
import type { ConversionResult } from './types';

export async function mergePdfs(files: File[]): Promise<ConversionResult> {
  try {
    if (files.length < 2) {
      return { success: false, error: 'Servono almeno 2 file PDF da unire.' };
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    const data = new Blob([mergedBytes], { type: 'application/pdf' });

    return { success: true, data, fileName: 'merged.pdf' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore durante l\'unione dei PDF.',
    };
  }
}

export async function splitPdf(
  file: File,
  ranges: { start: number; end: number }[]
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const totalPages = sourcePdf.getPageCount();

    for (const range of ranges) {
      if (range.start < 1 || range.end > totalPages || range.start > range.end) {
        results.push({
          success: false,
          error: `Range non valido: ${range.start}-${range.end} (il PDF ha ${totalPages} pagine).`,
        });
        continue;
      }

      const newPdf = await PDFDocument.create();
      const pageIndices = [];
      for (let i = range.start - 1; i < range.end; i++) {
        pageIndices.push(i);
      }

      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const bytes = await newPdf.save();
      results.push({
        success: true,
        data: new Blob([bytes], { type: 'application/pdf' }),
        fileName: `split_${range.start}-${range.end}.pdf`,
      });
    }

    return results;
  } catch (error) {
    return [
      {
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante la divisione del PDF.',
      },
    ];
  }
}

export async function rotatePdf(
  file: File,
  degreesToRotate: 90 | 180 | 270
): Promise<ConversionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    const pages = pdfDoc.getPages();
    pages.forEach((page) => {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + degreesToRotate) % 360));
    });

    const bytes = await pdfDoc.save();
    return {
      success: true,
      data: new Blob([bytes], { type: 'application/pdf' }),
      fileName: file.name.replace('.pdf', '_rotated.pdf'),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore durante la rotazione del PDF.',
    };
  }
}

export async function compressPdf(file: File): Promise<ConversionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // pdf-lib non ha una vera "compressione" come Ghostscript, ma il salvataggio
    // con questa opzione rimuove oggetti duplicati e ottimizza gli stream interni,
    // che su molti PDF (soprattutto con pagine ripetute o oggetti ridondanti) riduce la size.
    const bytes = await pdfDoc.save({ useObjectStreams: true });

    if (bytes.length >= file.size) {
      return {
        success: false,
        error: 'Il file non presenta margini di compressione significativi con questo metodo.',
      };
    }

    return {
      success: true,
      data: new Blob([bytes], { type: 'application/pdf' }),
      fileName: file.name.replace('.pdf', '_compressed.pdf'),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore durante la compressione del PDF.',
    };
  }
}