import { Router } from 'express';
import { uploadOfficeFile } from '../middleware/upload.middleware';
import { convertOfficeFileToPdf } from '../services/libreoffice.service';

export const convertRouter = Router();

convertRouter.post('/office', (req, res) => {
  uploadOfficeFile(req, res, async (uploadError: unknown) => {
    if (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Errore durante il caricamento del file.';
      res.status(400).json({ error: message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Nessun file caricato.' });
      return;
    }

    try {
      const { buffer, fileName } = await convertOfficeFileToPdf(req.file.buffer, req.file.originalname);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante la conversione del file.';
      res.status(500).json({ error: message });
    }
  });
});