import { PrivacyRegion } from '../shared/types';

export async function redactScreenshot(screenshot: Blob, regions: PrivacyRegion[], dpr: number = 1): Promise<string> {
  const bitmap = await createImageBitmap(screenshot);
  
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get 2d context");

  // Draw original image onto offscreen canvas
  ctx.drawImage(bitmap, 0, 0);

  for (const region of regions) {
    const x = Math.round(region.bbox.x * dpr);
    const y = Math.round(region.bbox.y * dpr);
    const w = Math.round(region.bbox.width * dpr);
    const h = Math.round(region.bbox.height * dpr);

    if (w <= 0 || h <= 0) continue;

    if (region.protection === 'PRESERVE') {
      continue;
    } else if (region.protection === 'BLUR') {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      const ctxAny = ctx as any;
      ctxAny.filter = 'blur(16px)';
      ctx.drawImage(bitmap, 0, 0);
      ctx.restore();
    } else {
      ctx.fillStyle = 'black';
      ctx.fillRect(x, y, w, h);
    }


  }

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

