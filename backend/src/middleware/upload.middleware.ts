import multer from 'multer';

const ALLOWED_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export const uploadOfficeFile = multer({
  // In memoria, mai su disco: il file esiste come Buffer solo per la durata
  // della richiesta, coerente con l'architettura "effimera" del server.
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new Error('Formato file non supportato. Sono accettati solo .docx, .pptx, .xlsx.'));
      return;
    }
    callback(null, true);
  },
}).single('file');