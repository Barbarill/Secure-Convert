import { convertImage, resizeImage, compressImage } from '../../src/lib/converters/image';

// --- Mock delle API browser che jsdom non implementa realmente ---

let shouldFailImageLoad = false;

beforeAll(() => {
  global.createImageBitmap = jest.fn((_file: File) => {
    if (shouldFailImageLoad) {
      return Promise.reject(new Error('formato non valido'));
    }
    return Promise.resolve({
      width: 800,
      height: 600,
      close: jest.fn(),
    } as unknown as ImageBitmap);
  });

  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    fillStyle: '',
    fillRect: jest.fn(),
    drawImage: jest.fn(),
  }) as any;

  HTMLCanvasElement.prototype.toBlob = jest.fn(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
    type?: string
  ) {
    callback(new Blob(['fake-image-data'], { type: type || 'image/png' }));
  }) as any;
});

beforeEach(() => {
  shouldFailImageLoad = false;
});

function createTestImageFile(name = 'photo.png', type = 'image/png'): File {
  return new File(['fake-image-content'], name, { type });
}

describe('convertImage', () => {
  it('converte un\'immagine PNG in JPEG con estensione corretta', async () => {
    const file = createTestImageFile('photo.png', 'image/png');
    const result = await convertImage(file, 'image/jpeg');

    expect(result.success).toBe(true);
    expect(result.fileName).toBe('photo.jpg');
    expect(result.data).toBeInstanceOf(Blob);
  });

  it('converte un\'immagine in WebP con estensione corretta', async () => {
    const file = createTestImageFile('photo.png', 'image/png');
    const result = await convertImage(file, 'image/webp');

    expect(result.success).toBe(true);
    expect(result.fileName).toBe('photo.webp');
  });

  it('gestisce un file non valido come immagine senza crashare', async () => {
    shouldFailImageLoad = true;
    const file = createTestImageFile('corrupt.png', 'image/png');
    const result = await convertImage(file, 'image/png');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('resizeImage', () => {
  it('produce un output valido rispettando i vincoli massimi richiesti', async () => {
    const file = createTestImageFile('photo.png', 'image/png');
    const result = await resizeImage(file, 400, 400);

    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Blob);
  });

  it('gestisce un file non valido senza crashare', async () => {
    shouldFailImageLoad = true;
    const file = createTestImageFile('corrupt.png', 'image/png');
    const result = await resizeImage(file, 400, 400);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('compressImage', () => {
  it('comprime un\'immagine JPEG restando nello stesso formato', async () => {
    const file = createTestImageFile('photo.jpg', 'image/jpeg');
    const result = await compressImage(file);

    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Blob);
  });

  it('converte un PNG in JPEG durante la compressione (il PNG non ha una vera compressione lossy)', async () => {
    const file = createTestImageFile('photo.png', 'image/png');
    const result = await compressImage(file);

    expect(result.success).toBe(true);
    expect(result.fileName).toBe('photo.jpg');
  });
});