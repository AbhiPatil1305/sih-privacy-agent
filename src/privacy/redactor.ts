import { PrivacyRegion } from '../shared/types';

export async function redactScreenshot(screenshot: Blob, regions: PrivacyRegion[], dpr: number = 1): Promise<string> {
  const bitmap = await createImageBitmap(screenshot);
  
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get 2d context");

  ctx.drawImage(bitmap, 0, 0);

  ctx.fillStyle = 'black';
  for (const region of regions) {
    if (region.protection === 'BLACK') {
      const x = region.bbox.x * dpr;
      const y = region.bbox.y * dpr;
      const w = region.bbox.width * dpr;
      const h = region.bbox.height * dpr;
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
