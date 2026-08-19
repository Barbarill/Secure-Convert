import request from 'supertest';
import express from 'express';
import { convertRouter } from '../../src/routes/convert.routes';

jest.mock('../../src/services/libreoffice.service', () => ({
  convertOfficeFileToPdf: jest.fn(),
}));

import { convertOfficeFileToPdf } from '../../src/services/libreoffice.service';

const mockedConvert = convertOfficeFileToPdf as jest.Mock;

function buildApp() {
  const app = express();
  app.use('/api/convert', convertRouter);
  return app;
}

describe('POST /api/convert/office', () => {
  afterEach(() => jest.clearAllMocks());

  it('risponde 400 se non viene inviato alcun file', async () => {
    const app = buildApp();
    const response = await request(app).post('/api/convert/office');

    expect(response.status).toBe(400);
    expect(mockedConvert).not.toHaveBeenCalled();
  });

  it('risponde 400 per un tipo di file non supportato', async () => {
    const app = buildApp();
    const response = await request(app)
      .post('/api/convert/office')
      .attach('file', Buffer.from('contenuto finto'), {
        filename: 'appunti.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(400);
    expect(mockedConvert).not.toHaveBeenCalled();
  });

  it('restituisce il PDF convertito con gli header corretti per un DOCX valido', async () => {
    mockedConvert.mockResolvedValue({
      buffer: Buffer.from('%PDF-finto'),
      fileName: 'relazione.pdf',
    });

    const app = buildApp();
    const response = await request(app)
      .post('/api/convert/office')
      .attach('file', Buffer.from('contenuto docx finto'), {
        filename: 'relazione.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/pdf');
    expect(response.headers['content-disposition']).toContain('relazione.pdf');
  });

  it('risponde 500 se il servizio di conversione lancia un errore', async () => {
    mockedConvert.mockRejectedValue(new Error('LibreOffice non disponibile'));

    const app = buildApp();
    const response = await request(app)
      .post('/api/convert/office')
      .attach('file', Buffer.from('contenuto docx finto'), {
        filename: 'relazione.docx',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('LibreOffice non disponibile');
  });
});