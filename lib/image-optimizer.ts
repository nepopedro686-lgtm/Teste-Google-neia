export interface ProcessedImage {
  dataBase64: string;
  previewDataUrl: string;
  mimeType: 'image/webp' | 'image/jpeg';
  width: number;
  height: number;
  sizeBytes: number;
}

const MAX_RAW_FILE_BYTES = 15 * 1024 * 1024; // 15 MB raw input
const MAX_STORED_BYTES = 600 * 1024; // 600 KB binary target (~800KB base64 < 1MB Firestore limit)
const MAX_DIMENSION_PX = 1400;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
]);

function loadImageFromFile(file: File): Promise<{
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file).then((bitmap) => ({
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    }));
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível ler a imagem selecionada.'));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: 'image/webp' | 'image/jpeg',
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function blobToBase64(blob: Blob): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      if (commaIdx === -1) {
        reject(new Error('Falha ao processar imagem.'));
        return;
      }
      resolve({
        dataUrl: result,
        base64: result.slice(commaIdx + 1),
      });
    };
    reader.onerror = () => reject(new Error('Erro ao ler dados da imagem.'));
    reader.readAsDataURL(blob);
  });
}

export async function processImageUpload(file: File): Promise<ProcessedImage> {
  const mimeLower = (file.type || '').toLowerCase();
  const hasValidExt = /\.(jpe?g|png|webp|avif)$/i.test(file.name);
  if (!ALLOWED_MIME_TYPES.has(mimeLower) && !hasValidExt) {
    throw new Error('Formato não suportado. Envie uma foto JPG, PNG ou WebP.');
  }

  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new Error('A imagem é muito grande (máximo 15 MB antes da otimização).');
  }

  const loaded = await loadImageFromFile(file);
  try {
    let targetW = loaded.width;
    let targetH = loaded.height;

    if (targetW > MAX_DIMENSION_PX || targetH > MAX_DIMENSION_PX) {
      const ratio = Math.min(MAX_DIMENSION_PX / targetW, MAX_DIMENSION_PX / targetH);
      targetW = Math.max(1, Math.round(targetW * ratio));
      targetH = Math.max(1, Math.round(targetH * ratio));
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Navegador sem suporte para processamento de imagem.');
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(loaded.source, 0, 0, targetW, targetH);

    // Prefer WebP; fall back to JPEG if browser cannot encode WebP
    const testWebp = await canvasToBlob(canvas, 'image/webp', 0.85);
    const preferredType: 'image/webp' | 'image/jpeg' =
      testWebp && testWebp.type === 'image/webp' ? 'image/webp' : 'image/jpeg';

    const qualities = [0.85, 0.76, 0.66, 0.56];
    let finalBlob: Blob | null = null;

    for (const q of qualities) {
      const candidate = await canvasToBlob(canvas, preferredType, q);
      if (candidate && candidate.size <= MAX_STORED_BYTES) {
        finalBlob = candidate;
        break;
      }
      finalBlob = candidate;
    }

    // If still above target, reduce dimensions once more proportionally
    if (finalBlob && finalBlob.size > MAX_STORED_BYTES) {
      const scale = 0.7;
      canvas.width = Math.max(1, Math.round(targetW * scale));
      canvas.height = Math.max(1, Math.round(targetH * scale));
      const ctx2 = canvas.getContext('2d');
      if (ctx2) {
        ctx2.fillStyle = '#FFFFFF';
        ctx2.fillRect(0, 0, canvas.width, canvas.height);
        ctx2.drawImage(loaded.source, 0, 0, canvas.width, canvas.height);
        finalBlob = await canvasToBlob(canvas, preferredType, 0.68);
        targetW = canvas.width;
        targetH = canvas.height;
      }
    }

    if (!finalBlob || finalBlob.size > 680 * 1024) {
      throw new Error('Não foi possível comprimir a imagem dentro do limite permitido.');
    }

    const { base64, dataUrl } = await blobToBase64(finalBlob);

    return {
      dataBase64: base64,
      previewDataUrl: dataUrl,
      mimeType: preferredType,
      width: targetW,
      height: targetH,
      sizeBytes: finalBlob.size,
    };
  } finally {
    loaded.cleanup();
  }
}
